<template>
  <div class="px-8 pt-6 pb-12 max-w-[1440px] mx-auto">
    <!-- Modern Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" class="fixed bottom-8 right-8 z-[999] flex items-center gap-[0.6rem] px-5 py-3 rounded-[10px] text-[0.82rem] font-semibold shadow-[0_8px_24px_rgba(20,20,20,0.12)] backdrop-blur-[12px]" :class="toastType === 'success' ? 'bg-[rgba(16,185,129,0.9)] text-accent-ink' : 'bg-[rgba(239,68,68,0.9)] text-accent-ink'">
        <span class="w-2 h-2 rounded-full bg-accent-ink"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="flex flex-col gap-6">
      <!-- 0. EDITORIAL PAGE HEADER -->
      <div class="flex flex-col gap-[0.15rem] pt-1 px-[0.1rem] pb-2">
        <span class="text-[0.72rem] font-semibold tracking-[0.08em] uppercase text-accent-lime-deep">{{ todayLabel }}</span>
        <h1 class="m-0 font-accent italic font-medium text-[2.4rem] tracking-[-0.01em] text-text-primary">{{ greeting }}, Redaktion.</h1>
      </div>

      <!-- 1. TOP SECTION: Hero Story Showcase + Tasks & Schedule -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <!-- Hero Story Card (Left 2/3) -->
        <div class="hero-card rounded-[28px] bg-cover bg-center relative min-h-[380px] flex flex-col justify-end border border-border-subtle overflow-hidden shadow-[0_8px_30px_rgba(20,20,20,0.12)]" :style="heroCardStyle">
          <div class="absolute inset-0 [background:linear-gradient(to_top,rgba(255,255,255,0.75)_0%,rgba(255,255,255,0.35)_50%,rgba(255,255,255,0.15)_100%)] flex flex-col justify-between p-6">
            <div class="flex items-center gap-[0.6rem]">
              <span class="flex items-center gap-[0.4rem] px-3 py-[0.35rem] rounded-full bg-[rgba(111,143,26,0.15)] border border-[rgba(111,143,26,0.4)] text-[#5c7a14] text-[0.72rem] font-bold tracking-[0.04em] backdrop-blur-[8px]">
                <span class="w-[6px] h-[6px] rounded-full bg-accent-lime-deep shadow-[0_0_8px_#6f8f1a]"></span>
                <span>TOP-STORY IM FEED</span>
              </span>
              <span class="px-3 py-[0.35rem] rounded-full bg-[rgba(20,20,20,0.1)] border border-[rgba(20,20,20,0.15)] text-[#24252a] text-[0.72rem] font-semibold backdrop-blur-[8px]" v-if="topArticle">
                {{ topArticle.category }}
              </span>
            </div>

            <div class="bg-[rgba(255,255,255,0.85)] backdrop-blur-[16px] border border-[rgba(20,20,20,0.1)] rounded-[20px] p-[1.35rem] shadow-[0_8px_32px_rgba(20,20,20,0.10)]">
              <h2 class="m-0 mb-2 text-[1.35rem] font-extrabold leading-[1.3] text-[#14151a] tracking-[-0.02em]" v-if="topArticle">
                {{ topArticle.title }}
              </h2>
              <h2 class="m-0 mb-2 text-[1.35rem] font-extrabold leading-[1.3] text-[#14151a] tracking-[-0.02em]" v-else>
                Keine veröffentlichten Artikel vorhanden
              </h2>

              <p class="m-0 mb-[0.85rem] text-[0.85rem] leading-[1.5] text-[#5a5b61] line-clamp-2" v-if="topArticle && topArticle.teaser">
                {{ topArticle.teaser }}
              </p>

              <div class="flex items-center flex-wrap gap-[1.1rem] mb-4 text-[0.78rem] text-text-secondary" v-if="topArticle">
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

              <div class="flex items-center gap-3" v-if="topArticle">
                <button class="flex items-center gap-[0.45rem] px-[1.1rem] py-2 rounded-full bg-accent-ink border-none text-accent-lime text-[0.82rem] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(20,20,20,0.25)] transition-opacity duration-200 hover:opacity-[0.92]" @click="selectArticle(topArticle)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <span>Im Panel prüfen</span>
                </button>
                <button class="flex items-center gap-[0.45rem] px-4 py-2 rounded-full bg-[rgba(20,20,20,0.08)] border border-[rgba(20,20,20,0.12)] text-[#24252a] text-[0.82rem] font-medium cursor-pointer transition-colors duration-200 hover:bg-[rgba(20,20,20,0.14)]" @click="openMobilePreview">
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
          <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-3">
                <div>
                  <h3 class="m-0 text-[1.15rem] font-medium font-accent italic text-[#14151a]">Zu erledigen</h3>
                  <span class="text-[0.72rem] text-text-muted">Ausstehende Redaktionsaufgaben</span>
                </div>
              </div>
              <span class="text-[0.72rem] px-[0.6rem] py-1 rounded-full bg-[rgba(20,20,20,0.05)] border border-border-subtle text-text-muted font-semibold" :class="{ '!bg-[rgba(245,158,11,0.15)] !border-[rgba(245,158,11,0.35)] !text-[#fbbf24]': draftCount > 0 }">
                {{ draftCount > 0 ? `${draftCount} Entwürfe` : '0 offen' }}
              </span>
            </div>

            <div>
              <div v-if="draftArticles.length > 0" class="flex flex-col gap-[0.6rem]">
                <div
                  v-for="draft in draftArticles.slice(0, 2)"
                  :key="draft.id"
                  class="flex justify-between items-center px-3 py-[0.6rem] bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.06)] hover:border-[rgba(245,158,11,0.3)]"
                  @click="selectArticle(draft)"
                >
                  <div class="flex items-center gap-2 overflow-hidden">
                    <span class="w-[6px] h-[6px] rounded-full bg-[#f59e0b] shrink-0"></span>
                    <span class="text-[0.78rem] text-[#24252a] font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[210px]">{{ draft.title }}</span>
                  </div>
                  <button class="bg-[rgba(16,185,129,0.15)] border border-[rgba(16,185,129,0.35)] text-[#34d399] text-[0.7rem] font-semibold px-[0.55rem] py-1 rounded-md cursor-pointer hover:bg-[rgba(16,185,129,0.25)]" @click.stop="toggleStatus(draft)" title="Freigeben">
                    Freigeben
                  </button>
                </div>
              </div>
              <div v-else class="flex items-center gap-[0.85rem] p-[0.85rem] bg-[rgba(16,185,129,0.05)] border border-dashed border-[rgba(16,185,129,0.25)] rounded-[10px]">
                <div class="w-7 h-7 rounded-full bg-[rgba(16,185,129,0.2)] text-[#34d399] flex items-center justify-center font-extrabold text-[0.85rem]">✓</div>
                <div>
                  <strong class="block text-[0.82rem] text-[#24252a]">Alles erledigt.</strong>
                  <p class="m-0 text-[0.72rem] text-text-muted">Keine ausstehenden Entwürfe oder Freigaben.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card: Nächste Veröffentlichungen -->
          <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
            <div class="flex justify-between items-center mb-4">
              <div class="flex items-center gap-3">
                <div>
                  <h3 class="m-0 text-[1.15rem] font-medium font-accent italic text-[#14151a]">Nächste Veröffentlichungen</h3>
                  <span class="text-[0.72rem] text-text-muted">Redaktions-Kalender 2026</span>
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-[0.65rem]">
              <div
                v-for="item in upcomingArticles"
                :key="item.id"
                class="flex items-center gap-[0.85rem] px-[0.65rem] py-[0.55rem] bg-[rgba(20,20,20,0.02)] border border-border-subtle rounded-lg cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.05)] hover:border-[rgba(111,143,26,0.3)]"
                @click="selectArticle(item)"
              >
                <div class="flex flex-col items-center justify-center w-[38px] h-[38px] rounded-lg bg-[#f4f2ec] border border-[rgba(20,20,20,0.08)] shrink-0">
                  <span class="text-[0.85rem] font-bold text-[#14151a] leading-none">{{ getDayNum(item.createdAt) }}</span>
                  <span class="text-[0.58rem] font-semibold text-[#6c6d73] mt-px">{{ getMonthAbbr(item.createdAt) }}</span>
                </div>
                <div class="flex-1 overflow-hidden">
                  <div>
                    <span class="text-[0.78rem] font-semibold text-[#24252a] whitespace-nowrap overflow-hidden text-ellipsis block">{{ item.title }}</span>
                  </div>
                  <div class="flex items-center gap-[0.4rem] text-[0.7rem] text-text-muted mt-0.5">
                    <span class="text-[#5c7a14] font-semibold">{{ item.category }}</span>
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
        <div class="bg-accent-ink border border-accent-ink rounded-[22px] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] px-[1.4rem] pt-[1.4rem] pb-5 flex flex-col justify-between min-h-[120px] gap-[0.6rem] sm:col-span-2 lg:col-span-1">
          <span class="text-[0.85rem] font-medium font-accent italic !text-[rgba(255,255,255,0.6)]">Verwaltete Artikel</span>
          <div class="font-accent italic font-medium text-[3.4rem] leading-none text-white tracking-[-0.02em]">{{ totalArticlesCount }}</div>
          <div class="text-[0.72rem] mt-3 z-[2] !text-[rgba(255,255,255,0.55)]">
            <span class="text-[#5c7a14] font-semibold !text-accent-lime">{{ publishedArticlesCount }} im Live-Feed</span> • {{ draftCount }} Entwürfe
          </div>
        </div>

        <!-- KPI 2: KI-Pipelines 2026 -->
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] px-[1.4rem] pt-[1.4rem] pb-5 flex flex-col justify-between min-h-[120px] gap-[0.6rem]">
          <span class="text-[0.85rem] text-text-secondary font-medium font-accent italic">KI-Pipelines 2026</span>
          <div class="font-bold text-[#14151a] tracking-[-0.02em] text-[1.35rem] flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
            <span>Aktiv</span>
          </div>
          <div class="text-[0.72rem] text-text-muted mt-3 z-[2]">
            <span>Fastify & qwen2.5:3b-instruct bereit</span>
          </div>
        </div>

        <!-- KPI 3: Nachrichten (Feed) with Cyan Wave -->
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] px-[1.4rem] pt-[1.4rem] pb-5 flex flex-col justify-between min-h-[120px] gap-[0.6rem]">
          <span class="text-[0.85rem] text-text-secondary font-medium font-accent italic">Nachrichten (Feed)</span>
          <div class="text-[1.75rem] font-bold text-[#14151a] tracking-[-0.02em]">{{ publishedArticlesCount }}</div>
          <div class="text-[0.72rem] text-text-muted mt-3 z-[2]">
            <span class="text-[#5c7a14] font-semibold">+100%</span> Bereitstellung
          </div>
          <!-- Cyan Area Sparkline Wave -->
          <svg class="absolute bottom-0 left-0 w-full h-[52px] pointer-events-none z-[1]" viewBox="0 0 300 80" preserveAspectRatio="none">
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
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] px-[1.4rem] pt-[1.4rem] pb-5 flex flex-col justify-between min-h-[120px] gap-[0.6rem]">
          <span class="text-[0.85rem] text-text-secondary font-medium font-accent italic">Feed-Leserate</span>
          <div class="text-[1.75rem] font-bold text-[#14151a] tracking-[-0.02em]">{{ analyticsSummary.readThroughRate || '84.2%' }}</div>
          <div class="text-[0.72rem] text-text-muted mt-3 z-[2]">
            <span>{{ analyticsSummary.totalReads }} Volltext • {{ analyticsSummary.totalImpressions }} Aufrufe</span>
          </div>
          <!-- Amber Area Sparkline Wave -->
          <svg class="absolute bottom-0 left-0 w-full h-[52px] pointer-events-none z-[1]" viewBox="0 0 300 80" preserveAspectRatio="none">
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
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 text-[1.15rem] font-medium font-accent italic text-[#14151a]">Aktivste Autoren</h3>
                <span class="text-[0.72rem] text-text-muted">Beiträge im Diplomarbeits-Semester</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-[0.85rem]">
            <div v-for="author in authorStats" :key="author.name" class="flex flex-col gap-[0.4rem]">
              <div class="flex justify-between items-center">
                <div class="flex flex-col">
                  <span class="text-[0.82rem] font-semibold text-[#24252a]">{{ author.name }}</span>
                  <span class="text-[0.68rem] text-text-muted">{{ author.role }}</span>
                </div>
                <div class="flex items-center gap-[0.3rem] text-[0.76rem]">
                  <span class="font-semibold text-[#14151a]">{{ author.count }} Artikel</span>
                  <span class="text-text-muted">({{ author.percent }}%)</span>
                </div>
              </div>
              <div class="w-full h-[6px] bg-[rgba(20,20,20,0.05)] rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-[width] duration-[400ms] ease-in-out"
                  :style="{ width: `${Math.max(author.percent, 8)}%`, backgroundColor: author.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Artikel nach Kategorie -->
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 text-[1.15rem] font-medium font-accent italic text-[#14151a]">Nach Kategorie</h3>
                <span class="text-[0.72rem] text-text-muted">Thematische Verteilung im Feed</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-[1.1rem]">
            <!-- Segmented horizontal bar -->
            <div class="w-full h-3 rounded-full flex overflow-hidden bg-[rgba(20,20,20,0.04)]">
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
                <span class="w-2 h-2 rounded-full shrink-0" :style="{ backgroundColor: cat.color }"></span>
                <span class="text-text-secondary flex-1">{{ cat.name }}</span>
                <span class="font-semibold text-[#14151a]">{{ cat.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Server & KI-Status -->
        <div class="bg-bg-card border border-border-subtle rounded-[22px] p-[1.35rem] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)]">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center gap-3">
              <div>
                <h3 class="m-0 text-[1.15rem] font-medium font-accent italic text-[#14151a]">Server & KI-Status</h3>
                <span class="text-[0.72rem] text-text-muted">Infrastruktur-Metriken</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center p-3 rounded-lg bg-[rgba(20,20,20,0.02)] border border-border-subtle">
              <div class="text-[1.25rem] font-extrabold text-[#14151a]">0,53 Last</div>
              <div class="flex items-center gap-[0.4rem] text-[0.74rem] font-semibold text-[#34d399]">
                <span class="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981]"></span>
                <span>Läuft stabil</span>
              </div>
            </div>

            <div class="flex flex-col gap-[0.65rem]">
              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>Fastify REST API (Port 3005)</span>
                  <span class="font-semibold text-[#14151a]">Online</span>
                </div>
                <div class="w-full h-[5px] bg-[rgba(20,20,20,0.05)] rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-accent-lime-deep" style="width: 100%;"></div>
                </div>
              </div>

              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>PostgreSQL & Redis Queue</span>
                  <span class="font-semibold text-[#14151a]">Aktiv</span>
                </div>
                <div class="w-full h-[5px] bg-[rgba(20,20,20,0.05)] rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-[#10b981]" style="width: 100%;"></div>
                </div>
              </div>

              <div class="flex flex-col gap-[0.3rem]">
                <div class="flex justify-between text-[0.72rem] text-text-secondary">
                  <span>Ollama LLM (qwen2.5)</span>
                  <span class="font-semibold text-[#14151a]">1.2 GB VRAM</span>
                </div>
                <div class="w-full h-[5px] bg-[rgba(20,20,20,0.05)] rounded-full overflow-hidden">
                  <div class="h-full rounded-full bg-[#a855f7]" style="width: 32%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ARTICLE MANAGEMENT & TABLE SECTION -->
      <div class="bg-bg-card border border-border-subtle rounded-[22px] shadow-[0_4px_20px_rgba(20,20,20,0.05)] relative overflow-hidden transition-[border-color,transform] duration-200 hover:border-[rgba(20,20,20,0.14)] p-6">
        <div class="flex flex-col gap-4 mb-5 md:flex-row md:justify-between md:items-center">
          <div>
            <h3 class="m-0 text-[1.15rem] font-extrabold text-[#14151a]">Artikel verwalten</h3>
            <p class="mt-[0.2rem] mb-0 text-[0.76rem] text-text-muted">Übersicht aller redaktionellen Short-Form-Inhalte</p>
          </div>

          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg px-[0.85rem] py-[0.45rem] text-text-secondary focus-within:border-border-focus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" v-model="searchQuery" placeholder="Suchen nach Titel, Tags, Autor..." class="bg-transparent border-none outline-none text-[#14151a] text-[0.8rem] w-[180px] placeholder:text-text-muted" />
              <button v-if="searchQuery" @click="searchQuery = ''" class="bg-transparent border-none text-text-muted cursor-pointer text-base">&times;</button>
            </div>
            <button class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.55rem] rounded-full bg-accent-ink border-none text-accent-lime text-[0.82rem] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]" @click="openModal">
              <span class="text-base font-bold">+</span> Neuer Artikel
            </button>
          </div>
        </div>

        <!-- Filter Chips (Categories) -->
        <div class="flex gap-2 flex-wrap mb-[0.85rem]">
          <button
            v-for="cat in categories"
            :key="cat"
            class="px-[0.85rem] py-[0.35rem] rounded-full bg-[rgba(20,20,20,0.03)] border border-border-subtle text-text-secondary text-[0.76rem] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.07)] hover:text-[#14151a]"
            :class="{ '!bg-accent-lime !border-accent-lime !text-[#14151a] !font-semibold [box-shadow:0_0_10px_rgba(213,242,78,0.5)]': activeCategory === cat }"
            @click="activeCategory = cat; activeTag = null"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Subtag Filter Chips: canonical subcategories for the active main category,
             falls back to live tags from the data when "Alle" is selected -->
        <div class="flex items-center gap-[0.45rem] flex-wrap mb-5 px-3 py-2 bg-[rgba(20,20,20,0.02)] rounded-lg border border-border-subtle" v-if="canonicalSubtagsForActiveCategory.length > 0">
          <span class="text-[0.72rem] text-text-muted font-semibold">Subkategorie:</span>
          <button
            class="px-3 py-[0.3rem] rounded-full bg-transparent border border-[rgba(20,20,20,0.12)] text-text-secondary text-[0.74rem] font-medium cursor-pointer transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ '!bg-[rgba(111,143,26,0.15)] !border-accent-lime-deep !text-accent-lime-deep !font-semibold': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="sub in canonicalSubtagsForActiveCategory"
            :key="sub.slug"
            class="px-3 py-[0.3rem] rounded-full bg-transparent border border-[rgba(20,20,20,0.12)] text-text-secondary text-[0.74rem] font-medium cursor-pointer transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ '!bg-[rgba(111,143,26,0.15)] !border-accent-lime-deep !text-accent-lime-deep !font-semibold': activeTag === sub.name }"
            @click="activeTag = activeTag === sub.name ? null : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
        <div class="flex items-center gap-[0.45rem] flex-wrap mb-5 px-3 py-2 bg-[rgba(20,20,20,0.02)] rounded-lg border border-border-subtle" v-else-if="allTags && allTags.length > 0">
          <span class="text-[0.72rem] text-text-muted font-semibold">Filter Subtags:</span>
          <button
            class="px-3 py-[0.3rem] rounded-full bg-transparent border border-[rgba(20,20,20,0.12)] text-text-secondary text-[0.74rem] font-medium cursor-pointer transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ '!bg-[rgba(111,143,26,0.15)] !border-accent-lime-deep !text-accent-lime-deep !font-semibold': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="t in allTags"
            :key="t.id"
            class="px-3 py-[0.3rem] rounded-full bg-transparent border border-[rgba(20,20,20,0.12)] text-text-secondary text-[0.74rem] font-medium cursor-pointer transition-all duration-200 hover:border-[rgba(111,143,26,0.4)] hover:text-[#14151a]"
            :class="{ '!bg-[rgba(111,143,26,0.15)] !border-accent-lime-deep !text-accent-lime-deep !font-semibold': activeTag === t.name }"
            @click="activeTag = activeTag === t.name ? null : t.name"
          >
            #{{ t.name }} <span v-if="t.articleCount > 0" class="opacity-75">({{ t.articleCount }})</span>
          </button>
        </div>

        <!-- Carbon Data Table -->
        <div class="overflow-x-auto">
          <table class="w-full border-separate [border-spacing:0_4px]">
            <thead>
              <tr>
                <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle w-[70px]">Cover</th>
                <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle">Titel & Redaktionsinhalte</th>
                <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle w-[130px]">Kategorie</th>
                <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle w-[140px]">Autor</th>
                <th class="text-left px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle w-[120px]">Status</th>
                <th class="text-right px-4 py-3 text-[0.72rem] font-semibold text-text-muted tracking-[0.03em] uppercase border-b border-border-subtle w-[160px]">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="article in filteredArticles"
                :key="article.id"
                class="bg-[rgba(20,20,20,0.02)] transition-all duration-200 cursor-pointer hover:bg-[rgba(20,20,20,0.04)]"
                :class="{ '!bg-[rgba(111,143,26,0.08)] border-l-2 border-l-accent-lime-deep': selectedArticle && selectedArticle.id === article.id }"
                @click="selectArticle(article)"
              >
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg">
                  <div class="w-[52px] h-[38px] rounded-md overflow-hidden bg-[#f4f2ec] flex items-center justify-center border border-border-subtle">
                    <img
                      v-if="article.imageUrl"
                      :src="`${config.public.apiUrl}${article.imageUrl}`"
                      class="w-full h-full object-cover"
                      alt="Cover"
                    />
                    <div v-else class="text-text-muted">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg">
                  <div class="flex flex-col gap-1">
                    <span class="font-semibold text-[#14151a] leading-[1.35]">{{ article.title }}</span>
                    <div class="flex gap-[0.35rem] flex-wrap" v-if="article.tags && article.tags.length > 0">
                      <span v-for="t in article.tags" :key="t.id || t.name" class="text-[0.65rem] px-[0.45rem] py-[0.1rem] rounded-[4px] bg-[rgba(20,20,20,0.04)] text-text-secondary">
                        #{{ t.name }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg">
                  <span
                    class="text-[0.72rem] px-[0.65rem] py-1 rounded-full font-semibold inline-block bg-[rgba(20,20,20,0.06)]"
                    :class="{
                      'bg-[rgba(239,68,68,0.15)] text-[#f87171]': article.category?.toLowerCase() === 'politik',
                      'bg-[rgba(16,185,129,0.15)] text-[#34d399]': article.category?.toLowerCase() === 'wirtschaft',
                      'bg-[rgba(245,158,11,0.15)] text-[#fbbf24]': article.category?.toLowerCase() === 'sport',
                      'bg-[rgba(111,143,26,0.15)] text-[#5c7a14]': article.category?.toLowerCase() === 'technologie',
                      'bg-[rgba(217,70,239,0.15)] text-[#e879f9]': article.category?.toLowerCase() === 'kultur'
                    }"
                  >
                    {{ article.category }}
                  </span>
                </td>
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg">
                  <span class="text-[0.78rem] text-text-secondary">{{ article.author }}</span>
                </td>
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg">
                  <span
                    class="inline-flex items-center gap-[0.35rem] text-[0.72rem] px-[0.65rem] py-1 rounded-full font-semibold"
                    :class="article.status === 'published' ? 'bg-[rgba(16,185,129,0.15)] text-[#34d399]' : 'bg-[rgba(20,20,20,0.05)] text-text-muted'"
                  >
                    <span class="w-[6px] h-[6px] rounded-full" :class="article.status === 'published' ? 'bg-[#10b981] shadow-[0_0_6px_#10b981]' : 'bg-text-muted'"></span>
                    <span>{{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}</span>
                  </span>
                </td>
                <td class="px-4 py-[0.85rem] text-[0.82rem] text-[#24252a] align-middle first:rounded-l-lg last:rounded-r-lg text-right">
                  <div class="flex justify-end gap-[0.4rem]" @click.stop>
                    <button class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-text-secondary text-[0.72rem] font-medium px-[0.6rem] py-1 cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]" @click="selectArticle(article)" title="Vorschau im Detailpanel">
                      Vorschau
                    </button>
                    <button class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-text-secondary text-[0.72rem] font-medium px-[0.6rem] py-1 cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]" @click="toggleStatus(article)" title="Status ändern">
                      {{ article.status === 'published' ? 'Entwurf' : 'Live' }}
                    </button>
                    <button class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-[#f87171] text-[0.72rem] font-medium px-[0.6rem] py-1 cursor-pointer transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]" @click="deleteArticle(article.id)" title="Löschen">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0">
                <td colspan="6" class="text-center py-12 px-4">
                  <div class="flex flex-col items-center">
                    <span class="text-[2rem] mb-2">🔍</span>
                    <p class="m-0 text-[0.95rem] font-semibold text-[#14151a]">Keine passenden Artikel gefunden</p>
                    <p class="mt-1 mb-0 text-[0.76rem] text-text-muted">Passe deine Filterkriterien an oder erstelle einen neuen Beitrag.</p>
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
      <div class="fixed top-0 right-0 w-[440px] max-w-[90vw] h-screen bg-[rgba(255,255,255,0.9)] backdrop-blur-[20px] border-l border-border-subtle shadow-[-10px_0_40px_rgba(20,20,20,0.14)] z-[200] flex flex-col" v-if="selectedArticle">
        <div class="flex justify-between items-center px-6 py-5 border-b border-border-subtle">
          <div class="flex items-center gap-[0.65rem]">
            <h3 class="m-0 text-[1.05rem] font-bold text-[#14151a]">Live-Vorschau</h3>
            <span class="flex items-center gap-[0.35rem] px-[0.55rem] py-[0.2rem] rounded-full bg-[rgba(111,143,26,0.12)] border border-[rgba(111,143,26,0.3)] text-[#5c7a14] text-[0.68rem] font-semibold">
              <span class="w-[6px] h-[6px] rounded-full bg-accent-lime-deep shadow-[0_0_8px_#6f8f1a]"></span>
              <span>Echtzeit-Sync</span>
            </span>
          </div>
          <button class="bg-transparent border-none text-text-muted text-2xl cursor-pointer leading-none hover:text-[#14151a]" @click="selectedArticle = null">&times;</button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <!-- Cover Image Section -->
          <div v-if="selectedArticle.imageUrl" class="w-full h-[200px] rounded-xl bg-cover bg-center relative overflow-hidden border border-border-subtle" :style="{ backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` }">
            <div class="absolute inset-0 [background:linear-gradient(to_top,rgba(20,20,20,0.22)_0%,rgba(20,20,20,0.05)_60%)] flex flex-col justify-end p-[0.85rem] gap-2">
              <div class="flex gap-2 flex-wrap">
                <button
                  class="flex items-center gap-[0.35rem] px-3 py-[0.35rem] rounded-full bg-[rgba(20,20,20,0.7)] border border-[rgba(255,255,255,0.2)] text-white text-[0.72rem] font-semibold cursor-pointer backdrop-blur-[8px] hover:bg-[rgba(20,20,20,0.55)]"
                  :disabled="isGeneratingImage"
                  @click="generateImageForArticle('editorial')"
                  title="Authentisches, hochauflösendes Redaktionsfoto laden"
                >
                  <span v-if="isGeneratingImage" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-current rounded-full animate-btn-spin"></span>
                  <span v-else>📷</span>
                  Redaktionsfoto laden
                </button>
                <button
                  class="flex items-center gap-[0.35rem] px-3 py-[0.35rem] rounded-full bg-[rgba(20,20,20,0.7)] border border-[rgba(255,255,255,0.2)] text-white text-[0.72rem] font-semibold cursor-pointer backdrop-blur-[8px] hover:bg-[rgba(20,20,20,0.55)]"
                  :disabled="isGeneratingImage"
                  @click="generateImageForArticle('ai')"
                  title="Ohne laufendes LocalAI (Nvidia-GPU nötig) landet das beim kostenlosen Pollinations-Fallback: niedrigere Auflösung (576×1024), Ergebnis passt nicht immer zum Artikel. 'Redaktionsfoto laden' ist zuverlässiger."
                >
                  <span v-if="isGeneratingImage" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-current rounded-full animate-btn-spin"></span>
                  <span v-else>✨</span>
                  KI-Bild (Fallback ohne GPU)
                </button>
              </div>

              <!-- Live image gen status -->
              <div
                v-if="imageGenState"
                class="flex items-center gap-[0.4rem] text-[0.72rem] px-[0.6rem] py-[0.3rem] rounded-full bg-[rgba(20,20,20,0.7)] text-white"
                :class="imageGenState.type === 'loading' ? 'text-accent-lime' : imageGenState.type === 'success' ? 'text-[#34d399]' : imageGenState.type === 'error' ? 'text-[#f87171]' : ''"
              >
                <span v-if="imageGenState.type === 'loading'" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-current rounded-full animate-btn-spin"></span>
                <span v-else-if="imageGenState.type === 'error'">⚠️</span>
                <span v-else-if="imageGenState.type === 'success'">✓</span>
                <span>{{ imageGenState.message }}</span>
                <span v-if="imageGenState.elapsed">({{ imageGenState.elapsed }}s)</span>
              </div>

              <button class="self-start bg-transparent border-none text-[#f87171] text-[0.68rem] cursor-pointer underline" @click="removeImage(selectedArticle.id)">Bild löschen</button>
            </div>
          </div>

          <!-- Empty Image Placeholder -->
          <div v-else class="w-full h-[180px] rounded-xl bg-[rgba(20,20,20,0.02)] border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-text-muted gap-[0.6rem] p-4" @dragover.prevent @drop.prevent="handleImageDrop">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <p class="m-0 text-[0.8rem] text-text-secondary">Kein Titelbild hinterlegt</p>
            <div class="flex gap-2 flex-wrap justify-center">
              <button
                class="flex items-center gap-[0.35rem] px-[0.8rem] py-[0.4rem] rounded-full bg-accent-ink border-none text-accent-lime text-[0.74rem] font-semibold cursor-pointer"
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('editorial')"
              >
                <span v-if="isGeneratingImage" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-current rounded-full animate-btn-spin"></span>
                <span v-else>📷</span>
                Redaktionsfoto laden
              </button>
              <button
                class="flex items-center gap-[0.35rem] px-[0.8rem] py-[0.4rem] rounded-md bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.35)] text-[#c084fc] text-[0.74rem] font-semibold cursor-pointer"
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('ai')"
                title="Ohne laufendes LocalAI (Nvidia-GPU nötig) landet das beim kostenlosen Pollinations-Fallback: niedrigere Auflösung, Ergebnis passt nicht immer zum Artikel. 'Redaktionsfoto laden' ist zuverlässiger."
              >
                <span>✨</span> KI-Bild (Fallback-Qualität ohne GPU)
              </button>
              <label class="px-[0.8rem] py-[0.4rem] rounded-md bg-[rgba(20,20,20,0.05)] border border-border-subtle text-text-secondary text-[0.74rem] cursor-pointer">
                Upload
                <input type="file" accept="image/*" @change="handleImageUpload" style="display: none;" />
              </label>
            </div>
            <div
              v-if="imageGenState"
              class="flex items-center gap-[0.4rem] text-[0.72rem] px-[0.6rem] py-[0.3rem] rounded-full bg-[rgba(20,20,20,0.7)] text-white"
              :class="imageGenState.type === 'loading' ? 'text-accent-lime' : imageGenState.type === 'success' ? 'text-[#34d399]' : imageGenState.type === 'error' ? 'text-[#f87171]' : ''"
            >
              <span>{{ imageGenState.message }}</span>
            </div>
          </div>

          <!-- Meta & Category Row -->
          <div class="flex items-center gap-[0.6rem] flex-wrap">
            <span class="text-[0.72rem] font-bold px-[0.65rem] py-1 rounded-full bg-[#efece3] text-[#5c7a14] border border-[rgba(92,122,20,0.3)]">{{ selectedArticle.category }}</span>
            <div class="flex gap-[0.35rem] flex-wrap" v-if="selectedArticle.tags && selectedArticle.tags.length > 0">
              <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="text-[0.7rem] px-[0.55rem] py-[0.2rem] rounded-md bg-[rgba(20,20,20,0.04)] border border-border-subtle text-text-secondary">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Article Title -->
          <h2 class="m-0 text-[1.25rem] font-extrabold text-[#14151a] leading-[1.35]">{{ selectedArticle.title }}</h2>

          <!-- KI-Zusammenfassung Box -->
          <div class="rounded-[10px] p-[0.95rem] bg-[rgba(111,143,26,0.06)] border border-[rgba(111,143,26,0.2)]" v-if="selectedArticle.teaser">
            <div class="flex items-center gap-[0.4rem] text-[0.78rem] text-[#24252a] mb-2">
              <span>✨</span>
              <strong>KI-Zusammenfassung (Teaser)</strong>
            </div>
            <p class="m-0 text-[0.8rem] leading-[1.5] text-[#5a5b61]">{{ selectedArticle.teaser }}</p>
          </div>

          <!-- KI-Kernpunkte Box -->
          <div class="rounded-[10px] p-[0.95rem] bg-[rgba(168,85,247,0.06)] border border-[rgba(168,85,247,0.2)]" v-if="selectedArticle.keyTakeaways">
            <div class="flex items-center gap-[0.4rem] text-[0.78rem] text-[#24252a] mb-2">
              <span>📌</span>
              <strong>KI-Kernpunkte</strong>
            </div>
            <ul class="m-0 pl-[1.2rem] text-[0.8rem] leading-[1.5] text-[#5a5b61] list-disc">
              <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point" class="mb-[0.3rem]">
                {{ point }}
              </li>
            </ul>
          </div>

          <!-- Author & Meta -->
          <div class="text-[0.74rem] text-text-muted">
            {{ selectedArticle.author }} • {{ estimateReadingTime(selectedArticle.content) }} • {{ formatDate(selectedArticle.createdAt) }}
          </div>

          <!-- Article Content -->
          <div class="text-[0.82rem] leading-[1.6] text-[#3f4046] whitespace-pre-line">
            {{ selectedArticle.content }}
          </div>
        </div>

        <!-- Drawer Footer Actions -->
        <div class="flex flex-col gap-[0.6rem] px-6 py-5 border-t border-border-subtle bg-[rgba(255,255,255,0.85)]">
          <button class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.55rem] rounded-full bg-accent-ink border-none text-accent-lime text-[0.82rem] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]" @click="toggleStatus(selectedArticle)">
            {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
          </button>
          <button class="p-2 rounded-lg bg-[rgba(20,20,20,0.05)] border border-border-subtle text-[#24252a] text-[0.8rem] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.1)]" @click="openMobilePreview">
            Mobile Ansicht (3002)
          </button>
          <button class="p-2 rounded-lg bg-[rgba(20,20,20,0.05)] border border-border-subtle text-[#24252a] text-[0.8rem] font-medium cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.1)]" @click="editArticle(selectedArticle)">
            Bearbeiten
          </button>
          <button class="p-2 rounded-lg bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] text-[#f87171] text-[0.8rem] font-semibold cursor-pointer hover:bg-[rgba(239,68,68,0.2)]" @click="deleteArticle(selectedArticle.id)">
            Löschen
          </button>
        </div>
      </div>
    </transition>

    <!-- 6. MODAL: "+ Neuer Artikel / Bearbeiten" -->
    <div class="fixed inset-0 bg-[rgba(20,20,20,0.18)] backdrop-blur-[8px] flex items-center justify-center z-[300] p-4" v-if="isModalOpen" @click.self="closeModal">
      <div class="w-[680px] max-w-full max-h-[90vh] overflow-y-auto bg-[#f4f2ec] border border-border-subtle rounded-2xl shadow-[0_16px_50px_rgba(20,20,20,0.16)] p-7">
        <div class="flex justify-between items-start mb-6">
          <div>
            <h3 class="m-0 text-[1.25rem] font-extrabold text-[#14151a]">{{ newArticle.id ? 'Artikel bearbeiten' : 'Neuen Artikel einpflegen' }}</h3>
            <p class="mt-[0.2rem] mb-0 text-[0.78rem] text-text-muted">Short-Form-Inhalte erstellen mit automatischer KI-Extraktion</p>
          </div>
          <button class="bg-transparent border-none text-text-muted text-[1.6rem] cursor-pointer leading-none hover:text-[#14151a]" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="saveArticle" class="flex flex-col gap-5">
          <!-- Textarea / Content Input -->
          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex justify-between items-center">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Artikel-Fließtext (Quelle)</label>
              <div class="flex gap-[0.4rem]">
                <button type="button" class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-text-secondary text-[0.72rem] font-medium px-[0.55rem] py-1 cursor-pointer hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]" @click="pasteFromClipboard">
                  📋 Zwischenablage
                </button>
                <button
                  type="button"
                  class="bg-[rgba(111,143,26,0.12)] border border-[rgba(111,143,26,0.3)] rounded-md text-accent-lime-deep text-[0.72rem] font-medium px-[0.55rem] py-1 cursor-pointer hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                  :disabled="isExtracting"
                  @click="autoFillFromContent"
                >
                  <span v-if="isExtracting" class="w-3 h-3 border-2 border-[rgba(20,20,20,0.2)] border-t-current rounded-full animate-btn-spin inline-block"></span>
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
              class="bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg px-[0.85rem] py-[0.65rem] text-[#14151a] text-[0.82rem] font-[inherit] outline-none transition-colors duration-200 focus:border-border-focus"
              @input="onContentInput"
            ></textarea>
          </div>

          <!-- Title Input with Auto-Title Generator -->
          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex justify-between items-center">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Überschrift / Titel</label>
              <button type="button" class="bg-[rgba(20,20,20,0.04)] border border-border-subtle rounded-md text-text-secondary text-[0.72rem] font-medium px-[0.55rem] py-1 cursor-pointer hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]" @click="generateTitleOnly" title="Titel automatisch aus dem ersten Satz ableiten">
                ⚡ Auto-Titel
              </button>
            </div>
            <input
              type="text"
              v-model="newArticle.title"
              placeholder="Prägnanter Titel für vertikalen Feed..."
              required
              class="bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg px-[0.85rem] py-[0.65rem] text-[#14151a] text-[0.82rem] font-[inherit] outline-none transition-colors duration-200 focus:border-border-focus"
            />
          </div>

          <!-- Category & Author Row -->
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-[0.4rem]">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Kategorie</label>
              <select v-model="newArticle.category" @change="onCategoryChange" class="bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg px-[0.85rem] py-[0.65rem] text-[#14151a] text-[0.82rem] font-[inherit] outline-none transition-colors duration-200 focus:border-border-focus">
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
                type="text"
                v-model="newArticle.author"
                list="author-suggestions"
                placeholder="z.B. David Windischbauer, ORF.at..."
                class="bg-[rgba(20,20,20,0.03)] border border-border-subtle rounded-lg px-[0.85rem] py-[0.65rem] text-[#14151a] text-[0.82rem] font-[inherit] outline-none transition-colors duration-200 focus:border-border-focus"
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
            <div class="flex flex-wrap gap-[0.45rem] mt-1">
              <button
                type="button"
                v-for="sub in availableSubtags"
                :key="sub.slug"
                class="flex items-center gap-[0.4rem] px-[0.7rem] py-[0.35rem] rounded-md bg-[rgba(20,20,20,0.03)] border border-border-subtle text-text-secondary text-[0.74rem] cursor-pointer transition-all duration-200 hover:bg-[rgba(20,20,20,0.07)]"
                :class="{ '!bg-[rgba(111,143,26,0.15)] !border-accent-lime-deep !text-accent-lime-deep !font-semibold': isTagSelected(sub.name) }"
                @click="toggleTag(sub.name)"
              >
                <span class="w-[6px] h-[6px] rounded-full" :style="{ backgroundColor: sub.color || 'var(--accent-cyan)' }"></span>
                <span>{{ sub.name }}</span>
              </button>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="flex justify-end gap-3 mt-3 pt-4 border-t border-border-subtle">
            <button type="button" class="px-[1.1rem] py-[0.55rem] rounded-lg bg-transparent border border-border-subtle text-text-secondary text-[0.82rem] cursor-pointer hover:bg-[rgba(20,20,20,0.05)] hover:text-[#14151a]" @click="closeModal">Abbrechen</button>
            <button type="submit" class="flex items-center gap-[0.45rem] px-[1.1rem] py-[0.55rem] rounded-full bg-accent-ink border-none text-accent-lime text-[0.82rem] font-semibold cursor-pointer shadow-[0_4px_14px_rgba(20,20,20,0.2)] transition-all duration-200 hover:opacity-[0.92] hover:shadow-[0_0_20px_rgba(111,143,26,0.45)]">
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
import { parseKeyTakeaways, estimateReadingTime, CATEGORY_SUBTAGS, autoExtractArticleMetadata, type Article, type ArticleTag } from '@wb-news/shortform-news';

