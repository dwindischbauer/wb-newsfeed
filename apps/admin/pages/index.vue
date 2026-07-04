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
  </div>
</template>

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
</style>
