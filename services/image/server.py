"""
Bildserver fuer wb-newsfeed.

Stellt ein lokales Bildmodell ueber eine OpenAI-kompatible Schnittstelle bereit
(POST /v1/images/generations), damit die API den Server wie jeden anderen
Bildgenerator ansprechen kann.

Modelle (IMAGE_MODEL beim Start, danach per "model" in der Anfrage umschaltbar):
  z-image-turbo  Tongyi-MAI/Z-Image-Turbo, 6 Mrd. Parameter, Apache 2.0.
                 Sehr fotorealistisch, 8 Schritte, Textencoder Qwen3 (versteht Deutsch).
  flux-schnell   FLUX.1-schnell von Black Forest Labs, 12 Mrd. Parameter, Apache 2.0.
                 Transformer als GGUF Q8_0, T5-Encoder in fp8, 4 Schritte.

Speicher: Passt das Modell in den freien Grafikspeicher, liegt immer nur die
gerade rechnende Komponente auf der GPU (model offload). Sonst, etwa wenn ein
Spiel die Karte belegt, werden die Bloecke einzeln nachgeladen (group offload).
Zwischen zwei Anfragen ist die GPU frei, Ollama kann sie also mitbenutzen.
"""

import base64
import gc
import io
import logging
import os
import threading
import time

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

IMAGE_MODEL = os.getenv("IMAGE_MODEL", "z-image-turbo")
PRELOAD = os.getenv("IMAGE_PRELOAD", "1") == "1"
# auto: je nach freiem Grafikspeicher, model: ganze Komponenten, group: blockweise
OFFLOAD = os.getenv("IMAGE_OFFLOAD", "auto")

MODELS = {
    "z-image-turbo": {"label": "Z-Image-Turbo (6B, Apache 2.0)", "steps": 9, "guidance": 0.0, "max_sequence_length": 512},
    "flux-schnell": {"label": "FLUX.1-schnell (12B, Apache 2.0)", "steps": 4, "guidance": 0.0, "max_sequence_length": 256},
}
if IMAGE_MODEL not in MODELS:
    raise SystemExit(f"Unbekanntes IMAGE_MODEL {IMAGE_MODEL}, erlaubt: {', '.join(MODELS)}")
STEPS_OVERRIDE = os.getenv("IMAGE_STEPS")

log = logging.getLogger("image-server")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

app = FastAPI(title="wb-newsfeed Bildserver", version="1.1.0")

_pipe = None
_pipe_model = None
_offload_mode = None
_load_lock = threading.Lock()
_gen_lock = threading.Lock()


def load_z_image():
    from diffusers import ZImagePipeline

    repo = os.getenv("ZIMAGE_REPO", "Tongyi-MAI/Z-Image-Turbo")
    log.info("Lade %s", repo)
    pipe = ZImagePipeline.from_pretrained(repo, torch_dtype=torch.bfloat16)
    if os.getenv("ZIMAGE_FP8", "1") == "1":
        # Gewichte in fp8 ablegen, gerechnet wird in bf16. 6 statt 12 GB: passt
        # dann neben Desktop und Ollama auf eine 16-GB-Karte, ohne dass Windows
        # in den langsamen gemeinsamen Speicher auslagert.
        pipe.transformer.enable_layerwise_casting(storage_dtype=torch.float8_e4m3fn, compute_dtype=torch.bfloat16)
        return pipe, 6 * 1024**3
    return pipe, 12 * 1024**3


def load_flux():
    from diffusers import FluxPipeline, FluxTransformer2DModel, GGUFQuantizationConfig
    from diffusers.hooks import apply_layerwise_casting
    from huggingface_hub import hf_hub_download
    from transformers import T5EncoderModel

    # Frei zugaengliche 1:1-Kopie von black-forest-labs/FLUX.1-schnell (Apache 2.0),
    # das Original verlangt einen Hugging-Face-Login
    base_repo = os.getenv("FLUX_BASE_REPO", "unsloth/FLUX.1-schnell")
    gguf_repo = os.getenv("FLUX_GGUF_REPO", "city96/FLUX.1-schnell-gguf")
    gguf_file = os.getenv("FLUX_GGUF_FILE", "flux1-schnell-Q8_0.gguf")

    log.info("Lade Transformer %s/%s", gguf_repo, gguf_file)
    gguf_path = hf_hub_download(gguf_repo, gguf_file)
    transformer = FluxTransformer2DModel.from_single_file(
        gguf_path,
        quantization_config=GGUFQuantizationConfig(compute_dtype=torch.bfloat16),
        config=base_repo,
        subfolder="transformer",
        torch_dtype=torch.bfloat16,
    )

    # Die Pipeline nimmt den dtype des Encoders fuer Embeddings und Latents.
    # Nach dem fp8-Casting waere das fp8, gerechnet wird aber in bf16.
    class T5EncoderBf16(T5EncoderModel):
        @property
        def dtype(self):
            return torch.bfloat16

    text_encoder_2 = T5EncoderBf16.from_pretrained(base_repo, subfolder="text_encoder_2", torch_dtype=torch.bfloat16)
    # Gewichte in fp8 ablegen, Rechnung bleibt bf16. Die wo-Schichten bleiben bf16:
    # T5 castet die Eingabe auf deren dtype, bevor der Hook hochcasten kann.
    apply_layerwise_casting(
        text_encoder_2,
        storage_dtype=torch.float8_e4m3fn,
        compute_dtype=torch.bfloat16,
        skip_modules_pattern=["shared", "norm", "layer_norm", "relative_attention_bias", r"DenseReluDense\.wo"],
    )

    pipe = FluxPipeline.from_pretrained(
        base_repo, transformer=transformer, text_encoder_2=text_encoder_2, torch_dtype=torch.bfloat16
    )
    return pipe, os.path.getsize(gguf_path)