interface ArticleForm {
  id?: number;
  title: string;
  category: string;
  author: string;
  content: string;
  tags: string[];
  [key: string]: unknown;
}

interface ImageGenState {
  type: 'loading' | 'success' | 'error';
  message: string;
  elapsed?: number;
}

interface AnalyticsSummary {
  totalImpressions: number;
  totalReads: number;
  totalTtsPlays: number;
  readThroughRate: string;
  [key: string]: unknown;
}

interface Job {
  status?: string | null;
}

interface TagWithCount extends ArticleTag {
  articleCount: number;
}

const config = useRuntimeConfig();

const articles = ref<Article[]>([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');
const allTags = ref<TagWithCount[]>([]);

// Canonical subcategories (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const canonicalSubtagsForActiveCategory = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);
const activeTag = ref<string | null>(null);
const searchQuery = ref('');
const selectedArticle = ref<Article | null>(null);
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
const toastType = ref<'success' | 'error'>('success');
let toastTimeout: ReturnType<typeof setTimeout> | null = null;

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastMessage.value = '';
  }, 3500);
};

// Top Hero Showcase
const topArticle = computed(() => {
  return articles.value.find(a => a.status === 'published' && a.imageUrl) || articles.value[0] || null;
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
const draftArticles = computed(() => {
  return articles.value.filter(a => a.status === 'draft');
});

const draftCount = computed(() => draftArticles.value.length);

const upcomingArticles = computed(() => {
  return articles.value.slice(0, 3);
});

// KPI Calculations
const totalArticlesCount = computed(() => articles.value.length);
const publishedArticlesCount = computed(() => {
  return articles.value.reduce((count, a) => (a.status === 'published' ? count + 1 : count), 0);
});

// Author Leaderboard
interface AuthorCounts {
  'David Windischbauer': number;
  'Stefan Schachner': number;
  'ORF.at Redaktion': number;
}

const authorStats = computed(() => {
  const map: AuthorCounts = {
    'David Windischbauer': 0,
    'Stefan Schachner': 0,
    'ORF.at Redaktion': 0
  };
  const total = articles.value.length || 1;
  articles.value.forEach(a => {
    const author = a.author || '';
    if (author.includes('Windischbauer')) {
      map['David Windischbauer']++;
    } else if (author.includes('Schachner')) {
      map['Stefan Schachner']++;
    } else {
      map['ORF.at Redaktion']++;
    }
  });

  return [
    { 
      name: 'David Windischbauer', 
      role: 'Backend & KI-Architektur', 
      count: map['David Windischbauer'], 
      percent: Math.round((map['David Windischbauer'] / total) * 100), 
      color: '#6f8f1a' 
    },
    { 
      name: 'Stefan Schachner', 
      role: 'Frontend & UI-Design', 
      count: map['Stefan Schachner'], 
      percent: Math.round((map['Stefan Schachner'] / total) * 100), 
      color: '#a855f7' 
    },
    { 
      name: 'ORF.at Redaktion', 
      role: 'Journalistischer Quell-Feed', 
      count: map['ORF.at Redaktion'], 
      percent: Math.round((map['ORF.at Redaktion'] / total) * 100), 
      color: '#10b981' 
    }
  ];
});

// Category Distribution
const categoryStats = computed(() => {
  const catCounts: Record<string, number> = {
    Politik: 0,
    Wirtschaft: 0,
    Sport: 0,
    Technologie: 0,
    Kultur: 0
  };
  const total = articles.value.length || 1;
  articles.value.forEach(a => {
    if (catCounts[a.category] !== undefined) {
      catCounts[a.category] = (catCounts[a.category] || 0) + 1;
    }
  });

  const politik = catCounts['Politik'] || 0;
  const wirtschaft = catCounts['Wirtschaft'] || 0;
  const sport = catCounts['Sport'] || 0;
  const technologie = catCounts['Technologie'] || 0;
  const kultur = catCounts['Kultur'] || 0;

  return [
    { name: 'Politik', count: politik, percent: Math.round((politik / total) * 100), color: '#ef4444' },
    { name: 'Wirtschaft', count: wirtschaft, percent: Math.round((wirtschaft / total) * 100), color: '#10b981' },
    { name: 'Sport', count: sport, percent: Math.round((sport / total) * 100), color: '#f59e0b' },
    { name: 'Technologie', count: technologie, percent: Math.round((technologie / total) * 100), color: '#6f8f1a' },
    { name: 'Kultur', count: kultur, percent: Math.round((kultur / total) * 100), color: '#d946ef' }
  ];
});

// Subtags available in Modal
const availableSubtags = computed(() => {
  const cat = newArticle.value?.category;
  if (cat && cat !== 'Auto' && CATEGORY_SUBTAGS[cat]) {
    return CATEGORY_SUBTAGS[cat];
  }
  const res = [];
  for (const list of Object.values(CATEGORY_SUBTAGS)) {
    res.push(...list.slice(0, 3));
  }
  return res;
});

// Filtering
const filteredArticles = computed(() => {
  let list = articles.value;
  if (activeCategory.value !== 'Alle') {
    list = list.filter(a => a.category === activeCategory.value);
  }
  if (activeTag.value) {
    list = list.filter(a => (a.tags || []).some((t: ArticleTag) => t.name === activeTag.value || t.slug === activeTag.value));
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q) ||
      (a.tags || []).some((t: ArticleTag) => t.name?.toLowerCase().includes(q))
    );
  }
  return list;
});

