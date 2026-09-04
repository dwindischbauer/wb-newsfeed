<template>
  <div class="dashboard-page">
    <!-- Modern Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" :class="['toast-notification', toastType]">
        <span class="toast-dot"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="dashboard-container">
      <!-- 0. EDITORIAL PAGE HEADER -->
      <div class="page-intro">
        <span class="page-eyebrow">{{ todayLabel }}</span>
        <h1 class="page-greeting">{{ greeting }}, Redaktion.</h1>
      </div>

      <!-- 1. TOP SECTION: Hero Story Showcase + Tasks & Schedule -->
      <div class="top-showcase-grid">
        <!-- Hero Story Card (Left 2/3) -->
        <div class="hero-card" :style="heroCardStyle">
          <div class="hero-overlay">
            <div class="hero-badge-row">
              <span class="hero-status-pill">
                <span class="pulse-dot-cyan"></span>
                <span>TOP-STORY IM FEED</span>
              </span>
              <span class="hero-category-chip" v-if="topArticle">
                {{ topArticle.category }}
              </span>
            </div>

            <div class="hero-content-box">
              <h2 class="hero-title" v-if="topArticle">
                {{ topArticle.title }}
              </h2>
              <h2 class="hero-title" v-else>
                Keine veröffentlichten Artikel vorhanden
              </h2>

              <p class="hero-teaser" v-if="topArticle && topArticle.teaser">
                {{ topArticle.teaser }}
              </p>

              <div class="hero-meta-row" v-if="topArticle">
                <div class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  <span>{{ topArticle.author }}</span>
                </div>
                <div class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  <span>{{ estimateReadingTime(topArticle.content) }}</span>
                </div>
                <div class="meta-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <span>{{ formatDate(topArticle.createdAt) }}</span>
                </div>
              </div>

              <div class="hero-actions" v-if="topArticle">
                <button class="hero-btn-primary" @click="selectArticle(topArticle)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                  <span>Im Panel prüfen</span>
                </button>
                <button class="hero-btn-secondary" @click="openMobilePreview">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                  <span>Feed-Vorschau</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: "Zu erledigen" & "Nächste Veröffentlichungen" -->
        <div class="top-side-column">
          <!-- Card: Zu erledigen -->
          <div class="carbon-card side-task-card">
            <div class="card-title-row">
              <div class="card-icon-title">
                <div>
                  <h3 class="card-heading">Zu erledigen</h3>
                  <span class="card-subheading">Ausstehende Redaktionsaufgaben</span>
                </div>
              </div>
              <span class="task-counter-pill" :class="{ 'has-tasks': draftCount > 0 }">
                {{ draftCount > 0 ? `${draftCount} Entwürfe` : '0 offen' }}
              </span>
            </div>

            <div class="task-list-body">
              <div v-if="draftArticles.length > 0" class="draft-items">
                <div 
                  v-for="draft in draftArticles.slice(0, 2)" 
                  :key="draft.id" 
                  class="draft-item"
                  @click="selectArticle(draft)"
                >
                  <div class="draft-info">
                    <span class="draft-category-dot"></span>
                    <span class="draft-title">{{ draft.title }}</span>
                  </div>
                  <button class="btn-quick-action" @click.stop="toggleStatus(draft)" title="Freigeben">
                    Freigeben
                  </button>
                </div>
              </div>
              <div v-else class="all-done-state">
                <div class="done-check-circle">✓</div>
                <div class="done-text">
                  <strong>Alles erledigt.</strong>
                  <p>Keine ausstehenden Entwürfe oder Freigaben.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Card: Nächste Veröffentlichungen -->
          <div class="carbon-card side-schedule-card">
            <div class="card-title-row">
              <div class="card-icon-title">
                <div>
                  <h3 class="card-heading">Nächste Veröffentlichungen</h3>
                  <span class="card-subheading">Redaktions-Kalender 2026</span>
                </div>
              </div>
            </div>

            <div class="schedule-list">
              <div 
                v-for="item in upcomingArticles" 
                :key="item.id" 
                class="schedule-item"
                @click="selectArticle(item)"
              >
                <div class="date-badge">
                  <span class="date-day">{{ getDayNum(item.createdAt) }}</span>
                  <span class="date-month">{{ getMonthAbbr(item.createdAt) }}</span>
                </div>
                <div class="schedule-details">
                  <div class="schedule-title-row">
                    <span class="schedule-title">{{ item.title }}</span>
                  </div>
                  <div class="schedule-meta">
                    <span class="schedule-cat-badge">{{ item.category }}</span>
                    <span>• {{ item.author }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. MIDDLE SECTION: KPI Row, asymmetric -->
      <div class="kpi-grid">
        <!-- KPI 1: Verwaltete Artikel — featured, larger -->
        <div class="carbon-card kpi-card kpi-featured">
          <span class="kpi-label">Verwaltete Artikel</span>
          <div class="kpi-value kpi-value-xl">{{ totalArticlesCount }}</div>
          <div class="kpi-footer-text">
            <span class="text-highlight-cyan">{{ publishedArticlesCount }} im Live-Feed</span> • {{ draftCount }} Entwürfe
          </div>
        </div>

        <!-- KPI 2: KI-Pipelines 2026 -->
        <div class="carbon-card kpi-card">
          <span class="kpi-label">KI-Pipelines 2026</span>
          <div class="kpi-value kpi-status-text">
            <span class="live-dot-green"></span>
            <span>Aktiv</span>
          </div>
          <div class="kpi-footer-text">
            <span>Fastify & qwen2.5:3b-instruct bereit</span>
          </div>
        </div>

        <!-- KPI 3: Nachrichten (Feed) with Cyan Wave -->
        <div class="carbon-card kpi-card has-wave">
          <span class="kpi-label">Nachrichten (Feed)</span>
          <div class="kpi-value">{{ publishedArticlesCount }}</div>
          <div class="kpi-footer-text">
            <span class="text-highlight-cyan">+100%</span> Bereitstellung
          </div>
          <!-- Cyan Area Sparkline Wave -->
          <svg class="kpi-sparkline" viewBox="0 0 300 80" preserveAspectRatio="none">
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
        <div class="carbon-card kpi-card has-wave">
          <span class="kpi-label">Feed-Leserate</span>
          <div class="kpi-value">{{ analyticsSummary.readThroughRate || '84.2%' }}</div>
          <div class="kpi-footer-text">
            <span>{{ analyticsSummary.totalReads }} Volltext • {{ analyticsSummary.totalImpressions }} Aufrufe</span>
          </div>
          <!-- Amber Area Sparkline Wave -->
          <svg class="kpi-sparkline" viewBox="0 0 300 80" preserveAspectRatio="none">
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
      <div class="analytics-row-grid">
        <!-- Card 1: Aktivste Autoren 2026 -->
        <div class="carbon-card author-leaderboard-card">
          <div class="card-title-row">
            <div class="card-icon-title">
              <div>
                <h3 class="card-heading">Aktivste Autoren</h3>
                <span class="card-subheading">Beiträge im Diplomarbeits-Semester</span>
              </div>
            </div>
          </div>

          <div class="leaderboard-list">
            <div v-for="author in authorStats" :key="author.name" class="leaderboard-item">
              <div class="author-info-row">
                <div class="author-name-col">
                  <span class="author-name">{{ author.name }}</span>
                  <span class="author-role">{{ author.role }}</span>
                </div>
                <div class="author-count-col">
                  <span class="author-count">{{ author.count }} Artikel</span>
                  <span class="author-share">({{ author.percent }}%)</span>
                </div>
              </div>
              <div class="progress-track">
                <div 
                  class="progress-bar" 
                  :style="{ width: `${Math.max(author.percent, 8)}%`, backgroundColor: author.color }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 2: Artikel nach Kategorie -->
        <div class="carbon-card category-distribution-card">
          <div class="card-title-row">
            <div class="card-icon-title">
              <div>
                <h3 class="card-heading">Nach Kategorie</h3>
                <span class="card-subheading">Thematische Verteilung im Feed</span>
              </div>
            </div>
          </div>

          <div class="category-dist-body">
            <!-- Segmented horizontal bar -->
            <div class="segmented-bar">
              <div 
                v-for="cat in categoryStats" 
                :key="cat.name"
                class="segment"
                :style="{ width: `${cat.percent}%`, backgroundColor: cat.color }"
                :title="`${cat.name}: ${cat.count} (${cat.percent}%)`"
              ></div>
            </div>

            <!-- Category Legend -->
            <div class="category-legend-grid">
              <div v-for="cat in categoryStats" :key="cat.name" class="legend-item">
                <span class="legend-dot" :style="{ backgroundColor: cat.color }"></span>
                <span class="legend-name">{{ cat.name }}</span>
                <span class="legend-val">{{ cat.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Card 3: Server & KI-Status -->
        <div class="carbon-card server-status-card">
          <div class="card-title-row">
            <div class="card-icon-title">
              <div>
                <h3 class="card-heading">Server & KI-Status</h3>
                <span class="card-subheading">Infrastruktur-Metriken</span>
              </div>
            </div>
          </div>

          <div class="server-metrics-body">
            <div class="load-metric-row">
              <div class="load-number">0,53 Last</div>
              <div class="load-badge">
                <span class="live-dot-green"></span>
                <span>Läuft stabil</span>
              </div>
            </div>

            <div class="hardware-bars">
              <div class="hw-item">
                <div class="hw-label-row">
                  <span>Fastify REST API (Port 3005)</span>
                  <span class="hw-val">Online</span>
                </div>
                <div class="hw-track">
                  <div class="hw-fill cyan" style="width: 100%;"></div>
                </div>
              </div>

              <div class="hw-item">
                <div class="hw-label-row">
                  <span>PostgreSQL & Redis Queue</span>
                  <span class="hw-val">Aktiv</span>
                </div>
                <div class="hw-track">
                  <div class="hw-fill emerald" style="width: 100%;"></div>
                </div>
              </div>

              <div class="hw-item">
                <div class="hw-label-row">
                  <span>Ollama LLM (qwen2.5)</span>
                  <span class="hw-val">1.2 GB VRAM</span>
                </div>
                <div class="hw-track">
                  <div class="hw-fill purple" style="width: 32%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. ARTICLE MANAGEMENT & TABLE SECTION -->
      <div class="carbon-card articles-management-card">
        <div class="mgmt-header">
          <div>
            <h3 class="mgmt-title">Artikel verwalten</h3>
            <p class="mgmt-subtitle">Übersicht aller redaktionellen Short-Form-Inhalte</p>
          </div>

          <div class="mgmt-actions-cluster">
            <div class="carbon-search-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" v-model="searchQuery" placeholder="Suchen nach Titel, Tags, Autor..." />
              <button v-if="searchQuery" @click="searchQuery = ''" class="btn-clear-search">&times;</button>
            </div>
            <button class="carbon-btn-primary" @click="openModal">
              <span class="btn-plus-icon">+</span> Neuer Artikel
            </button>
          </div>
        </div>

        <!-- Filter Chips (Categories) -->
        <div class="category-chips-row">
          <button
            v-for="cat in categories"
            :key="cat"
            :class="['carbon-chip', { active: activeCategory === cat }]"
            @click="activeCategory = cat; activeTag = null"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Subtag Filter Chips: canonical subcategories for the active main category,
             falls back to live tags from the data when "Alle" is selected -->
        <div class="subtag-chips-row" v-if="canonicalSubtagsForActiveCategory.length > 0">
          <span class="subtag-filter-label">Subkategorie:</span>
          <button
            :class="['subtag-chip', { active: activeTag === null }]"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="sub in canonicalSubtagsForActiveCategory"
            :key="sub.slug"
            :class="['subtag-chip', { active: activeTag === sub.name }]"
            @click="activeTag = activeTag === sub.name ? null : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
        <div class="subtag-chips-row" v-else-if="allTags && allTags.length > 0">
          <span class="subtag-filter-label">Filter Subtags:</span>
          <button
            :class="['subtag-chip', { active: activeTag === null }]"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="t in allTags"
            :key="t.id"
            :class="['subtag-chip', { active: activeTag === t.name }]"
            @click="activeTag = activeTag === t.name ? null : t.name"
          >
            #{{ t.name }} <span v-if="t.articleCount > 0" class="badge-count">({{ t.articleCount }})</span>
          </button>
        </div>

        <!-- Carbon Data Table -->
        <div class="table-responsive">
          <table class="carbon-table">
            <thead>
              <tr>
                <th style="width: 70px;">Cover</th>
                <th>Titel & Redaktionsinhalte</th>
                <th style="width: 130px;">Kategorie</th>
                <th style="width: 140px;">Autor</th>
                <th style="width: 120px;">Status</th>
                <th style="width: 160px; text-align: right;">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="article in filteredArticles" 
                :key="article.id"
                :class="{ 'row-selected': selectedArticle && selectedArticle.id === article.id }"
                @click="selectArticle(article)"
              >
                <td>
                  <div class="table-thumbnail-wrapper">
                    <img 
                      v-if="article.imageUrl" 
                      :src="`${config.public.apiUrl}${article.imageUrl}`" 
                      class="table-thumbnail" 
                      alt="Cover" 
                    />
                    <div v-else class="table-thumbnail-empty">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="article-title-cell">
                    <span class="article-row-title">{{ article.title }}</span>
                    <div class="article-row-tags" v-if="article.tags && article.tags.length > 0">
                      <span v-for="t in article.tags" :key="t.id || t.name" class="table-tag-pill">
                        #{{ t.name }}
                      </span>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="table-cat-pill" :class="`cat-${article.category?.toLowerCase()}`">
                    {{ article.category }}
                  </span>
                </td>
                <td>
                  <span class="table-author-text">{{ article.author }}</span>
                </td>
                <td>
                  <span :class="['table-status-badge', article.status]">
                    <span class="status-badge-dot"></span>
                    <span>{{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}</span>
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="table-action-btns" @click.stop>
                    <button class="btn-table-action" @click="selectArticle(article)" title="Vorschau im Detailpanel">
                      Vorschau
                    </button>
                    <button class="btn-table-action" @click="toggleStatus(article)" title="Status ändern">
                      {{ article.status === 'published' ? 'Entwurf' : 'Live' }}
                    </button>
                    <button class="btn-table-action danger" @click="deleteArticle(article.id)" title="Löschen">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0">
                <td colspan="6" class="empty-table-cell">
                  <div class="empty-table-state">
                    <span class="empty-state-icon">🔍</span>
                    <p class="empty-state-title">Keine passenden Artikel gefunden</p>
                    <p class="empty-state-desc">Passe deine Filterkriterien an oder erstelle einen neuen Beitrag.</p>
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
      <div class="preview-drawer" v-if="selectedArticle">
        <div class="drawer-header">
          <div class="drawer-title-col">
            <h3 class="drawer-title">Live-Vorschau</h3>
            <span class="drawer-sync-pill">
              <span class="pulse-dot-cyan"></span>
              <span>Echtzeit-Sync</span>
            </span>
          </div>
          <button class="btn-drawer-close" @click="selectedArticle = null">&times;</button>
        </div>

        <div class="drawer-scroll-body">
          <!-- Cover Image Section -->
          <div v-if="selectedArticle.imageUrl" class="drawer-image-box" :style="{ backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` }">
            <div class="drawer-image-overlay">
              <div class="image-action-cluster">
                <button 
                  class="btn-glass-action" 
                  :disabled="isGeneratingImage"
                  @click="generateImageForArticle('editorial')"
                  title="Authentisches, hochauflösendes Redaktionsfoto laden"
                >
                  <span v-if="isGeneratingImage" class="mini-spinner"></span>
                  <span v-else>📷</span>
                  Redaktionsfoto laden
                </button>
                <button 
                  class="btn-glass-action" 
                  :disabled="isGeneratingImage"
                  @click="generateImageForArticle('ai')"
                  title="Neues KI-Bild über LocalAI/Stable Diffusion berechnen"
                >
                  <span v-if="isGeneratingImage" class="mini-spinner"></span>
                  <span v-else>✨</span>
                  KI-Bild generieren
                </button>
              </div>

              <!-- Live image gen status -->
              <div v-if="imageGenState" class="live-image-status" :class="`status-${imageGenState.type}`">
                <span v-if="imageGenState.type === 'loading'" class="status-spinner"></span>
                <span v-else-if="imageGenState.type === 'error'" class="status-icon">⚠️</span>
                <span v-else-if="imageGenState.type === 'success'" class="status-icon">✓</span>
                <span class="status-text">{{ imageGenState.message }}</span>
                <span v-if="imageGenState.elapsed" class="status-time">({{ imageGenState.elapsed }}s)</span>
              </div>

              <button class="btn-remove-image" @click="removeImage(selectedArticle.id)">Bild löschen</button>
            </div>
          </div>

          <!-- Empty Image Placeholder -->
          <div v-else class="drawer-image-placeholder" @dragover.prevent @drop.prevent="handleImageDrop">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            <p class="placeholder-text">Kein Titelbild hinterlegt</p>
            <div class="placeholder-btn-row">
              <button 
                class="btn-editorial-load" 
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('editorial')"
              >
                <span v-if="isGeneratingImage" class="mini-spinner"></span>
                <span v-else>📷</span>
                Redaktionsfoto laden
              </button>
              <button 
                class="btn-ai-gen" 
                :disabled="isGeneratingImage"
                @click="generateImageForArticle('ai')"
              >
                <span>✨</span> KI-Bild
              </button>
              <label class="btn-upload-cover">
                Upload
                <input type="file" accept="image/*" @change="handleImageUpload" style="display: none;" />
              </label>
            </div>
            <div v-if="imageGenState" class="live-image-status inline" :class="`status-${imageGenState.type}`">
              <span>{{ imageGenState.message }}</span>
            </div>
          </div>

          <!-- Meta & Category Row -->
          <div class="drawer-meta-row">
            <span class="drawer-cat-pill">{{ selectedArticle.category }}</span>
            <div class="drawer-tags-wrap" v-if="selectedArticle.tags && selectedArticle.tags.length > 0">
              <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="drawer-tag-pill">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <!-- Article Title -->
          <h2 class="drawer-article-title">{{ selectedArticle.title }}</h2>

          <!-- KI-Zusammenfassung Box -->
          <div class="drawer-box summary-box" v-if="selectedArticle.teaser">
            <div class="box-header">
              <span class="sparkle-icon">✨</span>
              <strong>KI-Zusammenfassung (Teaser)</strong>
            </div>
            <p class="box-text">{{ selectedArticle.teaser }}</p>
          </div>

          <!-- KI-Kernpunkte Box -->
          <div class="drawer-box takeaways-box" v-if="selectedArticle.keyTakeaways">
            <div class="box-header">
              <span class="sparkle-icon">📌</span>
              <strong>KI-Kernpunkte</strong>
            </div>
            <ul class="takeaways-list">
              <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point">
                {{ point }}
              </li>
            </ul>
          </div>

          <!-- Author & Meta -->
          <div class="drawer-author-line">
            {{ selectedArticle.author }} • {{ estimateReadingTime(selectedArticle.content) }} • {{ formatDate(selectedArticle.createdAt) }}
          </div>

          <!-- Article Content -->
          <div class="drawer-body-text">
            {{ selectedArticle.content }}
          </div>
        </div>

        <!-- Drawer Footer Actions -->
        <div class="drawer-footer">
          <button class="carbon-btn-primary" @click="toggleStatus(selectedArticle)">
            {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
          </button>
          <button class="drawer-btn-secondary" @click="openMobilePreview">
            Mobile Ansicht (3002)
          </button>
          <button class="drawer-btn-secondary" @click="editArticle(selectedArticle)">
            Bearbeiten
          </button>
          <button class="drawer-btn-danger" @click="deleteArticle(selectedArticle.id)">
            Löschen
          </button>
        </div>
      </div>
    </transition>

    <!-- 6. MODAL: "+ Neuer Artikel / Bearbeiten" -->
    <div class="carbon-modal-backdrop" v-if="isModalOpen" @click.self="closeModal">
      <div class="carbon-modal-card">
        <div class="modal-header-row">
          <div>
            <h3 class="modal-title">{{ newArticle.id ? 'Artikel bearbeiten' : 'Neuen Artikel einpflegen' }}</h3>
            <p class="modal-subtitle">Short-Form-Inhalte erstellen mit automatischer KI-Extraktion</p>
          </div>
          <button class="modal-close-btn" @click="closeModal">&times;</button>
        </div>

        <form @submit.prevent="saveArticle" class="modal-form">
          <!-- Textarea / Content Input -->
          <div class="form-section">
            <div class="form-label-row">
              <label>Artikel-Fließtext (Quelle)</label>
              <div class="helper-btn-cluster">
                <button type="button" class="btn-tool-sm" @click="pasteFromClipboard">
                  📋 Zwischenablage
                </button>
                <button 
                  type="button" 
                  class="btn-tool-sm btn-tool-ai" 
                  :disabled="isExtracting"
                  @click="autoFillFromContent"
                >
                  <span v-if="isExtracting" class="mini-spinner"></span>
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
              @input="onContentInput"
            ></textarea>
          </div>

          <!-- Title Input with Auto-Title Generator -->
          <div class="form-section">
            <div class="form-label-row">
              <label>Überschrift / Titel</label>
              <button type="button" class="btn-tool-sm" @click="generateTitleOnly" title="Titel automatisch aus dem ersten Satz ableiten">
                ⚡ Auto-Titel
              </button>
            </div>
            <input 
              type="text" 
              v-model="newArticle.title" 
              placeholder="Prägnanter Titel für vertikalen Feed..." 
              required 
            />
          </div>

          <!-- Category & Author Row -->
          <div class="form-row-2">
            <div class="form-section">
              <label>Kategorie</label>
              <select v-model="newArticle.category" @change="onCategoryChange">
                <option value="Auto">✨ Auto-Erkennung</option>
                <option value="Politik">Politik</option>
                <option value="Wirtschaft">Wirtschaft</option>
                <option value="Sport">Sport</option>
                <option value="Technologie">Technologie</option>
                <option value="Kultur">Kultur</option>
              </select>
            </div>

            <div class="form-section">
              <label>Autor / Quelle</label>
              <input 
                type="text" 
                v-model="newArticle.author" 
                list="author-suggestions"
                placeholder="z.B. David Windischbauer, ORF.at..." 
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
          <div class="form-section">
            <label>Subtags zuordnen</label>
            <div class="subtag-picker-wrap">
              <button 
                type="button"
                v-for="sub in availableSubtags" 
                :key="sub.slug"
                :class="['subtag-toggle-btn', { selected: isTagSelected(sub.name) }]"
                @click="toggleTag(sub.name)"
              >
                <span class="subtag-dot" :style="{ backgroundColor: sub.color || 'var(--accent-cyan)' }"></span>
                <span>{{ sub.name }}</span>
              </button>
            </div>
          </div>

          <!-- Modal Action Buttons -->
          <div class="modal-footer-row">
            <button type="button" class="modal-btn-cancel" @click="closeModal">Abbrechen</button>
            <button type="submit" class="carbon-btn-primary">
              {{ newArticle.id ? 'Änderungen speichern' : 'Artikel anlegen & KI starten' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { parseKeyTakeaways, estimateReadingTime, CATEGORY_SUBTAGS, autoExtractArticleMetadata } from '@wb-news/shortform-news';

const config = useRuntimeConfig();

const articles = ref([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');
const allTags = ref([]);

// Canonical subcategories (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const canonicalSubtagsForActiveCategory = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);
const activeTag = ref(null);
const newTagName = ref('');
const searchQuery = ref('');
const selectedArticle = ref(null);
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
const toastType = ref('success');
let toastTimeout = null;

const showToast = (message, type = 'success') => {
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
const authorStats = computed(() => {
  const map = {
    'David Windischbauer': 0,
    'Stefan Schachner': 0,
    'ORF.at Redaktion': 0
  };
  let total = articles.value.length || 1;
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
  const catCounts = {
    Politik: 0,
    Wirtschaft: 0,
    Sport: 0,
    Technologie: 0,
    Kultur: 0
  };
  let total = articles.value.length || 1;
  articles.value.forEach(a => {
    if (catCounts[a.category] !== undefined) {
      catCounts[a.category]++;
    }
  });

  return [
    { name: 'Politik', count: catCounts['Politik'], percent: Math.round((catCounts['Politik'] / total) * 100), color: '#ef4444' },
    { name: 'Wirtschaft', count: catCounts['Wirtschaft'], percent: Math.round((catCounts['Wirtschaft'] / total) * 100), color: '#10b981' },
    { name: 'Sport', count: catCounts['Sport'], percent: Math.round((catCounts['Sport'] / total) * 100), color: '#f59e0b' },
    { name: 'Technologie', count: catCounts['Technologie'], percent: Math.round((catCounts['Technologie'] / total) * 100), color: '#6f8f1a' },
    { name: 'Kultur', count: catCounts['Kultur'], percent: Math.round((catCounts['Kultur'] / total) * 100), color: '#d946ef' }
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
    list = list.filter(a => (a.tags || []).some(t => t.name === activeTag.value || t.slug === activeTag.value));
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(a =>
      a.title?.toLowerCase().includes(q) ||
      a.author?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q) ||
      (a.tags || []).some(t => t.name?.toLowerCase().includes(q))
    );
  }
  return list;
});

// Helper Date Functions
const getMonthAbbr = (dateStr) => {
  if (!dateStr) return 'SEP';
  const d = new Date(dateStr);
  return d.toLocaleString('de-AT', { month: 'short' }).toUpperCase().replace('.', '');
};

const getDayNum = (dateStr) => {
  if (!dateStr) return '16';
  const d = new Date(dateStr);
  return d.getDate().toString().padStart(2, '0');
};

const formatDate = (dateStr) => {
  if (!dateStr) return '16. Sep 2026';
  return new Date(dateStr).toLocaleDateString('de-AT', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Modal State
const isModalOpen = ref(false);
const newArticle = ref({ 
  title: '', 
  category: 'Auto', 
  author: 'David Windischbauer', 
  content: '',
  tags: []
});

const isGeneratingImage = ref(false);
const imageGenState = ref(null);
let genTimer = null;
let genSeconds = 0;
let pollInterval = null;

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

const analyticsSummary = ref({
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
      const data = await res.json();
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
  } catch (e) {}
};

const selectArticle = (article) => {
  selectedArticle.value = article;
};

const isTagSelected = (name) => {
  return (newArticle.value.tags || []).some(t => (typeof t === 'string' ? t : t.name) === name);
};

const toggleTag = (name) => {
  if (!newArticle.value.tags) newArticle.value.tags = [];
  const idx = newArticle.value.tags.findIndex(t => (typeof t === 'string' ? t : t.name) === name);
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
  } catch (err) {
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
      const tagNames = (meta.tags || []).map(t => t.name || t);
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

const toggleStatus = async (article) => {
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

const deleteArticle = async (id) => {
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

const generateImageForArticle = async (mode = 'editorial') => {
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
      const idx = articles.value.findIndex(a => a.id === selectedArticle.value.id);
      if (idx >= 0) {
        articles.value[idx].imageUrl = data.imageUrl;
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
    stopGenTimer();
    isGeneratingImage.value = false;
    imageGenState.value = { type: 'error', message: 'Netzwerkfehler' };
    showToast('Netzwerkfehler beim Bild-Laden', 'error');
  }
};

const removeImage = async (id) => {
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
      if (idx >= 0) articles.value[idx].imageUrl = null;
      showToast('Titelbild entfernt', 'success');
    }
  } catch (e) {
    console.error(e);
  }
};

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file || !selectedArticle.value) return;
  uploadFile(file);
};

const handleImageDrop = (event) => {
  const file = event.dataTransfer?.files?.[0];
  if (file && selectedArticle.value) {
    uploadFile(file);
  }
};

const uploadFile = async (file) => {
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
      const idx = articles.value.findIndex(a => a.id === selectedArticle.value.id);
      if (idx >= 0) articles.value[idx].imageUrl = data.imageUrl;
      showToast('Bild erfolgreich hochgeladen', 'success');
    }
  } catch (e) {
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

const editArticle = (article) => {
  newArticle.value = { 
    ...article,
    tags: (article.tags || []).map(t => (typeof t === 'string' ? t : t.name))
  };
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
        selectedArticle.value = { ...selectedArticle.value, ...newArticle.value };
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
.dashboard-page {
  padding: 1.5rem 2rem 3rem;
  max-width: 1440px;
  margin: 0 auto;
}

.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Editorial Page Intro */
.page-intro {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.25rem 0.1rem 0.5rem;
}

.page-eyebrow {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-lime-deep);
}

.page-greeting {
  margin: 0;
  font-family: var(--font-accent);
  font-style: italic;
  font-weight: 500;
  font-size: 2.4rem;
  letter-spacing: -0.01em;
  color: var(--text-primary);
}

/* Carbon Card Foundation */
.carbon-card {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 22px;
  padding: 1.35rem;
  box-shadow: 0 4px 20px rgba(20, 20, 20, 0.05);
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.carbon-card:hover {
  border-color: rgba(20, 20, 20, 0.14);
}

/* 1. TOP SHOWCASE GRID */
.top-showcase-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .top-showcase-grid {
    grid-template-columns: 2fr 1fr;
  }
}

/* Hero Showcase Card */
.hero-card {
  border-radius: 28px;
  background-size: cover;
  background-position: center;
  position: relative;
  min-height: 380px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  border: 1px solid var(--border-subtle);
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(20, 20, 20, 0.12);
}

.hero-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.5;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.35) 50%, rgba(255, 255, 255, 0.15) 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.5rem;
}

.hero-badge-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.hero-status-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(111, 143, 26, 0.15);
  border: 1px solid rgba(111, 143, 26, 0.4);
  color: #5c7a14;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  backdrop-filter: blur(8px);
}

.pulse-dot-cyan {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #6f8f1a;
  box-shadow: 0 0 8px #6f8f1a;
  animation: pulse 2s infinite;
}

.hero-category-chip {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.1);
  border: 1px solid rgba(20, 20, 20, 0.15);
  color: #24252a;
  font-size: 0.72rem;
  font-weight: 600;
  backdrop-filter: blur(8px);
}

.hero-content-box {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(20, 20, 20, 0.1);
  border-radius: 20px;
  padding: 1.35rem;
  box-shadow: 0 8px 32px rgba(20, 20, 20, 0.10);
}

.hero-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.3;
  color: #14151a;
  letter-spacing: -0.02em;
}

.hero-teaser {
  margin: 0 0 0.85rem 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: #5a5b61;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.1rem;
  margin-bottom: 1rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.hero-btn-primary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1.1rem;
  border-radius: 9999px;
  background: #14151a;
  border: none;
  color: #d5f24e;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(20, 20, 20, 0.25);
  transition: opacity 0.2s;
}

.hero-btn-primary:hover {
  opacity: 0.92;
}

.hero-btn-secondary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.08);
  border: 1px solid rgba(20, 20, 20, 0.12);
  color: #24252a;
  font-size: 0.82rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.hero-btn-secondary:hover {
  background: rgba(20, 20, 20, 0.14);
}

/* Top Side Column */
.top-side-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.card-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-icon-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-bubble {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-bubble.cyan {
  background: rgba(111, 143, 26, 0.15);
  color: #6f8f1a;
}

.icon-bubble.orange {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
}

.icon-bubble.purple {
  background: rgba(168, 85, 247, 0.15);
  color: #c084fc;
}

.icon-bubble.green {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.card-heading {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 500;
  font-family: var(--font-accent);
  font-style: italic;
  color: #14151a;
}

.card-subheading {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.task-counter-pill {
  font-size: 0.72rem;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  font-weight: 600;
}

.task-counter-pill.has-tasks {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.35);
  color: #fbbf24;
}

/* Tasks / Drafts list */
.draft-items {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.draft-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: rgba(20, 20, 20, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.draft-item:hover {
  background: rgba(20, 20, 20, 0.06);
  border-color: rgba(245, 158, 11, 0.3);
}

.draft-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  overflow: hidden;
}

.draft-category-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #f59e0b;
  flex-shrink: 0;
}

.draft-title {
  font-size: 0.78rem;
  color: #24252a;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 210px;
}

.btn-quick-action {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.35);
  color: #34d399;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.55rem;
  border-radius: 6px;
  cursor: pointer;
}

.btn-quick-action:hover {
  background: rgba(16, 185, 129, 0.25);
}

.all-done-state {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem;
  background: rgba(16, 185, 129, 0.05);
  border: 1px dashed rgba(16, 185, 129, 0.25);
  border-radius: 10px;
}

.done-check-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.2);
  color: #34d399;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.85rem;
}

.done-text strong {
  display: block;
  font-size: 0.82rem;
  color: #24252a;
}

.done-text p {
  margin: 0;
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Schedule List */
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.55rem 0.65rem;
  background: rgba(20, 20, 20, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.schedule-item:hover {
  background: rgba(20, 20, 20, 0.05);
  border-color: rgba(111, 143, 26, 0.3);
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: #f4f2ec;
  border: 1px solid rgba(20, 20, 20, 0.08);
  flex-shrink: 0;
}

.date-day {
  font-size: 0.85rem;
  font-weight: 700;
  color: #14151a;
  line-height: 1;
}

.date-month {
  font-size: 0.58rem;
  font-weight: 600;
  color: #6c6d73;
  margin-top: 1px;
}

.schedule-details {
  flex: 1;
  overflow: hidden;
}

.schedule-title {
  font-size: 0.78rem;
  font-weight: 600;
  color: #24252a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

.schedule-meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.7rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.schedule-cat-badge {
  color: #5c7a14;
  font-weight: 600;
}

/* 2. KPI METRICS GRID — asymmetric, one featured */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.25rem;
}

@media (min-width: 640px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .kpi-featured {
    grid-column: span 2;
  }
}

@media (min-width: 1024px) {
  .kpi-grid {
    grid-template-columns: 1.6fr 1fr 1fr 1fr;
  }
  .kpi-featured {
    grid-column: auto;
  }
}

.kpi-card {
  padding: 1.4rem 1.4rem 1.25rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 120px;
  gap: 0.6rem;
}

.kpi-featured {
  background: var(--accent-ink);
  border-color: var(--accent-ink);
}

.kpi-featured .kpi-label {
  color: rgba(255, 255, 255, 0.6);
}

.kpi-featured .kpi-footer-text {
  color: rgba(255, 255, 255, 0.55);
}

.kpi-featured .text-highlight-cyan {
  color: var(--accent-lime);
}

.kpi-card.has-wave {
  position: relative;
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 2;
}

.kpi-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
  font-family: var(--font-accent);
  font-style: italic;
}

.kpi-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #14151a;
  letter-spacing: -0.02em;
}

.kpi-value-xl {
  font-family: var(--font-accent);
  font-style: italic;
  font-weight: 500;
  font-size: 3.4rem;
  line-height: 1;
  color: #ffffff;
}

.kpi-status-text {
  font-size: 1.35rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.live-dot-green {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
  box-shadow: 0 0 8px #10b981;
}

.kpi-icon-pill {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.kpi-icon-pill.blue {
  background: rgba(77, 101, 18, 0.12);
  color: #4d6512;
}

.kpi-icon-pill.purple {
  background: rgba(168, 85, 247, 0.12);
  color: #c084fc;
}

.kpi-icon-pill.cyan {
  background: rgba(111, 143, 26, 0.12);
  color: #6f8f1a;
}

.kpi-icon-pill.amber {
  background: rgba(245, 158, 11, 0.12);
  color: #fbbf24;
}

.kpi-footer-text {
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-top: 0.75rem;
  z-index: 2;
}

.text-highlight-cyan {
  color: #5c7a14;
  font-weight: 600;
}

.kpi-sparkline {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 52px;
  pointer-events: none;
  z-index: 1;
}

/* 3. BOTTOM ANALYTICS ROW GRID */
.analytics-row-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 1024px) {
  .analytics-row-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Author Leaderboard */
.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.leaderboard-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.author-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.author-name-col {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 0.82rem;
  font-weight: 600;
  color: #24252a;
}

.author-role {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.author-count-col {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.76rem;
}

.author-count {
  font-weight: 600;
  color: #14151a;
}

.author-share {
  color: var(--text-muted);
}

.progress-track {
  width: 100%;
  height: 6px;
  background: rgba(20, 20, 20, 0.05);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.4s ease;
}

/* Category Distribution */
.category-dist-body {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.segmented-bar {
  width: 100%;
  height: 12px;
  border-radius: 9999px;
  display: flex;
  overflow: hidden;
  background: rgba(20, 20, 20, 0.04);
}

.segment {
  height: 100%;
  transition: width 0.3s ease;
}

.category-legend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.65rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.74rem;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-name {
  color: var(--text-secondary);
  flex: 1;
}

.legend-val {
  font-weight: 600;
  color: #14151a;
}

/* Server Status */
.server-metrics-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.load-metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.02);
  border: 1px solid var(--border-subtle);
}

.load-number {
  font-size: 1.25rem;
  font-weight: 800;
  color: #14151a;
}

.load-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.74rem;
  font-weight: 600;
  color: #34d399;
}

.hardware-bars {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.hw-item {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.hw-label-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-secondary);
}

.hw-val {
  font-weight: 600;
  color: #14151a;
}

.hw-track {
  width: 100%;
  height: 5px;
  background: rgba(20, 20, 20, 0.05);
  border-radius: 9999px;
  overflow: hidden;
}

.hw-fill {
  height: 100%;
  border-radius: 9999px;
}

.hw-fill.cyan { background: #6f8f1a; }
.hw-fill.emerald { background: #10b981; }
.hw-fill.purple { background: #a855f7; }

/* 4. ARTICLE MANAGEMENT CARD */
.articles-management-card {
  padding: 1.5rem;
}

.mgmt-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

@media (min-width: 768px) {
  .mgmt-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.mgmt-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 800;
  color: #14151a;
}

.mgmt-subtitle {
  margin: 0.2rem 0 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.mgmt-actions-cluster {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.carbon-search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(20, 20, 20, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.45rem 0.85rem;
  color: var(--text-secondary);
}

.carbon-search-box:focus-within {
  border-color: var(--border-focus);
}

.carbon-search-box input {
  background: transparent;
  border: none;
  outline: none;
  color: #14151a;
  font-size: 0.8rem;
  width: 180px;
}

.carbon-search-box input::placeholder {
  color: var(--text-muted);
}

.btn-clear-search {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
}

.carbon-btn-primary {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: 9999px;
  background: #14151a;
  border: none;
  color: #d5f24e;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(20, 20, 20, 0.2);
  transition: all 0.2s ease;
}

.carbon-btn-primary:hover {
  opacity: 0.92;
  box-shadow: 0 0 20px rgba(111, 143, 26, 0.45);
}

.btn-plus-icon {
  font-size: 1rem;
  font-weight: 700;
}

/* Category Chips */
.category-chips-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.85rem;
}

.carbon-chip {
  padding: 0.35rem 0.85rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.03);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.carbon-chip:hover {
  background: rgba(20, 20, 20, 0.07);
  color: #14151a;
}

.carbon-chip.active {
  background: #d5f24e;
  border-color: #d5f24e;
  color: #14151a;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(213, 242, 78, 0.5);
}

/* Subtag Chips */
.subtag-chips-row {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
  padding: 0.5rem 0.75rem;
  background: rgba(20, 20, 20, 0.02);
  border-radius: 8px;
  border: 1px solid var(--border-subtle);
}

.subtag-filter-label {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 600;
}

.subtag-chip {
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  background: transparent;
  border: 1px solid rgba(20, 20, 20, 0.12);
  color: var(--text-secondary);
  font-size: 0.74rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.subtag-chip:hover {
  border-color: rgba(111, 143, 26, 0.4);
  color: #14151a;
}

.subtag-chip.active {
  background: rgba(111, 143, 26, 0.15);
  border-color: #6f8f1a;
  color: #6f8f1a;
  font-weight: 600;
}

.badge-count {
  opacity: 0.75;
}

/* Carbon Table */
.table-responsive {
  overflow-x: auto;
}

.carbon-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 4px;
}

.carbon-table th {
  text-align: left;
  padding: 0.75rem 1rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}

.carbon-table tbody tr {
  background: rgba(20, 20, 20, 0.02);
  transition: all 0.2s ease;
  cursor: pointer;
}

.carbon-table tbody tr:hover {
  background: rgba(20, 20, 20, 0.04);
}

.carbon-table tbody tr.row-selected {
  background: rgba(111, 143, 26, 0.08);
  border-left: 2px solid #6f8f1a;
}

.carbon-table td {
  padding: 0.85rem 1rem;
  font-size: 0.82rem;
  color: #24252a;
  vertical-align: middle;
}

.carbon-table tbody tr td:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}

.carbon-table tbody tr td:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.table-thumbnail-wrapper {
  width: 52px;
  height: 38px;
  border-radius: 6px;
  overflow: hidden;
  background: #f4f2ec;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-subtle);
}

.table-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-thumbnail-empty {
  color: var(--text-muted);
}

.article-title-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.article-row-title {
  font-weight: 600;
  color: #14151a;
  line-height: 1.35;
}

.article-row-tags {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.table-tag-pill {
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
  border-radius: 4px;
  background: rgba(20, 20, 20, 0.04);
  color: var(--text-secondary);
}

.table-cat-pill {
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.06);
  font-weight: 600;
  display: inline-block;
}

.table-cat-pill.cat-politik { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.table-cat-pill.cat-wirtschaft { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.table-cat-pill.cat-sport { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.table-cat-pill.cat-technologie { background: rgba(111, 143, 26, 0.15); color: #5c7a14; }
.table-cat-pill.cat-kultur { background: rgba(217, 70, 239, 0.15); color: #e879f9; }

.table-author-text {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.table-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  font-weight: 600;
}

.table-status-badge.published {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
}

.table-status-badge.published .status-badge-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.table-status-badge.draft {
  background: rgba(20, 20, 20, 0.05);
  color: var(--text-muted);
}

.table-status-badge.draft .status-badge-dot {
  background: var(--text-muted);
}

.status-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.table-action-btns {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
}

.btn-table-action {
  background: rgba(20, 20, 20, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.6rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-table-action:hover {
  background: rgba(20, 20, 20, 0.08);
  color: #14151a;
}

.btn-table-action.danger {
  color: #f87171;
}

.btn-table-action.danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

.empty-table-cell {
  text-align: center;
  padding: 3rem 1rem;
}

.empty-table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-state-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.empty-state-title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #14151a;
}

.empty-state-desc {
  margin: 0.25rem 0 0 0;
  font-size: 0.76rem;
  color: var(--text-muted);
}

/* 5. SLIDE-OVER PREVIEW DRAWER */
.preview-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 440px;
  max-width: 90vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-left: 1px solid var(--border-subtle);
  box-shadow: -10px 0 40px rgba(20, 20, 20, 0.14);
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-subtle);
}

.drawer-title-col {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.drawer-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #14151a;
}

.drawer-sync-pill {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.55rem;
  border-radius: 9999px;
  background: rgba(111, 143, 26, 0.12);
  border: 1px solid rgba(111, 143, 26, 0.3);
  color: #5c7a14;
  font-size: 0.68rem;
  font-weight: 600;
}

.btn-drawer-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.btn-drawer-close:hover {
  color: #14151a;
}

.drawer-scroll-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.drawer-image-box {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  background-size: cover;
  background-position: center;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
}

.drawer-image-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(20, 20, 20, 0.22) 0%, rgba(20, 20, 20, 0.05) 60%);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0.85rem;
  gap: 0.5rem;
}

.image-action-cluster {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn-glass-action {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.btn-glass-action:hover {
  background: rgba(20, 20, 20, 0.55);
}

.btn-remove-image {
  align-self: flex-start;
  background: transparent;
  border: none;
  color: #f87171;
  font-size: 0.68rem;
  cursor: pointer;
  text-decoration: underline;
}

.drawer-image-placeholder {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  background: rgba(20, 20, 20, 0.02);
  border: 2px dashed var(--border-subtle);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 0.6rem;
  padding: 1rem;
}

.placeholder-text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.placeholder-btn-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.btn-editorial-load {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  border-radius: 9999px;
  background: #14151a;
  border: none;
  color: #d5f24e;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-ai-gen {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background: rgba(168, 85, 247, 0.15);
  border: 1px solid rgba(168, 85, 247, 0.35);
  color: #c084fc;
  font-size: 0.74rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-upload-cover {
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  cursor: pointer;
}

.live-image-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.72rem;
  padding: 0.3rem 0.6rem;
  border-radius: 9999px;
  background: rgba(20, 20, 20, 0.7);
  color: #ffffff;
}

.live-image-status.status-loading {
  color: #d5f24e;
}

.live-image-status.status-success {
  color: #34d399;
}

.live-image-status.status-error {
  color: #f87171;
}

.status-spinner, .mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(20, 20, 20, 0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.drawer-meta-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.drawer-cat-pill {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  background: #efece3;
  color: #5c7a14;
  border: 1px solid rgba(92, 122, 20, 0.3);
}

.drawer-tags-wrap {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.drawer-tag-pill {
  font-size: 0.7rem;
  padding: 0.2rem 0.55rem;
  border-radius: 6px;
  background: rgba(20, 20, 20, 0.04);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.drawer-article-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #14151a;
  line-height: 1.35;
}

.drawer-box {
  border-radius: 10px;
  padding: 0.95rem;
}

.summary-box {
  background: rgba(111, 143, 26, 0.06);
  border: 1px solid rgba(111, 143, 26, 0.2);
}

.takeaways-box {
  background: rgba(168, 85, 247, 0.06);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.box-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  color: #24252a;
  margin-bottom: 0.5rem;
}

.box-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #5a5b61;
}

.takeaways-list {
  margin: 0;
  padding-left: 1.2rem;
  font-size: 0.8rem;
  line-height: 1.5;
  color: #5a5b61;
}

.takeaways-list li {
  margin-bottom: 0.3rem;
}

.drawer-author-line {
  font-size: 0.74rem;
  color: var(--text-muted);
}

.drawer-body-text {
  font-size: 0.82rem;
  line-height: 1.6;
  color: #3f4046;
  white-space: pre-line;
}

.drawer-footer {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border-subtle);
  background: rgba(255, 255, 255, 0.85);
}

.drawer-btn-secondary {
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(20, 20, 20, 0.05);
  border: 1px solid var(--border-subtle);
  color: #24252a;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.drawer-btn-secondary:hover {
  background: rgba(20, 20, 20, 0.1);
}

.drawer-btn-danger {
  padding: 0.5rem;
  border-radius: 8px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #f87171;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.drawer-btn-danger:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* 6. MODAL STYLING */
.carbon-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 20, 0.18);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 1rem;
}

.carbon-modal-card {
  width: 680px;
  max-width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background: #f4f2ec;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  box-shadow: 0 16px 50px rgba(20, 20, 20, 0.16);
  padding: 1.75rem;
}

.modal-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.modal-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  color: #14151a;
}

.modal-subtitle {
  margin: 0.2rem 0 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.6rem;
  cursor: pointer;
  line-height: 1;
}

.modal-close-btn:hover {
  color: #14151a;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-label-row label, .form-section label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.helper-btn-cluster {
  display: flex;
  gap: 0.4rem;
}

.btn-tool-sm {
  background: rgba(20, 20, 20, 0.04);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 500;
  padding: 0.25rem 0.55rem;
  cursor: pointer;
}

.btn-tool-sm:hover {
  background: rgba(20, 20, 20, 0.08);
  color: #14151a;
}

.btn-tool-ai {
  background: rgba(111, 143, 26, 0.12);
  border-color: rgba(111, 143, 26, 0.3);
  color: #6f8f1a;
}

.form-section input, .form-section textarea, .form-section select {
  background: rgba(20, 20, 20, 0.03);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 0.65rem 0.85rem;
  color: #14151a;
  font-size: 0.82rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.2s;
}

.form-section input:focus, .form-section textarea:focus, .form-section select:focus {
  border-color: var(--border-focus);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.subtag-picker-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.25rem;
}

.subtag-toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  background: rgba(20, 20, 20, 0.03);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.74rem;
  cursor: pointer;
  transition: all 0.2s;
}

.subtag-toggle-btn:hover {
  background: rgba(20, 20, 20, 0.07);
}

.subtag-toggle-btn.selected {
  background: rgba(111, 143, 26, 0.15);
  border-color: #6f8f1a;
  color: #6f8f1a;
  font-weight: 600;
}

.subtag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.modal-footer-row {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.modal-btn-cancel {
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  background: transparent;
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  font-size: 0.82rem;
  cursor: pointer;
}

.modal-btn-cancel:hover {
  background: rgba(20, 20, 20, 0.05);
  color: #14151a;
}

/* Toast Notifications */
.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 999;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 8px 24px rgba(20, 20, 20, 0.12);
  backdrop-filter: blur(12px);
}

.toast-notification.success {
  background: rgba(16, 185, 129, 0.9);
  color: #14151a;
}

.toast-notification.error {
  background: rgba(239, 68, 68, 0.9);
  color: #14151a;
}

.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #14151a;
}

/* Transitions */
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
