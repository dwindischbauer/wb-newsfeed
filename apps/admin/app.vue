<template>
  <div class="admin-app">
    <!-- Outer Browser Container -->
    <div class="browser-frame">
      <div class="browser-header">
        <div class="browser-dots">
          <div class="dot dot-red"></div>
          <div class="dot dot-yellow"></div>
          <div class="dot dot-green"></div>
        </div>
        <div class="browser-url">https://app.wbpublisher.io/dashboard</div>
      </div>

      <!-- CMS Top Header Navigation -->
      <CmsAdminHeader @change-tab="onTabChange" />

      <!-- Floating Toast Notification -->
      <transition name="toast">
        <div v-if="toastMessage" class="toast-notification">
          <span class="toast-icon">⚡</span>
          <div>
            <strong class="toast-title">In Warteschlange eingereiht</strong>
            <p class="toast-body">{{ toastMessage }}</p>
          </div>
        </div>
      </transition>

      <!-- Main Layout Grid: CMS Table Left + Mobile Screen Preview Right -->
      <div class="dashboard-grid">
        <!-- Left Side: Interactive CMS Article Table + Job Monitor -->
        <div class="col-cms">
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

        <!-- Right Side: Embedded Live Mobile Phone Preview Container -->
        <div class="col-preview">
          <MobileFeedPreview 
            :selectedArticle="selectedArticle" 
            @next-article="selectNextArticle"
          />
        </div>
      </div>
    </div>

    <!-- Article Creation & Summarization Modal -->
    <ArticleModal 
      :isOpen="showModal" 
      @close="showModal = false" 
      @submitted="onArticleSubmitted" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CmsAdminHeader from './components/CmsAdminHeader.vue';
import ArticleTable from './components/ArticleTable.vue';
import JobMonitorTable from './components/JobMonitorTable.vue';
import MobileFeedPreview from './components/MobileFeedPreview.vue';
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

function onTabChange(tab) {
  toastMessage.value = `Registerkarte gewechselt: ${tab}`;
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

function selectNextArticle() {
  if (articlesList.value.length === 0) return;
  const currentIndex = articlesList.value.findIndex(a => a.id === selectedArticle.value?.id);
  const nextIndex = (currentIndex + 1) % articlesList.value.length;
  selectedArticle.value = articlesList.value[nextIndex];
}

async function fetchJobs() {
  try {
    const res = await fetch('http://localhost:3005/api/jobs');
    if (res.ok) {
      const data = await res.json();
      jobsList.value = data.jobs || [];
    }
  } catch (err) {
    console.log('API offline mode');
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

  // 1. Immediately insert at top of CMS table
  articlesList.value.unshift(newArticle);

  // 2. Immediately set as selected preview on mobile screen!
  selectedArticle.value = newArticle;

  // 3. Display Toast Notification
  toastMessage.value = `"${payload.title}" zusammengefasst & in Warteschlange eingereiht!`;
  setTimeout(() => {
    toastMessage.value = '';
  }, 4000);

  setTimeout(fetchJobs, 600);
}

onMounted(() => {
  selectedArticle.value = articlesList.value[0];
  fetchJobs();
  setInterval(fetchJobs, 3000);
});
</script>

<style scoped>
.admin-app {
  min-height: 100vh;
  padding: 24px;
  background-color: #cbd5e1;
  display: flex;
  justify-content: center;
}

.browser-frame {
  width: 100%;
  max-width: 1360px;
  background: #f8fafc;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
}

.browser-header {
  background-color: #1e293b;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.browser-dots { display: flex; gap: 6px; }
.dot { width: 10px; height: 10px; border-radius: 50%; }
.dot-red { background-color: #ff5f56; }
.dot-yellow { background-color: #ffbd2e; }
.dot-green { background-color: #27c93f; }

.browser-url {
  background: #334155; color: #94a3b8; font-size: 11px; padding: 4px 12px; border-radius: 6px; flex: 1; max-width: 340px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 24px;
  padding: 24px;
  align-items: start;
}

.toast-notification {
  position: fixed; bottom: 24px; right: 24px; background: #09090b; color: #ffffff; padding: 14px 20px;
  border-radius: 12px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4);
  border: 1px solid #10b981; z-index: 300;
}

.toast-icon { font-size: 20px; }
.toast-title { font-size: 13px; color: #10b981; display: block; }
.toast-body { font-size: 12px; color: #a1a1aa; margin-top: 2px; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(20px); }
</style>
