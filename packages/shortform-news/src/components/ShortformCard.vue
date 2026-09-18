<template>
  <div ref="cardRef" class="relative flex h-screen flex-col bg-[var(--sf-bg-color,#000)] text-[var(--sf-text-color,#fff)] [scroll-snap-align:start]">
    <div class="flex flex-1 items-start justify-end bg-[var(--sf-media-bg,#1f2937)] bg-cover bg-center bg-no-repeat p-[var(--sf-padding,1rem)]" :style="mediaStyle">
      <slot name="card-media" :article="article">
        <span class="rounded-full border border-[var(--sf-badge-border,rgba(255,255,255,0.3))] bg-[var(--sf-badge-bg,rgba(255,255,255,0.15))] px-[0.85rem] py-[0.4rem] font-[var(--font-accent,inherit)] text-[0.85rem] italic font-semibold text-[var(--sf-badge-color,white)] backdrop-blur-[10px]">{{ article.category }}</span>
      </slot>
    </div>
    <div class="absolute inset-x-0 bottom-0 flex min-h-[65%] flex-col justify-end p-[var(--sf-padding,2rem)] [background:linear-gradient(to_top,var(--sf-overlay-color,rgba(0,0,0,0.9))_0%,var(--sf-overlay-color,rgba(0,0,0,0.9))_35%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.15)_85%,transparent_100%)]">
      <slot name="card-content" :article="article" :read-action="triggerRead">
        <div class="pr-[3.75rem]">
          <h2 class="m-0 mb-4 text-[length:var(--sf-title-size,2rem)] font-extrabold leading-[1.2] tracking-[-0.02em] [text-shadow:0_2px_16px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.85)]">{{ article.title }}</h2>
          <p v-if="article.teaser" class="m-0 mb-4 text-[length:var(--sf-teaser-size,1rem)] leading-[1.4] opacity-95 [text-shadow:0_1px_10px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.8)]">{{ article.teaser }}</p>
          <div class="mb-4 text-[0.8rem] opacity-85 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ article.author || 'Redaktion' }} • {{ readingTime }}</div>
        </div>
        <button
          class="cursor-pointer rounded-full border-none bg-[var(--sf-primary-color,#4ade80)] p-4 text-base font-bold text-[var(--sf-primary-text,#000)] shadow-[0_6px_18px_rgba(20,20,20,0.3)] transition-opacity duration-200 hover:opacity-90"
          @click="triggerRead"
        >
          Vollständigen Artikel lesen
        </button>
        <div class="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 animate-sf-pulse text-[0.8rem] text-white/75 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          &darr; Weiterscrollen
        </div>
      </slot>

      <!-- TikTok-style action rail -->
      <div class="absolute bottom-[6.75rem] right-4 flex flex-col items-center gap-[1.35rem]">
        <button
          type="button"
          class="flex flex-col items-center gap-[0.3rem] border-none bg-transparent p-0 text-white transition-transform duration-150 [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] active:scale-[0.88]"
          :class="{ 'text-[var(--sf-primary-color,#4ade80)]': liked }"
          :title="liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'"
          @click.stop="handleLikeClick"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'sf-like-pop': justLiked }"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          <span class="text-[0.72rem] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ formatCount(article.likeCount) }}</span>
        </button>

        <button
          type="button"
          class="flex flex-col items-center gap-[0.3rem] border-none bg-transparent p-0 text-white transition-transform duration-150 [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] active:scale-[0.88]"
          title="Kommentare"
          @click.stop="$emit('open-comments', article)"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
          <span class="text-[0.72rem] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ formatCount(article.commentCount) }}</span>
        </button>

        <button
          type="button"
          class="flex flex-col items-center gap-[0.3rem] border-none bg-transparent p-0 text-white transition-transform duration-150 [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] active:scale-[0.88]"
          title="Teilen"
          @click.stop="$emit('share', article)"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span class="text-[0.72rem] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ formatCount(article.shareCount) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { estimateReadingTime, formatEngagementCount, type Article } from '../utils';

const props = defineProps<{
  article: Article;
  apiUrl?: string;
  trackingEnabled?: boolean;
  liked?: boolean;
}>();

const emit = defineEmits<{
  read: [articleId: number];
  impression: [article: Article];
  'filter-tag': [tag: string];
  like: [article: Article];
  unlike: [article: Article];
  share: [article: Article];
  'open-comments': [article: Article];
}>();

const readingTime = computed(() => estimateReadingTime(props.article.content));

const formatCount = (n: number | undefined | null): string => formatEngagementCount(n);

const cardRef = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

// Brief pop animation as feedback when a like registers (not on unlike).
const justLiked = ref(false);
let likePopTimeout: ReturnType<typeof setTimeout> | null = null;

const handleLikeClick = () => {
  if (!props.liked) {
    justLiked.value = false;
    requestAnimationFrame(() => {
      justLiked.value = true;
      if (likePopTimeout) clearTimeout(likePopTimeout);
      likePopTimeout = setTimeout(() => {
        justLiked.value = false;
      }, 350);
    });
  }
  emit(props.liked ? 'unlike' : 'like', props.article);
};

const mediaStyle = computed(() => {
  if (props.article.imageUrl) {
    const baseUrl = props.apiUrl ? props.apiUrl.replace(/\/$/, '') : '';
    const imageUrl = props.article.imageUrl.startsWith('/') ? props.article.imageUrl : `/${props.article.imageUrl}`;
    return { backgroundImage: `url(${baseUrl}${imageUrl})` };
  }
  return {};
});

// Only the article ID is signaled to the host — the host owns navigation and
// full-article rendering, per the module's contract (module never navigates
// itself, only tells the embedding system which article was opened).
const triggerRead = () => {
  emit('read', props.article.id);
};

onMounted(() => {
  if (props.trackingEnabled && cardRef.value) {
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
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
  if (likePopTimeout) {
    clearTimeout(likePopTimeout);
  }
});
</script>

<style scoped>
@keyframes sf-like-pop {
  0% {
    transform: scale(1);
  }
  35% {
    transform: scale(1.35);
  }
  65% {
    transform: scale(0.92);
  }
  100% {
    transform: scale(1);
  }
}

.sf-like-pop {
  animation: sf-like-pop 0.35s ease-out;
}
</style>
