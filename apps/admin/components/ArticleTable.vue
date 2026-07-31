<template>
  <div class="article-section">
    <div class="section-header">
      <div>
        <h2 class="title">Artikel-Übersicht & KI-Verwaltung</h2>
        <p class="subtitle">Klicke auf einen Artikel, um ihn live im Smartphone-Screen rechts anzuzeigen</p>
      </div>
      <button class="btn-primary" @click="$emit('open-create')">
        + Neuer Artikel / Text einfügen
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
        <div class="thumbnail-placeholder">
          <span class="thumb-icon">📰</span>
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
            <button class="action-btn btn-view" @click.stop="selectItem(item)" title="Im Handy anzeigen">
              👁️ Vorschau
            </button>
            <button class="action-btn btn-delete" @click.stop="$emit('delete-article', item.id)" title="Artikel löschen">
              🗑️
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

.thumbnail-placeholder {
  width: 48px; height: 48px; border-radius: 10px; background: #e2e8f0; display: flex; align-items: center; justify-content: center;
}

.thumb-icon { font-size: 22px; }

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
  background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;
}

.action-btn:hover { background: #e2e8f0; }

.btn-view { color: #0284c7; border-color: #bae6fd; }

.btn-delete { color: #dc2626; border-color: #fecaca; }

.empty-state { background: #ffffff; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 32px; text-align: center; color: #64748b; }
</style>
