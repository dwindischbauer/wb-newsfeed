<template>
  <div class="article-section">
    <div class="section-header">
      <div>
        <h2 class="title">Artikel-Übersicht</h2>
        <p class="subtitle">Redaktionelle Inhalte · verwaltet über das CMS</p>
      </div>
      <button class="btn-primary" @click="$emit('open-create')">
        + Artikel einpflegen
      </button>
    </div>

    <!-- Category filter bar -->
    <div class="category-filter-bar">
      <button 
        v-for="cat in categories" 
        :key="cat" 
        :class="['filter-btn', { active: selectedCat === cat }]"
        @click="selectedCat = cat"
      >
        {{ cat }}
      </button>
    </div>

    <div class="article-list">
      <div 
        v-for="item in filteredArticles" 
        :key="item.id" 
        :class="['article-card', { selected: selectedId === item.id }]"
        @click="selectItem(item)"
      >
        <div class="thumbnail-placeholder"></div>
        <div class="article-info">
          <h3 class="article-title">{{ item.title }}</h3>
          <span class="article-category">{{ item.category }} · {{ item.author || 'ORF.at / Redaktion' }}</span>
        </div>
        <div class="status-badge-container">
          <span :class="item.status === 'Veröffentlicht' ? 'badge-status-published' : 'badge-status-draft'">
            {{ item.status }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  articles: {
    type: Array,
    required: true
  }
});

const emit = defineEmits(['open-create', 'select-article']);

const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const selectedCat = ref('Alle');
const selectedId = ref('');

const filteredArticles = computed(() => {
  if (selectedCat.value === 'Alle') return props.articles;
  return props.articles.filter(a => a.category.toLowerCase() === selectedCat.value.toLowerCase());
});

function selectItem(item) {
  selectedId.value = item.id;
  emit('select-article', item);
}
</script>

<style scoped>
.article-section {
  width: 100%;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.subtitle {
  font-size: 13px;
  color: #64748b;
  margin-top: 2px;
}

.category-filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.filter-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.filter-btn.active {
  background: #10b981;
  color: #000000;
  font-weight: 700;
  border-color: #10b981;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.article-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.article-card:hover {
  border-color: #10b981;
  background: #f8fafc;
}

.article-card.selected {
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.thumbnail-placeholder {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: repeating-linear-gradient(45deg, #e2e8f0, #e2e8f0 6px, #f1f5f9 6px, #f1f5f9 12px);
}

.article-info {
  flex: 1;
}

.article-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.article-category {
  font-size: 12px;
  color: #64748b;
  display: block;
  margin-top: 2px;
}

.badge-status-published {
  background: #dcfce7;
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 12px;
}

.badge-status-draft {
  background: #f1f5f9;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 12px;
}
</style>
