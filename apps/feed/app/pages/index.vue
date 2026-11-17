<template>
  <div class="relative h-full bg-[#12110f]">
    <ShortformNewsFeed ref="feedRef" :api-url="config.public.apiUrl" @article-read="openReader" />

    <!-- Artikelansicht: schiebt sich ueber die aktuelle Karte, das Bild bleibt oben stehen -->
    <transition name="reader">
      <div v-if="article" class="fixed inset-0 z-[100] flex justify-center md:p-5" role="dialog" aria-modal="true" :aria-label="article.title">
        <div class="relative h-full w-full overflow-hidden md:max-h-[860px] md:max-w-[430px] md:rounded-[20px] md:border md:border-white/10">
          <div
            class="reader-image absolute inset-0 bg-[#1c1a17] bg-cover bg-center"
            :style="imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}"
          >
            <div class="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-black/65"></div>
          </div>

          <div ref="scrollRef" class="absolute inset-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              class="block h-[30vh] w-full cursor-default border-none bg-transparent"
              aria-label="Artikel schließen"
              @click="closeReader"
            ></button>

            <article class="reader-sheet relative min-h-[70vh] rounded-t-[20px] border-t border-black/[0.08] bg-reader-bg px-6 pb-16 pt-3 text-accent-ink shadow-[0_-12px_36px_rgba(0,0,0,0.32)]">
              <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-black/15"></div>

              <div class="mb-3 flex items-center justify-between gap-3 text-[0.78rem] text-reader-muted">
                <span class="font-mono">
                  <span class="font-sans font-medium text-reader-accent">{{ article.category }}</span>
                  · {{ estimateReadingTime(article.content) }}
                </span>
                <button
                  type="button"
                  class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-black/[0.08] bg-black/[0.04] text-accent-ink transition-colors duration-150 hover:bg-black/[0.08]"
                  aria-label="Schließen"
                  @click="closeReader"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>

              <h1 class="m-0 mb-2 font-[var(--font-accent)] text-[1.75rem] font-medium leading-[1.18] tracking-[-0.01em] text-accent-ink">{{ article.title }}</h1>
              <p class="m-0 mb-6 font-mono text-[0.76rem] text-reader-muted">{{ article.author || 'Redaktion' }}<template v-if="published"> · {{ published }}</template></p>

              <p v-if="article.teaser" class="m-0 mb-6 border-b border-black/[0.08] pb-5 font-reader text-[1.08rem] font-normal leading-[1.6] text-[#2d2821]">{{ article.teaser }}</p>

              <section v-if="keyPoints.length" class="mb-7 rounded-[10px] border border-black/[0.08] bg-reader-input-bg/70 p-4">
                <h2 class="m-0 mb-2.5 text-[0.8rem] font-semibold tracking-normal text-reader-accent">Das Wichtigste</h2>
                <ul class="m-0 flex list-disc flex-col gap-1.5 pl-4 font-sans text-[0.92rem] leading-[1.55] text-[#2d2821]">
                  <li v-for="point in keyPoints" :key="point">{{ point }}</li>
                </ul>
              </section>

              <div class="font-reader text-[1.06rem] leading-[1.75] text-[#24201a]">
                <p v-for="(paragraph, i) in paragraphs" :key="i" class="m-0 mb-4">{{ paragraph }}</p>
              </div>

              <div v-if="article.tags && article.tags.length" class="mt-8 flex flex-wrap items-center gap-2 border-t border-black/[0.08] pt-5">
                <span class="text-[0.78rem] text-reader-muted">Mehr zu</span>
                <button
                  v-for="tag in article.tags"
                  :key="tag.id"
                  type="button"
                  class="cursor-pointer rounded-[6px] border border-black/[0.1] bg-black/[0.03] px-2.5 py-1 text-[0.78rem] font-medium text-reader-accent transition-colors duration-150 hover:bg-black/[0.07]"
                  @click="filterByTag(tag.name)"
                >
                  {{ tag.name }}
                </button>
              </div>
            </article>
          </div>
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
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
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
