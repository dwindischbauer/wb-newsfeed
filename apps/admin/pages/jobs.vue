<template>
  <div class="jobs-page">
    <div class="header">
      <h2>Job Queue</h2>
      <button @click="fetchJobs" class="refresh-btn">Aktualisieren</button>
    </div>
    
    <table class="jobs-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Typ</th>
          <th>Artikel-ID</th>
          <th>Status</th>
          <th>Datum</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in jobs" :key="job.id">
          <td>{{ job.id }}</td>
          <td>{{ job.type }}</td>
          <td>{{ job.articleId }}</td>
          <td>
            <span :class="['status-badge', job.status]">{{ job.status }}</span>
          </td>
          <td>{{ new Date(job.createdAt).toLocaleString() }}</td>
        </tr>
        <tr v-if="jobs.length === 0">
          <td colspan="5" class="empty">Keine Jobs in der Warteschlange.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const config = useRuntimeConfig();
const jobs = ref([]);

const fetchJobs = async () => {
  try {
    const res = await fetch(`${config.public.apiUrl}/api/jobs`);
    const data = await res.json();
    jobs.value = data;
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchJobs();
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
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: bold;
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
