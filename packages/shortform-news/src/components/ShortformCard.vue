<template>
  <div class="h-screen [scroll-snap-align:start] relative flex flex-col bg-[var(--sf-bg-color,#000)] text-[var(--sf-text-color,#fff)]" ref="cardRef">
    <div class="flex-1 flex items-start justify-end p-[var(--sf-padding,1rem)] bg-cover bg-center bg-no-repeat bg-[var(--sf-media-bg,#1f2937)]" :style="mediaStyle">
      <slot name="card-media" :article="article">
        <div class="flex flex-col items-end gap-2">
          <span class="bg-[var(--sf-badge-bg,rgba(255,255,255,0.15))] border border-[var(--sf-badge-border,rgba(255,255,255,0.3))] text-[var(--sf-badge-color,white)] px-[0.85rem] py-[0.4rem] rounded-full text-[0.85rem] font-semibold backdrop-blur-[10px] [font-family:var(--font-accent,inherit)] italic">{{ article.category }}</span>
          <div class="flex flex-wrap gap-[0.35rem] justify-end max-w-[250px]" v-if="article.tags && article.tags.length > 0">
            <button
              type="button"
              v-for="tag in article.tags"
              :key="tag.id || tag.name"
              class="bg-[rgba(20,20,20,0.45)] border border-[rgba(255,255,255,0.3)] text-[#f3f2ec] px-[0.65rem] py-1 rounded-full text-[0.75rem] font-medium backdrop-blur-[8px]"
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
    <div class="absolute bottom-0 left-0 right-0 min-h-[65%] p-[var(--sf-padding,2rem)] [background:linear-gradient(to_top,var(--sf-overlay-color,rgba(0,0,0,0.9))_0%,var(--sf-overlay-color,rgba(0,0,0,0.9))_35%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.15)_85%,transparent_100%)] flex flex-col justify-end">
      <slot name="card-content" :article="article" :readAction="triggerRead">
        <div class="pr-[3.75rem]">
          <h2 class="m-0 mb-4 text-[length:var(--sf-title-size,2rem)] leading-[1.2] font-extrabold tracking-[-0.02em] [text-shadow:0_2px_16px_rgba(0,0,0,0.5),0_1px_4px_rgba(0,0,0,0.85)]">{{ article.title }}</h2>
          <p class="m-0 mb-4 text-[length:var(--sf-teaser-size,1rem)] leading-[1.4] opacity-[0.95] [text-shadow:0_1px_10px_rgba(0,0,0,0.45),0_1px_3px_rgba(0,0,0,0.8)]" v-if="article.teaser">{{ article.teaser }}</p>
          <div class="text-[0.8rem] opacity-[0.85] mb-4 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ article.author || 'Redaktion' }} • {{ readingTime }}</div>
        </div>
        <button class="bg-[var(--sf-primary-color,#4ade80)] text-[var(--sf-primary-text,#000)] border-none p-4 rounded-full text-base font-bold cursor-pointer transition-opacity duration-200 shadow-[0_6px_18px_rgba(20,20,20,0.3)] hover:opacity-90" @click="triggerRead">Vollständigen Artikel lesen</button>
        <div class="absolute bottom-20 left-1/2 -translate-x-1/2 text-[rgba(255,255,255,0.75)] text-[0.8rem] [text-shadow:0_1px_6px_rgba(0,0,0,0.6)] animate-sf-pulse pointer-events-none">
          &darr; Weiterscrollen
        </div>
      </slot>

      <!-- TikTok-style action rail -->
      <div class="absolute right-4 bottom-[6.75rem] flex flex-col items-center gap-[1.35rem]">
        <button
          type="button"
          class="flex flex-col items-center gap-[0.3rem] bg-none border-none p-0 text-white cursor-pointer [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] transition-transform duration-150 active:scale-[0.88]"
          :class="{ '!text-[var(--sf-primary-color,#4ade80)]': liked }"
          @click.stop="$emit(liked ? 'unlike' : 'like', article)"
          :title="liked ? 'Gefällt mir nicht mehr' : 'Gefällt mir'"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" :fill="liked ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>
          <span class="text-[0.72rem] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ formatCount(article.likeCount) }}</span>
        </button>

        <button type="button" class="flex flex-col items-center gap-[0.3rem] bg-none border-none p-0 text-white cursor-pointer [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] transition-transform duration-150 active:scale-[0.88]" @click.stop="$emit('open-comments', article)" title="Kommentare">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
          <span class="text-[0.72rem] font-bold [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{{ formatCount(article.commentCount) }}</span>
        </button>

        <button type="button" class="flex flex-col items-center gap-[0.3rem] bg-none border-none p-0 text-white cursor-pointer [filter:drop-shadow(0_2px_8px_rgba(0,0,0,0.5))] transition-transform duration-150 active:scale-[0.88]" @click.stop="$emit('share', article)" title="Teilen">
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
