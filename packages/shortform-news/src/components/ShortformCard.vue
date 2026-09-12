<template>
  <div class="sf-card" ref="cardRef">
    <div class="sf-media-area" :style="mediaStyle">
      <slot name="card-media" :article="article">
        <span class="sf-category-badge">{{ article.category }}</span>
      </slot>
    </div>
    <div class="sf-content-overlay">
      <slot name="card-content" :article="article" :readAction="triggerRead">
        <h2 class="sf-article-title">{{ article.title }}</h2>
        <p class="sf-teaser" v-if="article.teaser">{{ article.teaser }}</p>
        <div class="sf-meta">{{ article.author || 'Redaktion' }} • vor 5 Min</div>
        <button class="sf-read-more" @click="triggerRead">Vollständigen Artikel lesen</button>
        <div class="sf-scroll-indicator">
          &darr; Weiterscrollen
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  article: any;
  apiUrl?: string;
  trackingEnabled?: boolean;
}>();

const emit = defineEmits(['read', 'impression']);

const cardRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const mediaStyle = computed(() => {
  if (props.article.imageUrl) {
    const baseUrl = props.apiUrl ? props.apiUrl.replace(/\/$/, '') : '';
    const imageUrl = props.article.imageUrl.startsWith('/') ? props.article.imageUrl : `/${props.article.imageUrl}`;
    return { backgroundImage: `url(${baseUrl}${imageUrl})` };
  }
  return {};
});

const triggerRead = () => {
  emit('read', props.article);
};

onMounted(() => {
  if (props.trackingEnabled && cardRef.value) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          emit('impression', props.article);
          if (observer && cardRef.value) {
            observer.unobserve(cardRef.value); // Only track impression once
          }
        }
      });
    }, { threshold: 0.5 });
    observer.observe(cardRef.value);
  }
});

onUnmounted(() => {
  if (observer) {
    observer.disconnect();
  }
});
</script>

<style scoped>
.sf-card {
  height: 100vh;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--sf-bg-color, #000);
  color: var(--sf-text-color, #fff);
}

.sf-media-area {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  padding: var(--sf-padding, 1rem);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: var(--sf-media-bg, #1f2937);
}

.sf-category-badge {
  background: var(--sf-badge-bg, rgba(255, 255, 255, 0.1));
  border: 1px solid var(--sf-badge-border, rgba(255, 255, 255, 0.2));
  color: var(--sf-badge-color, white);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  backdrop-filter: blur(4px);
}

.sf-content-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: var(--sf-padding, 2rem);
  background: linear-gradient(transparent, var(--sf-overlay-color, rgba(0,0,0,0.9)));
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sf-article-title {
  margin: 0 0 1rem 0;
  font-size: var(--sf-title-size, 2rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.sf-teaser {
  margin: 0 0 1rem 0;
  font-size: var(--sf-teaser-size, 1rem);
  line-height: 1.4;
  opacity: 0.9;
}

.sf-meta {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}

.sf-read-more {
  background-color: var(--sf-primary-color, #4ade80);
  color: var(--sf-primary-text, #000);
  border: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.sf-read-more:hover {
  opacity: 0.9;
}

.sf-scroll-indicator {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  animation: sf-pulse 2s infinite;
  pointer-events: none;
}

@keyframes sf-pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}
</style>
