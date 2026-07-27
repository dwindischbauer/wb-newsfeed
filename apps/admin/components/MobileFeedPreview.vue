<template>
  <div class="mobile-preview-wrapper">
    <div class="preview-meta-title">MOBILE · FEED VORSCHAU</div>

    <!-- iPhone Frame -->
    <div class="iphone-frame">
      <div class="iphone-status-bar">
        <span class="time">9:41</span>
        <div class="notch"></div>
        <div class="status-icons">📶 📡 🔋</div>
      </div>

      <div class="mobile-article-container">
        <div class="top-meta-row">
          <span class="badge-category">{{ activeItem.category || 'POLITIK' }}</span>
          <span class="badge-ai">
            <span class="badge-ai-dot"></span>
            KI-generiert
          </span>
        </div>

        <div class="hero-image-box">
          <div class="image-icon">🖼️</div>
          <p class="image-label">Artikelbild – {{ activeItem.category || 'Politik' }}</p>
          <a href="#" class="browse-link">or browse files</a>
        </div>

        <div class="article-body">
          <h2 class="hero-headline">{{ activeItem.headline || activeItem.title }}</h2>
          <p class="hero-summary">{{ activeItem.summary || activeItem.content }}</p>

          <div class="author-time-meta">
            {{ activeItem.author || 'ORF.at Redaktion' }} · vor 12 Min
          </div>

          <button class="btn-cta" @click="handleReadMore">
            Weiterlesen →
          </button>

          <div class="swipe-indicator">
            <span class="chevron">^</span>
            <span>NACH OBEN SWIPEN</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  selectedArticle: {
    type: Object,
    default: null
  }
});

const defaultItem = {
  category: 'POLITIK',
  title: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
  headline: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
  summary: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden.',
  author: 'ORF.at Redaktion'
};

const activeItem = computed(() => props.selectedArticle || defaultItem);

function handleReadMore() {
  alert(`Artikel geöffnet: ${activeItem.value.title || activeItem.value.headline}`);
}
</script>

<style scoped>
.mobile-preview-wrapper {
  width: 100%;
}

.preview-meta-title {
  font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 10px; text-align: center;
}

.iphone-frame {
  width: 340px; background: #09090b; border-radius: 40px; padding: 16px 16px 24px; color: #ffffff;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); margin: 0 auto; border: 4px solid #27272a;
}

.iphone-status-bar {
  display: flex; justify-content: space-between; align-items: center; font-size: 12px; font-weight: 600; padding: 4px 12px 12px;
}

.notch { width: 90px; height: 18px; background: #000000; border-radius: 12px; }

.status-icons { font-size: 10px; }

.mobile-article-container { display: flex; flex-direction: column; gap: 16px; margin-top: 8px; }

.top-meta-row { display: flex; justify-content: space-between; align-items: center; }

.badge-category {
  background: #10b981; color: #000000; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
}

.badge-ai {
  background: #27272a; color: #a1a1aa; font-size: 11px; padding: 3px 10px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;
}

.badge-ai-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }

.hero-image-box {
  width: 100%; height: 210px; border: 1px dashed #3f3f46; border-radius: 16px; background: #18181b;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa;
}

.image-icon { font-size: 28px; margin-bottom: 6px; }
.image-label { font-size: 12px; font-weight: 500; }
.browse-link { font-size: 11px; color: #71717a; text-decoration: underline; margin-top: 4px; }

.hero-headline { font-size: 18px; font-weight: 800; line-height: 1.25; color: #f4f4f5; margin-bottom: 8px; }
.hero-summary { font-size: 13px; color: #a1a1aa; line-height: 1.45; margin-bottom: 10px; }
.author-time-meta { font-size: 11px; color: #71717a; margin-bottom: 14px; }

.btn-cta {
  background: #10b981; color: #000000; border: none; padding: 12px 24px; border-radius: 24px; font-weight: 800; font-size: 14px;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; width: 100%; transition: transform 0.15s ease;
}

.btn-cta:hover { background: #059669; transform: translateY(-1px); }

.swipe-indicator {
  margin-top: 16px; display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: #71717a;
}
.chevron { font-size: 12px; line-height: 1; }
</style>
