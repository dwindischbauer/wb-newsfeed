<template>
  <div class="relative h-screen bg-black">
    <div class="fixed inset-x-0 top-0 z-50 pb-3 [background:linear-gradient(to_bottom,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.3)_55%,rgba(0,0,0,0)_100%)]">
      <div class="flex overflow-x-auto px-4 pt-[0.85rem] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-1 rounded-full border border-white/[0.16] bg-black/40 p-[0.3rem] backdrop-blur-[14px]">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cursor-pointer whitespace-nowrap rounded-full border-none bg-transparent px-4 py-[0.48rem] text-[0.86rem] font-semibold text-white/[0.82] transition-all duration-200 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]"
            :class="{ 'bg-accent-lime font-bold text-accent-ink [text-shadow:none]': activeCategory === cat }"
            @click="activeCategory = cat; activeTagFilter = ''"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Subcategory chips for the active main category -->
      <div v-if="activeSubtags.length > 0" class="flex overflow-x-auto px-4 pt-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-1 rounded-full border border-white/10 bg-black/[0.28] p-[0.22rem]">
          <button
            v-for="sub in activeSubtags"
            :key="sub.slug"
            class="cursor-pointer whitespace-nowrap rounded-full border-none bg-transparent px-[0.8rem] py-[0.36rem] text-[0.76rem] font-medium text-white/[0.68] transition-all duration-200 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]"
            :class="{ 'bg-accent-lime font-bold text-accent-ink [text-shadow:none]': activeTagFilter === sub.name }"
            @click="activeTagFilter = activeTagFilter === sub.name ? '' : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Active Tag Filter Badge — only for tags picked from a card, not for the
         canonical subcategory chips above (those already show their own active state) -->
    <div
      v-if="activeTagFilter && !activeSubtags.some((s) => s.name === activeTagFilter)"
      class="fixed left-4 right-4 top-[60px] z-[45] flex items-center justify-between rounded-full border border-[rgba(213,242,78,0.5)] bg-black/[0.55] px-4 py-2 text-[0.85rem] text-white backdrop-blur-[12px]"
    >
      <span>Tag-Filter: <strong>{{ activeTagFilter }}</strong></span>
      <button class="rounded-[10px] border-none bg-white/20 px-2 py-[2px] text-[0.75rem] font-bold text-white hover:bg-white/[0.35]" @click="activeTagFilter = ''">✕ Entfernen</button>
    </div>

    <ShortformFeed
      :articles="publishedArticles"
      :api-url="config.public.apiUrl"
      :tracking-enabled="true"
      :liked-ids="likedArticleIds"
      @article-read="openReader"
      @article-impression="onArticleImpression"
      @scroll-depth="onScrollDepth"
      @filter-tag="filterByTag"
      @like="handleLike"
      @unlike="handleUnlike"
      @share="handleShare"
      @open-comments="openComments"
    >
      <template #empty>
        Keine aktiven Nachrichten für '{{ activeTagFilter || activeCategory }}'.
      </template>
    </ShortformFeed>

    <!-- Share toast -->
    <transition name="reader">
      <div v-if="shareToast" class="fixed bottom-[6.5rem] left-1/2 z-[150] -translate-x-1/2 rounded-full bg-accent-ink px-5 py-[0.6rem] text-[0.85rem] font-semibold text-accent-lime shadow-[0_8px_24px_rgba(0,0,0,0.4)]">{{ shareToast }}</div>
    </transition>

    <!-- Comments Sheet -->
    <transition name="sheet">
      <div v-if="commentsArticle" class="fixed inset-0 z-[140] flex items-end bg-black/[0.55]" @click.self="closeComments">
        <div class="comments-sheet flex max-h-[75vh] w-full flex-col rounded-t-[24px] bg-reader-bg shadow-[0_-10px_40px_rgba(0,0,0,0.35)]">
          <div class="flex items-center justify-between border-b border-black/[0.08] px-5 pb-[0.85rem] pt-[1.1rem]">
            <h3 class="m-0 font-accent text-[1.2rem] font-medium italic text-accent-ink">
              Kommentare <span class="text-[0.9rem] font-medium not-italic text-reader-muted">({{ commentsArticle.commentCount || comments.length }})</span>
            </h3>
            <button class="h-[30px] w-[30px] cursor-pointer rounded-full border-none bg-black/[0.06] text-[0.9rem] text-accent-ink" @click="closeComments">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-2">
            <div v-if="commentsLoading" class="py-10 text-center text-[0.9rem] text-reader-muted">Lade Kommentare…</div>
            <div v-else-if="comments.length === 0" class="py-10 text-center text-[0.9rem] text-reader-muted">Noch keine Kommentare. Sei die/der Erste!</div>
            <div v-for="c in comments" :key="c.id" class="flex gap-[0.7rem] border-b border-black/[0.06] py-[0.85rem]">
              <div class="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-accent-ink text-[0.85rem] font-bold text-accent-lime">{{ (c.authorName || 'A').charAt(0).toUpperCase() }}</div>
              <div class="min-w-0 flex-1">
                <div class="mb-[0.2rem] flex items-baseline gap-2 text-[0.78rem] text-reader-muted">
                  <strong class="text-[0.85rem] text-accent-ink">{{ c.authorName }}</strong>
                  <span>{{ formatRelativeTime(c.createdAt) }}</span>
                </div>
                <p class="m-0 break-words text-[0.9rem] leading-[1.4] text-[#24252a]">{{ c.text }}</p>
              </div>
            </div>
          </div>
          <form class="flex flex-col gap-2 border-t border-black/[0.08] px-5 pb-5 pt-[0.85rem]" @submit.prevent="submitComment">
            <input
              v-model="commentName"
              type="text"
              maxlength="60"
              placeholder="Dein Name (optional)"
              class="border-none bg-transparent p-0 text-[0.78rem] text-reader-muted outline-none"
            />
            <div class="flex items-center gap-2">
              <input
                v-model="commentText"
                type="text"
                maxlength="1000"
                placeholder="Kommentar schreiben…"
                class="flex-1 rounded-full border border-black/[0.12] bg-reader-input-bg px-[1.1rem] py-[0.65rem] text-[0.9rem] text-accent-ink outline-none focus:border-accent-lime-deep"
              />
              <button
                type="submit"
                class="whitespace-nowrap rounded-full border-none bg-accent-ink px-5 py-[0.65rem] text-[0.85rem] font-bold text-accent-lime disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!commentText.trim() || commentSubmitting"
              >
                Senden
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Reader Overlay -->
    <transition name="reader">
      <div v-if="activeReaderArticle" class="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-reader-bg">
        <div class="sticky top-0 z-10 flex items-center justify-between border-b border-black/[0.08] px-6 py-4">
          <button class="flex cursor-pointer items-center gap-1 border-none bg-transparent py-2 text-base font-semibold text-reader-accent" @click="activeReaderArticle = null">
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
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
  ShortformFeed,
  parseKeyTakeaways,
  estimateReadingTime,
  rankPersonalizedArticles,
  CATEGORY_SUBTAGS,
  type Article,
  type UserInterests
} from '@wb-news/shortform-news';

