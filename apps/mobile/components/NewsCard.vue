<template>
  <div class="tiktok-card-slide">
    <!-- Top Category & AI Tag Row -->
    <div class="top-tag-row">
      <span class="badge-category">{{ item.category || 'POLITIK' }}</span>
      <span class="badge-ai">
        <span class="badge-ai-dot"></span>
        KI-generiert
      </span>
    </div>

    <!-- Visual Media Container -->
    <div class="media-box">
      <div class="media-placeholder">
        <span class="media-tag">{{ item.category || 'Politik' }}</span>
      </div>
    </div>

    <!-- Article Content overlay at bottom of screen -->
    <div class="content-overlay">
      <h2 class="slide-headline">{{ item.headline }}</h2>
      <p class="slide-summary">{{ item.summary }}</p>
      
      <div class="slide-meta font-medium">
        {{ item.author || 'ORF.at Redaktion' }} · {{ item.timeAgo || 'vor 5 Min' }}
      </div>

      <div class="slide-actions">
        <button class="btn-read-full" @click="$emit('read-more', item)">
          Vollständigen Artikel lesen →
        </button>
      </div>

      <div class="scroll-hint">
        <span>Nach oben wischen für nächsten Artikel</span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
});

defineEmits(['read-more']);
</script>

<style scoped>
.tiktok-card-slide {
  height: 100vh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  background: #09090b;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 20px 32px;
  position: relative;
  box-sizing: border-box;
}

.top-tag-row {
  display: flex; justify-content: space-between; align-items: center; z-index: 10; margin-top: 12px;
}

.badge-category {
  background: #10b981; color: #000000; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;
}

.badge-ai {
  background: #27272a; color: #a1a1aa; font-size: 11px; padding: 4px 12px; border-radius: 12px; display: inline-flex; align-items: center; gap: 6px;
}

.badge-ai-dot { width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; }

.media-box {
  flex: 1; margin: 16px 0; border-radius: 20px; overflow: hidden; background: #18181b; border: 1px solid #27272a;
  display: flex; align-items: center; justify-content: center; position: relative;
}

.media-placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #71717a;
}

.media-tag { font-size: 13px; font-weight: 700; color: #a1a1aa; background: #27272a; padding: 4px 12px; border-radius: 12px; }

.content-overlay {
  display: flex; flex-direction: column; gap: 12px; z-index: 10;
}

.slide-headline { font-size: 22px; font-weight: 800; color: #f4f4f5; line-height: 1.25; }

.slide-summary { font-size: 14px; color: #a1a1aa; line-height: 1.5; max-height: 120px; overflow: hidden; }

.slide-meta { font-size: 12px; color: #71717a; }

.btn-read-full {
  background: #10b981; color: #000000; border: none; padding: 14px 24px; border-radius: 28px; font-weight: 800; font-size: 15px;
  width: 100%; cursor: pointer; transition: transform 0.15s ease; text-align: center;
}

.btn-read-full:active { transform: scale(0.98); }

.scroll-hint {
  text-align: center; font-size: 10px; color: #52525b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px;
}
</style>
