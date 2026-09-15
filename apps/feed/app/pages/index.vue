<template>
  <div class="vertical-feed-app">
    <div class="top-nav-area">
      <div class="category-filters">
        <div class="category-pill-group">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['nav-chip', { active: activeCategory === cat }]"
            @click="activeCategory = cat; activeTagFilter = ''"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Subcategory chips for the active main category -->
      <div class="subcategory-filters" v-if="activeSubtags.length > 0">
        <div class="category-pill-group subtle">
          <button
            v-for="sub in activeSubtags"
            :key="sub.slug"
            :class="['nav-chip', 'sub', { active: activeTagFilter === sub.name }]"
            @click="activeTagFilter = activeTagFilter === sub.name ? '' : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- Active Tag Filter Badge — only for tags picked from a card, not for the
         canonical subcategory chips above (those already show their own active state) -->
    <div v-if="activeTagFilter && !activeSubtags.some(s => s.name === activeTagFilter)" class="active-tag-banner">
      <span>Tag-Filter: <strong>{{ activeTagFilter }}</strong></span>
      <button @click="activeTagFilter = ''" class="clear-tag-btn">✕ Entfernen</button>
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
      <div v-if="shareToast" class="share-toast">{{ shareToast }}</div>
    </transition>

    <!-- Comments Sheet -->
    <transition name="sheet">
      <div v-if="commentsArticle" class="comments-backdrop" @click.self="closeComments">
        <div class="comments-sheet">
          <div class="comments-sheet-header">
            <h3>Kommentare <span class="comments-count">({{ commentsArticle.commentCount || comments.length }})</span></h3>
            <button class="comments-close-btn" @click="closeComments">✕</button>
          </div>
          <div class="comments-list">
            <div v-if="commentsLoading" class="comments-empty">Lade Kommentare…</div>
            <div v-else-if="comments.length === 0" class="comments-empty">Noch keine Kommentare. Sei die/der Erste!</div>
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-avatar">{{ (c.authorName || 'A').charAt(0).toUpperCase() }}</div>
              <div class="comment-body">
                <div class="comment-meta">
                  <strong>{{ c.authorName }}</strong>
                  <span>{{ formatRelativeTime(c.createdAt) }}</span>
                </div>
                <p>{{ c.text }}</p>
              </div>
            </div>
          </div>
          <form class="comment-form" @submit.prevent="submitComment">
            <input
              v-model="commentName"
              type="text"
              maxlength="60"
              placeholder="Dein Name (optional)"
              class="comment-name-input"
            />
            <div class="comment-input-row">
              <input
                v-model="commentText"
                type="text"
                maxlength="1000"
                placeholder="Kommentar schreiben…"
                class="comment-text-input"
              />
              <button type="submit" class="comment-submit-btn" :disabled="!commentText.trim() || commentSubmitting">
                Senden
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>

    <!-- Reader Overlay -->
    <transition name="reader">
      <div v-if="activeReaderArticle" class="reader-overlay">
        <div class="reader-header">
          <button @click="activeReaderArticle = null" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Zurück
          </button>
          
          <div class="reader-header-actions">
            <button 
              v-if="ttsSupported" 
              :class="['tts-btn', { active: isSpeaking }]" 
              @click="toggleSpeech"
              :title="isSpeaking ? 'Vorlesen stoppen' : 'KI-Zusammenfassung vorlesen'"
            >
              <span v-if="isSpeaking" class="audio-wave">
                <span></span><span></span><span></span>
              </span>
              <span v-else>🔊</span>
              {{ isSpeaking ? 'Stopp' : 'Vorlesen' }}
            </button>
          </div>
        </div>
        <div class="reader-content">
          <div class="reader-tags" v-if="activeReaderArticle.tags && activeReaderArticle.tags.length > 0">
            <button 
              v-for="tag in activeReaderArticle.tags" 
              :key="tag.id" 
              class="reader-tag-chip"
              @click="filterByTag(tag.name)"
              title="Nach diesem Tag filtern"
            >
              {{ tag.name }}
            </button>
          </div>
          <h1 class="reader-title">{{ activeReaderArticle.title }}</h1>
          
          <div v-if="activeReaderArticle.keyTakeaways" class="takeaways">
            <div class="takeaways-header">
              <h3>KI-Kernpunkte</h3>
              <span class="reading-time">{{ estimateReadingTime(activeReaderArticle.content) }}</span>
            </div>
            <ul style="padding-left: 1.2rem; margin: 0;">
              <li v-for="point in parseKeyTakeaways(activeReaderArticle.keyTakeaways)" :key="point">{{ point }}</li>
            </ul>
          </div>
          
          <div class="reader-body">{{ activeReaderArticle.content }}</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import {
  ShortformFeed,
  parseKeyTakeaways,
  estimateReadingTime,
  rankPersonalizedArticles,
  CATEGORY_SUBTAGS
} from '@wb-news/shortform-news';

