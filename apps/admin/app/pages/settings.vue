<template>
  <div class="mx-auto max-w-[800px] px-8 pb-12 pt-6">
    <div class="mb-6">
      <h2 class="m-0 text-[1.35rem] font-extrabold text-accent-ink">Einstellungen</h2>
    </div>

    <div class="mb-6 rounded-[22px] border border-border-subtle bg-bg-card p-7 shadow-[0_4px_20px_rgba(20,20,20,0.08)]">
      <div class="mb-6 flex items-start justify-between border-b border-border-subtle pb-4">
        <div>
          <h3 class="m-0 text-[1.1rem] font-bold text-accent-ink">KI & API Konfiguration</h3>
          <p class="m-0 mt-1 text-[0.76rem] text-text-muted">Steuerung der lokalen LLM- und Bildgenerierungs-Modelle</p>
        </div>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-black/[0.04] px-3 py-[0.35rem] text-[0.76rem] font-semibold text-[#3f4046] transition-all duration-150 enabled:hover:bg-black/[0.08] enabled:hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loadingModels"
          @click="fetchModels"
        >
          <span v-if="loadingModels" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-[#5c7a14]"></span>
          <span v-else>⟳</span>
          Modelle abfragen
        </button>
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">Ollama Base URL</label>
        <input
          v-model="settings.ollamaUrl"
          type="text"
          placeholder="http://localhost:11434"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        />
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <div class="flex items-center justify-between">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Text-KI-Modell (Teaser & Zusammenfassung)</label>
          <span class="rounded-xl border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.15)] px-2 py-[2px] font-mono text-[0.72rem] font-semibold text-[#5c7a14]">{{ settings.aiModel }}</span>
        </div>
        <select
          v-model="settings.aiModel"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        >
          <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-model="settings.aiModel"
          type="text"
          placeholder="Oder spezifischen Modellnamen manuell eintragen..."
          class="mt-[0.35rem] rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.8rem] text-text-secondary outline-none focus:border-border-focus"
        />
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">LocalAI Base URL (Bild-Generierung)</label>
        <input
          v-model="settings.localAiUrl"
          type="text"
          placeholder="http://localhost:8080"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        />
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <div class="flex items-center justify-between">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Bild-KI-Modell (Artikelbild-Generierung)</label>
          <span class="rounded-xl border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.15)] px-2 py-[2px] font-mono text-[0.72rem] font-semibold text-[#5c7a14]">{{ settings.imageModel || 'Deaktiviert' }}</span>
        </div>
        <select
          v-model="settings.imageModel"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        >
          <option value="">Deaktiviert</option>
          <option v-for="m in imageModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-if="settings.imageModel !== ''"
          v-model="settings.imageModel"
          type="text"
          placeholder="Oder spezifischen Modellnamen manuell eintragen..."
          class="mt-[0.35rem] rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.8rem] text-text-secondary outline-none focus:border-border-focus"
        />
      </div>

      <div class="flex gap-4">
        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Ollama Timeout (ms)</label>
          <input
            v-model="settings.timeout"
            type="number"
            class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Bild-KI Timeout (ms)</label>
          <input
            v-model="settings.imageTimeout"
            type="number"
            class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
          />
        </div>
      </div>

      <div class="flex gap-4">
        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Temperatur (0 = reproduzierbar)</label>
          <input
            v-model.number="settings.temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Seed</label>
          <input
            v-model.number="settings.seed"
            type="number"
            step="1"
            class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
          />
        </div>
      </div>

      <div class="flex gap-4">
        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">API Port</label>
          <input
            v-model="settings.apiPort"
            type="number"
            disabled
            class="rounded-lg border border-border-subtle bg-black/[0.01] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-text-muted outline-none"
          />
        </div>
        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">DB Port</label>
          <input
            v-model="settings.dbPort"
            type="number"
            disabled
            class="rounded-lg border border-border-subtle bg-black/[0.01] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-text-muted outline-none"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center gap-4">
        <button
          class="rounded-full bg-accent-ink px-[1.35rem] py-[0.65rem] text-[0.85rem] font-semibold text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_6px_18px_rgba(20,20,20,0.28)]"
          @click="saveSettings"
        >
          Einstellungen speichern
        </button>
        <span v-if="saveSuccess" class="animate-fade-in text-[0.82rem] font-semibold text-[#34d399]">✓ Gespeichert</span>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[9999] flex animate-slide-toast items-center gap-[10px] rounded-2xl border border-border-subtle bg-white px-[18px] py-3 text-[0.85rem] font-medium text-accent-ink shadow-[0_10px_25px_rgba(20,20,20,0.12)]"
      :class="{
        'border-l-4 border-l-[#10b981]': toast.type === 'success',
        'border-l-4 border-l-[#ef4444]': toast.type === 'error',
        'border-l-4 border-l-[#f59e0b]': toast.type === 'warning'
      }"
    >
      <span>{{ toast.type === 'success' ? '✓' : '⚠️' }}</span>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

type ToastType = 'success' | 'warning' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

const config = useRuntimeConfig();

const settings = ref({
  ollamaUrl: 'http://localhost:11434',
  localAiUrl: 'http://localhost:8080',
  aiModel: 'llama3.1:8b-instruct-q4_0',
  imageModel: 'stablediffusion',
  timeout: 30000,
  imageTimeout: 180000,
  temperature: 0,
  seed: 42,
  apiPort: 3005,
  dbPort: 5433
});

const textModels = ref<string[]>([
  'llama3.1:8b-instruct-q4_0',
  'qwen2.5:3b-instruct',
  'llama3:8b',
  'mistral:7b',
  'phi3:mini'
]);

const imageModels = ref<string[]>([
  'stablediffusion',
  'stable-diffusion-3-medium',
  'flux.1-schnell',
  'x/z-image-turbo'
]);

const loadingModels = ref(false);
const saveSuccess = ref(false);
const toast = ref<Toast | null>(null);

const showToast = (message: string, type: ToastType = 'success') => {
  toast.value = { message, type };
  setTimeout(() => {
    if (toast.value?.message === message) toast.value = null;
  }, 4000);
};

const fetchModels = async () => {
  loadingModels.value = true;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/settings/models`);
    if (res.ok) {
      const data = await res.json();
      if (data.textModels?.length) textModels.value = data.textModels;
      if (data.imageModels?.length) imageModels.value = data.imageModels;
      showToast('Modell-Listen erfolgreich aktualisiert', 'success');
    }
  } catch {
    showToast('Konnte Live-Modelle nicht abrufen, Standard-Liste aktiv', 'warning');
  } finally {
    loadingModels.value = false;
  }
};

const loadSettings = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.ollamaUrl) settings.value.ollamaUrl = data.ollamaUrl;
      if (data.localAiUrl) settings.value.localAiUrl = data.localAiUrl;
      if (data.aiModel) {
        settings.value.aiModel = data.aiModel;
        if (!textModels.value.includes(data.aiModel)) {
          textModels.value.push(data.aiModel);
        }
      }
      if (data.imageModel !== undefined) {
        settings.value.imageModel = data.imageModel;
        if (data.imageModel && !imageModels.value.includes(data.imageModel)) {
          imageModels.value.push(data.imageModel);
        }
      }
      if (data.timeout) settings.value.timeout = parseInt(data.timeout);
      if (data.imageTimeout) settings.value.imageTimeout = parseInt(data.imageTimeout);
      if (data.temperature !== undefined) settings.value.temperature = parseFloat(data.temperature);
      if (data.seed !== undefined) settings.value.seed = parseInt(data.seed);
    }
  } catch (e) {
    console.error('Failed to load settings', e);
  }
};

const saveSettings = async () => {
  try {
    const payload = {
      ollamaUrl: settings.value.ollamaUrl,
      localAiUrl: settings.value.localAiUrl,
      aiModel: settings.value.aiModel,
      imageModel: settings.value.imageModel,
      timeout: settings.value.timeout.toString(),
      imageTimeout: settings.value.imageTimeout.toString(),
      temperature: settings.value.temperature.toString(),
      seed: settings.value.seed.toString()
    };

    const res = await apiFetch(`${config.public.apiUrl}/api/settings`, {
      method: 'POST',
      body: payload
    });

    if (res.ok) {
      saveSuccess.value = true;
      setTimeout(() => {
        saveSuccess.value = false;
      }, 3000);
      showToast('Einstellungen erfolgreich gespeichert!', 'success');
    } else {
      showToast('Fehler beim Speichern der Einstellungen.', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Fehler beim Speichern der Einstellungen.', 'error');
  }
};

onMounted(() => {
  loadSettings();
  fetchModels();
});
</script>
