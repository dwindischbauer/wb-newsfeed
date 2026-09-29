<template>
  <div class="mx-auto max-w-[800px] px-4 pb-12 pt-6 md:px-8">
    <div class="mb-6">
      <h2 class="m-0 text-[1.35rem] font-extrabold text-accent-ink">Einstellungen</h2>
    </div>

    <div class="mb-6 rounded-xl border border-border-subtle bg-bg-card p-7">
      <div class="mb-6 flex items-start justify-between border-b border-border-subtle pb-4">
        <h3 class="m-0 text-[1.1rem] font-bold text-accent-ink">Modelle</h3>
        <button
          class="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-black/[0.04] px-3 py-[0.35rem] text-[0.76rem] font-semibold text-[#3f4046] transition-all duration-150 enabled:hover:bg-black/[0.08] enabled:hover:text-accent-ink disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loadingModels"
          @click="fetchModels"
        >
          <span v-if="loadingModels" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-[#5c7a14]"></span>
          Neu abfragen
        </button>
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">Ollama URL</label>
        <input
          v-model="settings.ollamaUrl"
          type="text"
          placeholder="http://localhost:11434"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        />
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <div class="flex items-center justify-between">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Textmodell (Teaser, Kernpunkte, Tags)</label>
          <span class="rounded-xl border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.15)] px-2 py-[2px] font-mono text-[0.72rem] font-semibold text-[#5c7a14]">{{ settings.aiModel }}</span>
        </div>
        <select
          v-model="settings.aiModel"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        >
          <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <p v-if="modelErrors.ollama" class="m-0 text-[0.76rem] text-[#c0392b]">{{ modelErrors.ollama }}</p>
      </div>

      <div class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">Bilder erzeugen mit</label>
        <select v-model="settings.imageProvider" class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus">
          <option value="local">Lokaler Server</option>
          <option value="gemini">Google Gemini (Nano Banana)</option>
        </select>
      </div>

      <template v-if="settings.imageProvider === 'gemini'">
        <div class="mb-5 flex gap-4">
          <div class="flex flex-1 flex-col gap-[0.4rem]">
            <label class="text-[0.78rem] font-semibold text-text-secondary">Gemini-Modell</label>
            <select v-model="settings.geminiModel" class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus">
              <option value="gemini-3-pro-image-preview">Nano Banana Pro (gemini-3-pro-image-preview)</option>
              <option value="gemini-2.5-flash-image">Nano Banana (gemini-2.5-flash-image)</option>
            </select>
          </div>
          <div class="flex w-[140px] flex-col gap-[0.4rem]">
            <label class="text-[0.78rem] font-semibold text-text-secondary">Auflösung</label>
            <select v-model="settings.geminiImageSize" class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus">
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
        <p class="-mt-3 mb-5 text-[0.76rem]" :class="geminiKeySet ? 'text-text-secondary' : 'text-[#c0392b]'">
          {{ geminiKeySet ? 'API-Key ist gesetzt (GEMINI_API_KEY).' : 'GEMINI_API_KEY fehlt in der .env der API. Ohne Key schlägt die Bilderzeugung fehl.' }}
          Jedes Bild kostet bei Google Guthaben.
        </p>
      </template>

      <div v-else class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">Bildserver URL</label>
        <input
          v-model="settings.imageServerUrl"
          type="text"
          placeholder="http://localhost:8080"
          class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
        />
      </div>

      <div v-if="settings.imageProvider !== 'gemini'" class="mb-5 flex flex-col gap-[0.4rem]">
        <label class="text-[0.78rem] font-semibold text-text-secondary">Bildmodell</label>
        <select v-model="settings.imageModel" class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus">
          <option v-for="m in imageModels" :key="m" :value="m">{{ imageModelLabels[m] || m }}</option>
        </select>
        <p class="m-0 text-[0.76rem] text-text-muted">Beim Wechsel lädt der Server das Modell beim nächsten Bild neu (etwa eine Minute).</p>
        <p v-if="modelErrors.imageServer" class="m-0 text-[0.76rem] text-[#c0392b]">{{ modelErrors.imageServer }}</p>
      </div>

      <div v-if="settings.imageProvider !== 'gemini'" class="mb-5 flex gap-4">
        <div class="flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Modell für Bildprompts</label>
          <select v-model="settings.imagePromptModel" class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus">
            <option value="">wie Textmodell</option>
            <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <label class="flex items-end gap-2 pb-3 text-[0.8rem] text-text-secondary">
          <input v-model="settings.imagePromptThinking" type="checkbox" />
          Denkmodus
        </label>
      </div>

      <div class="flex gap-4">
        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Timeout Text (ms)</label>
          <input
            v-model="settings.timeout"
            type="number"
            class="rounded-lg border border-border-subtle bg-black/[0.03] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.85rem] text-accent-ink outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-5 flex flex-1 flex-col gap-[0.4rem]">
          <label class="text-[0.78rem] font-semibold text-text-secondary">Timeout Bild (ms)</label>
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
          class="rounded-lg bg-accent-ink px-5 py-[0.6rem] text-[0.85rem] font-semibold text-white hover:opacity-90"
          @click="saveSettings"
        >
          Speichern
        </button>
        <span v-if="saveSuccess" class="text-[0.82rem] text-text-secondary">Gespeichert</span>
      </div>
    </div>

    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[9999] flex animate-slide-toast items-center gap-[10px] rounded-2xl border border-border-subtle bg-white px-[18px] py-3 text-[0.85rem] font-medium text-accent-ink shadow-[0_10px_25px_rgba(20,20,20,0.12)]"
      :class="{
        'border-l-4 border-l-[#10b981]': toast.type === 'success',
        'border-l-4 border-l-[#ef4444]': toast.type === 'error',
        'border-l-4 border-l-[#f59e0b]': toast.type === 'warning'
      }"
    >
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
  imageServerUrl: 'http://localhost:8080',
  imageProvider: 'local',
  imageModel: 'z-image-turbo',
  imagePromptModel: '',
  imagePromptThinking: true,
  geminiModel: 'gemini-3-pro-image-preview',
  geminiImageSize: '1K',
  aiModel: 'qwen3:14b',
  timeout: 180000,
  imageTimeout: 300000,
  temperature: 0,
  seed: 42,
  apiPort: 3005,
  dbPort: 5433
});