const articles = ref([]);
const activeReaderArticle = ref(null);
const activeCategory = ref('Für dich');
const activeTagFilter = ref('');
const categories = ['Für dich', 'Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];

// Granular subcategory chips (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const activeSubtags = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);

// User Interest Model (Stored locally, privacy-first)
const userInterests = ref({
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

const recordInterestInteraction = (article, weight = 1) => {
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
  } catch (e) {}
};

const publishedArticles = computed(() => {
  let filtered = articles.value.filter(a => a.status === 'published');
  
  if (activeTagFilter.value) {
    const tagQuery = activeTagFilter.value.toLowerCase();
    filtered = filtered.filter(a => 
      a.tags && a.tags.some(t => (t.slug || t.name || '').toLowerCase() === tagQuery)
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
    const data = await res.json();
    articles.value = data;
  } catch (e) {
    console.error('Failed to fetch articles:', e);
    articles.value = [];
  }
};

const sendAnalytics = (eventType, articleId = null, metadata = null) => {
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
  } catch (e) {}
};

const openReader = (article) => {
  activeReaderArticle.value = article;
  recordInterestInteraction(article, 2);
  sendAnalytics('read', article.id, { category: article.category });
  
  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId: article.id }, '*');
  }
};

const onArticleImpression = (article) => {
  recordInterestInteraction(article, 0.5);
  sendAnalytics('impression', article.id, { category: article.category });
};

