<template>
  <div class="mx-auto max-w-[880px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
    <div class="mb-6">
      <h1 class="m-0 font-accent text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">Einstellungen</h1>
      <p class="m-0 mt-1.5 text-[13.5px] text-text-secondary">KI-Modelle, Bildgenerierung und externer API-Zugang für CMS-Anbindungen.</p>
    </div>

    <div class="mb-6 rounded-[14px] border border-border-subtle bg-bg-card p-6 md:p-7">
      <div class="mb-6 flex items-center justify-between border-b border-border-subtle pb-4">
        <h2 class="m-0 font-accent text-[20px] font-medium text-text-primary">Modelle</h2>
        <button
          class="inline-flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-border-subtle bg-bg-main px-3 py-1.5 text-[12.5px] font-medium text-text-primary transition-colors duration-150 enabled:hover:bg-bg-card-subtle disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loadingModels"
          @click="fetchModels"
        >
          <span v-if="loadingModels" class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-[#5c7a14]"></span>
          Neu abfragen
        </button>
      </div>

      <div class="mb-5 flex flex-col gap-1.5">
        <label class="text-[13px] font-medium text-text-secondary">Ollama URL</label>
        <input
          v-model="settings.ollamaUrl"
          type="text"
          placeholder="http://localhost:11434"
          class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] text-text-primary outline-none focus:border-border-focus"
        />
      </div>

      <div class="mb-5 flex flex-col gap-1.5">
        <div class="flex items-center justify-between gap-2">
          <label class="text-[13px] font-medium text-text-secondary">Textmodell (Teaser, Kernpunkte, Tags)</label>
          <span class="rounded-[6px] border border-[rgba(92,122,20,0.3)] bg-[#dbe8a6]/35 px-2 py-0.5 font-mono text-[11.5px] font-medium text-[#3d520c]">{{ settings.aiModel }}</span>
        </div>
        <select
          v-model="settings.aiModel"
          class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus"
        >
          <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <p v-if="modelErrors.ollama" class="m-0 text-[12.5px] text-[#b93829]">{{ modelErrors.ollama }}</p>
      </div>

      <label class="mb-5 flex items-center gap-2.5 text-[13.5px] text-text-primary">
        <input v-model="settings.autoImage" type="checkbox" />
        Bei neuen Artikeln automatisch ein Titelbild erzeugen
      </label>

      <div class="mb-5 flex flex-col gap-1.5">
        <label class="text-[13px] font-medium text-text-secondary">Bilder erzeugen mit</label>
        <select v-model="settings.imageProvider" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus">
          <option value="local">Lokaler Server</option>
          <option value="gemini">Google Gemini (Nano Banana)</option>
        </select>
      </div>

      <template v-if="settings.imageProvider === 'gemini'">
        <div class="mb-5 flex flex-col gap-4 sm:flex-row">
          <div class="flex flex-1 flex-col gap-1.5">
            <label class="text-[13px] font-medium text-text-secondary">Gemini-Modell</label>
            <select v-model="settings.geminiModel" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus">
              <option value="gemini-3-pro-image-preview">Nano Banana Pro (gemini-3-pro-image-preview)</option>
              <option value="gemini-3.1-flash-image-preview">Nano Banana 2 (gemini-3.1-flash-image-preview)</option>
              <option value="gemini-2.5-flash-image">Nano Banana (gemini-2.5-flash-image)</option>
            </select>
          </div>
          <div class="flex w-full flex-col gap-1.5 sm:w-[140px]">
            <label class="text-[13px] font-medium text-text-secondary">Auflösung</label>
            <select v-model="settings.geminiImageSize" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus">
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
        <p class="-mt-3 mb-5 text-[12.5px]" :class="geminiKeySet ? 'text-text-secondary' : 'text-[#b93829]'">
          {{ geminiKeySet ? 'API-Key ist gesetzt (GEMINI_API_KEY).' : 'GEMINI_API_KEY fehlt in der .env der API. Ohne Key schlägt die Bilderzeugung fehl.' }}
          Jedes Bild kostet bei Google Guthaben.
        </p>
      </template>

      <div v-else class="mb-5 flex flex-col gap-1.5">
        <label class="text-[13px] font-medium text-text-secondary">Bildserver URL</label>
        <input
          v-model="settings.imageServerUrl"
          type="text"
          placeholder="http://localhost:8080"
          class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] text-text-primary outline-none focus:border-border-focus"
        />
      </div>

      <div v-if="settings.imageProvider !== 'gemini'" class="mb-5 flex flex-col gap-1.5">
        <label class="text-[13px] font-medium text-text-secondary">Bildmodell</label>
        <select v-model="settings.imageModel" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus">
          <option v-for="m in imageModels" :key="m" :value="m">{{ imageModelLabels[m] || m }}</option>
        </select>
        <p class="m-0 text-[12.5px] text-text-muted">Beim Wechsel lädt der Server das Modell beim nächsten Bild neu (etwa eine Minute).</p>
        <p v-if="modelErrors.imageServer" class="m-0 text-[12.5px] text-[#b93829]">{{ modelErrors.imageServer }}</p>
      </div>

      <div v-if="settings.imageProvider !== 'gemini'" class="mb-5 flex flex-col gap-4 sm:flex-row">
        <div class="flex flex-1 flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">Modell für Bildprompts</label>
          <select v-model="settings.imagePromptModel" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus">
            <option value="">wie Textmodell</option>
            <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
          </select>
        </div>
        <label class="flex items-end gap-2 pb-2.5 text-[13px] text-text-secondary">
          <input v-model="settings.imagePromptThinking" type="checkbox" />
          Denkmodus
        </label>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">Timeout Text (ms)</label>
          <input
            v-model="settings.timeout"
            type="number"
            class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-primary outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">Timeout Bild (ms)</label>
          <input
            v-model="settings.imageTimeout"
            type="number"
            class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-primary outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">Temperatur (0 = reproduzierbar)</label>
          <input
            v-model.number="settings.temperature"
            type="number"
            min="0"
            max="2"
            step="0.1"
            class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-primary outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">Seed</label>
          <input
            v-model.number="settings.seed"
            type="number"
            step="1"
            class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-primary outline-none focus:border-border-focus"
          />
        </div>

        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">API Port</label>
          <input
            v-model="settings.apiPort"
            type="number"
            disabled
            class="rounded-[8px] border border-border-subtle bg-bg-card-subtle/60 px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-muted outline-none"
          />
        </div>

        <div class="mb-4 flex flex-col gap-1.5">
          <label class="text-[13px] font-medium text-text-secondary">DB Port</label>
          <input
            v-model="settings.dbPort"
            type="number"
            disabled
            class="rounded-[8px] border border-border-subtle bg-bg-card-subtle/60 px-3.5 py-2.5 font-mono text-[13.5px] tabular-nums text-text-muted outline-none"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center gap-4 border-t border-border-subtle pt-5">
        <button
          class="cursor-pointer rounded-[8px] border-none bg-accent-ink px-5 py-2.5 text-[13.5px] font-medium text-[#fdfbf7] transition-opacity duration-150 hover:opacity-90"
          @click="saveSettings"
        >
          Speichern
        </button>
        <span v-if="saveSuccess" class="text-[13px] font-medium text-[#1f7a4c]">Gespeichert</span>
      </div>
    </div>

    <div class="mb-6 rounded-[14px] border border-border-subtle bg-bg-card p-6 md:p-7">
      <div class="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-border-subtle pb-4">
        <div>
          <h2 class="m-0 font-accent text-[20px] font-medium text-text-primary">API-Zugang für externe Systeme</h2>
          <p class="m-0 mt-1.5 text-[13px] leading-[1.6] text-text-secondary">
            Basis-URL <code class="whitespace-nowrap rounded-[5px] bg-bg-card-subtle px-1.5 py-0.5 font-mono text-[12px] text-text-primary">{{ apiBaseUrl }}</code> · Authentifizierung per
            <code class="whitespace-nowrap rounded-[5px] bg-bg-card-subtle px-1.5 py-0.5 font-mono text-[12px] text-text-primary">Authorization: Bearer &lt;API_KEY&gt;</code> oder
            <code class="whitespace-nowrap rounded-[5px] bg-bg-card-subtle px-1.5 py-0.5 font-mono text-[12px] text-text-primary">x-api-key</code>
          </p>
        </div>
        <a
          :href="`${apiBaseUrl}/docs`"
          target="_blank"
          class="shrink-0 rounded-[8px] border border-border-subtle bg-bg-main px-3 py-1.5 text-[12.5px] font-medium text-text-primary no-underline transition-colors duration-150 hover:bg-bg-card-subtle"
        >
          Swagger UI öffnen
        </a>
      </div>

      <div class="flex flex-col gap-3.5">
        <div v-for="snippet in apiSnippets" :key="snippet.id" class="rounded-[10px] border border-border-subtle bg-bg-main p-4">
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-[13px] font-semibold text-text-primary">{{ snippet.title }}</span>
            <button
              type="button"
              class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
              @click="copySnippet(snippet.code)"
            >
              Kopieren
            </button>
          </div>
          <pre class="m-0 overflow-x-auto font-mono text-[12px] leading-[1.55] text-text-primary"><code>{{ snippet.code }}</code></pre>
        </div>
      </div>
    </div>

    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-[9999] flex animate-slide-toast items-center gap-2.5 rounded-[10px] border border-border-subtle bg-bg-card px-4 py-3 text-[13px] font-medium text-accent-ink shadow-[0_10px_25px_rgba(31,27,22,0.12)]"
      :class="{
        'border-l-4 border-l-[#1f7a4c]': toast.type === 'success',
        'border-l-4 border-l-[#b93829]': toast.type === 'error',
        'border-l-4 border-l-[#b46a10]': toast.type === 'warning'
      }"
    >
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

