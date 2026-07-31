<template>
  <div class="article-section">
    <div class="section-header">
      <div>
        <h2 class="title">Artikel-Übersicht</h2>
        <p class="subtitle">Wähle einen Artikel aus, um Details & Vorschau anzuzeigen</p>
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
        <div class="article-icon-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>

        <div class="article-info">
          <h3 class="article-title">{{ item.title }}</h3>
          <p class="article-summary-preview" v-if="item.summary">{{ item.summary }}</p>
          <span class="article-category">{{ item.category }} · {{ item.author || 'ORF.at Redaktion' }}</span>
        </div>

        <div class="actions-container">
          <button 
            :class="item.status === 'Veröffentlicht' ? 'badge-status-published' : 'badge-status-draft'"
            @click.stop="$emit('toggle-status', item.id)"
            title="Klicken zum Ändern des Status"
          >
            {{ item.status }}
          </button>
          
          <div class="btn-group">
            <button class="action-btn btn-view" @click.stop="selectItem(item)" title="Vorschau anzeigen">
              Vorschau
            </button>
            <button class="action-btn btn-delete" @click.stop="$emit('delete-article', item.id)" title="Artikel löschen">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>
      </div>

      <div v-if="filteredArticles.length === 0" class="empty-state">
        Keine Artikel in dieser Kategorie vorhanden.
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
  },
  activeSelectedId: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['open-create', 'select-article', 'toggle-status', 'delete-article']);

const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const selectedCat = ref('Alle');

const selectedId = computed(() => props.activeSelectedId);

const filteredArticles = computed(() => {
  if (selectedCat.value === 'Alle') return props.articles;
  return props.articles.filter(a => a.category?.toLowerCase() === selectedCat.value.toLowerCase());
});

function selectItem(item) {
  emit('select-article', item);
}
</script>

<style scoped>
.article-section { width: 100%; }

.section-header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;
}

.title { font-size: 20px; font-weight: 700; color: #0f172a; }
.subtitle { font-size: 13px; color: #64748b; margin-top: 2px; }

.category-filter-bar {
  display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 4px;
}

.filter-btn {
  background: #ffffff; border: 1px solid #cbd5e1; color: #475569; padding: 6px 14px;
  border-radius: 16px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
}

.filter-btn:hover { border-color: #10b981; color: #0f172a; }

.filter-btn.active {
  background: #10b981; color: #000000; font-weight: 700; border-color: #10b981;
}

.article-list { display: flex; flex-direction: column; gap: 10px; }

.article-card {
  background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;
  display: flex; align-items: center; gap: 14px; cursor: pointer; transition: all 0.15s ease;
}

.article-card:hover { border-color: #10b981; background: #f8fafc; transform: translateY(-1px); }

.article-card.selected { border-color: #10b981; background: #f0fdf4; box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3); }

.article-icon-box {
  width: 42px; height: 42px; border-radius: 10px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.article-info { flex: 1; min-width: 0; }

.article-title { font-size: 14px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.article-summary-preview { font-size: 12px; color: #475569; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.article-category { font-size: 11px; color: #64748b; display: block; margin-top: 4px; font-weight: 500; }

.actions-container { display: flex; align-items: center; gap: 10px; }

.badge-status-published {
  background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 12px; border: none; cursor: pointer;
}

.badge-status-draft {
  background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 12px; border: none; cursor: pointer;
}

.btn-group { display: flex; gap: 4px; }

.action-btn {
  background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}

.action-btn:hover { background: #e2e8f0; }

.btn-view { color: #0284c7; border-color: #bae6fd; }

.btn-delete { color: #dc2626; border-color: #fecaca; }

.empty-state { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; color: #64748b; }
</style>
