<template>
  <div ref="cardRef" class="relative flex h-full flex-col overflow-hidden bg-[var(--sf-bg-color,#12110f)] text-[var(--sf-text-color,#f4efe6)] [scroll-snap-align:start]">
    <!-- Media area: real cover photo when present, otherwise a calm ruled newsprint cover -->
    <div
      class="relative flex-1 bg-[var(--sf-media-bg,#1c1a17)] bg-cover bg-center bg-no-repeat"
      :style="mediaStyle"
    >
      <slot name="card-media" :article="article">
        <div
          v-if="!hasImage"
          class="flex h-[38%] flex-col justify-between px-6 pb-4 pt-20"
          aria-hidden="true"
        >
          <div class="border-t border-white/[0.12] pt-3">
            <div class="flex items-center justify-between font-mono text-[0.72rem] text-white/45">
              <span>{{ article.category || 'Nachrichten' }}</span>
              <span>{{ article.author || 'Redaktion' }}</span>
            </div>
          </div>
          <div class="space-y-2.5 py-2">
            <div class="h-[1px] w-12 bg-white/30"></div>
            <div class="h-[2px] w-3/4 rounded-full bg-white/[0.08]"></div>
            <div class="h-[2px] w-1/2 rounded-full bg-white/[0.06]"></div>
          </div>
        </div>
      </slot>
    </div>

    <!-- Bottom scrim + editorial content -->
    <div
      class="absolute inset-x-0 bottom-0 flex min-h-[62%] flex-col justify-end px-6 pb-7 pt-20 [background:linear-gradient(to_top,var(--sf-overlay-color,rgba(18,17,15,0.96))_0%,var(--sf-overlay-color,rgba(18,17,15,0.92))_44%,rgba(18,17,15,0.55)_72%,transparent_100%)]"
    >
      <slot name="card-content" :article="article" :read-action="triggerRead">
        <div class="pr-14">
          <div class="mb-3 flex flex-wrap items-center gap-2 text-[0.75rem] text-white/70">
            <span
              v-if="article.category"
              class="rounded-[5px] border border-[var(--sf-badge-border,rgba(255,255,255,0.18))] bg-[var(--sf-badge-bg,rgba(255,255,255,0.1))] px-2 py-0.5 font-medium text-[var(--sf-badge-color,#f4efe6)]"
            >
              {{ article.category }}
            </span>
            <span class="font-mono tabular-nums text-white/60">{{ readingTime }}</span>
          </div>

          <h2 class="m-0 mb-3 font-[var(--font-accent,inherit)] text-[length:var(--sf-title-size,1.85rem)] font-medium leading-[1.16] tracking-[-0.01em] text-[var(--sf-text-color,#f4efe6)]">
            {{ article.title }}
          </h2>
          <p v-if="article.teaser" class="m-0 mb-3.5 text-[length:var(--sf-teaser-size,0.96rem)] leading-[1.48] text-white/85">
            {{ article.teaser }}
          </p>
          <div class="mb-5 font-mono text-[0.74rem] text-white/60">
            {{ article.author || 'Redaktion' }}
          </div>
        </div>

        <button
          type="button"
          class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-[var(--sf-primary-color,#d5f24e)] px-5 py-3.5 text-[0.94rem] font-semibold text-[var(--sf-primary-text,#171512)] transition-opacity duration-150 hover:opacity-90 active:scale-[0.99]"
          @click="triggerRead"
        >
          <span>Weiterlesen</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
      </slot>

      <!-- Like, Kommentare, Teilen -->
      <div class="absolute bottom-24 right-5 flex flex-col items-center gap-5">
        <button
          type="button"
          class="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 transition-transform duration-150 active:scale-[0.9]"
          :class="liked ? 'text-[var(--sf-primary-color,#d5f24e)]' : 'text-white/85 hover:text-white'"
          :title="liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'"
          @click.stop="handleLikeClick"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" :class="{ 'sf-like-pop': justLiked }"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          <span class="font-mono text-[0.72rem] font-medium tabular-nums">{{ formatCount(article.likeCount) }}</span>
        </button>

        <button
          type="button"
          class="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white/85 transition-transform duration-150 hover:text-white active:scale-[0.9]"
          title="Kommentare"
          @click.stop="$emit('open-comments', article)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
          <span class="font-mono text-[0.72rem] font-medium tabular-nums">{{ formatCount(article.commentCount) }}</span>
        </button>

        <button
          type="button"
          class="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white/85 transition-transform duration-150 hover:text-white active:scale-[0.9]"
          title="Teilen"
          @click.stop="$emit('share', article)"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
          <span class="font-mono text-[0.72rem] font-medium tabular-nums">{{ formatCount(article.shareCount) }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { estimateReadingTime, formatEngagementCount, resolveImageUrl, type Article } from '../utils';

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

const hasImage = computed(() => Boolean(resolveImageUrl(props.article.imageUrl, props.apiUrl)));

const mediaStyle = computed(() => {
  const url = resolveImageUrl(props.article.imageUrl, props.apiUrl);
  return url ? { backgroundImage: `url(${url})` } : {};
});

// Only the article ID is signaled to the host - the host owns navigation and
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
