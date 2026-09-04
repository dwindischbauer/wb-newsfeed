<template>
  <div class="px-8 pt-6 pb-12 max-w-[800px] mx-auto">
    <div class="mb-6">
      <h2 class="text-[1.35rem] font-extrabold text-text-primary m-0">Einstellungen</h2>
    </div>

    <div class="bg-bg-card border border-border-subtle p-7 rounded-[22px] shadow-[0_4px_20px_rgba(20,20,20,0.08)] mb-6">
      <div class="flex justify-between items-start mb-6 pb-4 border-b border-border-subtle">
        <div>
          <h3 class="m-0 text-[1.1rem] font-bold text-text-primary">KI & API Konfiguration</h3>
          <p class="mt-1 mb-0 text-[0.76rem] text-text-muted">Steuerung der lokalen LLM- und Bildgenerierungs-Modelle</p>
        </div>
        <button class="bg-[rgba(20,20,20,0.04)] text-[#3f4046] border border-border-subtle rounded-md px-3 py-[0.35rem] text-[0.76rem] font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all duration-150 enabled:hover:bg-[rgba(20,20,20,0.08)] enabled:hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed" :disabled="loadingModels" @click="fetchModels">
          <span v-if="loadingModels" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-[#5c7a14] rounded-full animate-btn-spin inline-block"></span>
          <span v-else>⟳</span>
          Modelle abfragen
        </button>
      </div>

      <div class="flex flex-col gap-[0.4rem] mb-5">
        <label class="font-semibold text-[0.78rem] text-text-secondary">Ollama Base URL</label>
        <input type="text" v-model="settings.ollamaUrl" placeholder="http://localhost:11434" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus" />
      </div>

      <div class="flex flex-col gap-[0.4rem] mb-5">
        <div class="flex justify-between items-center">
          <label class="font-semibold text-[0.78rem] text-text-secondary">Text-KI-Modell (Teaser & Zusammenfassung)</label>
          <span class="bg-[rgba(111,143,26,0.15)] text-[#5c7a14] px-2 py-0.5 rounded-xl text-[0.72rem] font-mono font-semibold border border-[rgba(111,143,26,0.3)]">{{ settings.aiModel }}</span>
        </div>
        <select v-model="settings.aiModel" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus">
          <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          type="text"
          v-model="settings.aiModel"
          placeholder="Oder spezifischen Modellnamen manuell eintragen..."
          class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus mt-[0.35rem] text-[0.8rem] !text-text-secondary"
        />
      </div>

      <div class="flex flex-col gap-[0.4rem] mb-5">
        <label class="font-semibold text-[0.78rem] text-text-secondary">LocalAI Base URL (Bild-Generierung)</label>
        <input type="text" v-model="settings.localAiUrl" placeholder="http://localhost:8080" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus" />
      </div>

      <div class="flex flex-col gap-[0.4rem] mb-5">
        <div class="flex justify-between items-center">
          <label class="font-semibold text-[0.78rem] text-text-secondary">Bild-KI-Modell (Artikelbild-Generierung)</label>
          <span class="bg-[rgba(111,143,26,0.15)] text-[#5c7a14] px-2 py-0.5 rounded-xl text-[0.72rem] font-mono font-semibold border border-[rgba(111,143,26,0.3)]">{{ settings.imageModel || 'Deaktiviert' }}</span>
        </div>
        <select v-model="settings.imageModel" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus">
          <option value="">Deaktiviert</option>
          <option v-for="m in imageModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input
          v-if="settings.imageModel !== ''"
          type="text"
          v-model="settings.imageModel"
          placeholder="Oder spezifischen Modellnamen manuell eintragen..."
          class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus mt-[0.35rem] text-[0.8rem] !text-text-secondary"
        />
      </div>

      <div class="flex gap-4">
        <div class="flex flex-col gap-[0.4rem] mb-5 flex-1">
          <label class="font-semibold text-[0.78rem] text-text-secondary">Ollama Timeout (ms)</label>
          <input type="number" v-model="settings.timeout" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus" />
        </div>

        <div class="flex flex-col gap-[0.4rem] mb-5 flex-1">
          <label class="font-semibold text-[0.78rem] text-text-secondary">Bild-KI Timeout (ms)</label>
          <input type="number" v-model="settings.imageTimeout" class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus" />
        </div>
      </div>

      <div class="flex gap-4">
        <div class="flex flex-col gap-[0.4rem] mb-5 flex-1">
          <label class="font-semibold text-[0.78rem] text-text-secondary">API Port</label>
          <input type="number" v-model="settings.apiPort" disabled class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus disabled:bg-[rgba(20,20,20,0.01)] disabled:text-text-muted" />
        </div>
        <div class="flex flex-col gap-[0.4rem] mb-5 flex-1">
          <label class="font-semibold text-[0.78rem] text-text-secondary">DB Port</label>
          <input type="number" v-model="settings.dbPort" disabled class="px-[0.85rem] py-[0.65rem] border border-border-subtle rounded-lg text-[0.85rem] bg-[rgba(20,20,20,0.03)] text-text-primary outline-none font-[inherit] focus:border-border-focus disabled:bg-[rgba(20,20,20,0.01)] disabled:text-text-muted" />
        </div>
      </div>

      <div class="flex items-center gap-4 mt-4">
        <button class="bg-accent-ink text-accent-lime border-none px-[1.35rem] py-[0.65rem] rounded-full cursor-pointer font-semibold text-[0.85rem] transition-all duration-200 shadow-[0_4px_14px_rgba(20,20,20,0.2)] hover:opacity-[0.92] hover:shadow-[0_6px_18px_rgba(20,20,20,0.28)]" @click="saveSettings">Einstellungen speichern</button>
        <span v-if="saveSuccess" class="text-[#34d399] font-semibold text-[0.82rem] animate-fade-in">✓ Gespeichert</span>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div
      v-if="toast"
      class="fixed bottom-6 right-6 bg-white text-text-primary px-[18px] py-3 rounded-[14px] shadow-[0_10px_25px_rgba(20,20,20,0.12)] border border-border-subtle text-[0.85rem] font-medium flex items-center gap-2.5 z-[9999] animate-slide-toast"
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
import { useRuntimeConfig } from '#app';

interface Toast {
  message: string;
  type: 'success' | 'warning' | 'error';
}

const config = useRuntimeConfig();

const settings = ref({
  ollamaUrl: 'http://localhost:11434',
  localAiUrl: 'http://localhost:8080',
  aiModel: 'llama3.1:8b-instruct-q4_0',
  imageModel: 'stablediffusion',
  timeout: 30000,
  imageTimeout: 180000,
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

const showToast = (message: string, type: Toast['type'] = 'success') => {
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
      const data: { textModels?: string[]; imageModels?: string[] } = await res.json();
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
      const data: Record<string, string> = await res.json();
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
      imageTimeout: settings.value.imageTimeout.toString()
    };
    
    const res = await apiFetch(`${config.public.apiUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      saveSuccess.value = true;
      setTimeout(() => { saveSuccess.value = false; }, 3000);
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