// Helper Date Functions
const getMonthAbbr = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return 'SEP';
  const d = new Date(dateStr);
  return d.toLocaleString('de-AT', { month: 'short' }).toUpperCase().replace('.', '');
};

const getDayNum = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '16';
  const d = new Date(dateStr);
  return d.getDate().toString().padStart(2, '0');
};

const formatDate = (dateStr: string | Date | null | undefined) => {
  if (!dateStr) return '16. Sep 2026';
  return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Modal State
const isModalOpen = ref(false);
const newArticle = ref<ArticleForm>({
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
      const data: Job[] = await res.json();
      pendingJobsCount.value = data.filter(j => j.status === 'pending' || j.status === 'processing').length;
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
    // Analytics endpoint unavailable — leave summary as-is
  }
};

const selectArticle = (article: Article) => {
  selectedArticle.value = article;
};

const isTagSelected = (name: string) => {
  return (newArticle.value.tags || []).some(t => t === name);
};

const toggleTag = (name: string) => {
  if (!newArticle.value.tags) newArticle.value.tags = [];
  const idx = newArticle.value.tags.findIndex(t => t === name);
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
  if ((!newArticle.value.title || newArticle.value.title.trim() === '') && newArticle.value.content.length > 25) {
    const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
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
  } catch {
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
      const meta: { title?: string; category?: string; tags?: Array<{ name: string }> } = await res.json();
      if (!newArticle.value.title || newArticle.value.title.trim() === '') {
        newArticle.value.title = meta.title || '';
      }
      if (newArticle.value.category === 'Auto' && meta.category) {
        newArticle.value.category = meta.category;
      }
      const tagNames = (meta.tags || []).map(t => t.name);
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
  } catch {
    const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
    if (!newArticle.value.title || newArticle.value.title.trim() === '') {
      newArticle.value.title = meta.title;
    }
    if (newArticle.value.category === 'Auto' && meta.category) {
      newArticle.value.category = meta.category;
    }
    const tagNames = (meta.tags || []).map(t => t.name);
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

const toggleStatus = async (article: Article) => {
  const newStatus = article.status === 'published' ? 'draft' : 'published';
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
      const data: { imageUrl: string } = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      const idx = articles.value.findIndex(a => a.id === selectedArticle.value?.id);
      const target = idx >= 0 ? articles.value[idx] : undefined;
      if (target) {
        target.imageUrl = data.imageUrl;
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
  } catch {
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
      const idx = articles.value.findIndex(a => a.id === id);
      const target = idx >= 0 ? articles.value[idx] : undefined;
      if (target) target.imageUrl = null;
      showToast('Titelbild entfernt', 'success');
    }
  } catch (e) {
    console.error(e);
  }
};

const handleImageUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
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
      const data: { imageUrl: string } = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      const idx = articles.value.findIndex(a => a.id === selectedArticle.value?.id);
      const target = idx >= 0 ? articles.value[idx] : undefined;
      if (target) target.imageUrl = data.imageUrl;
      showToast('Bild erfolgreich hochgeladen', 'success');
    }
  } catch {
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

const editArticle = (article: Article) => {
  newArticle.value = {
    ...article,
    tags: (article.tags || []).map((t: string | ArticleTag) => (typeof t === 'string' ? t : t.name))
  } as ArticleForm;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
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

    const article: ArticleForm | Article = isEdit ? newArticle.value : await res.json();
    
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
        const { tags: formTags, ...rest } = newArticle.value;
        selectedArticle.value = {
          ...selectedArticle.value,
          ...rest,
          tags: (formTags || []).map(name => ({ name }))
        };
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
/* Noise-texture overlay pseudo-element — a data-URI SVG turbulence filter
   applied via ::after, not expressible as a static Tailwind utility class. */
.hero-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* Vue <transition> lifecycle classes — framework-injected during
   enter/leave, not expressible as static Tailwind utility classes. */
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