const onScrollDepth = (percentage) => {
  if (percentage >= 80) {
    sendAnalytics('scroll_depth', activeReaderArticle.value?.id, { depth: percentage });
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

const filterByTag = (tagName) => {
  activeTagFilter.value = tagName;
  activeReaderArticle.value = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// --- Likes (device-local, privacy-first — same pattern as userInterests) ---
const likedArticleIds = ref([]);

const loadLikedArticles = () => {
  if (typeof window === 'undefined') return;
  try {
    const saved = localStorage.getItem('wb_liked_articles');
    if (saved) likedArticleIds.value = JSON.parse(saved);
  } catch (e) {}
};

const persistLikedArticles = () => {
  try {
    localStorage.setItem('wb_liked_articles', JSON.stringify(likedArticleIds.value));
  } catch (e) {}
};

const patchArticleCount = (articleId, field, delta) => {
  const article = articles.value.find(a => a.id === articleId);
  if (article) article[field] = Math.max(0, (article[field] || 0) + delta);
  if (activeReaderArticle.value?.id === articleId) {
    activeReaderArticle.value[field] = Math.max(0, (activeReaderArticle.value[field] || 0) + delta);
  }
};

const handleLike = async (article) => {
  if (likedArticleIds.value.includes(article.id)) return;
  likedArticleIds.value = [...likedArticleIds.value, article.id];
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', 1);
  recordInterestInteraction(article, 3);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/like`, { method: 'POST' });
  } catch (e) {}
};

const handleUnlike = async (article) => {
  likedArticleIds.value = likedArticleIds.value.filter(id => id !== article.id);
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', -1);
  try {
    await fetch(`${config.public.apiUrl}/api/articles/${article.id}/unlike`, { method: 'POST' });
  } catch (e) {}
};

// --- Share ---
const shareToast = ref('');
let shareToastTimeout = null;

const showShareToast = (msg) => {
  shareToast.value = msg;
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
  shareToastTimeout = setTimeout(() => { shareToast.value = ''; }, 2500);
};

const handleShare = async (article) => {
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
  } catch (e) {
    // User cancelled the native share sheet — not an error
  }
};

// --- Comments ---
const commentsArticle = ref(null);
const comments = ref([]);
const commentsLoading = ref(false);
const commentName = ref('');
const commentText = ref('');
const commentSubmitting = ref(false);

const openComments = async (article) => {
  commentsArticle.value = article;
  comments.value = [];
  commentsLoading.value = true;
  try {
    const savedName = localStorage.getItem('wb_comment_name');
    if (savedName) commentName.value = savedName;
  } catch (e) {}
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
  } catch (e) {}

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

const formatRelativeTime = (dateStr) => {
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
    const sharedId = parseInt(params.get('article'), 10);
    if (sharedId) {
      const found = articles.value.find(a => a.id === sharedId);
      if (found) openReader(found);
    }
  });
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    ttsSupported.value = true;
  }
});
</script>

<style scoped>
.vertical-feed-app {
  height: 100vh;
  position: relative;
  background: #000;
}
.top-nav-area {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  padding-bottom: 0.75rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0) 100%);
}

.category-filters {
  display: flex;
  overflow-x: auto;
  padding: 0.85rem 1rem 0;
  -webkit-overflow-scrolling: touch;
}
.category-filters::-webkit-scrollbar {
  display: none;
}

.subcategory-filters {
  display: flex;
  overflow-x: auto;
  padding: 0.5rem 1rem 0;
  -webkit-overflow-scrolling: touch;
}
.subcategory-filters::-webkit-scrollbar {
  display: none;
}

/* Grouped pill container — mirrors the admin header-nav pattern */
.category-pill-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: rgba(20, 20, 20, 0.4);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 9999px;
  padding: 0.3rem;
}
.category-pill-group.subtle {
  background: rgba(20, 20, 20, 0.28);
  border-color: rgba(255, 255, 255, 0.1);
  padding: 0.22rem;
}

.nav-chip {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
  padding: 0.48rem 1rem;
  border-radius: 9999px;
  font-size: 0.86rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav-chip.sub {
  padding: 0.36rem 0.8rem;
  font-size: 0.76rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.68);
}
.nav-chip.active {
  background: #d5f24e;
  color: #14151a;
  text-shadow: none;
  font-weight: 700;
}

.reader-enter-active,
.reader-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.reader-enter-from,
.reader-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.reader-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #faf8f2;
  z-index: 100;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.reader-header {
  padding: 1rem;
  background: #faf8f2;
  position: sticky;
  top: 0;
}
.back-btn {
  background: none;
  border: none;
  color: #4d6512;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0;
}
.reader-content {
  padding: 1.5rem;
  padding-bottom: 4rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #14151a;
}
.reader-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.reader-tag-chip {
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid rgba(20, 20, 20, 0.12);
  color: #4d6512;
  padding: 0.3rem 0.75rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
}
.reader-content h2 {
  margin-top: 0;
  font-size: 1.8rem;
  line-height: 1.2;
}
.takeaways {
  background: #f4f2ec;
  padding: 1.5rem;
  border-radius: 18px;
  margin-bottom: 2rem;
  border-left: 4px solid #6f8f1a;
}
.takeaways-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.takeaways h3 { margin: 0; color: #4d6512; font-size: 1.1rem; font-family: var(--font-accent); font-style: italic; }
.reading-time {
  font-size: 0.75rem;
  color: #6c6d73;
  background: rgba(20, 20, 20, 0.06);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
}
.reader-body {
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
  margin-bottom: 3rem;
  padding: 0 0.5rem;
}

/* Share toast */
.share-toast {
  position: fixed;
  bottom: 6.5rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  background: #14151a;
  color: #d5f24e;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.6rem 1.2rem;
  border-radius: 9999px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

/* Comments sheet */
.comments-backdrop {
  position: fixed;
  inset: 0;
  z-index: 140;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
}

.comments-sheet {
  width: 100%;
  max-height: 75vh;
  background: #faf8f2;
  border-radius: 24px 24px 0 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.35);
}

.comments-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.1rem 1.25rem 0.85rem;
  border-bottom: 1px solid rgba(20, 20, 20, 0.08);
}

.comments-sheet-header h3 {
  margin: 0;
  font-family: var(--font-accent);
  font-style: italic;
  font-weight: 500;
  font-size: 1.2rem;
  color: #14151a;
}

.comments-count {
  font-style: normal;
  font-weight: 500;
  font-size: 0.9rem;
  color: #6c6d73;
}

.comments-close-btn {
  background: rgba(20, 20, 20, 0.06);
  border: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: #14151a;
  font-size: 0.9rem;
  cursor: pointer;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 1.25rem;
}

.comments-empty {
  padding: 2.5rem 0;
  text-align: center;
  color: #6c6d73;
  font-size: 0.9rem;
}

.comment-item {
  display: flex;
  gap: 0.7rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(20, 20, 20, 0.06);
}

.comment-avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #14151a;
  color: #d5f24e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.85rem;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: #6c6d73;
  margin-bottom: 0.2rem;
}

.comment-meta strong {
  color: #14151a;
  font-size: 0.85rem;
}

.comment-body p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #24252a;
  word-wrap: break-word;
}

.comment-form {
  padding: 0.85rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(20, 20, 20, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-name-input {
  border: none;
  background: transparent;
  font-size: 0.78rem;
  color: #6c6d73;
  padding: 0;
  outline: none;
}

.comment-input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.comment-text-input {
  flex: 1;
  border: 1px solid rgba(20, 20, 20, 0.12);
  background: #f4f2ec;
  border-radius: 9999px;
  padding: 0.65rem 1.1rem;
  font-size: 0.9rem;
  color: #14151a;
  outline: none;
}

.comment-text-input:focus {
  border-color: #6f8f1a;
}

.comment-submit-btn {
  background: #14151a;
  color: #d5f24e;
  border: none;
  border-radius: 9999px;
  padding: 0.65rem 1.2rem;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.comment-submit-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
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

.active-tag-banner {
  position: fixed;
  top: 60px;
  left: 1rem;
  right: 1rem;
  z-index: 45;
  background: rgba(20, 20, 20, 0.55);
  border: 1px solid rgba(213, 242, 78, 0.5);
  backdrop-filter: blur(12px);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.clear-tag-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: bold;
}
.clear-tag-btn:hover {
  background: rgba(255, 255, 255, 0.35);
}

.reader-header {
  padding: 1rem 1.5rem;
  background: #faf8f2;
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(20, 20, 20, 0.08);
  z-index: 10;
}

.reader-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tts-btn {
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid rgba(20, 20, 20, 0.12);
  color: #4d6512;
  border-radius: 9999px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}
.tts-btn:hover {
  background: rgba(111, 143, 26, 0.12);
  border-color: #6f8f1a;
}
.tts-btn.active {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.audio-wave {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 12px;
}
.audio-wave span {
  width: 2px;
  height: 100%;
  background-color: currentColor;
  border-radius: 1px;
  animation: wave 1s ease-in-out infinite;
}
.audio-wave span:nth-child(2) { animation-delay: 0.2s; }
.audio-wave span:nth-child(3) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { height: 4px; }
  50% { height: 14px; }
}

.reader-tag-chip {
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid rgba(20, 20, 20, 0.12);
  color: #4d6512;
  padding: 0.3rem 0.75rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.reader-tag-chip:hover {
  background: rgba(111, 143, 26, 0.15);
  border-color: #6f8f1a;
  transform: translateY(-1px);
}
</style>
