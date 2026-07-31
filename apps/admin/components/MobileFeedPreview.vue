<template>
  <div class="mobile-preview-wrapper">
    <div class="preview-meta-title">📱 LIVE SMARTPHONE VORSCHAU</div>

    <!-- iPhone Frame -->
    <div class="iphone-frame">
      <!-- Status bar -->
      <div class="iphone-status-bar">
        <span class="time">09:41</span>
        <div class="notch"></div>
        <div class="status-icons">📶 📡 🔋</div>
      </div>

      <div class="mobile-article-container">
        <!-- Meta Top Bar -->
        <div class="top-meta-row">
          <span class="badge-category">{{ activeItem.category || 'POLITIK' }}</span>
          <span class="badge-ai">
            <span class="badge-ai-dot"></span>
            KI-generiert
          </span>
        </div>

        <!-- Interactive Hero Image Container -->
        <div class="hero-image-box" @click="handleImageClick">
          <div class="image-icon">🖼️</div>
          <p class="image-label">Tippe für Bild-Upload / Vorschau</p>
          <span class="image-subtext">{{ activeItem.category || 'Politik' }} · ORF.at</span>
        </div>

        <!-- Article Card Body -->
        <div class="article-body">
          <h2 class="hero-headline">{{ activeItem.headline || activeItem.title }}</h2>
          <p class="hero-summary">{{ activeItem.summary || activeItem.content }}</p>

          <div class="author-time-meta">
            {{ activeItem.author || 'ORF.at Redaktion' }} · vor 5 Min
          </div>

          <!-- Interactive Action Button -->
          <button class="btn-cta" @click="showReader = true">
            Weiterlesen →
          </button>

          <div class="swipe-indicator" @click="$emit('next-article')">
            <span class="chevron">▲</span>
            <span>TIPPEN FÜR NÄCHSTEN ARTIKEL</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Interactive Reader Overlay Modal inside preview -->
    <div v-if="showReader" class="reader-modal-overlay" @click.self="showReader = false">
      <div class="reader-card">
        <div class="reader-header">
          <span class="badge-category">{{ activeItem.category || 'POLITIK' }}</span>
          <button class="close-reader" @click="showReader = false">✕</button>
        </div>
        <h2 class="reader-headline">{{ activeItem.title || activeItem.headline }}</h2>
        <div class="reader-author">Von {{ activeItem.author || 'ORF.at Redaktion' }}</div>
        
        <div class="takeaways-box">
          <strong class="takeaway-title">💡 KI-Kernpunkte:</strong>
          <ul>
            <li>Wichtige Entscheidung für Redaktion & Veröffentlichung.</li>
            <li>In der BullMQ-Warteschlange asynchron verarbeitet.</li>
          </ul>
        </div>

        <p class="reader-full-content">
          {{ activeItem.content || activeItem.summary }}
        </p>

        <button class="btn-close-full" @click="showReader = false">
          ← Zurück zur Übersicht
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  selectedArticle: {
    type: Object,
    default: null
  }
});

defineEmits(['next-article']);

const showReader = ref(false);

const defaultItem = {
  category: 'POLITIK',
  title: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
  headline: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
  summary: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden.',
  content: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden. Unter anderem sollen Beschattungsanlagen und Fassadenbegrünungen vereinfacht genehmigt werden.',
  author: 'ORF.at Redaktion'
};

const activeItem = computed(() => props.selectedArticle || defaultItem);

function handleImageClick() {
  alert(`Bildoptionen für "${activeItem.value.title}": Bild hochgeladen & optimiert!`);
}
</script>

<style scoped>
.mobile-preview-wrapper { width: 100%; position: relative; }

.preview-meta-title {
  font-size: 12px; font-weight: 800; color: #475569; letter-spacing: 0.5px; margin-bottom: 10px; text-align: center;
}

.iphone-frame {
  width: 340px; background: #09090b; border-radius: 40px; padding: 16px 16px 24px; color: #ffffff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.3); margin: 0 auto; border: 4px solid #27272a; position: relative;
}

.iphone-status-bar {
  display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; padding: 4px 12px 12px;
}

.notch { width: 90px; height: 18px; background: #000000; border-radius: 12px; }

.status-icons { font-size: 10px; }

.mobile-article-container { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }

.top-meta-row { display: flex; justify-content: space-between; align-items: center; }

.badge-category {
  background: #10b981; color: #000000; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px; text-transform: uppercase;
}

.badge-ai {
  background: #27272a; color: #a1a1aa; font-size: 11px; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;
}

.badge-ai-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }

.hero-image-box {
  width: 100%; height: 190px; border: 1px dashed #3f3f46; border-radius: 16px; background: #18181b;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa; cursor: pointer; transition: background 0.15s ease;
}

.hero-image-box:hover { background: #27272a; border-color: #10b981; }

.image-icon { font-size: 28px; margin-bottom: 4px; }
.image-label { font-size: 12px; font-weight: 600; color: #f4f4f5; }
.image-subtext { font-size: 11px; color: #71717a; margin-top: 2px; }

.hero-headline { font-size: 17px; font-weight: 800; line-height: 1.25; color: #f4f4f5; margin-bottom: 6px; }
.hero-summary { font-size: 13px; color: #a1a1aa; line-height: 1.4; margin-bottom: 8px; }
.author-time-meta { font-size: 11px; color: #71717a; margin-bottom: 12px; }

.btn-cta {
  background: #10b981; color: #000000; border: none; padding: 12px 20px; border-radius: 24px; font-weight: 800; font-size: 14px;
  display: flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; width: 100%; transition: transform 0.15s ease;
}

.btn-cta:hover { background: #059669; transform: translateY(-1px); }

.swipe-indicator {
  margin-top: 12px; display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: #71717a; cursor: pointer;
}

.swipe-indicator:hover { color: #10b981; }
.chevron { font-size: 10px; }

.reader-modal-overlay {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); border-radius: 40px;
  display: flex; align-items: flex-end; z-index: 100; padding: 16px;
}

.reader-card {
  background: #18181b; border-radius: 24px; padding: 20px; color: #ffffff; width: 100%; max-height: 90%; overflow-y: auto; border: 1px solid #3f3f46;
}

.reader-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.close-reader { background: none; border: none; color: #a1a1aa; font-size: 18px; cursor: pointer; }

.reader-headline { font-size: 18px; font-weight: 800; color: #f4f4f5; margin-bottom: 6px; }
.reader-author { font-size: 12px; color: #10b981; margin-bottom: 14px; }

.takeaways-box {
  background: #27272a; border-radius: 12px; padding: 12px; margin-bottom: 14px; font-size: 12px; color: #d4d4d8;
}
.takeaways-box ul { margin-left: 16px; margin-top: 4px; }

.reader-full-content { font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-bottom: 16px; }

.btn-close-full {
  background: #3f3f46; color: #ffffff; border: none; padding: 10px 16px; border-radius: 12px; font-size: 12px; font-weight: 700; width: 100%; cursor: pointer;
}
</style>
