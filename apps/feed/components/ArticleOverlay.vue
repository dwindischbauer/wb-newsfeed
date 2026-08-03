<template>
  <div class="content-overlay">
    <h2 class="article-title">{{ article.title }}</h2>
    <p class="teaser" v-if="article.teaser">{{ article.teaser }}</p>
    <div class="meta">{{ article.author }} • vor 5 Min</div>
    <button class="read-more" @click="$emit('read', article)">Vollständigen Artikel lesen</button>
    <div class="scroll-indicator">
      &darr; Weiterscrollen
    </div>
  </div>
</template>

<script setup>
defineProps({
  article: { type: Object, required: true }
});
defineEmits(['read']);
</script>

<style scoped>
.content-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 2rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.article-title {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.teaser {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  line-height: 1.4;
  opacity: 0.9;
}
.meta {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}
.read-more {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}
.scroll-indicator {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  animation: pulse 2s infinite;
  pointer-events: none;
}
@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}
</style>