interface FeedArticle extends Article {
  status?: string;
  keyTakeaways?: string;
}

interface CommentItem {
  id: number;
  authorName: string;
  text: string;
  createdAt: string;
}

type CountField = 'likeCount' | 'commentCount' | 'shareCount';

const articles = ref<FeedArticle[]>([]);
const activeReaderArticle = ref<FeedArticle | null>(null);
const activeCategory = ref('Für dich');
const activeTagFilter = ref('');
const categories = ['Für dich', 'Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];

// Granular subcategory chips (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const activeSubtags = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);

// User Interest Model (Stored locally, privacy-first)
const userInterests = ref<Required<UserInterests>>({
  categories: {},
  tags: {}
});

const loadUserInterests = () => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('wb_user_interests');
    if (saved) userInterests.value = JSON.parse(saved);
  } catch (e) {
    console.warn('Could not read user interests', e);
  }
};

const recordInterestInteraction = (article: FeedArticle | null, weight = 1) => {
  if (!article) return;
  if (!userInterests.value.categories) userInterests.value.categories = {};
  if (!userInterests.value.tags) userInterests.value.tags = {};

  if (article.category) {
    const current = userInterests.value.categories[article.category] || 0;
    userInterests.value.categories[article.category] = current + weight * 2;
  }

  if (Array.isArray(article.tags)) {
    for (const tag of article.tags) {
      const slug = (tag.slug || tag.name || '').toLowerCase();
      if (!slug) continue;
      const current = userInterests.value.tags[slug] || 0;
      userInterests.value.tags[slug] = current + weight * 3;
    }
  }

  try {
    localStorage.setItem('wb_user_interests', JSON.stringify(userInterests.value));
  } catch {
    // storage unavailable — interest tracking is best-effort only
  }
};