const textModels = ref<string[]>([]);
const imageModels = ref<string[]>([]);
const imageModelLabels = ref<Record<string, string>>({});
const modelErrors = ref<{ ollama?: string; imageServer?: string }>({});
const geminiKeySet = ref(false);

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
      textModels.value = data.textModels || [];
      imageModels.value = data.imageModels || [];
      imageModelLabels.value = data.imageModelLabels || {};
      modelErrors.value = data.errors || {};
      geminiKeySet.value = Boolean(data.geminiKeySet);
      if (settings.value.aiModel && !textModels.value.includes(settings.value.aiModel)) {
        textModels.value.push(settings.value.aiModel);
      }
    }
  } catch {
    showToast('Modelle konnten nicht abgefragt werden', 'error');
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
      if (data.imageServerUrl) settings.value.imageServerUrl = data.imageServerUrl;
      if (data.imageProvider) settings.value.imageProvider = data.imageProvider;
      if (data.imageModel) settings.value.imageModel = data.imageModel;
      if (data.imagePromptModel !== undefined) settings.value.imagePromptModel = data.imagePromptModel;
      if (data.imagePromptThinking !== undefined) settings.value.imagePromptThinking = data.imagePromptThinking !== 'false';
      if (data.geminiModel) settings.value.geminiModel = data.geminiModel;
      if (data.geminiImageSize) settings.value.geminiImageSize = data.geminiImageSize;
      if (data.aiModel) {
        settings.value.aiModel = data.aiModel;
        if (!textModels.value.includes(data.aiModel)) {
          textModels.value.push(data.aiModel);
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
      imageServerUrl: settings.value.imageServerUrl,
      imageProvider: settings.value.imageProvider,
      imageModel: settings.value.imageModel,
      imagePromptModel: settings.value.imagePromptModel,
      imagePromptThinking: String(settings.value.imagePromptThinking),
      geminiModel: settings.value.geminiModel,
      geminiImageSize: settings.value.geminiImageSize,
      aiModel: settings.value.aiModel,
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
      showToast('Einstellungen gespeichert');
    } else {
      showToast('Speichern fehlgeschlagen', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Speichern fehlgeschlagen', 'error');
  }
};

onMounted(() => {
  loadSettings();
  fetchModels();
});
</script>