type ToastType = 'success' | 'warning' | 'error';

interface Toast {
  message: string;
  type: ToastType;
}

const config = useRuntimeConfig();
const apiBaseUrl = computed(() => String(config.public.apiUrl || 'http://localhost:3005').replace(/\/$/, ''));

const apiSnippets = computed(() => [
  {
    id: 'create',
    title: 'Artikel anlegen & asynchron aufbereiten (POST /api/articles)',
    code: `curl -X POST ${apiBaseUrl.value}/api/articles \\\n  -H "Authorization: Bearer diplomarbeit-secret-key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"title": "Titel", "content": "Volltext mindestens 10 Zeichen...", "status": "published"}'`
  },
  {
    id: 'generate',
    title: 'Synchron generieren ohne Job-Polling (POST /api/articles/generate)',
    code: `curl -X POST ${apiBaseUrl.value}/api/articles/generate \\\n  -H "Authorization: Bearer diplomarbeit-secret-key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"content": "Volltext mindestens 10 Zeichen...", "generateImage": false}'`
  },
  {
    id: 'rss',
    title: 'RSS/Atom-Quelle importieren (POST /api/import/rss)',
    code: `curl -X POST ${apiBaseUrl.value}/api/import/rss \\\n  -H "Authorization: Bearer diplomarbeit-secret-key" \\\n  -H "Content-Type: application/json" \\\n  -d '{"url": "https://example.at/rss.xml", "limit": 20, "fullText": true}'`
  },
  {
    id: 'feed',
    title: 'Öffentlichen Short-Form-Feed abrufen (GET /api/feed, ohne Key)',
    code: `curl "${apiBaseUrl.value}/api/feed?limit=10&offset=0"`
  }
]);

const copySnippet = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code);
    showToast('Beispiel in Zwischenablage kopiert');
  } catch {
    showToast('Kopieren nicht möglich', 'error');
  }
};

const settings = ref({
  ollamaUrl: 'http://localhost:11434',
  imageServerUrl: 'http://localhost:8080',
  autoImage: false,
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
      if (data.autoImage !== undefined) settings.value.autoImage = data.autoImage === 'true';
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
      autoImage: String(settings.value.autoImage),
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
