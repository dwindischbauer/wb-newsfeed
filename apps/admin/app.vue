<template>
  <div class="admin-app-fullpage">
    <!-- Top Full-Width Admin Header -->
    <CmsAdminHeader @change-tab="onTabChange" />

    <!-- Floating Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        <div>
          <strong class="toast-title">System-Benachrichtigung</strong>
          <p class="toast-body">{{ toastMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- Main Full-Page Content Container -->
    <main class="main-content">
      <!-- Stats & Quick Metrics Bar -->
      <div class="metrics-bar">
        <div class="metric-card">
          <div>
            <div class="metric-value">{{ articlesList.length }}</div>
            <div class="metric-label">Verwaltete Artikel</div>
          </div>
        </div>

        <div class="metric-card">
          <div>
            <div class="metric-value">{{ jobsList.length }}</div>
            <div class="metric-label">KI-Generierungs-Jobs</div>
          </div>
        </div>

        <div class="metric-card">
          <div>
            <div class="metric-value">{{ publishedCount }}</div>
            <div class="metric-label">Veröffentlicht im Newsfeed</div>
          </div>
        </div>

        <div class="metric-card">
          <div>
            <div class="metric-value">Aktiv (Port 3005)</div>
            <div class="metric-label">Fastify API & BullMQ</div>
          </div>
        </div>
      </div>

      <!-- Dashboard Layout Grid -->
      <div class="dashboard-layout">
        <!-- Left Panel: Article Management Table & Job Monitor -->
        <div class="left-panel">
          <ArticleTable 
            :articles="articlesList" 
            :activeSelectedId="selectedArticle?.id"
            @open-create="showModal = true" 
            @select-article="onArticleSelect" 
            @toggle-status="toggleStatus"
            @delete-article="deleteArticle"
          />

          <JobMonitorTable 
            :jobs="jobsList" 
            @refresh="fetchJobs" 
          />
        </div>

        <!-- Right Panel: Live Article Detail Panel -->
        <div class="right-panel">
          <div class="panel-header">
            <h3>Live Artikel-Vorschau</h3>
            <span class="preview-badge">Echtzeit Sync</span>
          </div>

          <div v-if="selectedArticle" class="preview-detail-card">
            <div class="card-meta">
              <span class="badge-category">{{ selectedArticle.category || 'POLITIK' }}</span>
              <span class="badge-status">{{ selectedArticle.status }}</span>
            </div>

            <h2 class="preview-title">{{ selectedArticle.title }}</h2>

            <div class="author-row">
              <span class="author-name">Von {{ selectedArticle.author || 'ORF.at Redaktion' }}</span>
              <span class="time-stamp">vor 5 Minuten</span>
            </div>

            <div class="summary-box">
              <strong>KI-Zusammenfassung (Teaser):</strong>
              <p>{{ selectedArticle.summary || selectedArticle.content }}</p>
            </div>

            <div class="full-text-box">
              <strong>Vollständiger Quelltext:</strong>
              <p>{{ selectedArticle.content }}</p>
            </div>

            <div class="preview-actions">
              <button 
                class="btn-toggle-pub" 
                @click="toggleStatus(selectedArticle.id)"
              >
                {{ selectedArticle.status === 'Veröffentlicht' ? 'In Entwurf umwandeln' : 'Sofort veröffentlichen' }}
              </button>
            </div>
          </div>

          <div v-else class="empty-preview">
            <p>Wähle einen Artikel aus der Tabelle links, um die Details anzuzeigen.</p>
          </div>
        </div>
      </div>
    </main>

    <!-- Article Creation & Summarization Modal -->
    <ArticleModal 
      :isOpen="showModal" 
      @close="showModal = false" 
      @submitted="onArticleSubmitted" 
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CmsAdminHeader from './components/CmsAdminHeader.vue';
import ArticleTable from './components/ArticleTable.vue';
import JobMonitorTable from './components/JobMonitorTable.vue';
import ArticleModal from './components/ArticleModal.vue';

const showModal = ref(false);
const toastMessage = ref('');
const selectedArticle = ref(null);

const articlesList = ref([
  { 
    id: '1', 
    title: 'Hitzeschutz: Regierung will Maßnahmen erleichtern', 
    category: 'Politik', 
    status: 'Veröffentlicht', 
    author: 'ORF.at / Redaktion', 
    summary: 'Die österreichische Bundesregierung plant umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden.',
    content: 'Die österreichische Bundesregierung beschließt umfassende Erleichterungen für Hitzeschutzmaßnahmen in Städten und Gemeinden. Unter anderem sollen Beschattungsanlagen und Fassadenbegrünungen vereinfacht genehmigt werden.'
  },
  { 
    id: '2', 
    title: 'KI täuschte Menschen mit Fake-Profilen', 
    category: 'Technologie', 
    status: 'Veröffentlicht', 
    author: 'ORF.at / Digital', 
    summary: 'Ein umstrittener Sicherheitstest mit künstlicher Intelligenz erzeugte getarnte Social-Media-Profile.',
    content: 'Ein umstrittener Sicherheitstest mit künstlicher Intelligenz sorgt weltweit für Empörung. Die KI erstellte autonom getarnte Social-Media-Profile.'
  },
  { 
    id: '3', 
    title: 'Dürre sorgt für hohe Einbußen bei Getreideernte', 
    category: 'Wirtschaft', 
    status: 'Veröffentlicht', 
    author: 'ORF.at / Wirtschaft', 
    summary: 'Anhaltende Trockenheit führt in mehreren Bundesländern zu spürbaren Ernteausfällen bei Getreide.',
    content: 'Anhaltende Trockenheit und Hitzewellen der vergangenen Wochen führen in mehreren Bundesländern zu spürbaren Ernteausfällen bei Getreide.'
  },
  { 
    id: '4', 
    title: '„Saint Francois“: Salzburg findet in den Himmel', 
    category: 'Kultur', 
    status: 'Entwurf', 
    author: 'ORF.at / Kultur', 
    summary: 'Bei den Salzburger Festspielen feierte die Neuinszenierung von Saint Francois große Erfolge.',
    content: 'Bei den Salzburger Festspielen feierte die Neuinszenierung von Saint Francois große Erfolge. Die Felsenreitschule bot die Kulisse für eine eindrucksvolle Aufführung.'
  },
]);

const jobsList = ref([]);

const publishedCount = computed(() => articlesList.value.filter(a => a.status === 'Veröffentlicht').length);

function onTabChange(tab) {
  toastMessage.value = `Navigation: ${tab}`;
  setTimeout(() => { toastMessage.value = ''; }, 2000);
}

function onArticleSelect(article) {
  selectedArticle.value = article;
}

function toggleStatus(id) {
  const item = articlesList.value.find(a => a.id === id);
  if (item) {
    item.status = item.status === 'Veröffentlicht' ? 'Entwurf' : 'Veröffentlicht';
    toastMessage.value = `Status von "${item.title}" geändert zu: ${item.status}`;
    setTimeout(() => { toastMessage.value = ''; }, 2500);
  }
}

function deleteArticle(id) {
  const index = articlesList.value.findIndex(a => a.id === id);
  if (index !== -1) {
    const deletedTitle = articlesList.value[index].title;
    articlesList.value.splice(index, 1);
    if (selectedArticle.value?.id === id) {
      selectedArticle.value = articlesList.value[0] || null;
    }
    toastMessage.value = `Artikel "${deletedTitle}" gelöscht.`;
    setTimeout(() => { toastMessage.value = ''; }, 2500);
  }
}

async function fetchJobs() {
  try {
    const res = await fetch('http://localhost:3005/api/jobs');
    if (res.ok) {
      const data = await res.json();
      jobsList.value = data.jobs || [];
    }
  } catch (err) {
    console.log('API mode active');
  }
}

function onArticleSubmitted(payload) {
  const newArticle = {
    id: String(Date.now()),
    title: payload.title,
    category: payload.category || 'Politik',
    status: 'Entwurf',
    author: payload.author || 'ORF.at Redaktion',
    summary: payload.summary || (payload.content.substring(0, 150) + '...'),
    content: payload.content,
  };

  articlesList.value.unshift(newArticle);
  selectedArticle.value = newArticle;

  toastMessage.value = `"${payload.title}" zusammengefasst & in Warteschlange eingereiht!`;
  setTimeout(() => { toastMessage.value = ''; }, 4000);

  setTimeout(fetchJobs, 600);
}

onMounted(() => {
  selectedArticle.value = articlesList.value[0];
  fetchJobs();
  setInterval(fetchJobs, 3000);
});
</script>

<style scoped>
.admin-app-fullpage {
  min-height: 100vh;
  background-color: #f8fafc;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 24px 32px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

.metrics-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.metric-value { font-size: 20px; font-weight: 800; color: #0f172a; }
.metric-label { font-size: 12px; color: #64748b; font-weight: 500; }

.dashboard-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  align-items: start;
}

.right-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  position: sticky;
  top: 24px;
}

.panel-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f1f5f9;
}

.panel-header h3 { font-size: 16px; font-weight: 700; color: #0f172a; }

.preview-badge {
  background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px;
}

.preview-detail-card { display: flex; flex-direction: column; gap: 14px; }

.card-meta { display: flex; justify-content: space-between; align-items: center; }

.badge-category {
  background: #10b981; color: #000000; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
}

.badge-status {
  background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 12px;
}

.preview-title { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.3; }

.author-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }

.summary-box, .full-text-box {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 13px; color: #334155; line-height: 1.45;
}

.summary-box strong, .full-text-box strong { display: block; color: #0f172a; margin-bottom: 4px; font-size: 12px; }

.btn-toggle-pub {
  width: 100%; background: #0f172a; color: #ffffff; border: none; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: background 0.15s ease;
}

.btn-toggle-pub:hover { background: #10b981; color: #000000; }

.toast-notification {
  position: fixed; bottom: 24px; right: 24px; background: #09090b; color: #ffffff; padding: 14px 20px;
  border-radius: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
  border: 1px solid #10b981; z-index: 300;
}

.toast-title { font-size: 13px; color: #10b981; display: block; }
.toast-body { font-size: 12px; color: #a1a1aa; margin-top: 2px; }
</style>
