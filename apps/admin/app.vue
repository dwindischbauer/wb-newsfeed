<template>
  <div class="admin-app-fullpage">
    <!-- Top Full-Width Navigation Header -->
    <CmsAdminHeader 
      :activeTab="activeTab" 
      @change-tab="onTabChange" 
    />

    <!-- Floating Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" class="toast-notification">
        <div>
          <strong class="toast-title">System-Benachrichtigung</strong>
          <p class="toast-body">{{ toastMessage }}</p>
        </div>
      </div>
    </transition>

    <!-- Main Dynamic Content Container -->
    <main class="main-content">
      <!-- 1. DASHBOARD TAB VIEW -->
      <div v-if="activeTab === 'Dashboard'" class="tab-view-container">
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
              @preview-article="openPreviewModal"
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
                <span :class="['badge-status', selectedArticle.status === 'Veröffentlicht' ? 'pub' : 'draft']">
                  {{ selectedArticle.status }}
                </span>
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
                  :class="['btn-toggle-pub', selectedArticle.status === 'Veröffentlicht' ? 'btn-unpub' : 'btn-pub']" 
                  @click="toggleStatus(selectedArticle.id)"
                >
                  {{ selectedArticle.status === 'Veröffentlicht' ? 'In Entwurf umwandeln (Inaktiv setzen)' : 'Sofort veröffentlichen' }}
                </button>
                
                <button class="btn-popup-preview" @click="showPreviewModal = true">
                  Mobil-Vorschau Popup öffnen
                </button>
              </div>
            </div>

            <div v-else class="empty-preview">
              <p>Wähle einen Artikel aus der Tabelle links, um die Details anzuzeigen.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. ARTIKEL TAB VIEW -->
      <div v-else-if="activeTab === 'Artikel'" class="tab-view-container">
        <ArticleTable 
          :articles="articlesList" 
          :activeSelectedId="selectedArticle?.id"
          @open-create="showModal = true" 
          @select-article="onArticleSelect" 
          @preview-article="openPreviewModal"
          @toggle-status="toggleStatus"
          @delete-article="deleteArticle"
        />
      </div>

      <!-- 3. EINSTELLUNGEN TAB VIEW -->
      <div v-else-if="activeTab === 'Einstellungen'" class="tab-view-container">
        <SettingsManager @saved="onSettingsSaved" />
      </div>
    </main>

    <!-- Article Creation & Summarization Modal -->
    <ArticleModal 
      :isOpen="showModal" 
      @close="showModal = false" 
      @submitted="onArticleSubmitted" 
    />

    <!-- Interactive Mobile Preview Modal -->
    <PreviewModal 
      :isOpen="showPreviewModal" 
      :article="selectedArticle" 
      @close="showPreviewModal = false"
      @toggle-status="toggleStatus"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import CmsAdminHeader from './components/CmsAdminHeader.vue';
import ArticleTable from './components/ArticleTable.vue';
import JobMonitorTable from './components/JobMonitorTable.vue';
import SettingsManager from './components/SettingsManager.vue';
import ArticleModal from './components/ArticleModal.vue';
import PreviewModal from './components/PreviewModal.vue';

const activeTab = ref('Dashboard');
const showModal = ref(false);
const showPreviewModal = ref(false);
const toastMessage = ref('');
const selectedArticle = ref(null);

const articlesList = ref([]);
const jobsList = ref([]);

const publishedCount = computed(() => articlesList.value.filter(a => a.status === 'Veröffentlicht').length);

function onTabChange(tab) {
  activeTab.value = tab;
  toastMessage.value = `Ansicht gewechselt: ${tab}`;
  setTimeout(() => { toastMessage.value = ''; }, 2000);
}

function onSettingsSaved(msg) {
  toastMessage.value = msg;
  setTimeout(() => { toastMessage.value = ''; }, 2500);
}

function onArticleSelect(article) {
  selectedArticle.value = article;
}

