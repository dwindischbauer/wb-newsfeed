<template>
  <div class="app-container">
    <header class="app-header">
      <div class="header-brand">
        <div class="brand-logo-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/>
            <path d="M15 18h-5"/>
            <path d="M10 6h8v4h-8V6Z"/>
          </svg>
        </div>
        <div class="brand-text">
          <span class="brand-title">WB Newsfeed</span>
          <span class="brand-subtitle">Redaktions-CMS & KI-Studio</span>
        </div>
      </div>

      <nav class="header-nav">
        <NuxtLink to="/" class="nav-pill">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/jobs" class="nav-pill">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span>Job-Queue</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="nav-pill">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Einstellungen</span>
        </NuxtLink>
      </nav>

      <div class="header-right">
        <a href="http://localhost:3002" target="_blank" class="live-feed-btn" title="Mobile Snap-Feed Web-App öffnen">
          <span class="pulse-dot"></span>
          <span>Feed-App (3002)</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>
    </header>

    <main class="app-main">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root {
  --bg-main: #080b11;
  --bg-card: #111622;
  --bg-card-subtle: #141a29;
  --bg-card-hover: #171f30;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-focus: rgba(6, 182, 212, 0.4);
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --accent-cyan: #06b6d4;
  --accent-cyan-glow: rgba(6, 182, 212, 0.25);
  --accent-emerald: #10b981;
  --accent-amber: #f59e0b;
  --accent-purple: #a855f7;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.app-container {
  min-height: 100vh;
  background-color: var(--bg-main);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(12, 16, 26, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0.85rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.brand-logo-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 0 16px rgba(6, 182, 212, 0.35);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-title {
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #ffffff;
}

.brand-subtitle {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.3rem;
  border-radius: 9999px;
  border: 1px solid var(--border-subtle);
}

.nav-pill {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 1.1rem;
  border-radius: 9999px;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;
}

.nav-pill:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.nav-pill.router-link-active {
  background: #1e293b;
  color: #38bdf8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.live-feed-btn {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s ease;
}

.live-feed-btn:hover {
  background: rgba(16, 185, 129, 0.2);
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.25);
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

.app-main {
  flex: 1;
  background-color: var(--bg-main);
  padding: 0;
  margin: 0;
}
</style>
