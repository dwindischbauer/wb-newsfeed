<template>
  <div class="app-container">
    <header class="app-header">
      <h1>WB News Admin CMS</h1>
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
}
</style>
