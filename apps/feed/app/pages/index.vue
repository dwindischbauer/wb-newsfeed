<template>
  <div class="h-screen relative bg-black">
    <div class="fixed top-0 left-0 w-full z-50 pb-3 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.3)_55%,rgba(0,0,0,0)_100%)]">
      <div class="flex overflow-x-auto pt-[0.85rem] px-4 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-1 bg-[rgba(20,20,20,0.4)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.16)] rounded-full p-[0.3rem]">
          <button
            v-for="cat in categories"
            :key="cat"
            class="bg-transparent border-none [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] rounded-full whitespace-nowrap cursor-pointer transition-all duration-200 py-[0.48rem] px-4 text-[0.86rem] font-semibold text-[rgba(255,255,255,0.82)]"
            :class="{ '!bg-accent-lime !text-accent-ink [text-shadow:none] !font-bold': activeCategory === cat }"
            @click="activeCategory = cat; activeTagFilter = ''"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Subcategory chips for the active main category -->
      <div class="flex overflow-x-auto pt-2 px-4 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden" v-if="activeSubtags.length > 0">
        <div class="flex items-center gap-1 bg-[rgba(20,20,20,0.28)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.1)] rounded-full p-[0.22rem]">
          <button
            v-for="sub in activeSubtags"
            :key="sub.slug"
            class="bg-transparent border-none [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] rounded-full whitespace-nowrap cursor-pointer transition-all duration-200 py-[0.36rem] px-[0.8rem] text-[0.76rem] font-medium text-[rgba(255,255,255,0.68)]"
            :class="{ '!bg-accent-lime !text-accent-ink [text-shadow:none] !font-bold': activeTagFilter === sub.name }"
            @click="activeTagFilter = activeTagFilter === sub.name ? '' : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Active Tag Filter Badge — only for tags picked from a card, not for the
         canonical subcategory chips above (those already show their own active state) -->
    <div v-if="activeTagFilter && !activeSubtags.some(s => s.name === activeTagFilter)" class="fixed top-[60px] left-4 right-4 z-45 bg-[rgba(20,20,20,0.55)] border border-[rgba(213,242,78,0.5)] backdrop-blur-[12px] text-white px-4 py-2 rounded-full flex justify-between items-center text-[0.85rem]">
      <span>Tag-Filter: <strong>{{ activeTagFilter }}</strong></span>
      <button @click="activeTagFilter = ''" class="bg-[rgba(255,255,255,0.2)] border-none text-white px-2 py-0.5 rounded-[10px] cursor-pointer text-[0.75rem] font-bold hover:bg-[rgba(255,255,255,0.35)]">✕ Entfernen</button>
    </div>

    <ShortformFeed
      :articles="publishedArticles"
      :apiUrl="config.public.apiUrl"
      :trackingEnabled="true"
      :likedIds="likedArticleIds"
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
      <div v-if="shareToast" class="fixed bottom-[6.5rem] left-1/2 -translate-x-1/2 z-[150] bg-accent-ink text-accent-lime text-[0.85rem] font-semibold px-[1.2rem] py-[0.6rem] rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.4)]">{{ shareToast }}</div>
    </transition>

    <!-- Comments Sheet -->
    <transition name="sheet">
      <div v-if="commentsArticle" class="comments-backdrop fixed inset-0 z-[140] bg-[rgba(0,0,0,0.55)] flex items-end" @click.self="closeComments">
        <div class="comments-sheet w-full max-h-[75vh] bg-reader-bg rounded-t-[24px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.35)]">
          <div class="flex items-center justify-between pt-[1.1rem] px-5 pb-[0.85rem] border-b border-[rgba(20,20,20,0.08)]">
            <h3 class="m-0 font-accent italic font-medium text-[1.2rem] text-accent-ink">Kommentare <span class="not-italic font-medium text-[0.9rem] text-reader-muted">({{ commentsArticle.commentCount || comments.length }})</span></h3>
            <button class="bg-[rgba(20,20,20,0.06)] border-none w-[30px] h-[30px] rounded-full text-accent-ink text-[0.9rem] cursor-pointer" @click="closeComments">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto py-2 px-5">
            <div v-if="commentsLoading" class="py-10 text-center text-reader-muted text-[0.9rem]">Lade Kommentare…</div>
            <div v-else-if="comments.length === 0" class="py-10 text-center text-reader-muted text-[0.9rem]">Noch keine Kommentare. Sei die/der Erste!</div>
            <div v-for="c in comments" :key="c.id" class="flex gap-[0.7rem] py-[0.85rem] border-b border-[rgba(20,20,20,0.06)]">
              <div class="shrink-0 w-[34px] h-[34px] rounded-full bg-accent-ink text-accent-lime flex items-center justify-center font-bold text-[0.85rem]">{{ (c.authorName || 'A').charAt(0).toUpperCase() }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 text-[0.78rem] text-reader-muted mb-[0.2rem]">
                  <strong class="text-accent-ink text-[0.85rem]">{{ c.authorName }}</strong>
                  <span>{{ formatRelativeTime(c.createdAt) }}</span>
                </div>
                <p class="m-0 text-[0.9rem] leading-[1.4] text-[#24252a] break-words">{{ c.text }}</p>
              </div>
            </div>
          </div>
          <form class="pt-[0.85rem] px-5 pb-5 border-t border-[rgba(20,20,20,0.08)] flex flex-col gap-2" @submit.prevent="submitComment">
            <input
              v-model="commentName"
              type="text"
              maxlength="60"
              placeholder="Dein Name (optional)"
              class="border-none bg-transparent text-[0.78rem] text-reader-muted p-0 outline-none"
            />
            <div class="flex gap-2 items-center">
              <input
                v-model="commentText"
                type="text"
                maxlength="1000"
                placeholder="Kommentar schreiben…"
                class="flex-1 border border-[rgba(20,20,20,0.12)] bg-reader-input-bg rounded-full px-[1.1rem] py-[0.65rem] text-[0.9rem] text-accent-ink outline-none focus:border-accent-lime-deep"
              />
              <button type="submit" class="bg-accent-ink text-accent-lime border-none rounded-full px-[1.2rem] py-[0.65rem] text-[0.85rem] font-bold cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed" :disabled="!commentText.trim() || commentSubmitting">
                Senden
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Reader Overlay -->
    <transition name="reader">
      <div v-if="activeReaderArticle" class="fixed top-0 left-0 w-full h-full bg-reader-bg z-100 overflow-y-auto flex flex-col">
        <div class="py-4 px-6 bg-reader-bg sticky top-0 flex justify-between items-center border-b border-[rgba(20,20,20,0.08)] z-10">
          <button @click="activeReaderArticle = null" class="bg-transparent border-none text-reader-accent text-base font-semibold cursor-pointer py-2 px-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Zurück
          </button>

          <div class="flex items-center gap-2">
            <button
              v-if="ttsSupported"
              class="bg-[rgba(20,20,20,0.05)] border border-[rgba(20,20,20,0.12)] text-reader-accent rounded-full px-[0.9rem] py-[0.4rem] text-[0.85rem] font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-all duration-200 hover:bg-[rgba(111,143,26,0.12)] hover:border-accent-lime-deep"
              :class="{ '!bg-[#ef4444] !text-white !border-[#ef4444]': isSpeaking }"
              @click="toggleSpeech"
              :title="isSpeaking ? 'Vorlesen stoppen' : 'KI-Zusammenfassung vorlesen'"
            >
              <span v-if="isSpeaking" class="inline-flex items-center gap-0.5 h-3">
                <span class="w-0.5 h-full bg-current rounded-[1px] animate-wave"></span><span class="w-0.5 h-full bg-current rounded-[1px] animate-wave" style="animation-delay: 0.2s"></span><span class="w-0.5 h-full bg-current rounded-[1px] animate-wave" style="animation-delay: 0.4s"></span>
              </span>
              <span v-else>🔊</span>
              {{ isSpeaking ? 'Stopp' : 'Vorlesen' }}
            </button>
          </div>
        </div>
        <div class="p-6 pb-16 font-reader text-accent-ink">
          <div class="flex flex-wrap gap-2 mb-4" v-if="activeReaderArticle.tags && activeReaderArticle.tags.length > 0">
            <button
              v-for="tag in activeReaderArticle.tags"
              :key="tag.id"
              class="bg-[rgba(20,20,20,0.05)] border border-[rgba(20,20,20,0.12)] text-reader-accent px-3 py-[0.3rem] rounded-[14px] text-[0.85rem] font-medium cursor-pointer transition-all duration-150 hover:bg-[rgba(111,143,26,0.15)] hover:border-accent-lime-deep hover:-translate-y-px"
              @click="filterByTag(tag.name)"
              title="Nach diesem Tag filtern"
            >
              {{ tag.name }}
            </button>
          </div>
          <h1 class="text-[2em] font-bold my-[0.67em]">{{ activeReaderArticle.title }}</h1>

          <div v-if="activeReaderArticle.keyTakeaways" class="bg-reader-input-bg p-6 rounded-[18px] mb-8 border-l-4 border-l-accent-lime-deep">
            <div class="flex justify-between items-center mb-3">
              <h3 class="m-0 text-reader-accent text-[1.1rem] font-accent italic">KI-Kernpunkte</h3>
              <span class="text-[0.75rem] text-reader-muted bg-[rgba(20,20,20,0.06)] px-[0.6rem] py-[0.2rem] rounded-xl">{{ estimateReadingTime(activeReaderArticle.content) }}</span>
            </div>
            <ul class="list-disc" style="padding-left: 1.2rem; margin: 0;">
              <li v-for="point in parseKeyTakeaways(activeReaderArticle.keyTakeaways)" :key="point">{{ point }}</li>
            </ul>
          </div>

          <div class="leading-[1.8] text-[1.1rem] whitespace-pre-wrap mb-12 px-2">{{ activeReaderArticle.content }}</div>
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
  type ArticleTag,
  type UserInterests
} from '@wb-news/shortform-news';

