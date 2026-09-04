<template>
  <div class="px-8 pt-6 pb-12 max-w-[1440px] mx-auto">
    <div class="bg-bg-card border border-border-subtle rounded-[22px] p-6 shadow-[0_4px_20px_rgba(20,20,20,0.08)]">
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h2 class="m-0 text-xl font-extrabold text-text-primary">KI Job Queue</h2>
          <p class="m-0 mt-[0.2rem] text-[0.78rem] text-text-muted">BullMQ Worker & Async Pipeline Monitoring</p>
        </div>
        <div class="flex items-center gap-[0.85rem]">
          <select v-model="statusFilter" class="px-[0.85rem] py-2 border border-border-subtle rounded-lg bg-[rgba(20,20,20,0.04)] text-text-primary text-[0.82rem] outline-none focus:border-border-focus">
            <option value="">Alle Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <Spinner v-if="isLoading" />
          <button @click="fetchJobs" class="flex items-center gap-[0.4rem] px-4 py-2 rounded-full bg-accent-ink border-none text-accent-lime text-[0.82rem] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_6px_18px_rgba(20,20,20,0.28)]">
            <span>⟳</span>
            <span>Aktualisieren</span>
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-separate [border-spacing:0_4px]">
          <thead>
            <tr>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[70px]">ID</th>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle">Typ</th>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[110px]">Artikel-ID</th>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[140px]">Status</th>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[100px]">Dauer</th>
              <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[160px]">Datum</th>
              <th class="text-right px-4 py-3 text-[0.72rem] font-semibold text-text-muted uppercase tracking-[0.04em] border-b border-border-subtle w-[160px]">Aktion</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredJobs.length === 0">
              <td colspan="7" class="text-center text-text-muted py-12 px-4">Keine Jobs in der Warteschlange gefunden.</td>
            </tr>
            <tr v-for="job in filteredJobs" :key="job.id" class="group">
              <td class="px-4 py-[0.85rem] text-[0.82rem] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle font-mono text-[0.8rem] text-[#5c7a14]">#{{ job.id }}</td>
              <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle">
                <span class="text-[0.74rem] font-semibold px-[0.55rem] py-[0.2rem] rounded-md bg-[rgba(20,20,20,0.05)] text-[#3f4046]">{{ job.type }}</span>
              </td>
              <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle">
                <span class="text-[0.72rem] text-text-secondary">Artikel #{{ job.articleId }}</span>
              </td>
              <td class="px-4 py-[0.85rem] text-[0.82rem] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle">
                <span class="inline-flex items-center gap-[0.35rem] px-[0.65rem] py-1 rounded-full text-[0.72rem] font-bold uppercase tracking-[0.04em]">
                  <span class="w-[6px] h-[6px] rounded-full"></span>
                  <span>{{ job.status }}</span>
                </span>
              </td>
              <td class="px-4 py-[0.85rem] text-[0.82rem] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle font-mono text-[0.8rem] text-[#5c7a14]">
                {{ job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : '-' }}
              </td>
              <td class="px-4 py-[0.85rem] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle text-text-muted text-[0.76rem]">
                {{ job.createdAt ? new Date(job.createdAt).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) : '-' }}
              </td>
              <td class="px-4 py-[0.85rem] text-[0.82rem] bg-[rgba(20,20,20,0.02)] group-hover:bg-[rgba(20,20,20,0.04)] align-middle text-right">
                <div class="flex justify-end gap-[0.4rem]">
                  <button v-if="job.status === 'failed'" @click="retryJob(job.id)" class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-text-secondary text-[0.72rem] font-medium px-[0.6rem] py-1 cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-text-primary">
                    Neu starten
                  </button>
                  <button @click="deleteJob(job.id)" class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-[#f87171] text-[0.72rem] font-medium px-[0.6rem] py-1 cursor-pointer transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]">
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

<script setup lang="ts">
import { ref, onMounted, computed, onUnmounted } from 'vue';
import Spinner from '../components/Spinner.vue';

interface Job {
  id: number;
  jobId?: number;
  articleId?: number | null;
  type: string;
  status?: string | null;
  result?: string | null;
  error?: string | null;
  processingTimeMs?: number | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

const config = useRuntimeConfig();
const jobs = ref<Job[]>([]);
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
    const data: Job[] = await res.json();
    jobs.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    isLoading.value = false;
  }
};

const retryJob = async (jobId: number) => {
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

const deleteJob = async (jobId: number) => {
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

let intervalId: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  fetchJobs();
  intervalId = setInterval(fetchJobs, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
