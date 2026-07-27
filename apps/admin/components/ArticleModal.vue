<template>
  <div v-if="isOpen" class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <div>
          <h3>Neuen Artikel einpflegen</h3>
          <p class="header-hint">⚡ Läuft sofort im Hintergrund in der BullMQ-Warteschlange</p>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <div class="form-group">
          <label>Titel des Artikels</label>
          <input 
            v-model="form.title" 
            type="text" 
            placeholder="z.B. Hitzeschutz: Regierung will Maßnahmen erleichtern" 
            required 
          />
        </div>

        <div class="form-group">
          <label>Kategorie</label>
          <select v-model="form.category">
            <option value="Politik">Politik</option>
            <option value="Wirtschaft">Wirtschaft</option>
            <option value="Sport">Sport</option>
            <option value="Technologie">Technologie</option>
            <option value="Kultur">Kultur</option>
          </select>
        </div>

        <div class="form-group">
          <label>Autor / Quelle</label>
          <input 
            v-model="form.author" 
            type="text" 
            placeholder="ORF.at / Redaktion" 
          />
        </div>

        <div class="form-group">
          <label>Artikel-Inhalt (Fließtext reinkopieren)</label>
          <textarea 
            v-model="form.content" 
            rows="5" 
            placeholder="Füge hier den vollständigen Nachrichtentext ein..." 
            required
          ></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="$emit('close')">Abbrechen</button>
          <button type="submit" class="btn-primary">
            🚀 In Warteschlange einreihen (Sofortschließen)
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  isOpen: Boolean,
});

const emit = defineEmits(['close', 'submitted']);

const form = ref({
  title: '',
  category: 'Politik',
  author: 'ORF.at Redaktion',
  content: '',
});

function handleSubmit() {
  const payload = {
    title: form.value.title,
    category: form.value.category,
    author: form.value.author || 'ORF.at Redaktion',
    content: form.value.content,
    source: 'cms-admin-ui',
  };

  // Close instantly and notify parent UI for immediate live preview update
  emit('close');
  emit('submitted', payload);

  // Send request in background asynchronously
  fetch('http://localhost:3000/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(err => console.error('Background ingestion error:', err));

  form.value = { title: '', category: 'Politik', author: 'ORF.at Redaktion', content: '' };
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 100;
}

.modal-card {
  background: #ffffff; border-radius: 16px; width: 100%; max-width: 580px; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px;
}

.header-hint { font-size: 12px; color: #10b981; font-weight: 600; margin-top: 2px; }

.close-btn { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }

.modal-body { display: flex; flex-direction: column; gap: 16px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-group label { font-size: 13px; font-weight: 600; color: #0f172a; }

.form-group input, .form-group select, .form-group textarea {
  padding: 10px 14px; border: 1px solid #cbd5e1; border-radius: 8px; font-family: inherit; font-size: 14px;
}

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 12px; }

.btn-cancel { background: #f1f5f9; color: #475569; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }

.btn-primary { background: #10b981; color: #000000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; }
</style>
