<template>
  <div class="news-card">
    <div class="card-meta">
      <span class="badge-category">{{ item.category || 'POLITIK' }}</span>
      <span class="badge-ai">
        <span class="badge-ai-dot"></span>
        KI-generiert
      </span>
    </div>

    <!-- Hero Image Box -->
    <div class="hero-image">
      <div class="image-icon">🖼️</div>
      <span class="image-title">Artikelbild – {{ item.category || 'Politik' }}</span>
      <a href="#" class="browse-link">or browse files</a>
    </div>

    <!-- Content Body -->
    <div class="card-content">
      <h2 class="headline">{{ item.headline }}</h2>
      <p class="summary">{{ item.summary }}</p>
      <div class="sub-meta">Redaktion Inland · {{ item.timeAgo || 'vor 12 Min' }}</div>

      <!-- Action Button -->
      <button class="btn-cta" @click="$emit('read-more', item)">
        Weiterlesen →
      </button>

      <div class="swipe-hint">
        <span class="arrow">^</span>
        <span>NACH OBEN SWIPEN</span>
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
.news-card {
  display: flex; flex-direction: column; gap: 16px; padding: 16px; background: #09090b;
}

.card-meta { display: flex; justify-content: space-between; align-items: center; }

.hero-image {
  width: 100%; height: 220px; border: 1px dashed #3f3f46; border-radius: 16px; background: #18181b;
  display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa;
}

.image-icon { font-size: 32px; margin-bottom: 6px; }
.image-title { font-size: 13px; font-weight: 500; }
.browse-link { font-size: 11px; color: #71717a; text-decoration: underline; margin-top: 4px; }

.card-content { display: flex; flex-direction: column; gap: 10px; }

.headline { font-size: 20px; font-weight: 800; color: #f4f4f5; line-height: 1.25; }
.summary { font-size: 14px; color: #a1a1aa; line-height: 1.45; }
.sub-meta { font-size: 12px; color: #71717a; margin-bottom: 6px; }

.swipe-hint {
  margin-top: 16px; display: flex; flex-direction: column; align-items: center; font-size: 9px; font-weight: 700; letter-spacing: 0.5px; color: #71717a;
}
.arrow { font-size: 12px; line-height: 1; }
</style>
