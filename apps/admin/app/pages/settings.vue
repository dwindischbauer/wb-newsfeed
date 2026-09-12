<template>
  <div class="settings-page">
    <div class="header">
      <h2>Einstellungen</h2>
    </div>
    
    <div class="settings-card">
      <h3>KI & API Konfiguration</h3>
      
      <div class="form-group">
        <label>Ollama Base URL</label>
        <input type="text" v-model="settings.ollamaUrl" />
      </div>
      
      <div class="form-group">
        <label>Text-KI-Modell (Teaser & Zusammenfassung)</label>
        <select v-model="settings.aiModel">
          <option value="llama3.1:8b-instruct-q4_0">llama3.1:8b-instruct (Empfohlen)</option>
          <option value="qwen2.5:3b-instruct">qwen2.5:3b-instruct (Klein)</option>
          <option value="llama3:8b">llama3:8b</option>
          <option value="mistral:7b">mistral:7b</option>
        </select>
      </div>

      <div class="form-group">
        <label>LocalAI Base URL (Bild-Generierung)</label>
        <input type="text" v-model="settings.localAiUrl" />
      </div>

      <div class="form-group">
        <label>Bild-KI-Modell (Artikelbild-Generierung)</label>
        <select v-model="settings.imageModel">
          <option value="stablediffusion">stablediffusion</option>
          <option value="flux.1-schnell">flux.1-schnell</option>
          <option value="stable-diffusion-3-medium">stable-diffusion-3-medium</option>
          <option value="x/z-image-turbo">x/z-image-turbo</option>
          <option value="">Deaktiviert</option>
        </select>
      </div>

      <div class="form-group">
        <label>Ollama Timeout (ms)</label>
        <input type="number" v-model="settings.timeout" />
      </div>
      
      <div class="form-group">
        <label>Bild-Generierung Timeout (ms)</label>
        <input type="number" v-model="settings.imageTimeout" />
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
      
      <button class="primary-btn" @click="saveSettings">Einstellungen speichern</button>
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

const loadSettings = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/settings`);
    if (res.ok) {
      const data = await res.json();
      if (data.ollamaUrl) settings.value.ollamaUrl = data.ollamaUrl;
      if (data.localAiUrl) settings.value.localAiUrl = data.localAiUrl;
      if (data.aiModel) settings.value.aiModel = data.aiModel;
      if (data.imageModel !== undefined) settings.value.imageModel = data.imageModel;
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
      alert('Einstellungen erfolgreich gespeichert!');
    } else {
      alert('Fehler beim Speichern der Einstellungen.');
    }
  } catch (e) {
    console.error(e);
    alert('Fehler beim Speichern der Einstellungen.');
  }
};

onMounted(() => {
  loadSettings();
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
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  margin-top: 1rem;
}
.primary-btn:hover {
  background-color: #2563eb;
}
</style>
