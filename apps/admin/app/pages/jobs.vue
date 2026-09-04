<template>
  <div class="jobs-page">
    <div class="carbon-card jobs-card">
      <div class="header">
        <div>
          <h2 class="page-title">KI Job Queue</h2>
          <p class="page-subtitle">BullMQ Worker & Async Pipeline Monitoring</p>
        </div>
        <div class="header-actions">
          <select v-model="statusFilter" class="carbon-select">
            <option value="">Alle Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <Spinner v-if="isLoading" />
          <button @click="fetchJobs" class="carbon-btn-primary">
            <span>⟳</span>
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>
      
      <div class="table-responsive">
        <table class="carbon-table">
          <thead>
            <tr>
              <th style="width: 70px;">ID</th>
              <th>Typ</th>
              <th style="width: 110px;">Artikel-ID</th>
              <th style="width: 140px;">Status</th>
              <th style="width: 100px;">Dauer</th>
              <th style="width: 160px;">Datum</th>
              <th style="width: 160px; text-align: right;">Aktion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredJobs.length === 0">
              <td colspan="7" class="empty-state">Keine Jobs in der Warteschlange gefunden.</td>
            </tr>
            <tr v-for="job in filteredJobs" :key="job.id">
              <td class="font-mono">#{{ job.id }}</td>
              <td>
                <span class="job-type-pill">{{ job.type }}</span>
              </td>
              <td>
                <span class="article-id-pill">Artikel #{{ job.articleId }}</span>
              </td>
              <td>
                <span :class="['status-badge', 'status-' + job.status]">
                  <span class="badge-dot"></span>
                  <span>{{ job.status }}</span>
                </span>
              </td>
              <td class="font-mono">
                {{ job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : '-' }}
              </td>
              <td class="text-muted">
                {{ new Date(job.createdAt).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) }}
              </td>
              <td style="text-align: right;">
                <div class="action-btn-row">
                  <button v-if="job.status === 'failed'" @click="retryJob(job.id)" class="carbon-action-btn">
                    Neu starten
                  </button>
                  <button @click="deleteJob(job.id)" class="carbon-action-btn danger">
                    Löschen
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import Spinner from '../components/Spinner.vue';

const config = useRuntimeConfig();
const jobs = ref([]);
const isLoading = ref(false);
const statusFilter = ref('');

const filteredJobs = computed(() => {
  if (!statusFilter.value) return jobs.value;
  return jobs.value.filter(j => j.status === statusFilter.value);
});

const fetchJobs = async () => {
  isLoading.value = true;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs`);
    const data = await res.json();
    jobs.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const retryJob = async (jobId) => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs/${jobId}/retry`, {
      method: 'POST'
    });
    if (res.ok) {
      fetchJobs();
    }
  } catch (e) {
    console.error('Failed to retry job', e);
  }
};

const deleteJob = async (jobId) => {
  if (!confirm('Diesen Job wirklich löschen?')) return;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs/${jobId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      fetchJobs();
    }
  } catch (e) {
    console.error('Failed to delete job', e);
  }
};

let intervalId = null;

onMounted(() => {
  fetchJobs();
  intervalId = setInterval(fetchJobs, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<style scoped>
.jobs-page {
  padding: 1.5rem 2rem 3rem;
  max-width: 1440px;
  margin: 0 auto;
}

.jobs-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(20, 20, 20, 0.08);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #14151a;
}

.page-subtitle {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.carbon-select {
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.04);
  color: #14151a;
  font-size: 0.82rem;
  outline: none;
}

.carbon-select:focus {
  border-color: var(--border-focus);
}

.carbon-btn-primary {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: #14151a;
  border: none;
  color: #d5f24e;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(20, 20, 20, 0.2);
  transition: all 0.2s;
}

.carbon-btn-primary:hover {
  opacity: 0.92;
  box-shadow: 0 6px 18px rgba(20, 20, 20, 0.28);
}

.table-responsive {
  overflow-x: auto;
}

.carbon-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
}

.carbon-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.carbon-table td {
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  color: #24252a;
  background: rgba(20, 20, 20, 0.02);
  vertical-align: middle;
}

.carbon-table tbody tr:hover td {
  background: rgba(20, 20, 20, 0.04);
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.8rem;
  color: #5c7a14;
}

.job-type-pill {
  font-size: 0.74rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(20, 20, 20, 0.05);
  color: #3f4046;
}

.article-id-pill {
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}
.status-badge.pending .badge-dot { background: #fbbf24; }

.status-badge.processing {
  background: rgba(111, 143, 26, 0.15);
  color: #5c7a14;
}
.status-badge.processing .badge-dot { background: #5c7a14; }

.status-badge.completed {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}
.status-badge.completed .badge-dot { background: #34d399; }

.status-badge.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
}
.status-badge.failed .badge-dot { background: #f87171; }

.empty-state {
  text-align: center;
  color: var(--text-muted);
  padding: 3rem 1rem !important;
}

.action-btn-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

.carbon-action-btn {
  background: rgba(20, 20, 20, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}

.carbon-action-btn:hover {
  background: rgba(20, 20, 20, 0.08);
  color: #14151a;
}

.carbon-action-btn.danger {
  color: #f87171;
}

.carbon-action-btn.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.text-muted {
  color: var(--text-muted);
  font-size: 0.76rem;
}
</style>
