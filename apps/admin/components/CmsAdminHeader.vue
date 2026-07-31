<template>
  <header class="cms-header">
    <div class="header-container">
      <div class="brand">
        <h1 class="brand-title">WB Publisher CMS</h1>
      </div>

      <nav class="nav-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab"
          :class="['nav-tab', { active: activeTab === tab }]"
          @click="$emit('change-tab', tab)"
        >
          {{ tab }}
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
defineProps({
  activeTab: {
    type: String,
    default: 'Dashboard'
  }
});

defineEmits(['change-tab']);

const tabs = ['Dashboard', 'Artikel', 'Einstellungen'];
</script>

<style scoped>
.cms-header {
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 32px;
  height: 64px;
  display: flex;
  align-items: center;
}

.header-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.brand { display: flex; align-items: center; }

.brand-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.nav-tabs {
  display: flex;
  gap: 8px;
}

.nav-tab {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-tab:hover {
  color: #0f172a;
  background: #f1f5f9;
}

.nav-tab.active {
  color: #0f172a;
  background: #f1f5f9;
  font-weight: 700;
}
</style>
