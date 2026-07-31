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
  </header>
</template>

<script setup>
import { ref } from 'vue';

const tabs = ['Dashboard', 'Artikel', 'Kanäle', 'Einstellungen'];
const currentTab = ref('Dashboard');

const emit = defineEmits(['change-tab']);

function selectTab(tab) {
  currentTab.value = tab;
  emit('change-tab', tab);
}
</script>

<style scoped>
.cms-header {
  height: 60px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 32px;
}

.brand {
  font-weight: 800;
  font-size: 16px;
  color: #0f172a;
  margin-right: 40px;
  letter-spacing: -0.3px;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-tab {
  background: none;
  border: none;
  color: #64748b;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-tab:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.nav-tab.active {
  background: #0f172a;
  color: #ffffff;
  font-weight: 700;
}
</style>
