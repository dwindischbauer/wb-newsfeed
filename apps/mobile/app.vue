<template>
  <div class="mobile-app-wrapper">
    <div class="iphone-notch-bar">
      <span class="time">9:41</span>
      <div class="notch"></div>
      <div class="icons">📶 📡 🔋</div>
    </div>

    <CategoryFilterBar 
      :selected="activeCategory" 
      @select="activeCategory = $event" 
    />

    <main class="feed-content">
      <NewsCard 
        v-if="currentArticle" 
        :item="currentArticle" 
        @read-more="onReadMore" 
      />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CategoryFilterBar from './components/CategoryFilterBar.vue';
import NewsCard from './components/NewsCard.vue';

const activeCategory = ref('Alle');
const feedItems = ref([
  {
    id: '1',
    category: 'POLITIK',
    headline: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
    summary: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden.',
    timeAgo: 'vor 12 Min'
  },
  {
    id: '2',
    category: 'TECHNOLOGIE',
    headline: 'KI täuschte Menschen mit Fake-Profilen',
    summary: 'Ein umstrittener Sicherheitstest mit künstlicher Intelligenz erzeugte getarnte Social-Media-Profile.',
    timeAgo: 'vor 25 Min'
  },
  {
    id: '3',
    category: 'WIRTSCHAFT',
    headline: 'Dürre sorgt für hohe Einbußen bei Getreideernte',
    summary: 'Anhaltende Trockenheit führt in mehreren Bundesländern zu spürbaren Ernteausfällen bei Getreide.',
    timeAgo: 'vor 40 Min'
  },
  {
    id: '4',
    category: 'KULTUR',
    headline: '„Saint Francois“: Salzburg findet in den Himmel',
    summary: 'Bei den Salzburger Festspielen feierte die Neuinszenierung von Saint Francois große Erfolge.',
    timeAgo: 'vor 1 Std'
  }
]);

async function fetchLiveFeed() {
  try {
    const res = await fetch('http://localhost:3005/api/feed');
    if (res.ok) {
      const data = await res.json();
      if (data.feed && data.feed.length > 0) {
        feedItems.value = data.feed.map(item => ({
          id: item.teaserId,
          category: 'POLITIK',
          headline: item.headline,
          summary: item.summary,
          timeAgo: 'vor 5 Min'
        }));
      }
    }
  } catch (err) {
    console.log('Backend API offline mode');
  }
}

const currentArticle = computed(() => {
  if (activeCategory.value === 'Alle') return feedItems.value[0];
  const found = feedItems.value.find(i => i.category.toLowerCase() === activeCategory.value.toLowerCase());
  return found || feedItems.value[0];
});

function onReadMore(item) {
  alert(`Öffne vollständigen Artikel: "${item.headline}"`);
}

onMounted(() => {
  fetchLiveFeed();
});
</script>

<style scoped>
.mobile-app-wrapper {
  max-width: 420px; min-height: 100vh; margin: 0 auto; background: #09090b; box-shadow: 0 0 40px rgba(0,0,0,0.5); display: flex; flex-direction: column;
}

.iphone-notch-bar {
  display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; font-size: 13px; font-weight: 600; color: #ffffff; background: #000000;
}

.notch { width: 90px; height: 18px; background: #18181b; border-radius: 12px; }
.icons { font-size: 11px; }
.feed-content { flex: 1; }
</style>