interface Comment {
  id: number;
  articleId: number;
  authorName: string;
  text: string;
  createdAt?: string | Date | null;
}

const articles = ref<Article[]>([]);
const activeReaderArticle = ref<Article | null>(null);
const activeCategory = ref('Für dich');
const activeTagFilter = ref('');
const categories = ['Für dich', 'Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];

// Granular subcategory chips (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const activeSubtags = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);

// User Interest Model (Stored locally, privacy-first)
const userInterests = ref<UserInterests>({
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

const recordInterestInteraction = (article: Article | null, weight = 1) => {
  if (!article) return;
  if (!userInterests.value.categories) userInterests.value.categories = {};
  if (!userInterests.value.tags) userInterests.value.tags = {};

  if (article.category) {
    const current = userInterests.value.categories[article.category] || 0;
    userInterests.value.categories[article.category] = current + (weight * 2);
  }

  if (Array.isArray(article.tags)) {
    for (const tag of article.tags) {
      const slug = (tag.slug || tag.name || '').toLowerCase();
      if (!slug) continue;
      const current = userInterests.value.tags[slug] || 0;
      userInterests.value.tags[slug] = current + (weight * 3);
    }
  }

  try {
    localStorage.setItem('wb_user_interests', JSON.stringify(userInterests.value));
  } catch {
    // best-effort, ignore failures
  }
};

const publishedArticles = computed(() => {
  let filtered = articles.value.filter(a => a.status === 'published');

  if (activeTagFilter.value) {
    // Match by name first — auto-generated slugs strip umlauts/&/spaces and
    // don't reliably round-trip back to the canonical subtag name (e.g.
    // "Justiz & Recht" -> slug "justiz-recht" != "justiz & recht").
    const tagQuery = activeTagFilter.value.toLowerCase();
    filtered = filtered.filter(a =>
      a.tags && a.tags.some((t: ArticleTag) => (t.name || '').toLowerCase() === tagQuery || (t.slug || '').toLowerCase() === tagQuery)
    );
  }

  if (activeCategory.value === 'Für dich') {
    return rankPersonalizedArticles(filtered, userInterests.value);
  } else if (activeCategory.value !== 'Alle') {
    filtered = filtered.filter(a => a.category === activeCategory.value);
  }
  return filtered;
});

const config = useRuntimeConfig();

const fetchArticles = async () => {
  try {
    const res = await fetch(`${config.public.apiUrl}/api/feed`);
    if (!res.ok) throw new Error('API Error');
    const data: Article[] = await res.json();
    articles.value = data;
  } catch (e) {
    console.error('Failed to fetch articles:', e);
    articles.value = [];
  }
};

// --- Background content-change detection ---
// The feed is opened once and can stay open for a long time (vertical scroll
// session); without this, newly published/edited/unpublished articles from
// the CMS would never show up until a manual page reload. Polling merges
// changes into the existing array in place (update-in-place, append-new,
// drop-removed) instead of replacing it wholesale, so Vue's :key-based
// diffing keeps already-rendered cards mounted and the user's scroll
// position/reader/comments state stays untouched.
const POLL_INTERVAL_MS = 60000;
let pollTimer: ReturnType<typeof setInterval> | null = null;

const pollForUpdates = async () => {
  if (typeof document !== 'undefined' && document.hidden) return;
  try {
    const res = await fetch(`${config.public.apiUrl}/api/feed`);
    if (!res.ok) return;
    const data: Article[] = await res.json();

    const existingIds = new Set(articles.value.map(a => a.id));
    const incomingIds = new Set(data.map(a => a.id));

    for (const incoming of data) {
      const idx = articles.value.findIndex(a => a.id === incoming.id);
      if (idx !== -1) {
        articles.value[idx] = { ...articles.value[idx], ...incoming };
      }
    }

    const newOnes = data.filter(a => !existingIds.has(a.id));
    if (newOnes.length > 0) {
      articles.value = [...articles.value, ...newOnes];
    }

    articles.value = articles.value.filter(a => incomingIds.has(a.id));
  } catch (e) {
    console.warn('Background content refresh failed:', e);
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
  } catch {
    // best-effort, ignore failures
  }
};

const openReader = (article: Article) => {
  activeReaderArticle.value = article;
  recordInterestInteraction(article, 2);
  sendAnalytics('read', article.id, { category: article.category });

  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId: article.id }, '*');
  }
};

