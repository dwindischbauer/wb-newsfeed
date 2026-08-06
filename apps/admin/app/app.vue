<template>
  <div class="app-container">
    <header class="app-header">
      <h1>WB News Admin CMS</h1>
      <nav>
        <NuxtLink to="/">Dashboard</NuxtLink>
        <NuxtLink to="/jobs">Job-Queue</NuxtLink>
        <NuxtLink to="/settings">Einstellungen</NuxtLink>
      </nav>
    </header>
    <main>
      <NuxtPage />
    </main>
  </div>
</template>

<style>
.app-container {
  font-family: 'Inter', sans-serif;
  background-color: #f4f7f6;
  min-height: 100vh;
  color: #333;
}
.app-header {
  background-color: #fff;
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}
nav {
  display: flex;
  gap: 1.5rem;
}
nav a {
  text-decoration: none;
  color: #4b5563;
  font-weight: 500;
  transition: color 0.2s ease;
}
nav a.router-link-active {
  color: #3b82f6;
}
</style>
