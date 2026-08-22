<template>
  <div class="vertical-feed">
    <div class="feed-item" v-for="article in publishedArticles" :key="article.id">
      <div class="media-area" :style="{ backgroundColor: article.image ? 'transparent' : '#1f2937' }">
        <span class="category-badge">{{ article.category }}</span>
      </div>
      <div class="content-overlay">
        <h2>{{ article.title }}</h2>
        <p class="teaser" v-if="article.teaser">{{ article.teaser }}</p>
        <div class="meta">{{ article.author }} • vor 5 Min</div>
        <button class="read-more" @click="openReader(article)">Vollständigen Artikel lesen</button>
      </div>
    </div>
    <div v-if="publishedArticles.length === 0" class="empty-feed">
      Keine aktiven Nachrichten vorhanden.
    </div>

    <!-- Reader Overlay -->
    <div class="reader-overlay" v-if="activeReaderArticle">
      <div class="reader-header">
        <button class="back-btn" @click="activeReaderArticle = null">Zurück zur Übersicht</button>
      </div>
      <div class="reader-content">
        <h2>{{ activeReaderArticle.title }}</h2>
        <div class="reader-meta">{{ activeReaderArticle.author }} | {{ activeReaderArticle.category }}</div>
        
        <div class="takeaways" v-if="activeReaderArticle.keyTakeaways">
          <h3>KI-Kernpunkte</h3>
          <p>{{ activeReaderArticle.keyTakeaways }}</p>
        </div>
        
        <div class="full-text">
          {{ activeReaderArticle.content }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const articles = ref([]);
const activeReaderArticle = ref(null);

const publishedArticles = computed(() => {
  return articles.value.filter(a => a.status === 'published');
});

const config = useRuntimeConfig();

const fetchArticles = async () => {
  try {
    const res = await fetch(`${config.public.apiUrl}/api/articles`);
    const data = await res.json();
    articles.value = data;
  } catch (e) {
    console.error(e);
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
.takeaways {
  background: #1f2937;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border-left: 4px solid #4ade80;
}
.takeaways h3 { margin: 0 0 0.5rem 0; color: #4ade80; font-size: 1.1rem; }
.full-text {
  line-height: 1.8;
  font-size: 1.1rem;
  white-space: pre-wrap;
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
.media-area {
  flex: 1;
  background: #1a1a1a;
  position: relative;
}
.category-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255,255,255,0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}
.content-overlay {
  padding: 1.5rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
}
.content-overlay h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}
.article-title {
  margin: 0 0 1rem 0;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.teaser {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  opacity: 0.9;
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