function openPreviewModal(article) {
  selectedArticle.value = article;
  showPreviewModal.value = true;
  toastMessage.value = `Mobil-Vorschau geöffnet für: "${article.title}"`;
  setTimeout(() => { toastMessage.value = ''; }, 3000);
}

async function toggleStatus(id) {
  const item = articlesList.value.find(a => a.id === id);
  if (!item) return;

  const newStatus = item.status === 'Veröffentlicht' ? 'Entwurf' : 'Veröffentlicht';
  item.status = newStatus;

  toastMessage.value = `Status von "${item.title}" geändert zu: ${newStatus}`;
  setTimeout(() => { toastMessage.value = ''; }, 2500);

  try {
    const res = await fetch(`http://localhost:3005/api/articles/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      console.log(`Successfully updated status of ${id} to ${newStatus} in Postgres DB`);
    }
  } catch (err) {
    console.error('Failed to patch status:', err);
  }
}

async function deleteArticle(id) {
  const index = articlesList.value.findIndex(a => a.id === id);
  if (index !== -1) {
    const deletedTitle = articlesList.value[index].title;
    articlesList.value.splice(index, 1);
    if (selectedArticle.value?.id === id) {
      selectedArticle.value = articlesList.value[0] || null;
    }
    toastMessage.value = `Artikel "${deletedTitle}" gelöscht.`;
    setTimeout(() => { toastMessage.value = ''; }, 2500);

    try {
      await fetch(`http://localhost:3005/api/articles/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  }
}

async function fetchArticlesFromApi() {
  try {
    const res = await fetch('http://localhost:3005/api/articles');
    if (res.ok) {
      const data = await res.json();
      if (data.articles) {
        articlesList.value = data.articles.map(a => ({
          id: a.id,
          title: a.title,
          category: 'Politik',
          status: a.status || 'Veröffentlicht',
          author: a.author || 'ORF.at Redaktion',
          summary: a.title,
          content: a.content || a.title
        }));
        if (!selectedArticle.value && articlesList.value.length > 0) {
          selectedArticle.value = articlesList.value[0];
        }
      }
    }
  } catch (err) {
    console.log('API error fetching articles');
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
  toastMessage.value = `"${payload.title}" zusammengefasst & in Warteschlange eingereiht!`;
  setTimeout(() => { toastMessage.value = ''; }, 4000);

  setTimeout(() => {
    fetchArticlesFromApi();
    fetchJobs();
  }, 800);
}

onMounted(() => {
  fetchArticlesFromApi();
  fetchJobs();
  setInterval(fetchArticlesFromApi, 2500);
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

.tab-view-container {
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
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 12px;
}

.badge-status.pub { background: #dcfce7; color: #15803d; }
.badge-status.draft { background: #f1f5f9; color: #64748b; }

.preview-title { font-size: 18px; font-weight: 800; color: #0f172a; line-height: 1.3; }

.author-row { display: flex; justify-content: space-between; font-size: 12px; color: #64748b; }

.summary-box, .full-text-box {
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 13px; color: #334155; line-height: 1.45;
}

.summary-box strong, .full-text-box strong { display: block; color: #0f172a; margin-bottom: 4px; font-size: 12px; }

.preview-actions { display: flex; flex-direction: column; gap: 8px; }

.btn-toggle-pub {
  width: 100%; border: none; padding: 12px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s ease;
}

.btn-pub { background: #10b981; color: #000000; }
.btn-pub:hover { background: #059669; }

.btn-unpub { background: #0f172a; color: #ffffff; }
.btn-unpub:hover { background: #dc2626; }

.btn-popup-preview {
  width: 100%; background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer;
}

.btn-popup-preview:hover { background: #e0f2fe; }

.toast-notification {
  position: fixed; bottom: 24px; right: 24px; background: #09090b; color: #ffffff; padding: 14px 20px;
  border-radius: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
  border: 1px solid #10b981; z-index: 500;
}

.toast-title { font-size: 13px; color: #10b981; display: block; }
.toast-body { font-size: 12px; color: #a1a1aa; margin-top: 2px; }
</style>
