<template>
  <div class="flex min-h-screen flex-col bg-bg-main text-text-primary">
    <header class="sticky top-0 z-[100] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border-subtle bg-white px-4 py-3 md:px-8">
      <div class="flex items-center gap-3">
        <div class="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-accent-ink text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
            <path d="M18 14h-8"/>
            <path d="M15 18h-5"/>
            <path d="M10 6h8v4h-8V6Z"/>
          </svg>
        </div>
        <span class="whitespace-nowrap text-[1.05rem] font-bold text-text-primary">WB Newsfeed <span class="font-normal text-text-muted">Redaktion</span></span>
      </div>

      <nav class="order-3 flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto">
        <NuxtLink
          to="/"
          class="whitespace-nowrap rounded-md px-3 py-[0.4rem] text-[0.84rem] font-medium text-text-secondary no-underline hover:text-text-primary [&.router-link-exact-active]:bg-black/[0.06] [&.router-link-exact-active]:text-text-primary"
        >
          Artikel
        </NuxtLink>
        <NuxtLink
          to="/jobs"
          class="whitespace-nowrap rounded-md px-3 py-[0.4rem] text-[0.84rem] font-medium text-text-secondary no-underline hover:text-text-primary [&.router-link-exact-active]:bg-black/[0.06] [&.router-link-exact-active]:text-text-primary"
        >
          Jobs
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="whitespace-nowrap rounded-md px-3 py-[0.4rem] text-[0.84rem] font-medium text-text-secondary no-underline hover:text-text-primary [&.router-link-exact-active]:bg-black/[0.06] [&.router-link-exact-active]:text-text-primary"
        >
          Einstellungen
        </NuxtLink>
      </nav>

      <div class="flex items-center gap-4">
        <a
          href="http://localhost:3002"
          target="_blank"
          class="flex items-center gap-[0.4rem] text-[0.82rem] font-medium text-text-secondary no-underline hover:text-text-primary"
        >
          <span>Feed öffnen</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
        </a>
      </div>
    </header>

    <main class="m-0 flex-1 bg-bg-main p-0">
      <NuxtPage />
    </main>
  </div>
</template>
