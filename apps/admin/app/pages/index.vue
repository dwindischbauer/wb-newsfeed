<template>
  <div class="mx-auto max-w-[1440px] px-8 pb-12 pt-6">
    <!-- Modern Toast Notification -->
    <transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed bottom-8 right-8 z-[999] flex items-center gap-[0.6rem] rounded-[10px] px-5 py-3 text-[0.82rem] font-semibold shadow-[0_8px_24px_rgba(20,20,20,0.12)] backdrop-blur-[12px]"
        :class="toastType === 'success' ? 'bg-[rgba(16,185,129,0.9)] text-[#14151a]' : 'bg-[rgba(239,68,68,0.9)] text-[#14151a]'"
      >
        <span class="h-2 w-2 rounded-full bg-[#14151a]"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="flex flex-col gap-6">
      <!-- 0. EDITORIAL PAGE HEADER -->
      <div class="flex flex-col gap-[0.15rem] px-[0.1rem] pt-1 pb-2">
        <span class="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-accent-lime-deep">{{ todayLabel }}</span>
        <h1 class="m-0 font-accent text-[2.4rem] font-medium italic tracking-[-0.01em] text-text-primary">{{ greeting }}, Redaktion.</h1>
      </div>

      <!-- 1. TOP SECTION: Hero Story Showcase + Tasks & Schedule -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Hero Story Card (Left 2/3) -->
        <div
          class="relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-[28px] border border-border-subtle bg-cover bg-center shadow-[0_8px_30px_rgba(20,20,20,0.12)]"
          :style="heroCardStyle"
        >
          <div
            class="pointer-events-none absolute inset-0 opacity-50 mix-blend-overlay bg-[url('data:image/svg+xml,%3Csvg%20xmlns=%27http://www.w3.org/2000/svg%27%20width=%27120%27%20height=%27120%27%3E%3Cfilter%20id=%27n%27%3E%3CfeTurbulence%20type=%27fractalNoise%27%20baseFrequency=%270.9%27%20numOctaves=%272%27%20stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect%20width=%27100%25%27%20height=%27100%25%27%20filter=%27url(%23n)%27/%3E%3C/svg%3E')]"
          ></div>
          <div
            class="absolute inset-0 flex flex-col justify-between p-6 bg-[linear-gradient(to_top,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.15)_100%)]"
          >
            <div class="flex items-center gap-[0.6rem]">
              <span
                class="flex items-center gap-[0.4rem] rounded-full border border-[rgba(111,143,26,0.4)] bg-[rgba(111,143,26,0.15)] px-3 py-[0.35rem] text-[0.72rem] font-bold tracking-[0.04em] text-[#5c7a14] backdrop-blur-[8px]"
              >
                <span class="h-[6px] w-[6px] animate-pulse rounded-full bg-[#6f8f1a] shadow-[0_0_8px_#6f8f1a]"></span>
                <span>TOP-STORY IM FEED</span>
              </span>
              <span
                v-if="topArticle"
                class="rounded-full border border-[rgba(20,20,20,0.15)] bg-[rgba(20,20,20,0.1)] px-3 py-[0.35rem] text-[0.72rem] font-semibold text-[#24252a] backdrop-blur-[8px]"
              >
                {{ topArticle.category }}
              </span>
            </div>

            <div class="rounded-[20px] border border-[rgba(20,20,20,0.1)] bg-[rgba(255,255,255,0.85)] p-[1.35rem] shadow-[0_8px_32px_rgba(20,20,20,0.10)] backdrop-blur-[16px]">
              <h2 v-if="topArticle" class="m-0 mb-2 text-[1.35rem] font-extrabold leading-[1.3] tracking-[-0.02em] text-[#14151a]">
                {{ topArticle.title }}
              </h2>
              <h2 v-else class="m-0 mb-2 text-[1.35rem] font-extrabold leading-[1.3] tracking-[-0.02em] text-[#14151a]">
                Keine veröffentlichten Artikel vorhanden
              </h2>

              <p v-if="topArticle && topArticle.teaser" class="m-0 mb-[0.85rem] line-clamp-2 text-[0.85rem] leading-[1.5] text-[#5a5b61]">
                {{ topArticle.teaser }}
              </p>

              <div v-if="topArticle" class="mb-4 flex flex-wrap items-center gap-[1.1rem] text-[0.78rem] text-text-secondary">
                <div class="flex items-center gap-[0.35rem]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>{{ topArticle.author }}</span>
                </div>
                <div class="flex items-center gap-[0.35rem]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>{{ estimateReadingTime(topArticle.content) }}</span>
                </div>
                <div class="flex items-center gap-[0.35rem]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>{{ formatDate(topArticle.createdAt) }}</span>
                </div>
              </div>

              <div v-if="topArticle" class="flex items-center gap-3">
                <button
                  class="flex cursor-pointer items-center gap-[0.45rem] rounded-full border-none bg-accent-ink px-[1.1rem] py-2 text-[0.82rem] font-semibold text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.25)] transition-opacity duration-200 hover:opacity-[0.92]"
                  @click="selectArticle(topArticle)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <span>Im Panel prüfen</span>
                </button>
                <button
                  class="flex cursor-pointer items-center gap-[0.45rem] rounded-full border border-[rgba(20,20,20,0.12)] bg-[rgba(20,20,20,0.08)] px-4 py-2 text-[0.82rem] font-medium text-[#24252a] transition-colors duration-200 hover:bg-[rgba(20,20,20,0.14)]"
                  @click="openMobilePreview"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  <span>Feed-Vorschau</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: "Zu erledigen" & "Nächste Veröffentlichungen" -->
        <div class="flex flex-col gap-5">
          <!-- Card: Zu erledigen -->
          <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div>
                  <h3 class="m-0 font-accent text-[1.15rem] font-medium italic text-[#14151a]">Zu erledigen</h3>
                  <span class="text-[0.72rem] text-text-muted">Ausstehende Redaktionsaufgaben</span>
                </div>
              </div>
              <span
                class="rounded-full border border-border-subtle px-[0.6rem] py-1 text-[0.72rem] font-semibold text-text-muted"
                :class="{ 'border-[rgba(245,158,11,0.35)] bg-[rgba(245,158,11,0.15)] text-[#fbbf24]': draftCount > 0 }"
              >
                {{ draftCount > 0 ? `${draftCount} Entwürfe` : '0 offen' }}
              </span>
            </div>

            <div>
              <div v-if="draftArticles.length > 0" class="flex flex-col gap-[0.6rem]">
                <div
                  v-for="draft in draftArticles.slice(0, 2)"
                  :key="draft.id"
                  class="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-3 py-[0.6rem] transition-all duration-200 hover:border-[rgba(245,158,11,0.3)] hover:bg-[rgba(20,20,20,0.06)]"
                  @click="selectArticle(draft)"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <span class="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-[#f59e0b]"></span>
                    <span class="max-w-[210px] overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] font-medium text-[#24252a]">{{ draft.title }}</span>
                  </div>
                  <button
                    class="cursor-pointer rounded-md border border-[rgba(16,185,129,0.35)] bg-[rgba(16,185,129,0.15)] px-[0.55rem] py-1 text-[0.7rem] font-semibold text-[#34d399] hover:bg-[rgba(16,185,129,0.25)]"
                    title="Freigeben"
                    @click.stop="toggleStatus(draft)"
                  >
                    Freigeben
                  </button>
                </div>
              </div>
              <div v-else class="flex items-center gap-[0.85rem] rounded-[10px] border border-dashed border-[rgba(16,185,129,0.25)] bg-[rgba(16,185,129,0.05)] p-[0.85rem]">
                <div class="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(16,185,129,0.2)] text-[0.85rem] font-extrabold text-[#34d399]">✓</div>
                <div>
                  <strong class="block text-[0.82rem] text-[#24252a]">Alles erledigt.</strong>
                  <p class="m-0 text-[0.72rem] text-text-muted">Keine ausstehenden Entwürfe oder Freigaben.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card: Nächste Veröffentlichungen -->
          <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div>
                  <h3 class="m-0 font-accent text-[1.15rem] font-medium italic text-[#14151a]">Nächste Veröffentlichungen</h3>
                  <span class="text-[0.72rem] text-text-muted">Redaktions-Kalender 2026</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-[0.65rem]">
              <div
                v-for="item in upcomingArticles"
                :key="item.id"
                class="flex cursor-pointer items-center gap-[0.85rem] rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.02)] px-[0.65rem] py-[0.55rem] transition-all duration-200 hover:border-[rgba(111,143,26,0.3)] hover:bg-[rgba(20,20,20,0.05)]"
                @click="selectArticle(item)"
              >
                <div class="flex h-[38px] w-[38px] flex-shrink-0 flex-col items-center justify-center rounded-lg border border-[rgba(20,20,20,0.08)] bg-[#f4f2ec]">
                  <span class="text-[0.85rem] font-bold leading-none text-[#14151a]">{{ getDayNum(item.createdAt) }}</span>
                  <span class="mt-px text-[0.58rem] font-semibold text-[#6c6d73]">{{ getMonthAbbr(item.createdAt) }}</span>
                </div>
                <div class="flex-1 overflow-hidden">
                  <div>
                    <span class="block overflow-hidden text-ellipsis whitespace-nowrap text-[0.78rem] font-semibold text-[#24252a]">{{ item.title }}</span>
                  </div>
                  <div class="mt-[2px] flex items-center gap-[0.4rem] text-[0.7rem] text-text-muted">
                    <span class="font-semibold text-[#5c7a14]">{{ item.category }}</span>
                    <span>• {{ item.author }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. MIDDLE SECTION: KPI Row, asymmetric -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <!-- KPI 1: Verwaltete Artikel — featured, larger -->
        <div
          class="relative flex min-h-[120px] flex-col justify-between gap-[0.6rem] overflow-hidden rounded-[22px] border border-accent-ink bg-accent-ink px-[1.4rem] pb-5 pt-[1.4rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] sm:col-span-2 lg:col-auto"
        >
          <span class="font-accent text-[0.85rem] font-medium italic text-white/60">Verwaltete Artikel</span>
          <div class="font-accent text-[3.4rem] font-medium italic leading-none text-white">{{ totalArticlesCount }}</div>
          <div class="z-[2] mt-3 text-[0.72rem] text-white/[0.55]">
            <span class="font-semibold text-accent-lime">{{ publishedArticlesCount }} im Live-Feed</span> • {{ draftCount }} Entwürfe
          </div>
        </div>

        <!-- KPI 2: KI-Pipelines 2026 -->
        <div class="relative flex min-h-[120px] flex-col justify-between gap-[0.6rem] overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card px-[1.4rem] pb-5 pt-[1.4rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <span class="font-accent text-[0.85rem] font-medium italic text-text-secondary">KI-Pipelines 2026</span>
          <div class="flex items-center gap-2 text-[1.35rem] font-bold tracking-[-0.02em] text-[#14151a]">
            <span class="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
            <span>Aktiv</span>
          </div>
          <div class="z-[2] mt-3 text-[0.72rem] text-text-muted">
            <span>Fastify & qwen2.5:3b-instruct bereit</span>
          </div>
        </div>

        <!-- KPI 3: Nachrichten (Feed) with Cyan Wave -->
        <div class="relative flex min-h-[120px] flex-col justify-between gap-[0.6rem] overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card px-[1.4rem] pb-5 pt-[1.4rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <span class="font-accent text-[0.85rem] font-medium italic text-text-secondary">Nachrichten (Feed)</span>
          <div class="text-[1.75rem] font-bold tracking-[-0.02em] text-[#14151a]">{{ publishedArticlesCount }}</div>
          <div class="z-[2] mt-3 text-[0.72rem] text-text-muted">
            <span class="font-semibold text-[#5c7a14]">+100%</span> Bereitstellung
          </div>
          <!-- Cyan Area Sparkline Wave -->
          <svg class="pointer-events-none absolute bottom-0 left-0 z-[1] h-[52px] w-full" viewBox="0 0 300 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cyanSpark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#6f8f1a" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#6f8f1a" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,55 Q50,45 100,50 T200,28 T260,35 T300,12 L300,80 L0,80 Z" fill="url(#cyanSpark)" />
            <path d="M0,55 Q50,45 100,50 T200,28 T260,35 T300,12" fill="none" stroke="#6f8f1a" stroke-width="2.5" />
          </svg>
        </div>

        <!-- KPI 4: Feed-Interaktionen with Amber Wave -->
        <div class="relative flex min-h-[120px] flex-col justify-between gap-[0.6rem] overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card px-[1.4rem] pb-5 pt-[1.4rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <span class="font-accent text-[0.85rem] font-medium italic text-text-secondary">Feed-Leserate</span>
          <div class="text-[1.75rem] font-bold tracking-[-0.02em] text-[#14151a]">{{ analyticsSummary.readThroughRate || '84.2%' }}</div>
          <div class="z-[2] mt-3 text-[0.72rem] text-text-muted">
            <span>{{ analyticsSummary.totalReads }} Volltext • {{ analyticsSummary.totalImpressions }} Aufrufe</span>
          </div>
          <!-- Amber Area Sparkline Wave -->
          <svg class="pointer-events-none absolute bottom-0 left-0 z-[1] h-[52px] w-full" viewBox="0 0 300 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="amberSpark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0" />
              </linearGradient>
            </defs>
            <path d="M0,60 Q60,40 120,48 T220,20 T270,25 T300,8 L300,80 L0,80 Z" fill="url(#amberSpark)" />
            <path d="M0,60 Q60,40 120,48 T220,20 T270,25 T300,8" fill="none" stroke="#f59e0b" stroke-width="2.5" />
          </svg>
        </div>
      </div>

      <!-- 3. BOTTOM DASHBOARD SECTION: Authors Leaderboard + Category Distribution + Server Health -->
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <!-- Card 1: Aktivste Autoren 2026 -->
        <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 font-accent text-[1.15rem] font-medium italic text-[#14151a]">Aktivste Autoren</h3>
                <span class="text-[0.72rem] text-text-muted">Beiträge im Diplomarbeits-Semester</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-[0.85rem]">
            <div v-for="author in authorStats" :key="author.name" class="flex flex-col gap-[0.4rem]">
              <div class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-[0.82rem] font-semibold text-[#24252a]">{{ author.name }}</span>
                  <span class="text-[0.68rem] text-text-muted">{{ author.role }}</span>
                </div>
                <div class="flex items-center gap-[0.3rem] text-[0.76rem]">
                  <span class="font-semibold text-[#14151a]">{{ author.count }} Artikel</span>
                  <span class="text-text-muted">({{ author.percent }}%)</span>
                </div>
              </div>
              <div class="h-[6px] w-full overflow-hidden rounded-full bg-[rgba(20,20,20,0.05)]">
                <div
                  class="h-full rounded-full transition-[width] duration-[400ms] ease-in-out"
                  :style="{ width: `${Math.max(author.percent, 8)}%`, backgroundColor: author.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Artikel nach Kategorie -->
        <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 font-accent text-[1.15rem] font-medium italic text-[#14151a]">Nach Kategorie</h3>
                <span class="text-[0.72rem] text-text-muted">Thematische Verteilung im Feed</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-[1.1rem]">
            <!-- Segmented horizontal bar -->
            <div class="flex h-3 w-full overflow-hidden rounded-full bg-[rgba(20,20,20,0.04)]">
              <div
                v-for="cat in categoryStats"
                :key="cat.name"
                class="h-full transition-[width] duration-300 ease-in-out"
                :style="{ width: `${cat.percent}%`, backgroundColor: cat.color }"
                :title="`${cat.name}: ${cat.count} (${cat.percent}%)`"
              ></div>
            </div>

            <!-- Category Legend -->
            <div class="grid grid-cols-2 gap-[0.65rem]">
              <div v-for="cat in categoryStats" :key="cat.name" class="flex items-center gap-[0.45rem] text-[0.74rem]">
                <span class="h-2 w-2 flex-shrink-0 rounded-full" :style="{ backgroundColor: cat.color }"></span>
                <span class="flex-1 text-text-secondary">{{ cat.name }}</span>
                <span class="font-semibold text-[#14151a]">{{ cat.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Server & KI-Status -->
        <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 font-accent text-[1.15rem] font-medium italic text-[#14151a]">Server & KI-Status</h3>
                <span class="text-[0.72rem] text-text-muted">Infrastruktur-Metriken</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.02)] p-3">
              <div class="text-[1.25rem] font-extrabold text-[#14151a]">0,53 Last</div>
              <div class="flex items-center gap-[0.4rem] text-[0.74rem] font-semibold text-[#34d399]">
                <span class="h-2 w-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                <span>Läuft stabil</span>
              </div>
            </div>

            <div class="flex flex-col gap-[0.65rem]">
              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>Fastify REST API (Port 3005)</span>
                  <span class="font-semibold text-[#14151a]">Online</span>
                </div>
                <div class="h-[5px] w-full overflow-hidden rounded-full bg-[rgba(20,20,20,0.05)]">
                  <div class="h-full w-full rounded-full bg-[#6f8f1a]"></div>
                </div>
              </div>

              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>PostgreSQL & Redis Queue</span>
                  <span class="font-semibold text-[#14151a]">Aktiv</span>
                </div>
                <div class="h-[5px] w-full overflow-hidden rounded-full bg-[rgba(20,20,20,0.05)]">
                  <div class="h-full w-full rounded-full bg-[#10b981]"></div>
                </div>
              </div>

              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>Ollama LLM (qwen2.5)</span>
                  <span class="font-semibold text-[#14151a]">1.2 GB VRAM</span>
                </div>
                <div class="h-[5px] w-full overflow-hidden rounded-full bg-[rgba(20,20,20,0.05)]">
                  <div class="h-full w-[32%] rounded-full bg-[#a855f7]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ARTICLE MANAGEMENT & TABLE SECTION -->
      <div class="relative overflow-hidden rounded-[22px] border border-border-subtle bg-bg-card p-6 shadow-[0_4px_20px_rgba(20,20,20,0.05)] transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
        <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 class="m-0 text-[1.15rem] font-extrabold text-[#14151a]">Artikel verwalten</h3>
            <p class="m-0 mt-[0.2rem] text-[0.76rem] text-text-muted">Übersicht aller redaktionellen Short-Form-Inhalte</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.45rem] text-text-secondary focus-within:border-border-focus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Suchen nach Titel, Tags, Autor..."
                class="w-[180px] border-none bg-transparent text-[0.8rem] text-[#14151a] outline-none placeholder:text-text-muted"
              />
              <button v-if="searchQuery" class="cursor-pointer border-none bg-transparent text-[1rem] text-text-muted" @click="searchQuery = ''">&times;</button>
            </div>
            <button
              class="flex cursor-pointer items-center gap-[0.45rem] rounded-full border-none bg-accent-ink px-[1.1rem] py-[0.55rem] text-[0.82rem] font-semibold text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]"
              @click="openModal"
            >
              <span class="text-base font-bold">+</span> Neuer Artikel
            </button>
          </div>
        </div>

        <!-- Filter Chips (Categories) -->
        <div class="mb-[0.85rem] flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cursor-pointer rounded-full border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.35rem] text-[0.76rem] font-medium text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.07)] hover:text-[#14151a]"
            :class="{ 'border-accent-lime bg-accent-lime font-semibold text-[#14151a] shadow-[0_0_10px_rgba(213,242,78,0.5)]': activeCategory === cat }"
            @click="activeCategory = cat; activeTag = null"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Subtag Filter Chips: canonical subcategories for the active main category,
             falls back to live tags from the data when "Alle" is selected -->
        <div
          v-if="canonicalSubtagsForActiveCategory.length > 0"
          class="mb-5 flex flex-wrap items-center gap-[0.45rem] rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.02)] px-3 py-2"
        >
          <span class="text-[0.72rem] font-semibold text-text-muted">Subkategorie:</span>
          <button
            class="cursor-pointer rounded-full border border-[rgba(20,20,20,0.12)] bg-transparent px-3 py-[0.3rem] text-[0.74rem] font-medium text-text-secondary transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ 'border-[#6f8f1a] bg-[rgba(111,143,26,0.15)] font-semibold text-[#6f8f1a]': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="sub in canonicalSubtagsForActiveCategory"
            :key="sub.slug"
            class="cursor-pointer rounded-full border border-[rgba(20,20,20,0.12)] bg-transparent px-3 py-[0.3rem] text-[0.74rem] font-medium text-text-secondary transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ 'border-[#6f8f1a] bg-[rgba(111,143,26,0.15)] font-semibold text-[#6f8f1a]': activeTag === sub.name }"
            @click="activeTag = activeTag === sub.name ? null : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
        <div
          v-else-if="allTags && allTags.length > 0"
          class="mb-5 flex flex-wrap items-center gap-[0.45rem] rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.02)] px-3 py-2"
        >
          <span class="text-[0.72rem] font-semibold text-text-muted">Filter Subtags:</span>
          <button
            class="cursor-pointer rounded-full border border-[rgba(20,20,20,0.12)] bg-transparent px-3 py-[0.3rem] text-[0.74rem] font-medium text-text-secondary transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ 'border-[#6f8f1a] bg-[rgba(111,143,26,0.15)] font-semibold text-[#6f8f1a]': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="t in visibleAllTags"
            :key="t.id"
            class="cursor-pointer rounded-full border border-[rgba(20,20,20,0.12)] bg-transparent px-3 py-[0.3rem] text-[0.74rem] font-medium text-text-secondary transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ 'border-[#6f8f1a] bg-[rgba(111,143,26,0.15)] font-semibold text-[#6f8f1a]': activeTag === t.name }"
            @click="activeTag = activeTag === t.name ? null : t.name"
          >
            #{{ t.name }} <span v-if="t.articleCount > 0" class="opacity-75">({{ t.articleCount }})</span>
          </button>
          <button
            v-if="sortedAllTags.length > TAG_PREVIEW_COUNT"
            class="cursor-pointer rounded-full border border-dashed border-[rgba(20,20,20,0.2)] bg-transparent px-3 py-[0.3rem] text-[0.74rem] font-semibold text-text-muted transition-all duration-200 hover:border-[rgba(20,20,20,0.4)] hover:text-[#14151a]"
            @click="allTagsExpanded = !allTagsExpanded"
          >
            {{ allTagsExpanded ? 'Weniger anzeigen' : `+${sortedAllTags.length - TAG_PREVIEW_COUNT} weitere` }}
          </button>
        </div>

        <!-- Carbon Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-separate [border-spacing:0_4px]">
            <thead>
              <tr>
                <th class="w-[70px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Cover</th>
                <th class="border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Titel & Redaktionsinhalte</th>
                <th class="w-[130px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Kategorie</th>
                <th class="w-[140px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Autor</th>
                <th class="w-[120px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Status</th>
                <th class="w-[160px] border-b border-border-subtle px-4 py-3 text-right text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in filteredArticles"
                :key="article.id"
                class="cursor-pointer bg-[rgba(20,20,20,0.02)] transition-all duration-200 hover:bg-[rgba(20,20,20,0.04)]"
                :class="{ 'border-l-2 border-l-[#6f8f1a] bg-[rgba(111,143,26,0.08)]': selectedArticle && selectedArticle.id === article.id }"
                @click="selectArticle(article)"
              >
                <td class="px-4 py-[0.85rem] align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <div class="flex h-[38px] w-[52px] items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-[#f4f2ec]">
                    <img
                      v-if="article.imageUrl"
                      :src="`${config.public.apiUrl}${article.imageUrl}`"
                      class="h-full w-full object-cover"
                      alt="Cover"
                    />
                    <div v-else class="text-text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-[0.85rem] align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <div class="flex flex-col gap-1">
                    <span class="font-semibold leading-[1.35] text-[#14151a]">{{ article.title }}</span>
                    <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-[0.35rem]">
                      <span v-for="t in article.tags" :key="t.id || t.name" class="rounded bg-[rgba(20,20,20,0.04)] px-[0.45rem] py-[0.1rem] text-[0.65rem] text-text-secondary">
                        #{{ t.name }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-[0.85rem] align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <span class="inline-block rounded-full px-[0.65rem] py-1 text-[0.72rem] font-semibold" :class="getCategoryPillClasses(article.category)">
                    {{ article.category }}
                  </span>
                </td>
                <td class="px-4 py-[0.85rem] align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <span class="text-[0.78rem] text-text-secondary">{{ article.author }}</span>
                </td>
                <td class="px-4 py-[0.85rem] align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <span class="inline-flex items-center gap-[0.35rem] rounded-full px-[0.65rem] py-1 text-[0.72rem] font-semibold" :class="statusBadgeClasses[article.status]">
                    <span class="h-[6px] w-[6px] rounded-full" :class="statusDotClasses[article.status]"></span>
                    <span>{{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}</span>
                  </span>
                </td>
                <td class="px-4 py-[0.85rem] text-right align-middle text-[0.82rem] text-[#24252a] first:rounded-l-lg last:rounded-r-lg">
                  <div class="flex justify-end gap-[0.4rem]" @click.stop>
                    <button
                      class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.6rem] py-1 text-[0.72rem] font-medium text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                      title="Vorschau im Detailpanel"
                      @click="selectArticle(article)"
                    >
                      Vorschau
                    </button>
                    <button
                      class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.6rem] py-1 text-[0.72rem] font-medium text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                      title="Status ändern"
                      @click="toggleStatus(article)"
                    >
                      {{ article.status === 'published' ? 'Entwurf' : 'Live' }}
                    </button>
                    <button
                      class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.6rem] py-1 text-[0.72rem] font-medium text-[#f87171] transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]"
                      title="Löschen"
                      @click="deleteArticle(article.id)"
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0">
                <td colspan="6" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center">
                    <span class="mb-2 text-[2rem]">🔍</span>
                    <p class="m-0 text-[0.95rem] font-semibold text-[#14151a]">Keine passenden Artikel gefunden</p>
                    <p class="m-0 mt-1 text-[0.76rem] text-text-muted">Passe deine Filterkriterien an oder erstelle einen neuen Beitrag.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 5. SLIDE-OVER PREVIEW DRAWER -->
    <transition name="drawer">
      <div
        v-if="selectedArticle"
        class="fixed right-0 top-0 z-[200] flex h-screen w-[440px] max-w-[90vw] flex-col border-l border-border-subtle bg-[rgba(255,255,255,0.9)] shadow-[-10px_0_40px_rgba(20,20,20,0.14)] backdrop-blur-[20px]"
      >
        <div class="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <div class="flex items-center gap-[0.65rem]">
            <h3 class="m-0 text-[1.05rem] font-bold text-[#14151a]">Live-Vorschau</h3>
            <span class="flex items-center gap-[0.35rem] rounded-full border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.12)] px-[0.55rem] py-[0.2rem] text-[0.68rem] font-semibold text-[#5c7a14]">
              <span class="h-[6px] w-[6px] animate-pulse rounded-full bg-[#6f8f1a] shadow-[0_0_8px_#6f8f1a]"></span>
              <span>Echtzeit-Sync</span>
            </span>
          </div>
          <button class="cursor-pointer border-none bg-transparent text-[1.5rem] leading-none text-text-muted hover:text-[#14151a]" @click="selectedArticle = null">&times;</button>
        </div>

        <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
          <!-- Cover Image Section -->
          <div
            v-if="selectedArticle.imageUrl"
            class="relative h-[200px] w-full overflow-hidden rounded-xl border border-border-subtle bg-cover bg-center"
            :style="{ backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` }"
          >
            <div class="absolute inset-0 flex flex-col justify-end gap-2 p-[0.85rem] bg-[linear-gradient(to_top,rgba(20,20,20,0.22)_0%,rgba(20,20,20,0.05)_60%)]">
              <div class="flex flex-wrap gap-2">
                <button
                  class="flex cursor-pointer items-center gap-[0.35rem] rounded-full border border-white/20 bg-[rgba(20,20,20,0.7)] px-3 py-[0.35rem] text-[0.72rem] font-semibold text-white backdrop-blur-[8px] hover:bg-[rgba(20,20,20,0.55)]"
                  :disabled="isGeneratingImage"
                  title="Authentisches, hochauflösendes Redaktionsfoto laden"
                  @click="generateImageForArticle('editorial')"
                >
                  <span v-if="isGeneratingImage" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                  <span v-else>📷</span>
                  Redaktionsfoto laden
                </button>
                <button
                  class="flex cursor-pointer items-center gap-[0.35rem] rounded-full border border-white/20 bg-[rgba(20,20,20,0.7)] px-3 py-[0.35rem] text-[0.72rem] font-semibold text-white backdrop-blur-[8px] hover:bg-[rgba(20,20,20,0.55)]"
                  :disabled="isGeneratingImage"
                  title="Neues KI-Bild über LocalAI/Stable Diffusion berechnen"
                  @click="generateImageForArticle('ai')"
                >
                  <span v-if="isGeneratingImage" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                  <span v-else>✨</span>
                  KI-Bild generieren
                </button>
              </div>

              <!-- Live image gen status -->
              <div
                v-if="imageGenState"
                class="flex items-center gap-[0.4rem] rounded-full bg-[rgba(20,20,20,0.7)] px-[0.6rem] py-[0.3rem] text-[0.72rem] text-white"
                :class="{
                  'text-accent-lime': imageGenState.type === 'loading',
                  'text-[#34d399]': imageGenState.type === 'success',
                  'text-[#f87171]': imageGenState.type === 'error'
                }"
              >
                <span v-if="imageGenState.type === 'loading'" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                <span v-else-if="imageGenState.type === 'error'">⚠️</span>
                <span v-else-if="imageGenState.type === 'success'">✓</span>
                <span>{{ imageGenState.message }}</span>
                <span v-if="imageGenState.elapsed">({{ imageGenState.elapsed }}s)</span>
              </div>

              <button class="self-start cursor-pointer border-none bg-transparent text-[0.68rem] text-[#f87171] underline" @click="removeImage(selectedArticle.id)">Bild löschen</button>
            </div>
          </div>

          <!-- Empty Image Placeholder -->
          <div
            v-else
            class="flex h-[180px] w-full flex-col items-center justify-center gap-[0.6rem] rounded-xl border-2 border-dashed border-border-subtle bg-[rgba(20,20,20,0.02)] p-4 text-text-muted"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <p class="m-0 text-[0.8rem] text-text-secondary">Kein Titelbild hinterlegt</p>
            <div class="flex flex-wrap justify-center gap-2">
              <button
                class="flex cursor-pointer items-center gap-[0.35rem] rounded-full border-none bg-accent-ink px-[0.8rem] py-[0.4rem] text-[0.74rem] font-semibold text-accent-lime"
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('editorial')"
              >
                <span v-if="isGeneratingImage" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                <span v-else>📷</span>
                Redaktionsfoto laden
              </button>
              <button
                class="flex cursor-pointer items-center gap-[0.35rem] rounded-md border border-[rgba(168,85,247,0.35)] bg-[rgba(168,85,247,0.15)] px-[0.8rem] py-[0.4rem] text-[0.74rem] font-semibold text-[#c084fc]"
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('ai')"
              >
                <span>✨</span> KI-Bild
              </button>
              <label class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.05)] px-[0.8rem] py-[0.4rem] text-[0.74rem] text-text-secondary">
                Upload
                <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
              </label>
            </div>
            <div v-if="imageGenState" class="flex items-center gap-[0.4rem] text-[0.72rem]">
              <span>{{ imageGenState.message }}</span>
            </div>
          </div>

          <!-- Meta & Category Row -->
          <div class="flex flex-wrap items-center gap-[0.6rem]">
            <span class="rounded-full border border-[rgba(92,122,20,0.3)] bg-[#efece3] px-[0.65rem] py-1 text-[0.72rem] font-bold text-[#5c7a14]">{{ selectedArticle.category }}</span>
            <div v-if="selectedArticle.tags && selectedArticle.tags.length > 0" class="flex flex-wrap gap-[0.35rem]">
              <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-[0.2rem] text-[0.7rem] text-text-secondary">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Article Title -->
          <h2 class="m-0 text-[1.25rem] font-extrabold leading-[1.35] text-[#14151a]">{{ selectedArticle.title }}</h2>

          <!-- KI-Zusammenfassung Box -->
          <div v-if="selectedArticle.teaser" class="rounded-[10px] border border-[rgba(111,143,26,0.2)] bg-[rgba(111,143,26,0.06)] p-[0.95rem]">
            <div class="mb-2 flex items-center gap-[0.4rem] text-[0.78rem] text-[#24252a]">
              <span>✨</span>
              <strong>KI-Zusammenfassung (Teaser)</strong>
            </div>
            <p class="m-0 text-[0.8rem] leading-[1.5] text-[#5a5b61]">{{ selectedArticle.teaser }}</p>
          </div>

          <!-- KI-Kernpunkte Box -->
          <div v-if="selectedArticle.keyTakeaways" class="rounded-[10px] border border-[rgba(168,85,247,0.2)] bg-[rgba(168,85,247,0.06)] p-[0.95rem]">
            <div class="mb-2 flex items-center gap-[0.4rem] text-[0.78rem] text-[#24252a]">
              <span>📌</span>
              <strong>KI-Kernpunkte</strong>
            </div>
            <ul class="m-0 pl-5 text-[0.8rem] leading-[1.5] text-[#5a5b61] [&>li]:mb-[0.3rem]">
              <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point">
                {{ point }}
              </li>
            </ul>
          </div>

          <!-- Author & Meta -->
          <div class="text-[0.74rem] text-text-muted">
            {{ selectedArticle.author }} • {{ estimateReadingTime(selectedArticle.content) }} • {{ formatDate(selectedArticle.createdAt) }}
          </div>

          <!-- Article Content -->
          <div class="whitespace-pre-line text-[0.82rem] leading-[1.6] text-[#3f4046]">
            {{ selectedArticle.content }}
          </div>
        </div>

        <!-- Drawer Footer Actions -->
        <div class="flex flex-col gap-[0.6rem] border-t border-border-subtle bg-[rgba(255,255,255,0.85)] px-6 py-5">
          <button
            class="flex cursor-pointer items-center gap-[0.45rem] rounded-full border-none bg-accent-ink px-[1.1rem] py-[0.55rem] text-[0.82rem] font-semibold text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]"
            @click="toggleStatus(selectedArticle)"
          >
            {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
          </button>
          <button
            class="cursor-pointer rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.05)] p-2 text-[0.8rem] font-medium text-[#24252a] transition-all duration-200 hover:bg-[rgba(20,20,20,0.1)]"
            @click="openMobilePreview"
          >
            Mobile Ansicht (3002)
          </button>
          <button
            class="cursor-pointer rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.05)] p-2 text-[0.8rem] font-medium text-[#24252a] transition-all duration-200 hover:bg-[rgba(20,20,20,0.1)]"
            @click="editArticle(selectedArticle)"
          >
            Bearbeiten
          </button>
          <button
            class="cursor-pointer rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.1)] p-2 text-[0.8rem] font-semibold text-[#f87171] hover:bg-[rgba(239,68,68,0.2)]"
            @click="deleteArticle(selectedArticle.id)"
          >
            Löschen
          </button>
        </div>
      </div>
    </transition>

    <!-- 6. MODAL: "+ Neuer Artikel / Bearbeiten" -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(20,20,20,0.18)] p-4 backdrop-blur-[8px]"
      @click.self="closeModal"
    >
      <div class="max-h-[90vh] w-[680px] max-w-full overflow-y-auto rounded-2xl border border-border-subtle bg-[#f4f2ec] p-7 shadow-[0_16px_50px_rgba(20,20,20,0.16)]">
        <div class="mb-6 flex items-start justify-between">
          <div>
            <h3 class="m-0 text-[1.25rem] font-extrabold text-[#14151a]">{{ newArticle.id ? 'Artikel bearbeiten' : 'Neuen Artikel einpflegen' }}</h3>
            <p class="m-0 mt-[0.2rem] text-[0.78rem] text-text-muted">Short-Form-Inhalte erstellen mit automatischer KI-Extraktion</p>
          </div>
          <button class="cursor-pointer border-none bg-transparent text-[1.6rem] leading-none text-text-muted hover:text-[#14151a]" @click="closeModal">&times;</button>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="saveArticle">
          <!-- Textarea / Content Input -->
          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex items-center justify-between">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Artikel-Fließtext (Quelle)</label>
              <div class="flex gap-[0.4rem]">
                <button
                  type="button"
                  class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-text-secondary hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                  @click="pasteFromClipboard"
                >
                  📋 Zwischenablage
                </button>
                <button
                  type="button"
                  class="cursor-pointer rounded-md border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.12)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-[#6f8f1a] hover:bg-[rgba(20,20,20,0.08)]"
                  :disabled="isExtracting"
                  @click="autoFillFromContent"
                >
                  <span v-if="isExtracting" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                  <span v-else>✨</span>
                  Auto-Analyse (Titel & Tags)
                </button>
              </div>
            </div>
            <textarea
              v-model="newArticle.content"
              rows="6"
              placeholder="Vollständigen Fließtext oder Agenturmeldung hier einfügen..."
              required
              class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
              @input="onContentInput"
            ></textarea>
          </div>

          <!-- Title Input with Auto-Title Generator -->
          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex items-center justify-between">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Überschrift / Titel</label>
              <button
                type="button"
                class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-text-secondary hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                title="Titel automatisch aus dem ersten Satz ableiten"
                @click="generateTitleOnly"
              >
                ⚡ Auto-Titel
              </button>
            </div>
            <input
              v-model="newArticle.title"
              type="text"
              placeholder="Prägnanter Titel für vertikalen Feed..."
              required
              class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
            />
          </div>

          <!-- Category & Author Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-[0.4rem]">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Kategorie</label>
              <select
                v-model="newArticle.category"
                class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
                @change="onCategoryChange"
              >
                <option value="Auto">✨ Auto-Erkennung</option>
                <option value="Politik">Politik</option>
                <option value="Wirtschaft">Wirtschaft</option>
                <option value="Sport">Sport</option>
                <option value="Technologie">Technologie</option>
                <option value="Kultur">Kultur</option>
              </select>
            </div>

            <div class="flex flex-col gap-[0.4rem]">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Autor / Quelle</label>
              <input
                v-model="newArticle.author"
                type="text"
                list="author-suggestions"
                placeholder="z.B. David Windischbauer, ORF.at..."
                class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
              />
              <datalist id="author-suggestions">
                <option value="David Windischbauer" />
                <option value="Stefan Schachner" />
                <option value="ORF.at Redaktion" />
                <option value="APA Redaktion" />
              </datalist>
            </div>
          </div>

          <!-- Subtag Selector -->
          <div class="flex flex-col gap-[0.4rem]">
            <label class="text-[0.78rem] font-semibold text-text-secondary">Subtags zuordnen</label>
            <div class="mt-1 flex flex-wrap gap-[0.45rem]">
              <button
                v-for="sub in availableSubtags"
                :key="sub.slug"
                type="button"
                class="flex cursor-pointer items-center gap-[0.4rem] rounded-md border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.7rem] py-[0.35rem] text-[0.74rem] text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.07)]"
                :class="{ 'border-[#6f8f1a] bg-[rgba(111,143,26,0.15)] font-semibold text-[#6f8f1a]': isTagSelected(sub.name) }"
                @click="toggleTag(sub.name)"
              >
                <span class="h-[6px] w-[6px] rounded-full" :style="{ backgroundColor: sub.color || 'var(--accent-cyan)' }"></span>
                <span>{{ sub.name }}</span>
              </button>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="mt-3 flex justify-end gap-3 border-t border-border-subtle pt-4">
            <button type="button" class="cursor-pointer rounded-lg border border-border-subtle bg-transparent px-[1.1rem] py-[0.55rem] text-[0.82rem] text-text-secondary hover:bg-[rgba(20,20,20,0.05)] hover:text-[#14151a]" @click="closeModal">Abbrechen</button>
            <button
              type="submit"
              class="flex cursor-pointer items-center gap-[0.45rem] rounded-full border-none bg-accent-ink px-[1.1rem] py-[0.55rem] text-[0.82rem] font-semibold text-accent-lime shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]"
            >
              {{ newArticle.id ? 'Änderungen speichern' : 'Artikel anlegen & KI starten' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  parseKeyTakeaways,
  estimateReadingTime,
  CATEGORY_SUBTAGS,
  autoExtractArticleMetadata,
  type Article,
  type ArticleTag,
  type SubtagDefinition
} from '@wb-news/shortform-news';

type ArticleStatus = 'draft' | 'published';

interface DashboardArticle extends Article {
  status: ArticleStatus;
  keyTakeaways?: string | null;
}

interface TagStat {
  id: number | string;
  name: string;
  slug?: string;
  articleCount: number;
}

interface ArticleFormState extends Omit<DashboardArticle, 'id' | 'tags' | 'status'> {
  id?: number;
  tags: string[];
  status?: ArticleStatus;
}

type ToastType = 'success' | 'error';

type ImageGenType = 'loading' | 'success' | 'error';

interface ImageGenState {
  type: ImageGenType;
  message: string;
  elapsed?: number;
}

interface AnalyticsSummary {
  totalImpressions: number;
  totalReads: number;
  totalTtsPlays: number;
  readThroughRate: string;
}

interface AuthorStat {
  name: string;
  role: string;
  count: number;
  percent: number;
  color: string;
}

interface CategoryStat {
  name: string;
  count: number;
  percent: number;
  color: string;
}

const config = useRuntimeConfig();

const articles = ref<DashboardArticle[]>([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');
const allTags = ref<TagStat[]>([]);

// Canonical subcategories (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const canonicalSubtagsForActiveCategory = computed<SubtagDefinition[]>(() => CATEGORY_SUBTAGS[activeCategory.value] || []);
const activeTag = ref<string | null>(null);

// The live tag cloud (fallback when "Alle" is selected) can hold 100+ single-use
// tags — showing them all at once buries the article table. Only the most-used
// tags are shown by default; the rest stay behind a collapsed toggle. Search
// already matches by tag name, so nothing becomes unreachable when collapsed.
const TAG_PREVIEW_COUNT = 10;
const allTagsExpanded = ref(false);
const sortedAllTags = computed(() => [...allTags.value].sort((a, b) => b.articleCount - a.articleCount));
const visibleAllTags = computed(() =>
  allTagsExpanded.value ? sortedAllTags.value : sortedAllTags.value.slice(0, TAG_PREVIEW_COUNT)
);
const searchQuery = ref('');
const selectedArticle = ref<DashboardArticle | null>(null);
const pendingJobsCount = ref(0);
const isExtracting = ref(false);

const todayLabel = new Date().toLocaleDateString('de-AT', { weekday: 'long', day: 'numeric', month: 'long' });
const greeting = (() => {
  const h = new Date().getHours();
  if (h < 11) return 'Guten Morgen';
  if (h < 18) return 'Guten Tag';
  return 'Guten Abend';
})();

// Toast Notification
const toastMessage = ref('');
const toastType = ref<ToastType>('success');
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const showToast = (message: string, type: ToastType = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

// Top Hero Showcase
const topArticle = computed<DashboardArticle | null>(() => {
  return articles.value.find((a) => a.status === 'published' && a.imageUrl) || articles.value[0] || null;
});

const heroCardStyle = computed(() => {
  if (topArticle.value?.imageUrl) {
    return {
      backgroundImage: `url(${config.public.apiUrl}${topArticle.value.imageUrl})`
    };
  }
  return {
    backgroundImage: `url('https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=85')`
  };
});

// Drafts & Tasks
const draftArticles = computed<DashboardArticle[]>(() => {
  return articles.value.filter((a) => a.status === 'draft');
});

const draftCount = computed(() => draftArticles.value.length);

const upcomingArticles = computed<DashboardArticle[]>(() => {
  return articles.value.slice(0, 3);
});

// KPI Calculations
const totalArticlesCount = computed(() => articles.value.length);
const publishedArticlesCount = computed(() => {
  return articles.value.reduce((count, a) => (a.status === 'published' ? count + 1 : count), 0);
});

// Author Leaderboard
const authorStats = computed<AuthorStat[]>(() => {
  let davidCount = 0;
  let stefanCount = 0;
  let orfCount = 0;
  articles.value.forEach((a) => {
    const author = a.author || '';
    if (author.includes('Windischbauer')) {
      davidCount++;
    } else if (author.includes('Schachner')) {
      stefanCount++;
    } else {
      orfCount++;
    }
  });
  const total = articles.value.length || 1;

  return [
    {
      name: 'David Windischbauer',
      role: 'Backend & KI-Architektur',
      count: davidCount,
      percent: Math.round((davidCount / total) * 100),
      color: '#6f8f1a'
    },
    {
      name: 'Stefan Schachner',
      role: 'Frontend & UI-Design',
      count: stefanCount,
      percent: Math.round((stefanCount / total) * 100),
      color: '#a855f7'
    },
    {
      name: 'ORF.at Redaktion',
      role: 'Journalistischer Quell-Feed',
      count: orfCount,
      percent: Math.round((orfCount / total) * 100),
      color: '#10b981'
    }
  ];
});

// Category Distribution
const categoryStats = computed<CategoryStat[]>(() => {
  let politikCount = 0;
  let wirtschaftCount = 0;
  let sportCount = 0;
  let technologieCount = 0;
  let kulturCount = 0;
  articles.value.forEach((a) => {
    switch (a.category) {
      case 'Politik':
        politikCount++;
        break;
      case 'Wirtschaft':
        wirtschaftCount++;
        break;
      case 'Sport':
        sportCount++;
        break;
      case 'Technologie':
        technologieCount++;
        break;
      case 'Kultur':
        kulturCount++;
        break;
    }
  });
  const total = articles.value.length || 1;

  return [
    { name: 'Politik', count: politikCount, percent: Math.round((politikCount / total) * 100), color: '#ef4444' },
    { name: 'Wirtschaft', count: wirtschaftCount, percent: Math.round((wirtschaftCount / total) * 100), color: '#10b981' },
    { name: 'Sport', count: sportCount, percent: Math.round((sportCount / total) * 100), color: '#f59e0b' },
    { name: 'Technologie', count: technologieCount, percent: Math.round((technologieCount / total) * 100), color: '#6f8f1a' },
    { name: 'Kultur', count: kulturCount, percent: Math.round((kulturCount / total) * 100), color: '#d946ef' }
  ];
});

// Subtags available in Modal
const availableSubtags = computed<SubtagDefinition[]>(() => {
  const cat = newArticle.value?.category;
  if (cat && cat !== 'Auto' && CATEGORY_SUBTAGS[cat]) {
    return CATEGORY_SUBTAGS[cat];
  }
  const res: SubtagDefinition[] = [];
  for (const list of Object.values(CATEGORY_SUBTAGS)) {
    res.push(...list.slice(0, 3));
  }
  return res;
});

// Filtering
const filteredArticles = computed<DashboardArticle[]>(() => {
  let list = articles.value;
  if (activeCategory.value !== 'Alle') {
    list = list.filter((a) => a.category === activeCategory.value);
  }
  if (activeTag.value) {
    list = list.filter((a) => (a.tags || []).some((t) => t.name === activeTag.value || t.slug === activeTag.value));
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.author?.toLowerCase().includes(q) ||
        a.content?.toLowerCase().includes(q) ||
        (a.tags || []).some((t) => t.name?.toLowerCase().includes(q))
    );
  }
  return list;
});

// Category & status pill color maps (drive the dynamic :class bindings in the table)
const categoryPillClasses: Record<string, string> = {
  politik: 'bg-[rgba(239,68,68,0.15)] text-[#f87171]',
  wirtschaft: 'bg-[rgba(16,185,129,0.15)] text-[#34d399]',
  sport: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24]',
  technologie: 'bg-[rgba(111,143,26,0.15)] text-[#5c7a14]',
  kultur: 'bg-[rgba(217,70,239,0.15)] text-[#e879f9]'
};

const getCategoryPillClasses = (category?: string): string =>
  categoryPillClasses[(category || '').toLowerCase()] || 'bg-[rgba(20,20,20,0.06)] text-[#24252a]';

const statusBadgeClasses: Record<ArticleStatus, string> = {
  draft: 'bg-[rgba(20,20,20,0.05)] text-text-muted',
  published: 'bg-[rgba(16,185,129,0.15)] text-[#34d399]'
};

const statusDotClasses: Record<ArticleStatus, string> = {
  draft: 'bg-text-muted',
  published: 'bg-[#10b981] shadow-[0_0_6px_#10b981]'
};

// Helper Date Functions
const getMonthAbbr = (dateStr?: string | Date | null): string => {
  if (!dateStr) return 'SEP';
  const d = new Date(dateStr);
  return d.toLocaleString('de-AT', { month: 'short' }).toUpperCase().replace('.', '');
};

const getDayNum = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '16';
  const d = new Date(dateStr);
  return d.getDate().toString().padStart(2, '0');
};

const formatDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '16. Sep 2026';
  return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Modal State
const isModalOpen = ref(false);
const newArticle = ref<ArticleFormState>({
  title: '',
  category: 'Auto',
  author: 'David Windischbauer',
  content: '',
  tags: []
});

const isGeneratingImage = ref(false);
const imageGenState = ref<ImageGenState | null>(null);
let genTimer: ReturnType<typeof setInterval> | null = null;
let genSeconds = 0;

const startGenTimer = () => {
  if (genTimer) clearInterval(genTimer);
  genSeconds = 0;
  genTimer = setInterval(() => {
    genSeconds++;
    if (imageGenState.value && imageGenState.value.type === 'loading') {
      imageGenState.value.elapsed = genSeconds;
    }
  }, 1000);
};

const stopGenTimer = () => {
  if (genTimer) {
    clearInterval(genTimer);
    genTimer = null;
  }
};

const analyticsSummary = ref<AnalyticsSummary>({
  totalImpressions: 0,
  totalReads: 0,
  totalTtsPlays: 0,
  readThroughRate: '0.0%'
});

// API Calls
const fetchArticles = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles`);
    if (res.ok) {
      articles.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch articles', e);
  }
};

const fetchTags = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/tags`);
    if (res.ok) {
      allTags.value = await res.json();
    }
  } catch (e) {
    console.error('Failed to fetch tags', e);
  }
};

