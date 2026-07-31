<template>
  <header class="cms-header">
    <div class="brand">WB Publisher CMS</div>
    <nav class="nav-links">
      <button 
        v-for="tab in tabs" 
        :key="tab" 
        :class="['nav-tab', { active: currentTab === tab }]"
        @click="selectTab(tab)"
      >
        {{ tab }}
      </button>
    </nav>
    <div class="user-badge" title="Redaktion Admin">
      <span class="user-icon">👤</span> Admin Redaktion
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';

const tabs = ['Dashboard', 'Artikel-Verwaltung', 'Kanäle', 'KI-Einstellungen'];
const currentTab = ref('Dashboard');

const emit = defineEmits(['change-tab']);

function selectTab(tab) {
  currentTab.value = tab;
  emit('change-tab', tab);
}
</script>

<style scoped>
.cms-header {
  height: 58px; background: #ffffff; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; padding: 0 24px;
}

.brand { font-weight: 800; font-size: 16px; color: #0f172a; margin-right: 32px; letter-spacing: -0.3px; }

.nav-links { display: flex; gap: 12px; flex: 1; }

.nav-tab {
  background: none; border: none; color: #64748b; font-weight: 600; font-size: 13px; padding: 8px 14px;
  border-radius: 8px; cursor: pointer; transition: all 0.15s ease;
}

.nav-tab:hover { background: #f1f5f9; color: #0f172a; }

.nav-tab.active { background: #0f172a; color: #ffffff; font-weight: 700; }

.user-badge {
  display: flex; align-items: center; gap: 8px; background: #f1f5f9; border: 1px solid #e2e8f0;
  padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #0f172a; cursor: pointer;
}

.user-icon { font-size: 14px; }
</style>
