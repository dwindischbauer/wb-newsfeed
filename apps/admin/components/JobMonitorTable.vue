<template>
  <div class="job-monitor">
    <div class="monitor-header">
      <div>
        <h3 class="title">BullMQ Generierungs-Jobs</h3>
        <p class="subtitle">Echtzeit-Überwachung der KI-Teaser Generierung</p>
      </div>
      <button class="btn-refresh" @click="$emit('refresh')">Aktualisieren</button>
    </div>

    <table class="job-table">
      <thead>
        <tr>
          <th>Job-ID</th>
          <th>Artikel</th>
          <th>Status</th>
          <th>Versuche</th>
          <th>Erstellt am</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="job in jobs" :key="job.id">
          <td class="code-font">{{ job.id.substring(0, 8) }}...</td>
          <td class="font-medium">{{ job.articleTitle }}</td>
          <td>
            <span :class="['status-badge', `status-${job.status}`]">
              {{ job.status }}
            </span>
          </td>
          <td>{{ job.attempts }}</td>
          <td class="time-text">{{ new Date(job.createdAt).toLocaleTimeString() }}</td>
        </tr>
        <tr v-if="jobs.length === 0">
          <td colspan="5" class="empty-state">Keine aktiven Generierungs-Jobs gefunden.</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
defineProps({
  jobs: {
    type: Array,
    default: () => []
  }
});

defineEmits(['refresh']);
</script>

<style scoped>
.job-monitor {
  background: #ffffff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; margin-top: 24px;
}

.monitor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }

.title { font-size: 18px; font-weight: 700; color: #0f172a; }
.subtitle { font-size: 13px; color: #64748b; }

.btn-refresh {
  background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
}

.job-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; }

.job-table th { padding: 10px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; font-weight: 600; }

.job-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; }

.code-font { font-family: monospace; color: #64748b; }
.font-medium { font-weight: 500; color: #0f172a; }

.status-badge { padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-processing { background: #dbeafe; color: #2563eb; }
.status-completed { background: #dcfce7; color: #16a34a; }
.status-failed { background: #fee2e2; color: #dc2626; }

.empty-state { text-align: center; color: #94a3b8; padding: 24px; }
</style>
