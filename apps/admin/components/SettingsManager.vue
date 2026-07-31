<template>
  <div class="settings-manager">
    <div class="section-header">
      <h2>System & KI-Einstellungen</h2>
      <p>Konfiguriere LLM Engine, Datenbankverbindung & Fastify API Schnittstellen</p>
    </div>

    <form @submit.prevent="saveSettings" class="settings-form">
      <div class="settings-group">
        <h3>KI Teaser Generator (Ollama LLM)</h3>

        <div class="form-row">
          <div class="form-field flex-2">
            <label>Ollama Base URL</label>
            <input v-model="settings.ollamaUrl" type="text" />
          </div>
          <div class="form-field flex-1">
            <label>KI Modell</label>
            <select v-model="settings.ollamaModel">
              <option value="qwen2.5:3b-instruct">qwen2.5:3b-instruct (Empfohlen)</option>
              <option value="llama3:8b">llama3:8b</option>
              <option value="mistral:7b">mistral:7b</option>
            </select>
          </div>
        </div>

        <div class="form-field">
          <label>LLM Timeout (ms)</label>
          <input v-model.number="settings.llmTimeout" type="number" />
        </div>
      </div>

      <div class="settings-group">
        <h3>Infrastruktur & Datenbank Ports</h3>

        <div class="form-row">
          <div class="form-field">
            <label>Fastify API Port</label>
            <input v-model.number="settings.apiPort" type="number" />
          </div>
          <div class="form-field">
            <label>PostgreSQL Port</label>
            <input v-model.number="settings.postgresPort" type="number" />
          </div>
          <div class="form-field">
            <label>Redis Queue Port</label>
            <input v-model.number="settings.redisPort" type="number" />
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn-save">
          Einstellungen speichern
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['saved']);

const settings = ref({
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5:3b-instruct',
  llmTimeout: 30000,
  apiPort: 3005,
  postgresPort: 5433,
  redisPort: 6379
});

function saveSettings() {
  emit('saved', 'Einstellungen erfolgreich gespeichert!');
}
</script>

<style scoped>
.settings-manager { width: 100%; max-width: 900px; }

.section-header { margin-bottom: 24px; }
.section-header h2 { font-size: 20px; font-weight: 700; color: #0f172a; }
.section-header p { font-size: 13px; color: #64748b; margin-top: 2px; }

.settings-form { display: flex; flex-direction: column; gap: 24px; }

.settings-group {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 24px; display: flex; flex-direction: column; gap: 16px;
}

.settings-group h3 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }

.form-row { display: flex; gap: 16px; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-field { display: flex; flex-direction: column; gap: 6px; }
.form-field label { font-size: 13px; font-weight: 600; color: #334155; }
.form-field input, .form-field select {
  padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 14px; font-family: inherit; color: #0f172a;
}

.btn-save {
  background: #10b981; color: #000000; border: none; padding: 12px 24px; border-radius: 8px; font-weight: 800; font-size: 14px; cursor: pointer;
}

.btn-save:hover { background: #059669; }
</style>