const fetchJobsStat = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs`);
    if (res.ok) {
      const data: Array<{ status: string }> = await res.json();
      pendingJobsCount.value = data.filter((j) => j.status === 'pending' || j.status === 'processing').length;
    }
  } catch (e) {
    console.error('Failed to fetch jobs', e);
  }
};

const fetchAnalytics = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/analytics`);
    if (res.ok) {
      analyticsSummary.value = await res.json();
    }
  } catch {
    // analytics are a non-critical enhancement — keep the previous summary on failure
  }
};

const selectArticle = (article: DashboardArticle) => {
  selectedArticle.value = article;
};

const isTagSelected = (name: string): boolean => {
  return (newArticle.value.tags || []).some((t) => t === name);
};

const toggleTag = (name: string) => {
  if (!newArticle.value.tags) newArticle.value.tags = [];
  const idx = newArticle.value.tags.findIndex((t) => t === name);
  if (idx >= 0) {
    newArticle.value.tags.splice(idx, 1);
  } else {
    newArticle.value.tags.push(name);
  }
};

const onCategoryChange = () => {
  // Category updated
};

const onContentInput = () => {
  if ((!newArticle.value.title || newArticle.value.title.trim() === '') && (newArticle.value.content || '').length > 25) {
    const meta = autoExtractArticleMetadata(newArticle.value.content || '', newArticle.value.category);
    newArticle.value.title = meta.title;
  }
};

