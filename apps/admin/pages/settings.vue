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
        <label>KI-Modell</label>
        <select v-model="settings.aiModel">
          <option value="qwen2.5:3b-instruct">qwen2.5:3b-instruct (Lokal)</option>
          <option value="llama3:8b">llama3:8b</option>
          <option value="mistral:7b">mistral:7b</option>
        </select>
      </div>

      <div class="form-group">
        <label>Timeout (ms)</label>
        <input type="number" v-model="settings.timeout" />
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
import { ref } from 'vue';

const settings = ref({
  ollamaUrl: 'http://localhost:11434',
  aiModel: 'qwen2.5:3b-instruct',
  timeout: 30000,
  apiPort: 3005,
  dbPort: 5433
});

const saveSettings = () => {
  alert('Einstellungen gespeichert! (Mock)');
};
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