const publishedArticles = computed(() => {
  let filtered = articles.value.filter((a) => a.status === 'published');

  if (activeTagFilter.value) {
    const tagQuery = activeTagFilter.value.toLowerCase();
    filtered = filtered.filter((a) => a.tags && a.tags.some((t) => (t.slug || t.name || '').toLowerCase() === tagQuery));
  }

  if (activeCategory.value === 'Für dich') {
    return rankPersonalizedArticles(filtered, userInterests.value);
  } else if (activeCategory.value !== 'Alle') {
    filtered = filtered.filter((a) => a.category === activeCategory.value);
  }
  return filtered;
});

const config = useRuntimeConfig();

const fetchArticles = async () => {
  try {
    const res = await fetch(`${config.public.apiUrl}/api/feed`);
    if (!res.ok) throw new Error('API Error');
    articles.value = await res.json();
  } catch (e) {
    console.error('Failed to fetch articles:', e);
    articles.value = [];
  }
};

// Merge freshly-polled articles into the current list in place, preserving
// object identity for unchanged articles so open cards/overlays don't flicker.
const mergeArticles = (freshList: FeedArticle[]) => {
  const currentById = new Map(articles.value.map((a) => [a.id, a]));
  articles.value = freshList.map((fresh) => {
    const existing = currentById.get(fresh.id);
    return existing && JSON.stringify(existing) === JSON.stringify(fresh) ? existing : fresh;
  });
};

const pollForUpdates = async () => {
  try {
    const res = await fetch(`${config.public.apiUrl}/api/feed`);
    if (!res.ok) return;
    const data: FeedArticle[] = await res.json();
    mergeArticles(data);
  } catch (e) {
    console.error('Failed to poll for updates:', e);
  }
};

const sendAnalytics = (eventType: string, articleId: number | null = null, metadata: Record<string, unknown> | null = null) => {
  try {
    const payload = JSON.stringify({ eventType, articleId, metadata });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${config.public.apiUrl}/api/analytics/events`, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(`${config.public.apiUrl}/api/analytics/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to send analytics:', e);
  }
};

const openReader = (article: FeedArticle) => {
  activeReaderArticle.value = article;
  recordInterestInteraction(article, 2);
  sendAnalytics('read', article.id, { category: article.category });

  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId: article.id }, '*');
  }
};

const onArticleImpression = (article: FeedArticle) => {
  recordInterestInteraction(article, 0.5);
  sendAnalytics('impression', article.id, { category: article.category });
};

const onScrollDepth = (percentage: number) => {
  if (percentage >= 80) {
    sendAnalytics('scroll_depth', activeReaderArticle.value?.id ?? null, { depth: percentage });
  }
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
  sendAnalytics('tts_play', art.id);
};

const filterByTag = (tagName: string) => {
  activeTagFilter.value = tagName;
  activeReaderArticle.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Likes (device-local, privacy-first — same pattern as userInterests) ---
const likedArticleIds = ref<number[]>([]);

const loadLikedArticles = () => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('wb_liked_articles');
    if (saved) likedArticleIds.value = JSON.parse(saved);
  } catch (e) {
    console.warn('Could not read liked articles', e);
  }
};

const persistLikedArticles = () => {
  try {
    localStorage.setItem('wb_liked_articles', JSON.stringify(likedArticleIds.value));
  } catch {
    // storage unavailable — likes stay in-memory only for this session
  }
};

const patchArticleCount = (articleId: number, field: CountField, delta: number) => {
  const article = articles.value.find((a) => a.id === articleId);
  if (article) article[field] = Math.max(0, (article[field] || 0) + delta);
  if (activeReaderArticle.value?.id === articleId) {
    activeReaderArticle.value[field] = Math.max(0, (activeReaderArticle.value[field] || 0) + delta);
  }
};

