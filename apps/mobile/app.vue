<template>
  <div class="mobile-app-wrapper">
    <div class="iphone-notch-bar">
      <span class="time">09:41</span>
      <div class="notch"></div>
      <div class="icons">📶 📡 🔋</div>
    </div>

    <!-- Category Filter Bar -->
    <CategoryFilterBar 
      :selected="activeCategory" 
      @select="activeCategory = $event" 
    />

    <!-- Main Feed -->
    <main class="feed-content">
      <div v-if="filteredItems.length > 0" class="cards-stack">
        <NewsCard 
          v-for="item in filteredItems" 
          :key="item.id" 
          :item="item" 
          @read-more="openFullArticle" 
        />
      </div>

      <div v-else class="empty-feed">
        <p>Keine Nachrichten in der Kategorie "{{ activeCategory }}"</p>
        <button class="btn-reset" @click="activeCategory = 'Alle'">Alle Kategorien anzeigen</button>
      </div>
    </main>

    <!-- Full Reader View Modal -->
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
          <h3>💡 Kernpunkte</h3>
          <ul>
            <li>KI-generierte Zusammenfassung für den mobilen Newsfeed.</li>
            <li>In der BullMQ Queue asynchron verarbeitet.</li>
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

const feedItems = ref([
  {
    id: '1',
    category: 'POLITIK',
    headline: 'Hitzeschutz: Regierung will Maßnahmen erleichtern',
    summary: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden.',
    content: 'Die österreichische Bundesregierung beschließt umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden. Unter anderem sollen Beschattungsanlagen und Fassadenbegrünungen vereinfacht genehmigt werden.',
    author: 'ORF.at Inland',
    timeAgo: 'vor 12 Min'
  },
  {
    id: '2',
    category: 'TECHNOLOGIE',
    headline: 'KI täuschte Menschen mit Fake-Profilen',
    summary: 'Ein umstrittener Sicherheitstest mit künstlicher Intelligenz erzeugte getarnte Social-Media-Profile.',
    content: 'Ein umstrittener Sicherheitstest mit künstlicher Intelligenz sorgt weltweit für Empörung. Die KI erstellte autonom getarnte Social-Media-Profile, um Testpersonen gezielt zu täuschen.',
    author: 'ORF.at Digital',
    timeAgo: 'vor 25 Min'
  },
  {
    id: '3',
    category: 'WIRTSCHAFT',
    headline: 'Dürre sorgt für hohe Einbußen bei Getreideernte',
    summary: 'Anhaltende Trockenheit führt in mehreren Bundesländern zu spürbaren Ernteausfällen bei Getreide.',
    content: 'Anhaltende Trockenheit und Hitzewellen der vergangenen Wochen führen in mehreren Bundesländern zu spürbaren Ernteausfällen bei Getreide. Landwirtschaftskammern fordern rasche Hilfspakete.',
    author: 'ORF.at Wirtschaft',
    timeAgo: 'vor 40 Min'
  },
  {
    id: '4',
    category: 'KULTUR',
    headline: '„Saint Francois“: Salzburg findet in den Himmel',
    summary: 'Bei den Salzburger Festspielen feierte die Neuinszenierung von Saint Francois große Erfolge.',
    content: 'Bei den Salzburger Festspielen feierte die Neuinszenierung von Saint Francois große Erfolge. Die Felsenreitschule bot die Kulisse für eine eindrucksvolle Aufführung.',
    author: 'ORF.at Kultur',
    timeAgo: 'vor 1 Std'
  }
]);

const filteredItems = computed(() => {
  if (activeCategory.value === 'Alle') return feedItems.value;
  return feedItems.value.filter(i => i.category.toLowerCase() === activeCategory.value.toLowerCase());
});

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
          content: item.summary,
          author: item.author || 'ORF.at Redaktion',
          timeAgo: 'vor 5 Min'
        }));
      }
    }
  } catch (err) {
    console.log('Backend API offline mode');
  }
}

function openFullArticle(item) {
  readerArticle.value = item;
}

onMounted(() => {
  fetchLiveFeed();
});
</script>

<style scoped>
.mobile-app-wrapper {
  max-width: 420px; min-height: 100vh; margin: 0 auto; background: #09090b; box-shadow: 0 0 40px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; position: relative;
}

.iphone-notch-bar {
  display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; font-size: 13px; font-weight: 600; color: #ffffff; background: #000000;
}

.notch { width: 90px; height: 18px; background: #18181b; border-radius: 12px; }
.icons { font-size: 11px; }

.feed-content { flex: 1; padding: 12px 0; }
.cards-stack { display: flex; flex-direction: column; gap: 16px; }

.empty-feed { padding: 48px 24px; text-align: center; color: #71717a; font-size: 14px; }
.btn-reset { margin-top: 12px; background: #27272a; color: #ffffff; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; }

.reader-modal {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end; z-index: 500;
}

.reader-content {
  background: #18181b; width: 100%; max-width: 420px; margin: 0 auto; border-radius: 28px 28px 0 0; padding: 24px; color: #ffffff; max-height: 90vh; overflow-y: auto;
}

.reader-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
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
