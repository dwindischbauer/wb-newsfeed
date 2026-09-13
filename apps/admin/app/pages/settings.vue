<template>
  <div class="settings-page">
    <div class="header">
      <h2>Einstellungen</h2>
    </div>
    
    <div class="settings-card">
      <div class="card-header-flex">
        <div>
          <h3>KI & API Konfiguration</h3>
          <p class="card-subtitle">Steuerung der lokalen LLM- und Bildgenerierungs-Modelle</p>
        </div>
        <button class="secondary-btn" :disabled="loadingModels" @click="fetchModels">
          <span v-if="loadingModels" class="btn-spinner"></span>
          <span v-else>⟳</span>
          Modelle abfragen
        </button>
      </div>
      
      <div class="form-group">
        <label>Ollama Base URL</label>
        <input type="text" v-model="settings.ollamaUrl" placeholder="http://localhost:11434" />
      </div>
      
      <div class="form-group">
        <div class="label-with-hint">
          <label>Text-KI-Modell (Teaser & Zusammenfassung)</label>
          <span class="active-model-badge">{{ settings.aiModel }}</span>
        </div>
        <select v-model="settings.aiModel">
          <option v-for="m in textModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input 
          type="text" 
          v-model="settings.aiModel" 
          placeholder="Oder spezifischen Modellnamen manuell eintragen..." 
          class="custom-model-input" 
        />
      </div>

      <div class="form-group">
        <label>LocalAI Base URL (Bild-Generierung)</label>
        <input type="text" v-model="settings.localAiUrl" placeholder="http://localhost:8080" />
      </div>

      <div class="form-group">
        <div class="label-with-hint">
          <label>Bild-KI-Modell (Artikelbild-Generierung)</label>
          <span class="active-model-badge">{{ settings.imageModel || 'Deaktiviert' }}</span>
        </div>
        <select v-model="settings.imageModel">
          <option value="">Deaktiviert</option>
          <option v-for="m in imageModels" :key="m" :value="m">{{ m }}</option>
        </select>
        <input 
          v-if="settings.imageModel !== ''"
          type="text" 
          v-model="settings.imageModel" 
          placeholder="Oder spezifischen Modellnamen manuell eintragen..." 
          class="custom-model-input" 
        />
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Ollama Timeout (ms)</label>
          <input type="number" v-model="settings.timeout" />
        </div>
        
        <div class="form-group">
          <label>Bild-KI Timeout (ms)</label>
          <input type="number" v-model="settings.imageTimeout" />
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>API Port</label>
          <input type="number" v-model="settings.apiPort" disabled />
        </div>
        <div class="form-group">
          <label>DB Port</label>
          <input type="number" v-model="settings.dbPort" disabled />
        </div>
      </div>
      
      <div class="form-actions-row">
        <button class="primary-btn" @click="saveSettings">Einstellungen speichern</button>
        <span v-if="saveSuccess" class="save-indicator">✓ Gespeichert</span>
      </div>
    </div>

    <!-- Floating Toast Notification -->
    <div v-if="toast" :class="['toast-notification', toast.type]">
      <span class="toast-icon">{{ toast.type === 'success' ? '✓' : '⚠️' }}</span>
      <span>{{ toast.message }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRuntimeConfig } from '#app';

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

const textModels = ref([
  'llama3.1:8b-instruct-q4_0',
  'qwen2.5:3b-instruct',
  'llama3:8b',
  'mistral:7b',
  'phi3:mini'
]);

const imageModels = ref([
  'stablediffusion',
  'stable-diffusion-3-medium',
  'flux.1-schnell',
  'x/z-image-turbo'
]);

const loadingModels = ref(false);
const saveSuccess = ref(false);
const toast = ref(null);

const showToast = (message, type = 'success') => {
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
  } catch (e) {
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

<style scoped>
.settings-page {
  padding: 2rem;
}
.header {
  margin-bottom: 2rem;
}
.settings-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  max-width: 600px;
}
.settings-card h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}
.form-row {
  display: flex;
  gap: 1rem;
}
.form-row .form-group {
  flex: 1;
}
label {
  font-weight: 500;
  color: #4b5563;
}
input, select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}
input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
}
.primary-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: background-color 0.15s ease;
}
.primary-btn:hover {
  background-color: #2563eb;
}

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e2e8f0;
}
.card-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  color: #64748b;
}

.secondary-btn {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.secondary-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #0f172a;
}
.secondary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.label-with-hint {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.active-model-badge {
  background: #eff6ff;
  color: #2563eb;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  font-weight: 600;
}

.custom-model-input {
  margin-top: 0.35rem;
  font-size: 0.85rem;
  color: #475569;
  background: #f8fafc;
}

.form-actions-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.save-indicator {
  color: #16a34a;
  font-weight: 600;
  font-size: 0.9rem;
  animation: fadeIn 0.2s ease;
}

.btn-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid #cbd5e1;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-4px); }
  to { opacity: 1; transform: translateX(0); }
}

.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #0f172a;
  color: white;
  padding: 12px 18px;
  border-radius: 8px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
  font-size: 0.9rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 9999;
  animation: slideToast 0.25s ease;
}
.toast-notification.success {
  border-left: 4px solid #22c55e;
}
.toast-notification.error {
  border-left: 4px solid #ef4444;
}
.toast-notification.warning {
  border-left: 4px solid #f59e0b;
}

@keyframes slideToast {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
