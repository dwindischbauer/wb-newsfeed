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
          <tr v-for="article in articles" :key="article.id">
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
          <tr v-if="articles.length === 0">
            <td colspan="5" class="empty">Keine Artikel gefunden.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const articles = ref([]);

const fetchArticles = async () => {
  try {
    const res = await fetch('http://localhost:3005/api/articles');
    const data = await res.json();
    articles.value = data;
  } catch (e) {
    console.error(e);
  }
};

const openModal = () => {
  alert('Modal wird noch implementiert');
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
</style>