const pasteFromClipboard = async () => {
  try {
    if (navigator.clipboard) {
      const text = await navigator.clipboard.readText();
      if (text) {
        newArticle.value.content = text;
        autoFillFromContent();
        showToast('Text aus Zwischenablage eingefügt!', 'success');
      }
    }
  } catch (e) {
    console.error('Clipboard access denied', e);
    showToast('Zugriff auf Zwischenablage nicht gestattet', 'error');
  }
};

const autoFillFromContent = async () => {
  if (!newArticle.value.content || newArticle.value.content.length < 10) return;
  isExtracting.value = true;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/auto-extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newArticle.value.content,
        category: newArticle.value.category
      })
    });
    if (res.ok) {
      const meta = await res.json();
      if (!newArticle.value.title || newArticle.value.title.trim() === '') {
        newArticle.value.title = meta.title;
      }
      if (newArticle.value.category === 'Auto' && meta.category) {
        newArticle.value.category = meta.category;
      }
      const tagNames: string[] = (meta.tags || []).map((t: ArticleTag | string) => (typeof t === 'string' ? t : t.name));
      if (!newArticle.value.tags) newArticle.value.tags = [];
      for (const t of tagNames) {
        if (!newArticle.value.tags.includes(t)) {
          newArticle.value.tags.push(t);
        }
      }
      showToast('Titel, Kategorie & Subtags automatisch analysiert!', 'success');
    } else {
      throw new Error('Fallback required');
    }
  } catch (e) {
    console.error('Auto-extract API failed, using local fallback', e);
    const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
    if (!newArticle.value.title || newArticle.value.title.trim() === '') {
      newArticle.value.title = meta.title;
    }
    if (newArticle.value.category === 'Auto' && meta.category) {
      newArticle.value.category = meta.category;
    }
    const tagNames = meta.tags.map((t) => t.name);
    if (!newArticle.value.tags) newArticle.value.tags = [];
    for (const t of tagNames) {
      if (!newArticle.value.tags.includes(t)) {
        newArticle.value.tags.push(t);
      }
    }
    showToast('Titel & Subtags aus Text extrahiert!', 'success');
  } finally {
    isExtracting.value = false;
  }
};

