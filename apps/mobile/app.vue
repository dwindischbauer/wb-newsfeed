<template>
  <div class="tiktok-feed-app">
    <!-- Floating Category Filter Bar at Top Overlay -->
    <div class="floating-category-bar">
      <CategoryFilterBar 
        :selected="activeCategory" 
        @select="activeCategory = $event" 
      />
    </div>

    <!-- TikTok Style Vertical Full-Height Snap Feed -->
    <main class="tiktok-feed-container">
      <div v-if="publishedItems.length > 0" class="tiktok-feed-snap">
        <NewsCard 
          v-for="item in publishedItems" 
          :key="item.id" 
          :item="item" 
          @read-more="openFullArticle" 
        />
      </div>

      <div v-else class="empty-feed-slide">
        <h3>Keine veröffentlichten Nachrichten</h3>
        <p v-if="activeCategory !== 'Alle'">Keine aktiven Nachrichten in Kategorie "{{ activeCategory }}".</p>
        <p v-else>Alle Artikel sind derzeit auf "Entwurf" (inaktiv) gesetzt. Klicke im Admin Dashboard auf "Sofort veröffentlichen", um einen Artikel im Handy-Feed anzuzeigen.</p>
        <button class="btn-reset" @click="activeCategory = 'Alle'">Alle Kategorien anzeigen</button>
      </div>
    </main>

    <!-- Full Reader View Modal Overlay -->
    <div v-if="readerArticle" class="reader-modal" @click.self="readerArticle = null">
      <div class="reader-content">
        <div class="reader-bar">
          <span class="badge-category">{{ readerArticle.category || 'POLITIK' }}</span>
          <button class="close-btn" @click="readerArticle = null">✕</button>
        </div>

        <h1 class="full-title">{{ readerArticle.headline }}</h1>
        <div class="meta-row">
          <span>Von {{ readerArticle.author || 'ORF.at Redaktion' }}</span> · <span>{{ readerArticle.timeAgo || 'vor 10 Min' }}</span>
        </div>

        <div class="takeaways">
          <h3>KI-Kernpunkte</h3>
          <ul>
            <li>Automatisch zusammengefasst von Ollama LLM / Worker.</li>
            <li>Live im WB Publisher Newsfeed verarbeitet.</li>
          </ul>
        </div>

        <p class="full-text">
          {{ readerArticle.content || readerArticle.summary }}
        </p>

        <button class="btn-back" @click="readerArticle = null">
          ← Zurück zur Übersicht
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CategoryFilterBar from './components/CategoryFilterBar.vue';
import NewsCard from './components/NewsCard.vue';

const activeCategory = ref('Alle');
const readerArticle = ref(null);
const feedItems = ref([]);

// STRICTLY Filter to ONLY display published items ('Veröffentlicht')
const publishedItems = computed(() => {
  const onlyPublished = feedItems.value.filter(item => item.status === 'Veröffentlicht');
  if (activeCategory.value === 'Alle') return onlyPublished;
  return onlyPublished.filter(i => i.category.toLowerCase() === activeCategory.value.toLowerCase());
});

async function fetchLiveFeed() {
  try {
    const res = await fetch('http://localhost:3005/api/feed');
    if (res.ok) {
      const data = await res.json();
      if (data.feed) {
        feedItems.value = data.feed.map(item => ({
          id: item.teaserId,
          category: 'POLITIK',
          headline: item.headline,
          summary: item.summary,
          content: item.content || item.summary,
          author: item.author || 'ORF.at Redaktion',
          status: item.status || 'Veröffentlicht',
          timeAgo: 'vor 5 Min'
        }));
      }
    }
  } catch (err) {
    console.log('API live feed fetch');
  }
}

function openFullArticle(item) {
  readerArticle.value = item;
}

onMounted(() => {
  fetchLiveFeed();
  setInterval(fetchLiveFeed, 1500);
});
</script>

<style scoped>
.tiktok-feed-app {
  height: 100vh;
  width: 100vw;
  max-width: 500px;
  margin: 0 auto;
  background: #09090b;
  color: #ffffff;
  position: relative;
  overflow: hidden;
}

.floating-category-bar {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(180deg, rgba(9,9,11,0.85) 0%, rgba(9,9,11,0) 100%);
  padding-top: 8px;
}

.tiktok-feed-container {
  height: 100vh;
  width: 100%;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  -webkit-overflow-scrolling: touch;
}

.tiktok-feed-snap {
  display: flex;
  flex-direction: column;
}

.empty-feed-slide {
  height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #a1a1aa; text-align: center; padding: 32px;
}

.empty-feed-slide h3 { color: #f4f4f5; font-size: 18px; margin-bottom: 8px; }

.empty-feed-slide p { font-size: 13px; color: #71717a; max-width: 320px; line-height: 1.5; }

.btn-reset { margin-top: 16px; background: #10b981; color: #000000; border: none; padding: 10px 20px; border-radius: 20px; font-weight: 700; cursor: pointer; }

.reader-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; justify-content: center; z-index: 500;
}

.reader-content {
  background: #18181b; width: 100%; max-width: 500px; border-radius: 24px 24px 0 0; padding: 24px; color: #ffffff; max-height: 90vh; overflow-y: auto;
}

.reader-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.badge-category { background: #10b981; color: #000000; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; }

.close-btn { background: none; border: none; color: #a1a1aa; font-size: 20px; cursor: pointer; }

.full-title { font-size: 22px; font-weight: 800; color: #f4f4f5; line-height: 1.25; margin-bottom: 8px; }
.meta-row { font-size: 12px; color: #10b981; margin-bottom: 16px; }

.takeaways { background: #27272a; border-radius: 12px; padding: 14px; margin-bottom: 18px; font-size: 13px; }
.takeaways h3 { font-size: 13px; color: #10b981; margin-bottom: 6px; }
.takeaways ul { margin-left: 18px; color: #d4d4d8; }

.full-text { font-size: 14px; color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; }

.btn-back {
  background: #10b981; color: #000000; border: none; padding: 14px; border-radius: 24px; font-weight: 800; font-size: 14px; width: 100%; cursor: pointer;
}
</style>
