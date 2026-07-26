<template>
  <header class="cms-header">
    <div class="brand">WB Publisher</div>
    <nav class="nav-links">
      <a href="#" class="nav-link active">Dashboard</a>
      <a href="#" class="nav-link">Artikel</a>
      <a href="#" class="nav-link">Kanäle</a>
      <a href="#" class="nav-link">Einstellungen</a>
    </nav>
    <div class="user-badge">Redaktion Admin</div>
  </header>
</template>

<style scoped>
.cms-header {
  height: 54px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 0 24px;
}

.brand {
  font-weight: 800; font-size: 16px; color: #0f172a; margin-right: 32px;
}

.nav-links {
  display: flex; gap: 24px; flex: 1;
}

.nav-link {
  text-decoration: none; color: #64748b; font-weight: 500; font-size: 14px; padding: 16px 0; border-bottom: 2px solid transparent;
}

.nav-link.active {
  color: #0f172a; border-bottom-color: #0f172a; font-weight: 600;
}

.user-badge {
  width: 32px; height: 32px; border-radius: 50%; background: #e2e8f0;
}
</style>
