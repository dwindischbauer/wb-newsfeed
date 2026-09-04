<template>
  <div class="min-h-screen bg-bg-main text-text-primary flex flex-col">
    <header class="bg-[rgba(255,255,255,0.78)] backdrop-blur-[16px] border-b border-border-subtle px-8 py-[0.85rem] flex justify-between items-center sticky top-0 z-100">
      <div class="flex items-center gap-[0.85rem]">
        <div class="w-[38px] h-[38px] rounded-[10px] bg-accent-ink flex items-center justify-center text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.18)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/>
            <path d="M15 18h-5"/>
            <path d="M10 6h8v4h-8V6Z"/>
          </svg>
        </div>
        <div class="flex flex-col">
          <span class="text-[1.05rem] font-bold tracking-[-0.01em] text-text-primary">WB Newsfeed</span>
          <span class="text-[0.72rem] text-text-muted font-medium">Redaktions-CMS & KI-Studio</span>
        </div>
      </div>

      <nav class="flex items-center gap-2 bg-bg-card-subtle p-[0.3rem] rounded-full border border-border-subtle">
        <NuxtLink to="/" class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.45rem] rounded-full text-[0.82rem] font-medium text-text-secondary no-underline transition-all duration-200 hover:text-text-primary hover:bg-[rgba(20,20,20,0.05)] [&.router-link-active]:bg-accent-ink [&.router-link-active]:text-accent-lime [&.router-link-active]:shadow-[0_2px_8px_rgba(20,20,20,0.2)] [&.router-link-active]:font-semibold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          <span>Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/jobs" class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.45rem] rounded-full text-[0.82rem] font-medium text-text-secondary no-underline transition-all duration-200 hover:text-text-primary hover:bg-[rgba(20,20,20,0.05)] [&.router-link-active]:bg-accent-ink [&.router-link-active]:text-accent-lime [&.router-link-active]:shadow-[0_2px_8px_rgba(20,20,20,0.2)] [&.router-link-active]:font-semibold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          <span>Job-Queue</span>
        </NuxtLink>
        <NuxtLink to="/settings" class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.45rem] rounded-full text-[0.82rem] font-medium text-text-secondary no-underline transition-all duration-200 hover:text-text-primary hover:bg-[rgba(20,20,20,0.05)] [&.router-link-active]:bg-accent-ink [&.router-link-active]:text-accent-lime [&.router-link-active]:shadow-[0_2px_8px_rgba(20,20,20,0.2)] [&.router-link-active]:font-semibold">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          <span>Einstellungen</span>
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-4">
        <a href="http://localhost:3002" target="_blank" class="flex items-center gap-[0.45rem] px-[0.95rem] py-[0.45rem] rounded-lg bg-[rgba(111,143,26,0.1)] border border-[rgba(111,143,26,0.3)] text-accent-lime-deep text-[0.78rem] font-semibold no-underline transition-all duration-200 hover:bg-[rgba(111,143,26,0.18)] hover:border-[rgba(111,143,26,0.5)] hover:shadow-[0_0_12px_rgba(111,143,26,0.2)]" title="Mobile Snap-Feed Web-App öffnen">
          <span class="w-[7px] h-[7px] rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse-dot"></span>
          <span>Feed-App (3002)</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>
    </header>

    <main class="flex-1 bg-bg-main p-0 m-0">
      <NuxtPage />
    </main>
  </div>
</template>
