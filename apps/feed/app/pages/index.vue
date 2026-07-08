<template>
  <div class="vertical-feed">
    <div class="feed-item" v-for="n in 3" :key="n">
      <div class="media-area">
        <span class="category-badge">Nachrichten</span>
      </div>
      <div class="content-overlay">
        <h2>Titel des Artikels</h2>
        <p class="teaser">Hier steht der KI generierte Teaser des Artikels.</p>
        <div class="meta">ORF.at Redaktion • vor 5 Min</div>
        <button class="read-more">Vollständigen Artikel lesen</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.vertical-feed {
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}
.feed-item {
  height: 100vh;
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
}
.media-area {
  flex: 1;
  background: #1a1a1a;
  position: relative;
}
.category-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: rgba(255,255,255,0.2);
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.8rem;
}
.content-overlay {
  padding: 1.5rem;
  background: linear-gradient(transparent, rgba(0,0,0,0.9));
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
}
.content-overlay h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
}
.teaser {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  opacity: 0.9;
}
.meta {
  font-size: 0.8rem;
  opacity: 0.7;
  margin-bottom: 1rem;
}
.read-more {
  width: 100%;
  padding: 1rem;
  background: #4ade80;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
}
</style>