const generateTitleOnly = () => {
  if (!newArticle.value.content || newArticle.value.content.length < 10) return;
  const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
  newArticle.value.title = meta.title;
  showToast('Auto-Titel abgeleitet!', 'success');
};

const toggleStatus = async (article: DashboardArticle) => {
  const newStatus: ArticleStatus = article.status === 'published' ? 'draft' : 'published';
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${article.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      article.status = newStatus;
      showToast(`Status auf "${newStatus === 'published' ? 'Veröffentlicht' : 'Entwurf'}" geändert`, 'success');
    }
  } catch (e) {
    console.error(e);
  }
};

const deleteArticle = async (id: number) => {
  if (!confirm('Artikel wirklich löschen?')) return;
  try {
    await apiFetch(`${config.public.apiUrl}/api/articles/${id}`, {
      method: 'DELETE'
    });
    selectedArticle.value = null;
    showToast('Artikel gelöscht', 'success');
    fetchArticles();
    fetchTags();
  } catch (e) {
    console.error(e);
  }
};

const generateImageForArticle = async (mode: 'editorial' | 'ai' = 'editorial') => {
  if (!selectedArticle.value) return;
  isGeneratingImage.value = true;
  startGenTimer();
  imageGenState.value = {
    type: 'loading',
    message: mode === 'editorial' ? 'Lade hochauflösendes Redaktionsfoto...' : 'KI generiert Titelbild...',
    elapsed: 0
  };

  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}/generate-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    stopGenTimer();
    isGeneratingImage.value = false;

    if (res.ok) {
      const data = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      const listArticle = articles.value.find((a) => a.id === selectedArticle.value?.id);
      if (listArticle) {
        listArticle.imageUrl = data.imageUrl;
      }
      imageGenState.value = {
        type: 'success',
        message: mode === 'editorial' ? 'Redaktionsfoto übernommen!' : `KI-Bild fertiggestellt (${genSeconds}s)!`
      };
      showToast(mode === 'editorial' ? 'Authentisches Redaktionsfoto übernommen!' : 'KI-Bild erfolgreich generiert!', 'success');
      setTimeout(() => {
        if (imageGenState.value?.type === 'success') {
          imageGenState.value = null;
        }
      }, 5000);
    } else {
      imageGenState.value = { type: 'error', message: 'Fehler beim Laden' };
      showToast('Bild konnte nicht geladen werden', 'error');
    }
  } catch (e) {
    console.error(e);
    stopGenTimer();
    isGeneratingImage.value = false;
    imageGenState.value = { type: 'error', message: 'Netzwerkfehler' };
    showToast('Netzwerkfehler beim Bild-Laden', 'error');
  }
};

