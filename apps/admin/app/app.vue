<template>
  <div class="flex min-h-screen flex-col bg-bg-main text-text-primary md:flex-row">
    <!-- Kompakte Kopfleiste fuer schmale Viewports -->
    <header class="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-bg-sidebar px-4 py-3 md:hidden">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-[8px] bg-accent-ink font-accent text-[18px] font-medium text-[#fdfbf7]">
          W
        </div>
        <div class="leading-tight">
          <div class="text-[14px] font-semibold tracking-[-0.01em] text-text-primary">WB Newsfeed</div>
          <div class="text-[11px] text-text-muted">Redaktion</div>
        </div>
      </div>

      <a
        href="http://localhost:3002"
        target="_blank"
        class="inline-flex items-center gap-1.5 rounded-[7px] border border-border-subtle bg-bg-card px-2.5 py-1.5 text-[12px] font-medium text-text-secondary no-underline hover:text-text-primary"
      >
        <span>Feed</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>

      <nav class="flex w-full items-center gap-1 overflow-x-auto pt-1">
        <NuxtLink
          to="/"
          class="whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium text-text-secondary no-underline transition-colors hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
        >
          Artikel
        </NuxtLink>
        <NuxtLink
          to="/jobs"
          class="whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium text-text-secondary no-underline transition-colors hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
        >
          Jobs
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="whitespace-nowrap rounded-[7px] px-3 py-1.5 text-[13px] font-medium text-text-secondary no-underline transition-colors hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
        >
          Einstellungen
        </NuxtLink>
      </nav>
    </header>

    <!-- Desktop Sidebar (248px) -->
    <aside class="hidden md:sticky md:top-0 md:flex md:h-screen md:w-[248px] md:shrink-0 md:flex-col md:justify-between md:border-r md:border-border-subtle md:bg-bg-sidebar md:px-4 md:py-5">
      <div>
        <div class="mb-7 flex items-center gap-3 px-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-accent-ink font-accent text-[18px] font-medium text-[#fdfbf7]">
            W
          </div>
          <div class="min-w-0 leading-tight">
            <div class="truncate text-[14px] font-semibold tracking-[-0.01em] text-text-primary">WB Newsfeed</div>
            <div class="text-[11px] text-text-muted">Redaktion</div>
          </div>
        </div>

        <div class="mb-2 px-2.5 text-[11px] font-medium text-text-muted">Redaktion</div>
        <nav class="flex flex-col gap-1">
          <NuxtLink
            to="/"
            class="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13.5px] font-medium text-text-secondary no-underline transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:shadow-[0_1px_2px_rgba(31,27,22,0.05)] [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>
            <span>Artikel</span>
          </NuxtLink>
          <NuxtLink
            to="/jobs"
            class="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13.5px] font-medium text-text-secondary no-underline transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:shadow-[0_1px_2px_rgba(31,27,22,0.05)] [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            <span>Jobs</span>
          </NuxtLink>
          <NuxtLink
            to="/settings"
            class="flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-[13.5px] font-medium text-text-secondary no-underline transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary [&.router-link-exact-active]:bg-bg-card [&.router-link-exact-active]:text-text-primary [&.router-link-exact-active]:shadow-[0_1px_2px_rgba(31,27,22,0.05)] [&.router-link-exact-active]:ring-1 [&.router-link-exact-active]:ring-border-subtle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            <span>Einstellungen</span>
          </NuxtLink>
        </nav>
      </div>

      <div class="border-t border-border-subtle pt-4">
        <a
          href="http://localhost:3002"
          target="_blank"
          class="flex items-center justify-between rounded-[8px] border border-border-subtle bg-bg-card px-3 py-2 text-[13px] font-medium text-text-primary no-underline transition-colors duration-150 hover:bg-bg-card-subtle"
        >
          <span class="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            Feed öffnen
          </span>
          <span class="font-mono text-[11px] tabular-nums text-text-muted">:3002</span>
        </a>
      </div>
    </aside>

    <main class="m-0 min-w-0 flex-1 bg-bg-main p-0">
      <NuxtPage />
    </main>
  </div>
</template>
