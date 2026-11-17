<template>
  <div class="mx-auto max-w-[1320px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="m-0 font-accent text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">Jobs</h1>
        <p class="m-0 mt-1.5 font-mono text-[12px] tabular-nums text-text-muted">
          {{ filteredJobs.length }} Einträge · Hintergrundverarbeitung (Teaser, Tags, Bilder)
        </p>
      </div>

      <div class="flex items-center gap-2.5">
        <select
          v-model="statusFilter"
          class="rounded-[8px] border border-border-subtle bg-bg-card px-3.5 py-2 text-[13px] text-text-primary outline-none focus:border-border-focus"
        >
          <option value="">Alle Status</option>
          <option value="pending">Wartend</option>
          <option value="processing">In Arbeit</option>
          <option value="completed">Fertig</option>
          <option value="failed">Fehlgeschlagen</option>
        </select>
        <Spinner v-if="isLoading" />
        <button
          class="cursor-pointer rounded-[8px] border border-border-subtle bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-card-subtle"
          @click="fetchJobs"
        >
          Aktualisieren
        </button>
      </div>
    </div>

    <div class="rounded-[14px] border border-border-subtle bg-bg-card p-5 md:p-6">
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b border-border-subtle">
              <th class="w-[70px] py-2.5 pl-2 pr-3 text-left text-[12px] font-medium text-text-muted">ID</th>
              <th class="w-[150px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Typ</th>
              <th class="py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Artikel</th>
              <th class="w-[140px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Status</th>
              <th class="w-[100px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Dauer</th>
              <th class="w-[155px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Datum</th>
              <th class="w-[165px] py-2.5 pl-3 pr-2 text-right text-[12px] font-medium text-text-muted"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-subtle">
            <tr v-if="filteredJobs.length === 0">
              <td colspan="7" class="py-12 text-center text-[13px] text-text-muted">Keine Jobs</td>
            </tr>
            <tr v-for="job in filteredJobs" :key="job.id" class="transition-colors duration-150 hover:bg-bg-main/70">
              <td class="py-3.5 pl-2 pr-3 align-middle font-mono text-[13px] tabular-nums text-[#5c7a14]">#{{ job.id }}</td>
              <td class="py-3.5 px-3 align-middle">
                <span class="rounded-[6px] border border-border-subtle bg-bg-main px-2 py-0.5 font-mono text-[12px] text-text-secondary">{{ job.type }}</span>
              </td>
              <td class="py-3.5 px-3 align-middle">
                <NuxtLink
                  :to="`/?article=${job.articleId}`"
                  class="block max-w-[340px] truncate text-[13.5px] font-medium text-text-primary underline decoration-black/20 underline-offset-2 hover:decoration-black/60"
                  :title="articleTitles.get(job.articleId)"
                >
                  {{ articleTitles.get(job.articleId) || `Artikel #${job.articleId}` }}
                </NuxtLink>
                <span v-if="job.result || job.error" class="mt-0.5 block max-w-[340px] truncate text-[12px]" :class="job.error ? 'text-[#b93829]' : 'text-text-muted'" :title="job.error || job.result || ''">{{ job.error || job.result }}</span>
              </td>
              <td class="py-3.5 px-3 align-middle">
                <span
                  class="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[12px] font-medium"
                  :class="statusBadgeClasses[job.status]"
                >
                  <span class="h-[6px] w-[6px] rounded-full" :class="statusDotClasses[job.status]"></span>
                  <span>{{ statusLabels[job.status] }}</span>
                </span>
              </td>
              <td class="py-3.5 px-3 align-middle font-mono text-[13px] tabular-nums text-text-primary">
                {{ job.processingTimeMs ? (job.processingTimeMs / 1000).toFixed(2) + 's' : '-' }}
              </td>
              <td class="py-3.5 px-3 align-middle font-mono text-[12px] tabular-nums text-text-muted">
                {{ new Date(job.createdAt).toLocaleString('de-AT', { dateStyle: 'short', timeStyle: 'short' }) }}
              </td>
              <td class="py-3.5 pl-3 pr-2 text-right align-middle">
                <div class="flex justify-end gap-1.5">
                  <button
                    v-if="job.status === 'failed'"
                    class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary"
                    @click="retryJob(job.id)"
                  >
                    Neu starten
                  </button>
                  <button
                    class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-[#b93829] transition-colors duration-150 hover:bg-[#b93829]/10"
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
  pending: 'bg-[#b46a10]/12 text-[#8f5209]',
  processing: 'bg-[#dbe8a6]/45 text-[#3d520c]',
  completed: 'bg-[#1f7a4c]/12 text-[#1f7a4c]',
  failed: 'bg-[#b93829]/12 text-[#b93829]'
};

const statusDotClasses: Record<JobStatus, string> = {
  pending: 'bg-[#b46a10]',
  processing: 'bg-[#5c7a14]',
  completed: 'bg-[#1f7a4c]',
  failed: 'bg-[#b93829]'
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
