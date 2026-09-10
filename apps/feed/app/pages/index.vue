<template>
  <div class="vertical-feed">
    <div class="category-filters">
      <button 
        v-for="cat in categories" 
        :key="cat"
        :class="['chip', { active: activeCategory === cat }]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="feed-item" v-for="article in publishedArticles" :key="article.id">
      <div class="media-area" :style="{ backgroundColor: article.image ? 'transparent' : '#1f2937' }">
        <span class="category-badge">{{ article.category }}</span>
      </div>
      <ArticleOverlay :article="article" @read="openReader" />
    </div>
    <div v-if="publishedArticles.length === 0" class="empty-feed">
      Keine aktiven Nachrichten in Kategorie '{{ activeCategory === 'Alle' ? 'Alle Kategorien' : activeCategory }}'.
    </div>

    <!-- Reader Overlay -->
    <transition name="reader">
      <div v-if="activeReaderArticle" class="reader-overlay">
        <div class="reader-header">
          <button @click="activeReaderArticle = null" class="back-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Zurück zur Übersicht
          </button>
        </div>
        <div class="reader-content">
          <h1 class="reader-title">{{ activeReaderArticle.title }}</h1>
          
          <div v-if="activeReaderArticle.keyTakeaways" class="takeaways">
            <h3>KI-Kernpunkte</h3>
            <ul style="padding-left: 1.2rem; margin: 0;">
              <li v-for="point in activeReaderArticle.keyTakeaways.split(/(?:\n|[,;]?\s*(?:•|-|\d+\.)\s+)/).filter(p => p.trim())" :key="point">{{ point.trim() }}</li>
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

const articles = ref([]);
const activeReaderArticle = ref(null);
const activeCategory = ref('Alle');
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];

const publishedArticles = computed(() => {
  let filtered = articles.value.filter(a => a.status === 'published');
  if (activeCategory.value !== 'Alle') {
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

const openReader = (article) => {
  activeReaderArticle.value = article;
  
  if (window.parent) {
    window.parent.postMessage({ type: 'article_opened', articleId: article.id }, '*');
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<style scoped>
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

.empty-feed {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #888;
  background: #000;
  text-align: center;
  padding: 2rem;
}
.empty-feed svg {
  margin-bottom: 1rem;
  opacity: 0.4;
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
}
.reader-content h2 { 
  margin-top: 0; 
  font-size: 1.8rem;
  line-height: 1.2;
}
.reader-meta { 
  color: #9ca3af; 
  font-size: 0.9rem; 
  margin-bottom: 2rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.scroll-indicator {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255,255,255,0.5);
  font-size: 0.8rem;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { opacity: 0.3; }
  50% { opacity: 0.8; }
  100% { opacity: 0.3; }
}
.takeaways {
  background: #1f2937;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #4ade80;
}
.takeaways h3 { margin: 0 0 0.5rem 0; color: #4ade80; font-size: 1.1rem; }
.reader-body {
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
  margin-bottom: 3rem;
  padding: 0 0.5rem;
}
.vertical-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}
.feed-item {
  height: 100vh;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
}
.empty-feed h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 500;
}
.article-title {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.meta {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}
.read-more {
  width: 100%;
  padding: 1rem;
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
</style>