const handleLike = async (article: FeedArticle) => {
  if (likedArticleIds.value.includes(article.id)) return;
  likedArticleIds.value = [...likedArticleIds.value, article.id];
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', 1);
  recordInterestInteraction(article, 3);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/like`, { method: 'POST' });
  } catch (e) {
    console.error('Failed to send like:', e);
  }
};

const handleUnlike = async (article: FeedArticle) => {
  likedArticleIds.value = likedArticleIds.value.filter((id) => id !== article.id);
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', -1);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/unlike`, { method: 'POST' });
  } catch (e) {
    console.error('Failed to send unlike:', e);
  }
};

// --- Share ---
const shareToast = ref('');
let shareToastTimeout: ReturnType<typeof setTimeout> | null = null;

const showShareToast = (msg: string) => {
  shareToast.value = msg;
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
  shareToastTimeout = setTimeout(() => {
    shareToast.value = '';
  }, 2500);
};

const handleShare = async (article: FeedArticle) => {
  const shareUrl = `${window.location.origin}${window.location.pathname}?article=${article.id}`;
  const shareData = { title: article.title, text: article.teaser || article.title, url: shareUrl };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showShareToast('Link kopiert');
    }
    patchArticleCount(article.id, 'shareCount', 1);
    sendAnalytics('share', article.id, { category: article.category });
    fetch(`${config.public.apiUrl}/api/articles/${article.id}/share`, { method: 'POST' }).catch(() => {});
  } catch {
    // User cancelled the native share sheet — not an error
  }
};

// --- Comments ---
const commentsArticle = ref<FeedArticle | null>(null);
const comments = ref<CommentItem[]>([]);
const commentsLoading = ref(false);
const commentName = ref('');
const commentText = ref('');
const commentSubmitting = ref(false);

const openComments = async (article: FeedArticle) => {
  commentsArticle.value = article;
  comments.value = [];
  commentsLoading.value = true;
  try {
    const savedName = localStorage.getItem('wb_comment_name');
    if (savedName) commentName.value = savedName;
  } catch (e) {
    console.warn('Could not read saved comment name', e);
  }
  try {
    const res = await fetch(`${config.public.apiUrl}/api/articles/${article.id}/comments`);
    if (res.ok) comments.value = await res.json();
  } catch (e) {
    console.error('Failed to load comments:', e);
  } finally {
    commentsLoading.value = false;
  }
};

const closeComments = () => {
  commentsArticle.value = null;
  commentText.value = '';
};

const submitComment = async () => {
  const text = commentText.value.trim();
  if (!text || !commentsArticle.value) return;
  commentSubmitting.value = true;
  const authorName = commentName.value.trim() || 'Anonym';
  try {
    localStorage.setItem('wb_comment_name', authorName);
  } catch (e) {
    console.warn('Could not persist comment name', e);
  }

  try {
    const res = await fetch(`${config.public.apiUrl}/api/articles/${commentsArticle.value.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, text })
    });
    const data = await res.json();
    if (data.success) {
      comments.value.unshift(data.comment);
      patchArticleCount(commentsArticle.value.id, 'commentCount', 1);
      commentText.value = '';
    }
  } catch (e) {
    console.error('Failed to submit comment:', e);
  } finally {
    commentSubmitting.value = false;
  }
};

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.floor(hours / 24)} Tg`;
};

let pollIntervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  loadUserInterests();
  loadLikedArticles();
  fetchArticles().then(() => {
    const params = new URLSearchParams(window.location.search);
    const articleParam = params.get('article');
    if (articleParam) {
      const sharedId = parseInt(articleParam, 10);
      const found = articles.value.find((a) => a.id === sharedId);
      if (found) openReader(found);
    }
  });
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    ttsSupported.value = true;
  }
  pollIntervalId = setInterval(pollForUpdates, 60000);
});

onUnmounted(() => {
  if (pollIntervalId) clearInterval(pollIntervalId);
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

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sheet-enter-active .comments-sheet,
.sheet-leave-active .comments-sheet {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
.sheet-enter-from .comments-sheet,
.sheet-leave-to .comments-sheet {
  transform: translateY(100%);
}
</style>