def unload_pipeline():
    global _pipe, _pipe_model, _offload_mode
    _pipe = None
    _pipe_model = None
    _offload_mode = None
    gc.collect()
    torch.cuda.empty_cache()


def load_pipeline(model: str = IMAGE_MODEL):
    """Laedt das gewuenschte Modell, ein anderes geladenes wird vorher entladen."""
    global _pipe, _pipe_model, _offload_mode
    with _load_lock:
        if _pipe is not None and _pipe_model == model:
            return _pipe
        if _pipe is not None:
            log.info("Wechsle von %s zu %s", _pipe_model, model)
            unload_pipeline()

        started = time.time()
        pipe, transformer_bytes = load_z_image() if model == "z-image-turbo" else load_flux()

        free_vram, _ = torch.cuda.mem_get_info()
        # Reserve fuer Zwischenergebnisse bei 768x1344 (gemessen gut 1 GB)
        needed = transformer_bytes + 2 * 1024**3
        mode = OFFLOAD if OFFLOAD in ("model", "group") else ("model" if free_vram > needed else "group")
        if mode == "model":
            pipe.enable_model_cpu_offload()
        else:
            pipe.enable_group_offload(
                onload_device=torch.device("cuda"),
                offload_type="block_level",
                num_blocks_per_group=1,
                use_stream=True,
                low_cpu_mem_usage=True,
            )
        pipe.vae.enable_tiling()

        _pipe = pipe
        _pipe_model = model
        _offload_mode = mode
        log.info("%s bereit nach %.1f s (Offload: %s, %.1f GB VRAM frei)",
                 model, time.time() - started, mode, free_vram / 1024**3)
        return _pipe


class GenerationRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=2000)
    model: str | None = None
    size: str = "768x1344"
    n: int = Field(1, ge=1, le=1)
    response_format: str = "b64_json"
    seed: int | None = None
    steps: int | None = Field(None, ge=1, le=16)


def parse_size(size: str) -> tuple[int, int]:
    try:
        width, height = (int(v) for v in size.lower().split("x"))
    except ValueError:
        raise HTTPException(400, f"Ungueltige Groesse: {size}")
    if not (256 <= width <= 1536 and 256 <= height <= 1536):
        raise HTTPException(400, "Breite und Hoehe muessen zwischen 256 und 1536 liegen")
    # Beide Modelle arbeiten in 16er-Bloecken
    return width - width % 16, height - height % 16


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": _pipe_model or IMAGE_MODEL,
        "loaded": _pipe is not None,
        "offload": _offload_mode,
        "cuda": torch.cuda.is_available(),
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }


@app.get("/v1/models")
def models():
    return {
        "object": "list",
        "data": [
            {"id": key, "object": "model", "label": cfg["label"], "loaded": key == _pipe_model}
            for key, cfg in MODELS.items()
        ],
    }


@app.post("/v1/images/generations")
def generate(req: GenerationRequest):
    if req.response_format != "b64_json":
        raise HTTPException(400, "Nur response_format=b64_json wird unterstuetzt")

    model = req.model or _pipe_model or IMAGE_MODEL
    if model not in MODELS:
        raise HTTPException(400, f"Unbekanntes Modell {model}, erlaubt: {', '.join(MODELS)}")
    config = MODELS[model]
    width, height = parse_size(req.size)
    steps = req.steps or int(STEPS_OVERRIDE or config["steps"])
    seed = req.seed if req.seed is not None else int(time.time()) % 2**31

    # Der Lock verhindert, dass ein Modellwechsel eine laufende Berechnung stoert
    with _gen_lock:
        pipe = load_pipeline(model)
        started = time.time()
        image = pipe(
            prompt=req.prompt,
            width=width,
            height=height,
            num_inference_steps=steps,
            guidance_scale=config["guidance"],
            max_sequence_length=config["max_sequence_length"],
            generator=torch.Generator("cpu").manual_seed(seed),
        ).images[0]
        duration = time.time() - started

    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=92)
    log.info("Bild %dx%d, %d Schritte, Seed %d in %.1f s", width, height, steps, seed, duration)

    return {
        "created": int(time.time()),
        "data": [{"b64_json": base64.b64encode(buffer.getvalue()).decode("ascii")}],
        "meta": {"model": model, "seed": seed, "steps": steps, "width": width, "height": height, "seconds": round(duration, 2)},
    }


if PRELOAD:
    threading.Thread(target=load_pipeline, daemon=True).start()