const removeImage = async (id: number) => {
  if (!confirm('Titelbild entfernen?')) return;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl: null })
    });
    if (res.ok) {
      if (selectedArticle.value && selectedArticle.value.id === id) {
        selectedArticle.value.imageUrl = null;
      }
      const listArticle = articles.value.find((a) => a.id === id);
      if (listArticle) listArticle.imageUrl = null;
      showToast('Titelbild entfernt', 'success');
    }
  } catch (e) {
    console.error(e);
  }
};

const handleImageUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file || !selectedArticle.value) return;
  uploadFile(file);
};

const handleImageDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0];
  if (file && selectedArticle.value) {
    uploadFile(file);
  }
};

const uploadFile = async (file: File) => {
  if (!selectedArticle.value) return;
  const formData = new FormData();
  formData.append('image', file);
  try {
    const res = await fetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}/upload-image`, {
      method: 'POST',
      headers: { 'x-api-key': 'diplomarbeit-secret-key' },
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      const listArticle = articles.value.find((a) => a.id === selectedArticle.value?.id);
      if (listArticle) listArticle.imageUrl = data.imageUrl;
      showToast('Bild erfolgreich hochgeladen', 'success');
    }
  } catch (e) {
    console.error(e);
    showToast('Fehler beim Upload', 'error');
  }
};

const openMobilePreview = () => {
  window.open('http://localhost:3002', '_blank', 'width=375,height=812');
};

const openModal = () => {
  newArticle.value = {
    title: '',
    category: 'Auto',
    author: 'David Windischbauer',
    content: '',
    tags: []
  };
  isModalOpen.value = true;
};

const editArticle = (article: DashboardArticle) => {
  newArticle.value = {
    ...article,
    tags: (article.tags || []).map((t) => t.name)
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

// Resolve the form's string[] tag names back into ArticleTag objects (with color/slug)
// by looking them up in CATEGORY_SUBTAGS. Falls back to a bare { name } when no
// canonical subtag matches (e.g. a free-form tag name from the AI auto-extract).
const resolveTagObjects = (names: string[]): ArticleTag[] => {
  return names.map((name) => {
    for (const list of Object.values(CATEGORY_SUBTAGS)) {
      const match = list.find((s) => s.name === name);
      if (match) return { name: match.name, slug: match.slug, color: match.color };
    }
    return { name };
  });
};

const saveArticle = async () => {
  if (!newArticle.value.content || newArticle.value.content.length < 10) {
    showToast('Bitte Text mit mindestens 10 Zeichen eingeben', 'error');
    return;
  }

  try {
    const isEdit = !!newArticle.value.id;
    const url = isEdit ? `${config.public.apiUrl}/api/articles/${newArticle.value.id}` : `${config.public.apiUrl}/api/articles`;
    const method = isEdit ? 'PUT' : 'POST';

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle.value)
    });

    if (!res.ok) {
      showToast('Fehler beim Speichern des Artikels', 'error');
      return;
    }

    const article = isEdit ? newArticle.value : await res.json();

    if (!isEdit) {
      // Trigger AI teaser generation job
      apiFetch(`${config.public.apiUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, type: 'teaser_generation' })
      }).catch(console.error);

      showToast('Artikel angelegt! KI-Zusammenfassung gestartet...', 'success');
    } else {
      if (selectedArticle.value && selectedArticle.value.id === article.id) {
        // Bug fix: newArticle.value.tags is a plain string[] of tag names (editArticle()
        // maps the form's tags down to strings for the subtag-picker UI above), but
        // selectedArticle.value.tags must stay ArticleTag[] objects — the table/drawer
        // tag pills read tag.name off of them. Resolve the names back to full tag
        // objects (with color/slug from CATEGORY_SUBTAGS) before merging.
        const { tags: formTags, ...rest } = newArticle.value;
        selectedArticle.value = { ...selectedArticle.value, ...rest, tags: resolveTagObjects(formTags) };
      }
      showToast('Artikel aktualisiert!', 'success');
    }

    closeModal();
    fetchArticles();
    fetchTags();
  } catch (e) {
    console.error(e);
    showToast('Netzwerkfehler beim Speichern', 'error');
  }
};

onMounted(() => {
  fetchArticles();
  fetchTags();
  fetchJobsStat();
  fetchAnalytics();
});
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from, .drawer-leave-to {
  transform: translateX(100%);
}

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
