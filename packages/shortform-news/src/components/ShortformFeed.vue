<template>
  <div ref="feedRef" class="h-screen overflow-y-scroll bg-[var(--sf-bg-color,#000)] [-webkit-overflow-scrolling:touch] [scroll-snap-type:y_mandatory]">
    <template v-if="articles && articles.length > 0">
      <!-- Only cards near the visible one are mounted (and load their image);
           the rest are empty snap slots of the same height, so scrolling and
           snapping behave exactly as if every card were there. -->
      <template v-for="(article, index) in articles" :key="article.id">
        <ShortformCard
          v-if="Math.abs(index - activeIndex) <= renderWindow"
          :article="article"
          :api-url="apiUrl"
          :tracking-enabled="trackingEnabled"
          :liked="likedIds && likedIds.includes(article.id)"
          @read="(id) => $emit('article-read', id)"
          @impression="onImpression"
          @filter-tag="(t) => $emit('filter-tag', t)"
          @like="(a) => $emit('like', a)"
          @unlike="(a) => $emit('unlike', a)"
          @share="(a) => $emit('share', a)"
          @open-comments="(a) => $emit('open-comments', a)"
        >
          <template #card-media="{ article: a }">
            <slot name="media" :article="a"></slot>
          </template>
          <template #card-content="{ article: a, readAction }">
            <slot name="content" :article="a" :read-action="readAction"></slot>
          </template>
        </ShortformCard>
        <div v-else class="h-screen bg-[var(--sf-bg-color,#000)] [scroll-snap-align:start]" aria-hidden="true"></div>
      </template>
    </template>
    <template v-else-if="loading">
      <div class="flex h-screen flex-col items-center justify-center bg-[var(--sf-bg-color,#000)] p-8 text-center text-[1.2rem] text-[var(--sf-empty-color,#888)]">
        <slot name="loading">Lade Nachrichten...</slot>
      </div>
    </template>
    <template v-else>
      <div class="flex h-screen flex-col items-center justify-center bg-[var(--sf-bg-color,#000)] p-8 text-center text-[1.2rem] text-[var(--sf-empty-color,#888)]">
        <slot name="empty">Keine Nachrichten verfügbar.</slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ShortformCard from './ShortformCard.vue';
import type { Article } from '../utils';

const props = withDefaults(defineProps<{
  articles: Article[];
  apiUrl?: string;
  loading?: boolean;
  trackingEnabled?: boolean;
  likedIds?: number[];
  /** Cards mounted before/after the visible one; `Infinity` mounts all. */
  renderWindow?: number;
}>(), {
  apiUrl: '',
  loading: false,
  trackingEnabled: false,
  likedIds: () => [],
  renderWindow: 2
});

const emit = defineEmits<{
  'article-read': [articleId: number];
  'article-impression': [article: Article];
  'scroll-depth': [percentage: number];
  'active-index': [index: number];
  'filter-tag': [tag: string];
  like: [article: Article];
  unlike: [article: Article];
  share: [article: Article];
  'open-comments': [article: Article];
}>();

const feedRef = ref<HTMLElement | null>(null);
const activeIndex = ref(0);

// Cards remount when they scroll back into the render window — without this
// every remount would count as a new impression.
const seenIds = new Set<number>();
const onImpression = (article: Article) => {
  if (seenIds.has(article.id)) return;
  seenIds.add(article.id);
  emit('article-impression', article);
};

// Every card is exactly one container height, so the visible index follows
// from scrollTop alone — no per-card observers needed.
const handleScroll = () => {
  const el = feedRef.value;
  if (!el) return;
  const index = el.clientHeight > 0 ? Math.round(el.scrollTop / el.clientHeight) : 0;
  if (index !== activeIndex.value) {
    activeIndex.value = index;
    emit('active-index', index);
  }
  if (props.trackingEnabled) emit('scroll-depth', (el.scrollTop + el.clientHeight) / el.scrollHeight);
};

onMounted(() => {
  feedRef.value?.addEventListener('scroll', handleScroll, { passive: true });
});

onUnmounted(() => {
  feedRef.value?.removeEventListener('scroll', handleScroll);
});
</script>
