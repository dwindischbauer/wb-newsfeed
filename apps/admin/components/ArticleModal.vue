<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>✨ Artikel einpflegen & KI-Zusammenfassung</h3>
          <p class="header-hint">Text einfügen ➔ Automatische Zusammenfassung & Live-Mobilvorschau</p>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <div class="label-row">
            <label>Artikel-Inhalt (Fließtext reinkopieren / einfügen)</label>
            <button type="button" class="btn-paste" @click="handlePasteFromClipboard">
              📋 aus Zwischenablage einfügen
            </button>
          </div>
          <textarea 
            v-model="form.content" 
            rows="6" 
            placeholder="Füge hier den vollständigen Nachrichtentext ein (z.B. aus ORF.at)..." 
            required
            @input="autoGenerateTitleAndSummary"
          ></textarea>
        </div>

        <div class="form-row">
          <div class="form-group flex-2">
            <label>Generierter / Eigener Titel</label>
            <input 
              v-model="form.title" 
              type="text" 
              placeholder="z.B. Hitzeschutz: Regierung will Maßnahmen erleichtern" 
              required 
            />
          </div>

          <div class="form-group flex-1">
            <label>Kategorie</label>
            <select v-model="form.category">
              <option value="Politik">Politik</option>
              <option value="Wirtschaft">Wirtschaft</option>
              <option value="Sport">Sport</option>
              <option value="Technologie">Technologie</option>
              <option value="Kultur">Kultur</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>Generierte Zusammenfassung (Teaser-Text für Handy)</label>
          <textarea 
            v-model="form.summary" 
            rows="3" 
            placeholder="Wird automatisch aus dem Text generiert oder kann hier angepasst werden..."
          ></textarea>
        </div>

        <div class="form-group">
          <label>Autor / Quelle</label>
          <input 
            v-model="form.author" 
            type="text" 
            placeholder="ORF.at / Redaktion" 
          />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">Abbrechen</button>
          <button type="submit" class="btn-primary">
            🚀 Zusammenfassen & Verwalten (Sofortschließen)
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'submitted']);

const form = ref({
  title: '',
  category: 'Politik',
  author: 'ORF.at Redaktion',
  content: '',
  summary: '',
});

async function handlePasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    if (text) {
      form.value.content = text;
      autoGenerateTitleAndSummary();
    }
  } catch (err) {
    alert('Bitte füge den Text mit Strg+V in das Textfeld ein.');
  }
}

function autoGenerateTitleAndSummary() {
  if (!form.value.content) return;

  const lines = form.value.content.split('\n').map(l => l.trim()).filter(Boolean);
  
  if (!form.value.title && lines.length > 0) {
    form.value.title = lines[0].length < 100 ? lines[0] : lines[0].substring(0, 90) + '...';
  }

  const fullText = lines.slice(1).join(' ') || lines[0] || '';
  if (fullText.length > 10) {
    form.value.summary = fullText.length > 160 ? fullText.substring(0, 157) + '...' : fullText;
  }
}

function handleSubmit() {
  autoGenerateTitleAndSummary();

  const payload = {
    title: form.value.title || 'Neuer Artikel',
    category: form.value.category || 'Politik',
    author: form.value.author || 'ORF.at Redaktion',
    content: form.value.content,
    summary: form.value.summary || (form.value.content.substring(0, 150) + '...'),
    source: 'cms-admin-ui',
  };

  // Close modal instantly & emit submitted event for live management
  emit('close');
  emit('submitted', payload);

  // Background API ingestion call
  fetch('http://localhost:3005/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => console.error('Background ingestion error:', err));

  // Reset form
  form.value = { title: '', category: 'Politik', author: 'ORF.at Redaktion', content: '', summary: '' };
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}

.modal-card {
  background: #ffffff; border-radius: 16px; width: 100%; max-width: 640px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;
}

.header-hint { font-size: 12px; color: #10b981; font-weight: 600; margin-top: 2px; }

.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }

.modal-body { display: flex; flex-direction: column; gap: 14px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }

.label-row { display: flex; justify-content: space-between; align-items: center; }

.btn-paste {
  background: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; font-size: 12px; font-weight: 700;
  padding: 4px 10px; border-radius: 6px; cursor: pointer; transition: all 0.15s ease;
}

.btn-paste:hover { background: #d1fae5; }

.form-row { display: flex; gap: 12px; }
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }

.form-group label { font-size: 13px; font-weight: 600; color: #0f172a; }

.form-group input, .form-group select, .form-group textarea {
  padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 14px; color: #0f172a;
}

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }

.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }

.btn-primary { background: #10b981; color: #000000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }

.btn-primary:hover { background: #059669; }
</style>
