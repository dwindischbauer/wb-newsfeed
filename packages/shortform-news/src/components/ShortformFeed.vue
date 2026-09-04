<template>
  <div class="h-screen overflow-y-scroll [scroll-snap-type:y_mandatory] [-webkit-overflow-scrolling:touch] bg-[var(--sf-bg-color,#000)]" ref="feedRef">
    <template v-if="articles && articles.length > 0">
      <ShortformCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
        :apiUrl="apiUrl"
        :trackingEnabled="trackingEnabled"
        :liked="likedIds && likedIds.includes(article.id)"
        @read="(a) => $emit('article-read', a)"
        @impression="(a) => $emit('article-impression', a)"
        @filter-tag="(t) => $emit('filter-tag', t)"
        @like="(a) => $emit('like', a)"
        @unlike="(a) => $emit('unlike', a)"
        @share="(a) => $emit('share', a)"
        @open-comments="(a) => $emit('open-comments', a)"
      >
        <template #card-media="{ article }">
          <slot name="media" :article="article"></slot>
        </template>
        <template #card-content="{ article, readAction }">
          <slot name="content" :article="article" :readAction="readAction"></slot>
        </template>
      </ShortformCard>
    </template>
    <template v-else-if="loading">
      <div class="h-screen flex flex-col items-center justify-center text-xl text-[var(--sf-empty-color,#888)] bg-[var(--sf-bg-color,#000)] text-center p-8">
        <slot name="loading">Lade Nachrichten...</slot>
      </div>
    </template>
    <template v-else>
      <div class="h-screen flex flex-col items-center justify-center text-xl text-[var(--sf-empty-color,#888)] bg-[var(--sf-bg-color,#000)] text-center p-8">
        <slot name="empty">Keine Nachrichten verfügbar.</slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ShortformCard from './ShortformCard.vue';
import type { Article } from '../utils';

const props = defineProps<{
  articles: Article[];
  apiUrl?: string;
  loading?: boolean;
  trackingEnabled?: boolean;
  likedIds?: number[];
}>();

const emit = defineEmits(['article-read', 'article-impression', 'scroll-depth', 'filter-tag', 'like', 'unlike', 'share', 'open-comments']);

const feedRef = ref<HTMLElement | null>(null);

const handleScroll = () => {
  if (!props.trackingEnabled || !feedRef.value) return;
  const el = feedRef.value;
  const scrollPercentage = (el.scrollTop + el.clientHeight) / el.scrollHeight;
  emit('scroll-depth', scrollPercentage);
};

onMounted(() => {
  if (props.trackingEnabled && feedRef.value) {
    feedRef.value.addEventListener('scroll', handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  if (feedRef.value) {
    feedRef.value.removeEventListener('scroll', handleScroll);
  }
});
</script>
