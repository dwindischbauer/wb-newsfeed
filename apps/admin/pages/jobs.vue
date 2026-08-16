<template>
  <div class="jobs-page">
    <div class="header">
      <h2>Job Queue</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <select v-model="statusFilter" class="filter-select">
          <option value="">Alle Jobs</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <Spinner v-if="isLoading" />
        <button @click="fetchJobs" class="refresh-btn">Aktualisieren</button>
      </div>
    </div>
    
    <table class="jobs-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Typ</th>
          <th>Artikel-ID</th>
          <th>Status</th>
          <th>Dauer</th>
          <th>Datum</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredJobs.length === 0">
          <td colspan="7" class="empty-state">Keine Jobs gefunden.</td>
        </tr>
        <tr v-for="job in filteredJobs" :key="job.id">
          <td>{{ job.id }}</td>
          <td>{{ job.type }}</td>
          <td>{{ job.articleId }}</td>
          <td>
            <span :class="['status-badge', 'status-' + job.status]">
              {{ job.status }}
            </span>
          </td>
          <td>
            {{ job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : '-' }}
          </td>
          <td>{{ new Date(job.createdAt).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) }}</td>
          <td>
            <button v-if="job.status === 'failed'" @click="retryJob(job.id)" class="action-btn">Neu starten</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
    const res = await fetch(`${config.public.apiUrl}/api/jobs`);
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
    const res = await fetch(`${config.public.apiUrl}/api/jobs/${jobId}/retry`, {
      method: 'POST'
    });
    if (res.ok) {
      fetchJobs();
    }
  } catch (e) {
    console.error('Failed to retry job', e);
  }
};

let intervalId;
onMounted(() => {
  fetchJobs();
  intervalId = setInterval(fetchJobs, 5000);
});
</script>

<style scoped>
.jobs-page {
  padding: 2rem;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.refresh-btn {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
}
.jobs-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.jobs-table th, .jobs-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.status-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.status-badge.pending { background: #fef08a; color: #854d0e; }
.status-badge.processing { background: #bfdbfe; color: #1e40af; }
.status-badge.completed { background: #bbf7d0; color: #166534; }
.status-badge.failed { background: #fecaca; color: #991b1b; }
.empty {
  text-align: center;
  color: #666;
  padding: 2rem;
}
</style>