const onArticleImpression = (article: Article) => {
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

  utterance.onend = () => { isSpeaking.value = false; };
  utterance.onerror = () => { isSpeaking.value = false; };

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
  } catch {
    // best-effort, ignore failures
  }
};

const persistLikedArticles = () => {
  try {
    localStorage.setItem('wb_liked_articles', JSON.stringify(likedArticleIds.value));
  } catch {
    // best-effort, ignore failures
  }
};

const patchArticleCount = (articleId: number, field: 'likeCount' | 'commentCount' | 'shareCount', delta: number) => {
  const article = articles.value.find(a => a.id === articleId);
  if (article) article[field] = Math.max(0, (article[field] || 0) + delta);
  if (activeReaderArticle.value?.id === articleId) {
    activeReaderArticle.value[field] = Math.max(0, (activeReaderArticle.value[field] || 0) + delta);
  }
};

const handleLike = async (article: Article) => {
  if (likedArticleIds.value.includes(article.id)) return;
  likedArticleIds.value = [...likedArticleIds.value, article.id];
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', 1);
  recordInterestInteraction(article, 3);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/like`, { method: 'POST' });
  } catch {
    // best-effort, ignore failures
  }
};

const handleUnlike = async (article: Article) => {
  likedArticleIds.value = likedArticleIds.value.filter(id => id !== article.id);
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', -1);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/unlike`, { method: 'POST' });
  } catch {
    // best-effort, ignore failures
  }
};

