<template>
  <div class="sf-feed" ref="feedRef">
    <template v-if="articles && articles.length > 0">
      <ShortformCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
        :apiUrl="apiUrl"
        :trackingEnabled="trackingEnabled"
        @read="(a) => $emit('article-read', a)"
        @impression="(a) => $emit('article-impression', a)"
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
      <div class="sf-loading">
        <slot name="loading">Lade Nachrichten...</slot>
      </div>
    </template>
    <template v-else>
      <div class="sf-empty">
        <slot name="empty">Keine Nachrichten verfügbar.</slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ShortformCard from './ShortformCard.vue';

const props = defineProps<{
  articles: any[];
  apiUrl?: string;
  loading?: boolean;
  trackingEnabled?: boolean;
}>();

const emit = defineEmits(['article-read', 'article-impression', 'scroll-depth']);

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

<style scoped>
.sf-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
  background-color: var(--sf-bg-color, #000);
}

.sf-loading, .sf-empty {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: var(--sf-empty-color, #888);
  background: var(--sf-bg-color, #000);
  text-align: center;
  padding: 2rem;
}
</style>
