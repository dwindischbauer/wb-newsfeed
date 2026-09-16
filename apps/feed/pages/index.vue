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
    </div>

    <!-- Active Tag Filter Badge -->
    <div v-if="activeTagFilter" class="active-tag-banner">
      <span>Tag-Filter: <strong>#{{ activeTagFilter }}</strong></span>
      <button @click="activeTagFilter = ''" class="clear-tag-btn">✕ Entfernen</button>
    </div>

    <ShortformFeed 
      :articles="publishedArticles" 
      :apiUrl="config.public.apiUrl"
      :trackingEnabled="true"
      @article-read="openReader"
      @article-impression="onArticleImpression"
      @scroll-depth="onScrollDepth"
      @filter-tag="filterByTag"
    >
      <template #empty>
        Keine aktiven Nachrichten für '{{ activeTagFilter ? '#' + activeTagFilter : activeCategory }}'.
      </template>
    </ShortformFeed>

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
              #{{ tag.name }}
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
  rankPersonalizedArticles 
} from '@wb-news/shortform-news';

const articles = ref([]);
const activeReaderArticle = ref(null);
const activeCategory = ref('⭐ Für dich');
const activeTagFilter = ref('');
const categories = ['⭐ Für dich', 'Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];

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

  if (activeCategory.value === '⭐ Für dich') {
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

onMounted(() => {
  loadUserInterests();
  fetchArticles();
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
.category-filters {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 50;
  display: flex;
  overflow-x: auto;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  -webkit-overflow-scrolling: touch;
}
.category-filters::-webkit-scrollbar {
  display: none;
}
.chip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.2s ease;
}
.chip.active {
  background: #4ade80;
  color: #000;
  border-color: #4ade80;
  font-weight: bold;
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
  background: #111;
  z-index: 100;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.reader-header {
  padding: 1rem;
  background: #000;
  position: sticky;
  top: 0;
}
.back-btn {
  background: none;
  border: none;
  color: #4ade80;
  font-size: 1rem;
  cursor: pointer;
  padding: 0.5rem 0;
}
.reader-content {
  padding: 1.5rem;
  padding-bottom: 4rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #fff;
}
.reader-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.reader-tag-chip {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #4ade80;
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
  background: #1f2937;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #4ade80;
}
.takeaways-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.takeaways h3 { margin: 0; color: #4ade80; font-size: 1.1rem; }
.reading-time {
  font-size: 0.75rem;
  color: #9ca3af;
  background: rgba(255, 255, 255, 0.08);
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

.active-tag-banner {
  position: fixed;
  top: 60px;
  left: 1rem;
  right: 1rem;
  z-index: 45;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(74, 222, 128, 0.4);
  backdrop-filter: blur(12px);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
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
  background: #000;
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #222;
  z-index: 10;
}

.reader-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tts-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #4ade80;
  border-radius: 20px;
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
  background: rgba(74, 222, 128, 0.15);
  border-color: #4ade80;
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
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #4ade80;
  padding: 0.3rem 0.75rem;
  border-radius: 14px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}
.reader-tag-chip:hover {
  background: rgba(74, 222, 128, 0.2);
  border-color: #4ade80;
  transform: translateY(-1px);
}
</style>