<template>
  <div class="relative h-screen bg-black">
    <ShortformNewsFeed ref="feedRef" :api-url="config.public.apiUrl" @article-read="openReader" />

    <!-- Artikelansicht: schiebt sich ueber die aktuelle Karte, das Bild bleibt oben stehen -->
    <transition name="reader">
      <div v-if="article" class="fixed inset-0 z-[100]" role="dialog" aria-modal="true" :aria-label="article.title">
        <div
          class="reader-image absolute inset-0 bg-[#1b1c20] bg-cover bg-center"
          :style="imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}"
        >
          <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60"></div>
        </div>

        <div ref="scrollRef" class="absolute inset-0 overflow-y-auto overscroll-contain">
          <button
            type="button"
            class="block h-[34vh] w-full cursor-default border-none bg-transparent"
            aria-label="Artikel schließen"
            @click="closeReader"
          ></button>

          <article class="reader-sheet relative min-h-[66vh] rounded-t-[22px] bg-reader-bg px-6 pb-16 pt-3 text-accent-ink shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
            <div class="mx-auto mb-4 h-1 w-10 rounded-full bg-black/15"></div>

            <div class="mb-3 flex items-center justify-between gap-3 text-[0.8rem] text-reader-muted">
              <span>
                <span class="font-semibold text-reader-accent">{{ article.category }}</span>
                · {{ estimateReadingTime(article.content) }}
              </span>
              <button
                type="button"
                class="flex h-8 w-8 items-center justify-center rounded-full border-none bg-black/[0.06] text-accent-ink"
                aria-label="Schließen"
                @click="closeReader"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <h1 class="m-0 mb-2 text-[1.65rem] font-extrabold leading-[1.2] tracking-[-0.01em]">{{ article.title }}</h1>
            <p class="m-0 mb-6 text-[0.82rem] text-reader-muted">{{ article.author || 'Redaktion' }}<template v-if="published"> · {{ published }}</template></p>

            <p v-if="article.teaser" class="m-0 mb-6 font-reader text-[1.08rem] font-medium leading-[1.55]">{{ article.teaser }}</p>

            <section v-if="keyPoints.length" class="mb-7 border-l-[3px] border-accent-lime-deep pl-4">
              <h2 class="m-0 mb-2 text-[0.78rem] font-bold uppercase tracking-[0.06em] text-reader-accent">Das Wichtigste</h2>
              <ul class="m-0 flex list-disc flex-col gap-1 pl-4 font-reader text-[0.98rem] leading-[1.5]">
                <li v-for="point in keyPoints" :key="point">{{ point }}</li>
              </ul>
            </section>

            <div class="font-reader text-[1.05rem] leading-[1.75]">
              <p v-for="(paragraph, i) in paragraphs" :key="i" class="m-0 mb-4">{{ paragraph }}</p>
            </div>

            <div v-if="article.tags && article.tags.length" class="mt-8 flex flex-wrap items-center gap-2 border-t border-black/[0.08] pt-5">
              <span class="text-[0.8rem] text-reader-muted">Mehr zu</span>
              <button
                v-for="tag in article.tags"
                :key="tag.id"
                type="button"
                class="cursor-pointer rounded-full border border-black/[0.12] bg-transparent px-3 py-1 text-[0.82rem] font-medium text-reader-accent hover:bg-black/[0.04]"
                @click="filterByTag(tag.name)"
              >
                {{ tag.name }}
              </button>
            </div>
          </article>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import {
  ShortformNewsFeed,
  parseKeyTakeaways,
  estimateReadingTime,
  resolveImageUrl,
  type Article
} from '@wb-news/shortform-news';

const config = useRuntimeConfig();
const feedRef = ref<InstanceType<typeof ShortformNewsFeed> | null>(null);
const scrollRef = ref<HTMLElement | null>(null);
const article = ref<Article | null>(null);
let openedAt = 0;

const imageUrl = computed(() => resolveImageUrl(article.value?.imageUrl, config.public.apiUrl));
const keyPoints = computed(() => parseKeyTakeaways(article.value?.keyTakeaways));
const paragraphs = computed(() =>
  (article.value?.content || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
);
const published = computed(() => {
  const date = article.value?.createdAt;
  return date ? new Date(date).toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
});

// Das Feed-Modul meldet nur die Artikel-ID, anzeigen muss der Host selbst
const openReader = (articleId: number) => {
  const found = feedRef.value?.findArticle(articleId);
  if (!found) return;
  article.value = found;
  openedAt = Date.now();
  scrollRef.value?.scrollTo({ top: 0 });

  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId }, '*');
  }
};

// Die Lesedauer fliesst in "Für dich" ein
const closeReader = () => {
  if (article.value) feedRef.value?.recordReadTime(article.value.id, (Date.now() - openedAt) / 1000);
  article.value = null;
};

const filterByTag = (tagName: string) => {
  feedRef.value?.filterByTag(tagName);
  closeReader();
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && article.value) closeReader();
};

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.reader-enter-active .reader-image,
.reader-leave-active .reader-image {
  transition: opacity 0.25s ease;
}
.reader-enter-active .reader-sheet,
.reader-leave-active .reader-sheet {
  transition: transform 0.32s cubic-bezier(0.2, 0.9, 0.3, 1);
}
.reader-enter-active,
.reader-leave-active {
  transition: opacity 0.32s;
}
.reader-enter-from .reader-image,
.reader-leave-to .reader-image {
  opacity: 0;
}
.reader-enter-from .reader-sheet,
.reader-leave-to .reader-sheet {
  transform: translateY(100%);
}
</style>