// --- Share ---
const shareToast = ref('');
let shareToastTimeout: ReturnType<typeof setTimeout> | null = null;

const showShareToast = (msg: string) => {
  shareToast.value = msg;
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
  shareToastTimeout = setTimeout(() => { shareToast.value = ''; }, 2500);
};

const handleShare = async (article: Article) => {
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
const commentsArticle = ref<Article | null>(null);
const comments = ref<Comment[]>([]);
const commentsLoading = ref(false);
const commentName = ref('');
const commentText = ref('');
const commentSubmitting = ref(false);

const openComments = async (article: Article) => {
  commentsArticle.value = article;
  comments.value = [];
  commentsLoading.value = true;
  try {
    const savedName = localStorage.getItem('wb_comment_name');
    if (savedName) commentName.value = savedName;
  } catch {
    // best-effort, ignore failures
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
  } catch {
    // best-effort, ignore failures
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

const formatRelativeTime = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.floor(hours / 24)} Tg`;
};

onMounted(() => {
  loadUserInterests();
  loadLikedArticles();
  fetchArticles().then(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedIdParam = params.get('article');
    const sharedId = sharedIdParam ? parseInt(sharedIdParam, 10) : NaN;
    if (!Number.isNaN(sharedId)) {
      const found = articles.value.find(a => a.id === sharedId);
      if (found) openReader(found);
    }
  });
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    ttsSupported.value = true;
  }
  pollTimer = setInterval(pollForUpdates, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer);
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
});
</script>

<style scoped>
/* Vue <transition> lifecycle classes — framework-injected during
   enter/leave, not expressible as static Tailwind utility classes. */
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
