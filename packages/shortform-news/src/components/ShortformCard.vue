<template>
  <div class="sf-card" ref="cardRef">
    <div class="sf-media-area" :style="mediaStyle">
      <slot name="card-media" :article="article">
        <div class="sf-badges-wrapper">
          <span class="sf-category-badge">{{ article.category }}</span>
          <div class="sf-tags-container" v-if="article.tags && article.tags.length > 0">
            <button 
              type="button"
              v-for="tag in article.tags" 
              :key="tag.id || tag.name" 
              class="sf-tag-badge"
              :style="tag.color ? { borderColor: tag.color, color: tag.color, backgroundColor: tag.color + '22' } : {}"
              @click.stop="$emit('filter-tag', tag.name)"
              title="Nach diesem Subtag filtern"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
      </slot>
    </div>
    <div class="sf-content-overlay">
      <slot name="card-content" :article="article" :readAction="triggerRead">
        <div class="sf-text-block">
          <h2 class="sf-article-title">{{ article.title }}</h2>
          <p class="sf-teaser" v-if="article.teaser">{{ article.teaser }}</p>
          <div class="sf-meta">{{ article.author || 'Redaktion' }} • {{ readingTime }}</div>
        </div>
        <button class="sf-read-more" @click="triggerRead">Vollständigen Artikel lesen</button>
        <div class="sf-scroll-indicator">
          &darr; Weiterscrollen
        </div>
      </slot>

      <!-- TikTok-style action rail -->
      <div class="sf-action-rail">
        <button
          type="button"
          :class="['sf-action-btn', { active: liked }]"
          @click.stop="$emit(liked ? 'unlike' : 'like', article)"
          :title="liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          <span class="sf-action-count">{{ formatCount(article.likeCount) }}</span>
        </button>

        <button type="button" class="sf-action-btn" @click.stop="$emit('open-comments', article)" title="Kommentare">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
          <span class="sf-action-count">{{ formatCount(article.commentCount) }}</span>
        </button>

        <button type="button" class="sf-action-btn" @click.stop="$emit('share', article)" title="Teilen">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span class="sf-action-count">{{ formatCount(article.shareCount) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { estimateReadingTime, formatEngagementCount } from '../utils';

const props = defineProps<{
  article: any;
  apiUrl?: string;
  trackingEnabled?: boolean;
  liked?: boolean;
}>();

const emit = defineEmits(['read', 'impression', 'filter-tag', 'like', 'unlike', 'share', 'open-comments']);

const readingTime = computed(() => estimateReadingTime(props.article.content));

const formatCount = (n: number | undefined | null): string => formatEngagementCount(n);


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

.sf-badges-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.sf-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: flex-end;
  max-width: 250px;
}

.sf-category-badge {
  background: var(--sf-badge-bg, rgba(255, 255, 255, 0.15));
  border: 1px solid var(--sf-badge-border, rgba(255, 255, 255, 0.3));
  color: var(--sf-badge-color, white);
  padding: 0.4rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  backdrop-filter: blur(10px);
  font-family: var(--font-accent, inherit);
  font-style: italic;
}

.sf-tag-badge {
  background: rgba(20, 20, 20, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #f3f2ec;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  backdrop-filter: blur(8px);
}

.sf-content-overlay {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  min-height: 65%;
  padding: var(--sf-padding, 2rem);
  background: linear-gradient(
    to top,
    var(--sf-overlay-color, rgba(0,0,0,0.9)) 0%,
    var(--sf-overlay-color, rgba(0,0,0,0.9)) 35%,
    rgba(0, 0, 0, 0.55) 60%,
    rgba(0, 0, 0, 0.15) 85%,
    transparent 100%
  );
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.sf-text-block {
  padding-right: 3.75rem;
}

.sf-action-rail {
  position: absolute;
  right: 1rem;
  bottom: 6.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.35rem;
}

.sf-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  background: none;
  border: none;
  padding: 0;
  color: #ffffff;
  cursor: pointer;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
  transition: transform 0.15s ease;
}

.sf-action-btn:active {
  transform: scale(0.88);
}

.sf-action-btn.active {
  color: var(--sf-primary-color, #4ade80);
}

.sf-action-count {
  font-size: 0.72rem;
  font-weight: 700;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
}

.sf-article-title {
  margin: 0 0 1rem 0;
  font-size: var(--sf-title-size, 2rem);
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.5), 0 1px 4px rgba(0, 0, 0, 0.85);
}

.sf-teaser {
  margin: 0 0 1rem 0;
  font-size: var(--sf-teaser-size, 1rem);
  line-height: 1.4;
  opacity: 0.95;
  text-shadow: 0 1px 10px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(0, 0, 0, 0.8);
}

.sf-meta {
  font-size: 0.8rem;
  opacity: 0.85;
  margin-bottom: 1rem;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
}

.sf-read-more {
  background-color: var(--sf-primary-color, #4ade80);
  color: var(--sf-primary-text, #000);
  border: none;
  padding: 1rem;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
  box-shadow: 0 6px 18px rgba(20, 20, 20, 0.3);
}

.sf-read-more:hover {
  opacity: 0.9;
}

.sf-scroll-indicator {
  position: absolute;
  bottom: 5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.75);
  font-size: 0.8rem;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.6);
  animation: sf-pulse 2s infinite;
  pointer-events: none;
}

@keyframes sf-pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}
</style>

<!-- refactor(pkg): use tailwind @layer utilities in shortform-news -->

<!-- feat(pkg): add frosted-glass card variant using backdrop-blur -->
