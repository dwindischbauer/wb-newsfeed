<template>
  <div class="mx-auto max-w-[1440px] px-4 pb-12 pt-6 md:px-8">
    <div class="rounded-xl border border-border-subtle bg-bg-card p-6">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 class="m-0 text-xl font-bold text-accent-ink">Jobs</h2>
        <div class="flex items-center gap-[0.85rem]">
          <select
            v-model="statusFilter"
            class="rounded-lg border border-border-subtle bg-black/[0.04] px-[0.85rem] py-2 text-[0.82rem] text-accent-ink outline-none focus:border-border-focus"
          >
            <option value="">Alle Status</option>
            <option value="pending">Wartend</option>
            <option value="processing">In Arbeit</option>
            <option value="completed">Fertig</option>
            <option value="failed">Fehlgeschlagen</option>
          </select>
          <Spinner v-if="isLoading" />
          <button
            class="rounded-lg border border-border-subtle bg-white px-4 py-2 text-[0.82rem] font-semibold text-accent-ink hover:bg-black/[0.04]"
            @click="fetchJobs"
          >
            Aktualisieren
          </button>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full border-separate [border-spacing:0_4px]">
          <thead>
            <tr>
              <th class="w-[70px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">ID</th>
              <th class="w-[150px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">Typ</th>
              <th class="border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">Artikel</th>
              <th class="w-[140px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">Status</th>
              <th class="w-[100px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">Dauer</th>
              <th class="w-[160px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted">Datum</th>
              <th class="w-[160px] border-b border-border-subtle px-4 py-3 text-right text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-muted"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredJobs.length === 0">
              <td colspan="7" class="!py-12 bg-black/[0.02] text-center text-text-muted">Keine Jobs.</td>
            </tr>
            <tr v-for="job in filteredJobs" :key="job.id" class="group">
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle font-mono text-[0.8rem] text-[#5c7a14] group-hover:bg-black/[0.04]">#{{ job.id }}</td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle group-hover:bg-black/[0.04]">
                <span class="rounded-md bg-black/5 px-[0.55rem] py-[0.2rem] text-[0.74rem] font-semibold text-[#3f4046]">{{ job.type }}</span>
              </td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle group-hover:bg-black/[0.04]">
                <NuxtLink
                  :to="`/?article=${job.articleId}`"
                  class="block max-w-[340px] truncate text-[0.8rem] font-medium text-accent-ink underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  :title="articleTitles.get(job.articleId)"
                >
                  {{ articleTitles.get(job.articleId) || `Artikel #${job.articleId}` }}
                </NuxtLink>
                <span v-if="job.result || job.error" class="mt-[2px] block max-w-[340px] truncate text-[0.72rem]" :class="job.error ? 'text-[#c0392b]' : 'text-text-muted'" :title="job.error || job.result || ''">{{ job.error || job.result }}</span>
              </td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle group-hover:bg-black/[0.04]">
                <span
                  class="inline-flex items-center gap-[0.35rem] rounded-full px-[0.65rem] py-[0.25rem] text-[0.72rem] font-semibold"
                  :class="statusBadgeClasses[job.status]"
                >
                  <span class="h-[6px] w-[6px] rounded-full" :class="statusDotClasses[job.status]"></span>
                  <span>{{ statusLabels[job.status] }}</span>
                </span>
              </td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle font-mono text-[0.8rem] text-[#5c7a14] group-hover:bg-black/[0.04]">
                {{ job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : '-' }}
              </td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] align-middle text-[0.76rem] text-text-muted group-hover:bg-black/[0.04]">
                {{ new Date(job.createdAt).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) }}
              </td>
              <td class="bg-black/[0.02] px-4 py-[0.85rem] text-right align-middle group-hover:bg-black/[0.04]">
                <div class="flex justify-end gap-[0.4rem]">
                  <button
                    v-if="job.status === 'failed'"
                    class="rounded-md border border-border-subtle bg-black/[0.04] px-[0.6rem] py-[0.25rem] text-[0.72rem] font-medium text-text-secondary transition-all duration-200 hover:bg-black/[0.08] hover:text-accent-ink"
                    @click="retryJob(job.id)"
                  >
                    Neu starten
                  </button>
                  <button
                    class="rounded-md border border-border-subtle bg-black/[0.04] px-[0.6rem] py-[0.25rem] text-[0.72rem] font-medium text-[#f87171] transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]"
                    @click="deleteJob(job.id)"
                  >
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

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface Job {
  id: number;
  type: string;
  articleId: number;
  status: JobStatus;
  processingTimeMs: number | null;
  result: string | null;
  error: string | null;
  createdAt: string;
}

const config = useRuntimeConfig();
const jobs = ref<Job[]>([]);
const isLoading = ref(false);
const statusFilter = ref<JobStatus | ''>('');

const statusLabels: Record<JobStatus, string> = {
  pending: 'Wartend',
  processing: 'In Arbeit',
  completed: 'Fertig',
  failed: 'Fehlgeschlagen'
};

const statusBadgeClasses: Record<JobStatus, string> = {
  pending: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24]',
  processing: 'bg-[rgba(111,143,26,0.15)] text-[#5c7a14]',
  completed: 'bg-[rgba(16,185,129,0.15)] text-[#34d399]',
  failed: 'bg-[rgba(239,68,68,0.15)] text-[#f87171]'
};

const statusDotClasses: Record<JobStatus, string> = {
  pending: 'bg-[#fbbf24]',
  processing: 'bg-[#5c7a14]',
  completed: 'bg-[#34d399]',
  failed: 'bg-[#f87171]'
};

const filteredJobs = computed(() => {
  if (!statusFilter.value) return jobs.value;
  return jobs.value.filter((j) => j.status === statusFilter.value);
});

// Titel fuer die Links in der Artikel-Spalte
const articleTitles = ref(new Map<number, string>());
const fetchArticleTitles = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles`);
    if (res.ok) {
      const list: Array<{ id: number; title: string }> = await res.json();
      articleTitles.value = new Map(list.map((a) => [a.id, a.title]));
    }
  } catch (e) {
    console.error(e);
  }
};

const fetchJobs = async () => {
  isLoading.value = true;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs`);
    jobs.value = await res.json();
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
  fetchArticleTitles();
  fetchJobs();
  intervalId = setInterval(fetchJobs, 5000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
