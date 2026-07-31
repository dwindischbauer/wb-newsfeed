<template>
  <div v-if="isOpen && article" class="preview-modal-backdrop" @click.self="$emit('close')">
    <div class="preview-modal-card">
      <div class="preview-modal-header">
        <div>
          <h3>Live Mobile Feed Vorschau</h3>
          <p class="preview-subtitle">So sieht der Artikel im mobilen TikTok Newsfeed aus</p>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="smartphone-preview-frame">
        <div class="phone-tag-bar">
          <span class="badge-category">{{ article.category || 'POLITIK' }}</span>
          <span class="badge-ai">KI-generiert</span>
        </div>

        <div class="phone-media">
          <span class="media-label">{{ article.category || 'Politik' }} Bildvorschau</span>
        </div>

        <div class="phone-content">
          <h2 class="phone-headline">{{ article.title }}</h2>
          <p class="phone-summary">{{ article.summary || article.content }}</p>
          <div class="phone-author">Von {{ article.author || 'ORF.at Redaktion' }} · vor 5 Min</div>

          <button class="btn-read-more" @click="showFull = true">
            Vollständigen Artikel lesen →
          </button>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          :class="['btn-status', article.status === 'Veröffentlicht' ? 'is-published' : 'is-draft']"
          @click="$emit('toggle-status', article.id)"
        >
          Status: {{ article.status }} (Klicken zum Ändern)
        </button>
        <button class="btn-close-modal" @click="$emit('close')">Schließen</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  isOpen: Boolean,
  article: Object
});

defineEmits(['close', 'toggle-status']);

const showFull = ref(false);
</script>

<style scoped>
.preview-modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(5px);
  display: flex; align-items: center; justify-content: center; z-index: 400;
}

.preview-modal-card {
  background: #ffffff; border-radius: 20px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.3);
  display: flex; flex-direction: column; gap: 16px;
}

.preview-modal-header { display: flex; justify-content: space-between; align-items: flex-start; }
.preview-modal-header h3 { font-size: 18px; font-weight: 800; color: #0f172a; }
.preview-subtitle { font-size: 12px; color: #64748b; margin-top: 2px; }

.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #64748b; }

.smartphone-preview-frame {
  background: #09090b; border-radius: 24px; padding: 20px; color: #ffffff; display: flex; flex-direction: column; gap: 14px; border: 2px solid #27272a;
}

.phone-tag-bar { display: flex; justify-content: space-between; align-items: center; }

.badge-category {
  background: #10b981; color: #000000; font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;
}

.badge-ai { background: #27272a; color: #a1a1aa; font-size: 11px; padding: 3px 10px; border-radius: 12px; }

.phone-media {
  height: 140px; background: #18181b; border: 1px solid #27272a; border-radius: 14px; display: flex; align-items: center; justify-content: center;
}

.media-label { font-size: 12px; color: #71717a; font-weight: 600; }

.phone-headline { font-size: 17px; font-weight: 800; color: #f4f4f5; line-height: 1.3; margin-bottom: 6px; }

.phone-summary { font-size: 13px; color: #a1a1aa; line-height: 1.45; margin-bottom: 8px; }

.phone-author { font-size: 11px; color: #71717a; margin-bottom: 12px; }

.btn-read-more {
  background: #10b981; color: #000000; border: none; padding: 10px 16px; border-radius: 20px; font-weight: 800; font-size: 13px; width: 100%; cursor: pointer;
}

.modal-footer { display: flex; gap: 10px; justify-content: space-between; margin-top: 4px; }

.btn-status {
  flex: 1; border: none; padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
}

.btn-status.is-published { background: #dcfce7; color: #15803d; }
.btn-status.is-draft { background: #f1f5f9; color: #64748b; }

.btn-close-modal { background: #0f172a; color: #ffffff; border: none; padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; }
</style>
