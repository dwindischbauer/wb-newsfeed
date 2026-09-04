<template>
  <div class="feed-container">
    <NuxtPage />
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --accent-lime: #d5f24e;
  --accent-lime-deep: #6f8f1a;
  --accent-ink: #14151a;
  --font-accent: 'Fraunces', Georgia, serif;

  /* ShortformCard / ShortformFeed theme overrides */
  --sf-bg-color: #000;
  --sf-media-bg: #d9d6cb;
  --sf-overlay-color: rgba(20, 20, 20, 0.92);
  --sf-badge-bg: rgba(255, 255, 255, 0.22);
  --sf-badge-border: rgba(255, 255, 255, 0.4);
  --sf-badge-color: #ffffff;
  --sf-primary-color: #d5f24e;
  --sf-primary-text: #14151a;
  --sf-empty-color: #b8b9b2;
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #000;
  color: #fff;
  overflow: hidden;
}
.feed-container {
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
</style>
