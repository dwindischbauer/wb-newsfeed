<template>
  <div class="relative h-screen bg-black">
    <ShortformNewsFeed ref="feedRef" :api-url="config.public.apiUrl" @article-read="openReader" />

    <!-- Reader Overlay — the full article is this app's job, the module only signals the ID -->
    <transition name="reader">
      <div v-if="activeReaderArticle" class="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-reader-bg">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <button class="flex cursor-pointer items-center gap-1 border-none bg-transparent py-2 text-base font-semibold text-reader-accent" @click="closeReader">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Zurück
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="ttsSupported"
              class="inline-flex cursor-pointer items-center gap-[6px] rounded-full border border-black/[0.12] bg-black/5 px-[0.9rem] py-[0.4rem] text-[0.85rem] font-semibold text-reader-accent transition-all duration-200 hover:border-accent-lime-deep hover:bg-[rgba(111,143,26,0.12)]"
              :class="{ '!border-[#ef4444] !bg-[#ef4444] !text-white': isSpeaking }"
              :title="isSpeaking ? 'Vorlesen stoppen' : 'KI-Zusammenfassung vorlesen'"
              @click="toggleSpeech"
            >
              <span v-if="isSpeaking" class="inline-flex h-3 items-center gap-[2px]">
                <span class="h-full w-[2px] animate-wave rounded-[1px] bg-current"></span>
                <span class="h-full w-[2px] animate-wave rounded-[1px] bg-current [animation-delay:0.2s]"></span>
                <span class="h-full w-[2px] animate-wave rounded-[1px] bg-current [animation-delay:0.4s]"></span>
              </span>
              <span v-else>🔊</span>
              {{ isSpeaking ? 'Stopp' : 'Vorlesen' }}
            </button>
          </div>
        </div>
        <div class="px-6 pb-16 pt-6 font-reader text-accent-ink">
          <div v-if="activeReaderArticle.tags && activeReaderArticle.tags.length > 0" class="mb-4 flex flex-wrap gap-2">
            <button
              v-for="tag in activeReaderArticle.tags"
              :key="tag.id"
              class="cursor-pointer rounded-[14px] border border-black/[0.12] bg-black/5 px-3 py-[0.3rem] text-[0.85rem] font-medium text-reader-accent transition-all duration-150 hover:-translate-y-px hover:border-accent-lime-deep hover:bg-[rgba(111,143,26,0.15)]"
              title="Nach diesem Tag filtern"
              @click="filterByTag(tag.name)"
            >
              {{ tag.name }}
            </button>
          </div>
          <h1 class="mt-0 text-[1.8rem] leading-[1.2]">{{ activeReaderArticle.title }}</h1>

          <div v-if="activeReaderArticle.keyTakeaways" class="mb-8 rounded-[18px] border-l-4 border-l-accent-lime-deep bg-reader-input-bg p-6">
            <div class="mb-3 flex items-center justify-between">
              <h3 class="m-0 font-accent text-[1.1rem] italic text-reader-accent">KI-Kernpunkte</h3>
              <span class="rounded-xl bg-black/[0.06] px-[0.6rem] py-[0.2rem] text-[0.75rem] text-reader-muted">{{ estimateReadingTime(activeReaderArticle.content) }}</span>
            </div>
            <ul class="m-0 pl-[1.2rem]">
              <li v-for="point in parseKeyTakeaways(activeReaderArticle.keyTakeaways)" :key="point">{{ point }}</li>
            </ul>
          </div>

          <div class="mb-12 whitespace-pre-wrap px-2 text-[1.1rem] leading-[1.8]">{{ activeReaderArticle.content }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  ShortformNewsFeed,
  parseKeyTakeaways,
  estimateReadingTime,
  type Article
} from '@wb-news/shortform-news';

const config = useRuntimeConfig();
const feedRef = ref<InstanceType<typeof ShortformNewsFeed> | null>(null);
const activeReaderArticle = ref<Article | null>(null);

// The module only ever signals an article ID when a user wants to read the
// full text — resolving it to content is this host app's responsibility,
// matching the briefing's "module never navigates itself" contract.
const openReader = (articleId: number) => {
  const article = feedRef.value?.findArticle(articleId);
  if (!article) return;
  activeReaderArticle.value = article;

  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId }, '*');
  }
};

const closeReader = () => {
  if (isSpeaking.value) window.speechSynthesis.cancel();
  isSpeaking.value = false;
  activeReaderArticle.value = null;
};

const filterByTag = (tagName: string) => {
  feedRef.value?.filterByTag(tagName);
  closeReader();
};

// TTS Audio Synthesis
const isSpeaking = ref(false);
const ttsSupported = ref(false);

const toggleSpeech = () => {
  if (!ttsSupported.value || !activeReaderArticle.value) return;

  if (isSpeaking.value) {
    window.speechSynthesis.cancel();
    isSpeaking.value = false;
    return;
  }

  const art = activeReaderArticle.value;
  let textToRead = `${art.title}. `;
  if (art.teaser) textToRead += `Zusammenfassung: ${art.teaser}. `;
  if (art.keyTakeaways) {
    textToRead += `Kernpunkte: ${parseKeyTakeaways(art.keyTakeaways).join('. ')}. `;
  }

  const utterance = new SpeechSynthesisUtterance(textToRead);
  utterance.lang = 'de-DE';
  utterance.rate = 1.05;

  utterance.onend = () => {
    isSpeaking.value = false;
  };
  utterance.onerror = () => {
    isSpeaking.value = false;
  };

  window.speechSynthesis.speak(utterance);
  isSpeaking.value = true;
  feedRef.value?.track('tts_play', art.id);
};

onMounted(() => {
  ttsSupported.value = 'speechSynthesis' in window;
});
</script>

<style scoped>
.reader-enter-active,
.reader-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.reader-enter-from,
.reader-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
