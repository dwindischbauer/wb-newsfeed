<template>
  <div class="dashboard">
    <h2>Dashboard</h2>
    <div class="stats">
      <div class="stat-card">
        <h3>Verwaltete Artikel</h3>
        <p>0</p>
      </div>
      <div class="stat-card">
        <h3>KI-Jobs</h3>
        <p>0</p>
      </div>
      <div class="stat-card">
        <h3>Veröffentlicht im Feed</h3>
        <p>0</p>
      </div>
    </div>
    
    <div class="articles-section">
      <div class="section-header">
        <h3>Artikel verwalten</h3>
        <button class="primary-btn" @click="openModal">+ Artikel einpflegen</button>
      </div>

      <div class="category-filters">
        <button 
          v-for="cat in categories" 
          :key="cat"
          :class="['chip', { active: activeCategory === cat }]"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>
      
      <table class="data-table">
        <thead>
          <tr>
            <th>Titel</th>
            <th>Kategorie</th>
            <th>Autor</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="article in filteredArticles" :key="article.id">
            <td>{{ article.title }}</td>
            <td>{{ article.category }}</td>
            <td>{{ article.author }}</td>
            <td>
              <span :class="['status-badge', article.status]">{{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}</span>
            </td>
            <td>
              <button class="action-btn">Vorschau</button>
            </td>
          </tr>
          <tr v-if="filteredArticles.length === 0">
            <td colspan="5" class="empty">Keine Artikel gefunden.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Artikel einpflegen</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Titel (Auto-Titel falls leer)</label>
            <input type="text" v-model="newArticle.title" />
          </div>
          <div class="form-group">
            <label>Kategorie</label>
            <select v-model="newArticle.category">
              <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Autor / Quelle</label>
            <input type="text" v-model="newArticle.author" />
          </div>
          <div class="form-group">
            <label>Fließtext (Aus Zwischenablage einfügen)</label>
            <textarea v-model="newArticle.content" rows="6"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" @click="closeModal">Abbrechen</button>
          <button class="primary-btn" @click="saveArticle">Speichern & KI Job starten</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const articles = ref([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');

const filteredArticles = computed(() => {
  if (activeCategory.value === 'Alle') return articles.value;
  return articles.value.filter(a => a.category === activeCategory.value);
});

const fetchArticles = async () => {
  try {
    const res = await fetch('http://localhost:3005/api/articles');
    const data = await res.json();
    articles.value = data;
  } catch (e) {
    console.error(e);
  }
};

const isModalOpen = ref(false);
const newArticle = ref({ title: '', category: 'Wirtschaft', author: 'ORF.at Redaktion', content: '' });

const openModal = () => {
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  newArticle.value = { title: '', category: 'Wirtschaft', author: 'ORF.at Redaktion', content: '' };
};

const saveArticle = async () => {
  if (!newArticle.value.content) return;
  if (!newArticle.value.title) {
    newArticle.value.title = newArticle.value.content.substring(0, 30) + '...';
  }
  
  try {
    const res = await fetch('http://localhost:3005/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle.value)
    });
    const article = await res.json();
    
    await fetch('http://localhost:3005/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ articleId: article.id, type: 'teaser_generation' })
    });
    
    closeModal();
    fetchArticles();
  } catch (e) {
    console.error(e);
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}
.stats {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex: 1;
}
.stat-card h3 {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}
.stat-card p {
  margin: 0.5rem 0 0;
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
}
.articles-section {
  margin-top: 2rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.primary-btn {
  background-color: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
.category-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.chip {
  padding: 0.25rem 1rem;
  border-radius: 99px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
}
.chip.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.data-table th, .data-table td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: bold;
}
.status-badge.published { background: #bbf7d0; color: #166534; }
.status-badge.draft { background: #e5e7eb; color: #374151; }
.action-btn {
  background: none;
  border: 1px solid #ccc;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
}
.empty {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}
.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
}
.form-group input, .form-group select, .form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}
</style>
