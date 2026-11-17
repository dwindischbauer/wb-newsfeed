<template>
  <div class="mx-auto max-w-[1320px] px-4 pb-12 pt-6 md:px-8 md:pt-8">
    <transition name="toast">
      <div
        v-if="toastMessage"
        class="fixed bottom-6 right-6 z-[999] flex items-center gap-2.5 rounded-[10px] border border-border-subtle bg-bg-card px-4 py-3 text-[13px] font-medium text-accent-ink shadow-[0_8px_24px_rgba(31,27,22,0.08)]"
        :class="toastType === 'success' ? 'border-l-4 border-l-[#1f7a4c]' : 'border-l-4 border-l-[#b93829]'"
      >
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="flex flex-col gap-6">
      <!-- Kopfbereich -->
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="m-0 font-accent text-[30px] font-medium leading-[1.1] tracking-[-0.02em] text-text-primary">Artikel</h1>
          <p class="m-0 mt-1.5 font-mono text-[12px] tabular-nums text-text-muted">
            {{ articles.length }} Beiträge · {{ publishedCount }} live · {{ pendingJobsCount }} Jobs aktiv
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <button
            class="cursor-pointer whitespace-nowrap rounded-[8px] border border-border-subtle bg-bg-card px-3.5 py-2 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-card-subtle"
            @click="isImportOpen = true"
          >
            RSS importieren
          </button>
          <button
            class="cursor-pointer whitespace-nowrap rounded-[8px] border-none bg-accent-ink px-4 py-2 text-[13px] font-medium text-[#fdfbf7] transition-opacity duration-150 hover:opacity-90"
            @click="openModal"
          >
            Neuer Artikel
          </button>
        </div>
      </div>

      <!-- Asymmetrische Uebersicht: Themenverteilung + Redaktionsstatus -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section class="flex flex-col justify-between rounded-[14px] border border-border-subtle bg-bg-card p-5">
          <div class="flex items-baseline justify-between gap-2">
            <h2 class="m-0 text-[13px] font-semibold text-text-primary">Themenverteilung</h2>
            <span class="font-mono text-[11px] tabular-nums text-text-muted">{{ articles.length }} gesamt</span>
          </div>

          <div v-if="categoryBreakdown.length > 0" class="mt-4 flex flex-col gap-3">
            <div class="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-card-subtle">
              <div
                v-for="item in categoryBreakdown"
                :key="item.category"
                :style="{ width: `${item.percent}%`, backgroundColor: item.color }"
                :title="`${item.category}: ${item.count}`"
                class="h-full border-r border-bg-card last:border-r-0"
              />
            </div>

            <div class="flex flex-wrap gap-x-4 gap-y-1.5">
              <button
                v-for="item in categoryBreakdown"
                :key="item.category"
                type="button"
                class="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[12px] text-text-secondary transition-colors hover:text-text-primary"
                @click="activeCategory = item.category; activeTag = null"
              >
                <span class="h-2 w-2 rounded-[2px]" :style="{ backgroundColor: item.color }" />
                <span>{{ item.category }}</span>
                <span class="font-mono text-[11px] tabular-nums text-text-muted">{{ item.count }}</span>
              </button>
            </div>
          </div>
          <p v-else class="m-0 mt-4 text-[13px] text-text-muted">Noch keine Artikel angelegt.</p>
        </section>

        <section class="rounded-[14px] border border-border-subtle bg-bg-card px-5 py-4">
          <div class="mb-2.5 flex items-baseline justify-between">
            <h2 class="m-0 text-[13px] font-semibold text-text-primary">Redaktionsstatus</h2>
          </div>
          <div class="divide-y divide-border-subtle">
            <div class="flex items-center justify-between py-2 first:pt-0.5">
              <span class="text-[13px] text-text-secondary">Veröffentlicht</span>
              <span class="font-mono text-[15px] font-medium tabular-nums text-text-primary">{{ publishedCount }}</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-[13px] text-text-secondary">Entwürfe</span>
              <span class="font-mono text-[15px] font-medium tabular-nums text-text-primary">{{ draftCount }}</span>
            </div>
            <div class="flex items-center justify-between py-2 last:pb-0.5">
              <span class="text-[13px] text-text-secondary">Jobs in Arbeit</span>
              <span class="font-mono text-[15px] font-medium tabular-nums text-[#5c7a14]">{{ pendingJobsCount }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Artikel-Tabelle -->
      <div class="rounded-[14px] border border-border-subtle bg-bg-card p-5 md:p-6">
        <div class="mb-4 flex flex-col gap-3 border-b border-border-subtle pb-4 md:flex-row md:items-center md:justify-between">
          <!-- Kategorie-Tabs -->
          <div class="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              v-for="cat in categories"
              :key="cat"
              class="shrink-0 cursor-pointer whitespace-nowrap rounded-[7px] border border-transparent px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
              :class="{ 'border-border-subtle bg-bg-card-subtle font-semibold text-text-primary': activeCategory === cat }"
              @click="activeCategory = cat; activeTag = null"
            >
              {{ cat }}
            </button>
          </div>

          <!-- Suche -->
          <div class="flex items-center gap-2 rounded-[8px] border border-border-subtle bg-bg-main px-3 py-1.5 text-text-secondary focus-within:border-border-focus">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Artikel suchen"
              class="w-full min-w-[180px] border-none bg-transparent text-[13px] text-text-primary outline-none placeholder:text-text-muted md:w-[210px]"
            />
            <button
              v-if="searchQuery"
              type="button"
              aria-label="Suche leeren"
              class="flex cursor-pointer items-center border-none bg-transparent p-0 text-text-muted hover:text-text-primary"
              @click="searchQuery = ''"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <!-- Unterkategorien / Tags -->
        <div
          v-if="canonicalSubtagsForActiveCategory.length > 0"
          class="mb-4 flex flex-wrap items-center gap-1.5"
        >
          <span class="mr-1 text-[12px] text-text-muted">Thema:</span>
          <button
            class="cursor-pointer rounded-[6px] border border-border-subtle bg-transparent px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            :class="{ 'border-[#5c7a14] bg-[#dbe8a6]/35 font-semibold text-[#3d520c]': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="sub in canonicalSubtagsForActiveCategory"
            :key="sub.slug"
            class="cursor-pointer rounded-[6px] border border-border-subtle bg-transparent px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            :class="{ 'border-[#5c7a14] bg-[#dbe8a6]/35 font-semibold text-[#3d520c]': activeTag === sub.name }"
            @click="activeTag = activeTag === sub.name ? null : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
        <div
          v-else-if="allTags && allTags.length > 0"
          class="mb-4 flex flex-wrap items-center gap-1.5"
        >
          <span class="mr-1 text-[12px] text-text-muted">Tags:</span>
          <button
            class="cursor-pointer rounded-[6px] border border-border-subtle bg-transparent px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            :class="{ 'border-[#5c7a14] bg-[#dbe8a6]/35 font-semibold text-[#3d520c]': activeTag === null }"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button
            v-for="t in visibleAllTags"
            :key="t.id"
            class="cursor-pointer rounded-[6px] border border-border-subtle bg-transparent px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:text-text-primary"
            :class="{ 'border-[#5c7a14] bg-[#dbe8a6]/35 font-semibold text-[#3d520c]': activeTag === t.name }"
            @click="activeTag = activeTag === t.name ? null : t.name"
          >
            #{{ t.name }} <span v-if="t.articleCount > 0" class="font-mono text-[11px] tabular-nums opacity-70">{{ t.articleCount }}</span>
          </button>
          <button
            v-if="sortedAllTags.length > TAG_PREVIEW_COUNT"
            class="cursor-pointer rounded-[6px] border border-dashed border-border-subtle bg-transparent px-2.5 py-1 text-[12px] font-medium text-text-muted transition-colors duration-150 hover:text-text-primary"
            @click="allTagsExpanded = !allTagsExpanded"
          >
            {{ allTagsExpanded ? 'Weniger' : `+${sortedAllTags.length - TAG_PREVIEW_COUNT} weitere` }}
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-border-subtle">
                <th class="w-[52px] py-2.5 pl-2 pr-3 text-left text-[12px] font-medium text-text-muted">Karte</th>
                <th class="py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Titel</th>
                <th class="w-[125px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Kategorie</th>
                <th class="w-[140px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Autor</th>
                <th class="w-[125px] py-2.5 px-3 text-left text-[12px] font-medium text-text-muted">Status</th>
                <th class="w-[180px] py-2.5 pl-3 pr-2 text-right text-[12px] font-medium text-text-muted">Aktionen</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border-subtle">
              <tr
                v-for="article in filteredArticles"
                :key="article.id"
                class="cursor-pointer transition-colors duration-150 hover:bg-bg-main/70"
                :class="{ 'bg-[#dbe8a6]/20': selectedArticle && selectedArticle.id === article.id }"
                @click="selectArticle(article)"
              >
                <td class="py-3 pl-2 pr-3 align-middle">
                  <div class="flex h-11 w-[26px] items-center justify-center overflow-hidden rounded-[5px] border border-border-subtle bg-bg-card-subtle">
                    <img
                      v-if="article.imageUrl"
                      :src="`${config.public.apiUrl}${article.imageUrl}`"
                      class="h-full w-full object-cover"
                      alt=""
                      loading="lazy"
                    />
                    <div v-else class="flex h-full w-full flex-col justify-between p-[4px]">
                      <div class="h-[2px] w-2.5 rounded-full bg-text-primary/35" />
                      <div class="space-y-[2px]">
                        <div class="h-[2px] w-full rounded-full bg-text-primary/20" />
                        <div class="h-[2px] w-3 rounded-full bg-text-primary/15" />
                      </div>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-3 align-middle">
                  <div class="flex flex-col gap-1">
                    <span class="font-accent text-[15.5px] font-medium leading-[1.3] text-text-primary">{{ article.title }}</span>
                    <div v-if="article.tags && article.tags.length > 0" class="flex flex-wrap gap-1.5">
                      <span v-for="t in article.tags" :key="t.id || t.name" class="font-mono text-[11px] text-text-muted">
                        #{{ t.name }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="py-3 px-3 align-middle">
                  <span class="inline-block rounded-[6px] px-2 py-0.5 text-[12px] font-medium" :class="getCategoryPillClasses(article.category)">
                    {{ article.category }}
                  </span>
                </td>
                <td class="py-3 px-3 align-middle">
                  <span class="text-[13px] text-text-secondary">{{ article.author }}</span>
                </td>
                <td class="py-3 px-3 align-middle">
                  <span class="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[12px] font-medium" :class="statusBadgeClasses[article.status]">
                    <span class="h-[6px] w-[6px] rounded-full" :class="statusDotClasses[article.status]"></span>
                    <span>{{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}</span>
                  </span>
                </td>
                <td class="py-3 pl-3 pr-2 text-right align-middle">
                  <div class="flex justify-end gap-1.5" @click.stop>
                    <button
                      class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary"
                      @click="selectArticle(article)"
                    >
                      Vorschau
                    </button>
                    <button
                      class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary"
                      @click="toggleStatus(article)"
                    >
                      {{ article.status === 'published' ? 'Entwurf' : 'Live' }}
                    </button>
                    <button
                      class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[12px] font-medium text-[#b93829] transition-colors duration-150 hover:bg-[#b93829]/10"
                      @click="deleteArticle(article.id)"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0">
                <td colspan="6" class="px-4 py-12 text-center">
                  <p class="m-0 text-[13px] text-text-muted">Keine Artikel gefunden</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Vorschau-Panel -->
    <transition name="drawer">
      <div
        v-if="selectedArticle"
        role="dialog"
        aria-label="Artikelvorschau"
        class="fixed right-0 top-0 z-[200] flex h-screen w-[440px] max-w-[92vw] flex-col border-l border-border-subtle bg-bg-card shadow-[0_12px_36px_rgba(31,27,22,0.12)]"
      >
        <div class="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div class="flex items-center gap-2">
            <h3 class="m-0 font-accent text-[18px] font-medium text-text-primary">Vorschau</h3>
            <span class="font-mono text-[11px] tabular-nums text-text-muted">#{{ selectedArticle.id }}</span>
          </div>
          <button type="button" aria-label="Schließen" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent text-text-muted transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary" @click="selectedArticle = null">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-6 [&>*]:shrink-0">
          <div
            class="relative flex h-[240px] w-full items-center justify-center overflow-hidden rounded-[10px] border border-border-subtle bg-bg-card-subtle bg-cover bg-center"
            :class="{ 'border-dashed': !selectedArticle.imageUrl }"
            :style="selectedArticle.imageUrl ? { backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` } : {}"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
          >
            <div v-if="!selectedArticle.imageUrl && !isGeneratingImage" class="flex flex-col items-center gap-2 px-6 text-center">
              <span class="font-mono text-[11px] text-text-muted">Titelbild</span>
              <p class="m-0 text-[13px] text-text-secondary">Datei hierher ziehen oder erzeugen lassen.</p>
            </div>
            <div v-if="isGeneratingImage" class="absolute inset-0 flex items-center justify-center bg-black/50 font-mono text-[13px] text-white">
              Bild wird erzeugt … {{ genElapsed }} s
            </div>
          </div>
          <div class="-mt-2 flex flex-wrap items-center gap-2 text-[12px]">
            <button
              class="cursor-pointer rounded-[7px] border border-border-subtle bg-bg-card px-3 py-1.5 font-medium text-text-primary transition-colors hover:bg-bg-card-subtle disabled:opacity-50"
              :disabled="isGeneratingImage"
              @click="generateImageForArticle"
            >
              {{ selectedArticle.imageUrl ? 'Neu erzeugen' : 'Bild erzeugen' }}
            </button>
            <label class="cursor-pointer rounded-[7px] border border-border-subtle bg-bg-card px-3 py-1.5 text-text-secondary transition-colors hover:bg-bg-card-subtle">
              Hochladen
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
            <button
              v-if="selectedArticle.imageUrl"
              class="cursor-pointer border-none bg-transparent px-1 text-[#b93829] hover:underline"
              @click="removeImage(selectedArticle.id)"
            >
              Entfernen
            </button>
            <span v-if="imageError" class="basis-full text-[12px] text-[#b93829]">{{ imageError }}</span>
          </div>
          <details v-if="selectedArticle.imagePrompt" class="-mt-2 text-[12px] text-text-secondary">
            <summary class="cursor-pointer">Bildprompt</summary>
            <p class="m-0 mt-1.5 leading-[1.5]">{{ selectedArticle.imagePrompt }}</p>
          </details>

          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-[6px] border border-[rgba(92,122,20,0.28)] bg-[#dbe8a6]/35 px-2.5 py-0.5 text-[12px] font-medium text-[#3d520c]">{{ selectedArticle.category }}</span>
            <div v-if="selectedArticle.tags && selectedArticle.tags.length > 0" class="flex flex-wrap gap-1.5">
              <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="rounded-[6px] border border-border-subtle bg-bg-main px-2 py-0.5 font-mono text-[11px] text-text-secondary">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <h2 class="m-0 font-accent text-[22px] font-medium leading-[1.25] text-text-primary">{{ selectedArticle.title }}</h2>

          <div v-if="selectedArticle.teaser" class="rounded-[10px] border border-border-subtle bg-bg-main/60 p-4">
            <strong class="mb-1.5 block text-[12px] font-semibold text-text-primary">Teaser</strong>
            <p class="m-0 text-[13.5px] leading-[1.55] text-text-secondary">{{ selectedArticle.teaser }}</p>
          </div>

          <div v-if="selectedArticle.keyTakeaways" class="rounded-[10px] border border-border-subtle bg-bg-main/60 p-4">
            <strong class="mb-1.5 block text-[12px] font-semibold text-text-primary">Kernpunkte</strong>
            <ul class="m-0 pl-4 text-[13.5px] leading-[1.55] text-text-secondary [&>li]:mb-1.5 last:[&>li]:mb-0">
              <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point">
                {{ point }}
              </li>
            </ul>
          </div>

          <div class="rounded-[10px] border border-border-subtle bg-bg-main/60 p-4">
            <strong class="mb-2 block text-[12px] font-semibold text-text-primary">Nutzung im Feed</strong>
            <dl v-if="selectedStats" class="m-0 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] text-text-secondary">
              <dt>Aufrufe</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ selectedStats.impressions }}</dd>
              <dt>Ø Kartenzeit</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ formatSeconds(selectedStats.avgDwellSeconds) }}</dd>
              <dt>Schnell weiter</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ selectedStats.quickSkips }}</dd>
              <dt>Geöffnet</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ selectedStats.reads }}</dd>
              <dt>Ø Lesedauer</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ formatSeconds(selectedStats.avgReadSeconds) }}</dd>
              <dt>Reaktionen</dt><dd class="m-0 text-right font-mono font-medium tabular-nums text-text-primary">{{ selectedStats.likes }} · {{ selectedStats.comments }} · {{ selectedStats.shares }}</dd>
            </dl>
            <p v-else class="m-0 text-[13px] text-text-muted">Noch keine Daten</p>
          </div>

          <!-- Versionen (GET /api/articles/:id/versions) -->
          <div v-if="versions.length > 0" class="rounded-[10px] border border-border-subtle bg-bg-main/60 p-4">
            <div class="mb-2 flex items-baseline justify-between text-[12px] text-text-primary">
              <strong>Versionen</strong>
              <span class="font-mono text-[11px] tabular-nums text-text-muted">{{ versions.length }} gespeichert</span>
            </div>
            <ol class="m-0 flex list-none flex-col divide-y divide-border-subtle p-0">
              <li
                v-for="(v, idx) in versions"
                :key="v.id"
                class="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-text-secondary">
                    <span class="font-mono font-medium text-text-primary">v{{ v.version }}</span>
                    <span>{{ versionSourceLabel(v) }}</span>
                    <span class="font-mono text-[11px] tabular-nums text-text-muted">{{ formatDateTime(v.createdAt) }}</span>
                  </div>
                  <div v-if="v.model" class="mt-0.5 truncate font-mono text-[11px] text-text-muted">
                    {{ v.model }} · T {{ v.temperature }} · Seed {{ v.seed }}
                  </div>
                  <p class="m-0 mt-1 line-clamp-2 text-[12.5px] leading-[1.45] text-text-secondary">{{ v.teaser || '–' }}</p>
                </div>
                <span v-if="idx === 0" class="shrink-0 pt-0.5 font-mono text-[11px] font-medium text-[#5c7a14]">aktuell</span>
                <button
                  v-else
                  type="button"
                  class="shrink-0 cursor-pointer rounded-[6px] border border-border-subtle bg-bg-card px-2.5 py-1 text-[11.5px] font-medium text-text-primary transition-colors hover:bg-bg-card-subtle disabled:opacity-50"
                  :disabled="restoringVersion !== null"
                  @click="restoreVersion(v.version)"
                >
                  {{ restoringVersion === v.version ? '…' : 'Wiederherstellen' }}
                </button>
              </li>
            </ol>
          </div>

          <div class="font-mono text-[11.5px] text-text-muted">
            {{ selectedArticle.author }} · {{ estimateReadingTime(selectedArticle.content) }} · {{ formatDate(selectedArticle.createdAt) }}
          </div>

          <div class="whitespace-pre-line text-[13.5px] leading-[1.65] text-text-secondary">
            {{ selectedArticle.content }}
          </div>
        </div>

        <div class="flex flex-col gap-2 border-t border-border-subtle bg-bg-card px-6 py-4">
          <button
            class="cursor-pointer rounded-[8px] border-none bg-accent-ink px-4 py-2.5 text-[13px] font-medium text-[#fdfbf7] transition-opacity duration-150 hover:opacity-90"
            @click="toggleStatus(selectedArticle)"
          >
            {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
          </button>
          <div class="grid grid-cols-2 gap-2">
            <button
              class="cursor-pointer rounded-[8px] border border-border-subtle bg-bg-main px-3 py-2 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-card-subtle"
              @click="openMobilePreview(selectedArticle.id)"
            >
              Im Feed ansehen
            </button>
            <button
              class="cursor-pointer rounded-[8px] border border-border-subtle bg-bg-main px-3 py-2 text-[13px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-card-subtle"
              @click="editArticle(selectedArticle)"
            >
              Bearbeiten
            </button>
          </div>
          <button
            class="cursor-pointer rounded-[8px] border border-[#b93829]/25 bg-[#b93829]/5 px-3 py-2 text-[13px] font-medium text-[#b93829] transition-colors duration-150 hover:bg-[#b93829]/10"
            @click="deleteArticle(selectedArticle.id)"
          >
            Löschen
          </button>
        </div>
      </div>
    </transition>

    <!-- RSS-Import -->
    <div
      v-if="isImportOpen"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(31,27,22,0.28)] p-4"
      @click.self="isImportOpen = false"
    >
      <form class="flex w-[520px] max-w-full flex-col gap-4 rounded-[14px] border border-border-subtle bg-bg-card p-6 shadow-[0_16px_48px_rgba(31,27,22,0.14)]" @submit.prevent="runImport">
        <h3 class="m-0 font-accent text-[22px] font-medium text-text-primary">RSS importieren</h3>
        <label class="flex flex-col gap-1.5 text-[13px] font-medium text-text-secondary">
          Feed-Adresse
          <input v-model="importForm.url" type="url" required class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none focus:border-border-focus" />
        </label>
        <div class="flex flex-wrap items-center gap-5 text-[13px] text-text-secondary">
          <label class="flex items-center gap-2">
            Anzahl
            <input v-model.number="importForm.limit" type="number" min="1" max="100" class="w-[72px] rounded-[8px] border border-border-subtle bg-bg-main px-2.5 py-1.5 font-mono text-[13px] tabular-nums text-text-primary outline-none focus:border-border-focus" />
          </label>
          <label class="flex items-center gap-2">
            <input v-model="importForm.fullText" type="checkbox" />
            Volltext von der Artikelseite laden
          </label>
        </div>
        <p class="m-0 text-[12.5px] text-text-muted">Bereits importierte Artikel werden übersprungen. Teaser, Kategorie und Tags entstehen danach im Hintergrund.</p>
        <p v-if="importResult" class="m-0 text-[13px] font-medium text-text-primary">{{ importResult }}</p>
        <div class="flex justify-end gap-2.5 border-t border-border-subtle pt-4">
          <button type="button" class="cursor-pointer rounded-[8px] border border-border-subtle bg-transparent px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-card-subtle hover:text-text-primary" @click="isImportOpen = false">Schließen</button>
          <button type="submit" :disabled="isImporting" class="cursor-pointer rounded-[8px] border-none bg-accent-ink px-4 py-2 text-[13px] font-medium text-[#fdfbf7] disabled:opacity-50">
            {{ isImporting ? 'Importiere …' : 'Importieren' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Artikel anlegen / bearbeiten -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(31,27,22,0.28)] p-4 backdrop-blur-[4px]"
      @click.self="closeModal"
    >
      <div class="max-h-[90vh] w-[680px] max-w-full overflow-y-auto rounded-[14px] border border-border-subtle bg-bg-card p-6 shadow-[0_16px_48px_rgba(31,27,22,0.16)] md:p-7">
        <div class="mb-5 flex items-start justify-between">
          <h3 class="m-0 font-accent text-[22px] font-medium text-text-primary">{{ newArticle.id ? 'Artikel bearbeiten' : 'Neuer Artikel' }}</h3>
          <button type="button" aria-label="Schließen" class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[7px] border-none bg-transparent text-text-muted transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary" @click="closeModal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="saveArticle">
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[13px] font-medium text-text-secondary">Text</label>
              <div class="flex gap-1.5">
                <button
                  type="button"
                  class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-main px-2.5 py-1 text-[12px] font-medium text-text-secondary hover:bg-bg-card-subtle hover:text-text-primary"
                  @click="pasteFromClipboard"
                >
                  Einfügen
                </button>
                <button
                  type="button"
                  class="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-[rgba(92,122,20,0.3)] bg-[#dbe8a6]/35 px-2.5 py-1 text-[12px] font-medium text-[#3d520c] hover:bg-[#dbe8a6]/55"
                  :disabled="isExtracting"
                  @click="autoFillFromContent"
                >
                  <span v-if="isExtracting" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-black/20 border-t-current"></span>
                  Titel und Tags vorschlagen
                </button>
              </div>
            </div>
            <textarea
              v-model="newArticle.content"
              rows="6"
              placeholder="Artikeltext oder Agenturmeldung"
              required
              class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] leading-[1.55] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"
              @input="onContentInput"
            ></textarea>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-[13px] font-medium text-text-secondary">Titel</label>
              <button
                type="button"
                class="cursor-pointer rounded-[6px] border border-border-subtle bg-bg-main px-2.5 py-1 text-[12px] font-medium text-text-secondary hover:bg-bg-card-subtle hover:text-text-primary"
                title="Titel aus dem ersten Satz ableiten"
                @click="generateTitleOnly"
              >
                Aus Text übernehmen
              </button>
            </div>
            <input
              v-model="newArticle.title"
              type="text"
              placeholder="Leer lassen, dann wird er erzeugt"
              class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"
            />
          </div>

          <!-- Generierte Inhalte, beim Bearbeiten frei aenderbar -->
          <template v-if="newArticle.id">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-secondary">Teaser</label>
              <textarea v-model="newArticle.teaser" rows="3" placeholder="Wird aus dem Text erzeugt" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] leading-[1.5] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"></textarea>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-secondary">Kernpunkte <span class="font-normal text-text-muted">(ein Punkt pro Zeile)</span></label>
              <textarea v-model="keyPointsText" rows="4" placeholder="Wird aus dem Text erzeugt" class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] leading-[1.5] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"></textarea>
            </div>
            <p class="-mt-2 m-0 text-[12px] text-text-muted">
              Geänderter Teaser oder geänderte Kernpunkte werden als eigene Version gespeichert. Wird nur der Text geändert, erzeugt das System Teaser und Kernpunkte neu.
            </p>
          </template>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-secondary">Kategorie</label>
              <select
                v-model="newArticle.category"
                class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"
              >
                <option value="Auto">Automatisch</option>
                <option value="Politik">Politik</option>
                <option value="Wirtschaft">Wirtschaft</option>
                <option value="Chronik">Chronik</option>
                <option value="Sport">Sport</option>
                <option value="Technologie">Technologie</option>
                <option value="Kultur">Kultur</option>
              </select>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-[13px] font-medium text-text-secondary">Autor</label>
              <input
                v-model="newArticle.author"
                type="text"
                list="author-suggestions"
                placeholder="Name oder Quelle"
                class="rounded-[8px] border border-border-subtle bg-bg-main px-3.5 py-2.5 font-[inherit] text-[13.5px] text-text-primary outline-none transition-colors duration-150 focus:border-border-focus"
              />
              <datalist id="author-suggestions">
                <option value="David Windischbauer" />
                <option value="Stefan Schachner" />
                <option value="Redaktion" />
                <option value="APA Redaktion" />
              </datalist>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-[13px] font-medium text-text-secondary">Unterkategorien</label>
            <div class="mt-0.5 flex flex-wrap gap-1.5">
              <button
                v-for="sub in availableSubtags"
                :key="sub.slug"
                type="button"
                class="flex cursor-pointer items-center rounded-[6px] border border-border-subtle bg-bg-main px-2.5 py-1 text-[12px] text-text-secondary transition-colors duration-150 hover:bg-bg-card-subtle hover:text-text-primary"
                :class="{ 'border-[#5c7a14] bg-[#dbe8a6]/35 font-semibold text-[#3d520c]': isTagSelected(sub.name) }"
                @click="toggleTag(sub.name)"
              >
                <span>{{ sub.name }}</span>
              </button>
            </div>
          </div>

          <div class="mt-2 flex justify-end gap-2.5 border-t border-border-subtle pt-4">
            <button type="button" class="cursor-pointer rounded-[8px] border border-border-subtle bg-transparent px-4 py-2 text-[13px] font-medium text-text-secondary hover:bg-bg-card-subtle hover:text-text-primary" @click="closeModal">Abbrechen</button>
            <button
              type="submit"
              class="cursor-pointer rounded-[8px] border-none bg-accent-ink px-4 py-2 text-[13px] font-medium text-[#fdfbf7] hover:opacity-90"
            >
              {{ newArticle.id ? 'Speichern' : 'Anlegen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
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
  imagePrompt?: string | null;
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


const config = useRuntimeConfig();

const articles = ref<DashboardArticle[]>([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Chronik', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');
const allTags = ref<TagStat[]>([]);

// Unterkategorien der gewaehlten Hauptkategorie
const canonicalSubtagsForActiveCategory = computed<SubtagDefinition[]>(() => CATEGORY_SUBTAGS[activeCategory.value] || []);
const activeTag = ref<string | null>(null);

// Bei "Alle" koennen sehr viele Tags zusammenkommen, standardmaessig nur die haeufigsten zeigen
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

const publishedCount = computed(() => articles.value.filter((a) => a.status === 'published').length);
const draftCount = computed(() => articles.value.filter((a) => a.status === 'draft').length);

const CATEGORY_BAR_COLORS: Record<string, string> = {
  Politik: '#1f1b16',
  Wirtschaft: '#b46a10',
  Technologie: '#5c7a14',
  Chronik: '#4f5d6b',
  Sport: '#a64d36',
  Kultur: '#6b4f6e'
};

const categoryBreakdown = computed(() => {
  const total = articles.value.length;
  if (total === 0) return [];
  const counts = new Map<string, number>();
  for (const a of articles.value) {
    const cat = a.category || 'Sonstige';
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({
      category,
      count,
      percent: Math.max(4, Math.round((count / total) * 1000) / 10),
      color: CATEGORY_BAR_COLORS[category] || '#7b7266'
    }));
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

// Farben fuer Kategorie- und Status-Pillen in der Tabelle (ruhige Palette auf warmem Grund)
const categoryPillClasses: Record<string, string> = {
  politik: 'bg-bg-card-subtle text-text-primary',
  wirtschaft: 'bg-bg-card-subtle text-text-primary',
  sport: 'bg-bg-card-subtle text-text-primary',
  technologie: 'bg-[#dbe8a6]/40 text-[#3d520c]',
  kultur: 'bg-bg-card-subtle text-text-primary',
  chronik: 'bg-bg-card-subtle text-text-primary'
};

const getCategoryPillClasses = (category?: string): string =>
  categoryPillClasses[(category || '').toLowerCase()] || 'bg-bg-card-subtle text-text-primary';

const statusBadgeClasses: Record<ArticleStatus, string> = {
  draft: 'bg-bg-card-subtle text-text-secondary',
  published: 'bg-[#1f7a4c]/12 text-[#1f7a4c]'
};

const statusDotClasses: Record<ArticleStatus, string> = {
  draft: 'bg-text-muted',
  published: 'bg-[#1f7a4c]'
};

const formatDate = (dateStr?: string | Date | null): string => {
  if (!dateStr) return '';
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
const imageError = ref('');
const genElapsed = ref(0);
let genTimer: ReturnType<typeof setInterval> | null = null;

// API Calls
const fetchArticles = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles`);
    if (res.ok) {
      articles.value = await res.json();
      // Offene Vorschau auf den neuen Stand bringen (Bild, Teaser, Tags aus einem Job)
      const open = selectedArticle.value;
      const fresh = open ? articles.value.find((a) => a.id === open.id) : undefined;
      if (open && fresh) {
        const teaserChanged = fresh.teaser !== open.teaser;
        selectedArticle.value = fresh;
        if (teaserChanged) fetchVersions(fresh.id);
      }
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

interface GenerationVersion {
  id: number;
  version: number;
  teaser: string | null;
  keyTakeaways: string | null;
  source: 'ai' | 'fallback' | 'manual';
  model: string | null;
  temperature: number | null;
  seed: number | null;
  restoredFrom: number | null;
  createdAt: string;
}

const versions = ref<GenerationVersion[]>([]);
const restoringVersion = ref<number | null>(null);

const versionSourceLabel = (v: GenerationVersion): string => {
  const label = { ai: 'generiert', fallback: 'Heuristik', manual: 'manuell' }[v.source] ?? v.source;
  return v.restoredFrom ? `${label}, aus v${v.restoredFrom}` : label;
};

const formatDateTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleString('de-AT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const fetchVersions = async (articleId: number) => {
  versions.value = [];
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${articleId}/versions`);
    if (res.ok && selectedArticle.value?.id === articleId) versions.value = await res.json();
  } catch (e) {
    console.error(e);
  }
};

const restoreVersion = async (version: number) => {
  const article = selectedArticle.value;
  if (!article) return;
  restoringVersion.value = version;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${article.id}/versions/${version}/restore`, { method: 'POST' });
    if (!res.ok) {
      showToast('Version konnte nicht wiederhergestellt werden', 'error');
      return;
    }
    const restored = versions.value.find((v) => v.version === version);
    if (restored) {
      article.teaser = restored.teaser ?? undefined;
      article.keyTakeaways = restored.keyTakeaways;
    }
    showToast(`Version v${version} wiederhergestellt`, 'success');
    await fetchVersions(article.id);
    fetchArticles();
  } catch (e) {
    console.error(e);
    showToast('Netzwerkfehler beim Wiederherstellen', 'error');
  } finally {
    restoringVersion.value = null;
  }
};

interface ArticleStats {
  articleId: number;
  impressions: number;
  reads: number;
  avgDwellSeconds: number | null;
  avgReadSeconds: number | null;
  quickSkips: number;
  likes: number;
  comments: number;
  shares: number;
}

const statsById = ref(new Map<number, ArticleStats>());
const selectedStats = computed(() => (selectedArticle.value ? statsById.value.get(selectedArticle.value.id) : undefined));

const fetchStats = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/analytics/articles`);
    if (res.ok) {
      const rows: ArticleStats[] = await res.json();
      statsById.value = new Map(rows.map((r) => [r.articleId, r]));
    }
  } catch (e) {
    console.error('Failed to fetch stats', e);
  }
};

const formatSeconds = (value: number | null | undefined): string =>
  value == null ? '–' : `${value.toLocaleString('de-AT', { maximumFractionDigits: 1 })} s`;

// RSS-Import
const isImportOpen = ref(false);
const isImporting = ref(false);
const importResult = ref('');
const importForm = ref({ url: 'https://rss.orf.at/news.xml', limit: 20, fullText: true });

const runImport = async () => {
  isImporting.value = true;
  importResult.value = '';
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/import/rss`, { method: 'POST', body: importForm.value });
    const data = await res.json();
    importResult.value = res.ok
      ? `${data.imported.length} neu aus „${data.source}“, ${data.skipped} übersprungen.`
      : data.error || 'Import fehlgeschlagen';
    if (res.ok) {
      fetchArticles();
      fetchTags();
      fetchJobsStat();
    }
  } catch (e) {
    console.error(e);
    importResult.value = 'Netzwerkfehler';
  } finally {
    isImporting.value = false;
  }
};

const selectArticle = (article: DashboardArticle) => {
  selectedArticle.value = article;
  fetchStats();
  imageError.value = '';
  fetchVersions(article.id);
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
        showToast('Text eingefügt');
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
      showToast('Titel, Kategorie und Tags vorgeschlagen');
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
    showToast('Titel und Tags aus dem Text übernommen');
  } finally {
    isExtracting.value = false;
  }
};

const generateTitleOnly = () => {
  if (!newArticle.value.content || newArticle.value.content.length < 10) return;
  const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
  newArticle.value.title = meta.title;
  showToast('Titel übernommen');
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

const generateImageForArticle = async () => {
  const article = selectedArticle.value;
  if (!article) return;
  isGeneratingImage.value = true;
  imageError.value = '';
  genElapsed.value = 0;
  genTimer = setInterval(() => genElapsed.value++, 1000);

  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${article.id}/generate-image`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      imageError.value = data.error || 'Bild konnte nicht erzeugt werden';
      return;
    }
    article.imageUrl = data.imageUrl;
    article.imagePrompt = data.article?.imagePrompt ?? article.imagePrompt;
    const listArticle = articles.value.find((a) => a.id === article.id);
    if (listArticle) listArticle.imageUrl = data.imageUrl;
    showToast(`Bild erzeugt (${genElapsed.value} s)`);
  } catch (e) {
    console.error(e);
    imageError.value = 'Netzwerkfehler';
  } finally {
    if (genTimer) clearInterval(genTimer);
    genTimer = null;
    isGeneratingImage.value = false;
  }
};

const removeImage = async (id: number) => {
  if (!confirm('Titelbild entfernen?')) return;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${id}/image`, { method: 'DELETE' });
    if (!res.ok) {
      showToast('Titelbild konnte nicht entfernt werden', 'error');
      return;
    }
    if (selectedArticle.value && selectedArticle.value.id === id) {
      selectedArticle.value.imageUrl = null;
    }
    const listArticle = articles.value.find((a) => a.id === id);
    if (listArticle) listArticle.imageUrl = null;
    showToast('Titelbild entfernt', 'success');
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
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}/image`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      showToast('Fehler beim Upload', 'error');
      return;
    }
    const data = await res.json();
    selectedArticle.value.imageUrl = data.imageUrl;
    const listArticle = articles.value.find((a) => a.id === selectedArticle.value?.id);
    if (listArticle) listArticle.imageUrl = data.imageUrl;
    showToast('Bild hochgeladen');
  } catch (e) {
    console.error(e);
    showToast('Fehler beim Upload', 'error');
  }
};

const openMobilePreview = (articleId?: number) => {
  const url = articleId ? `http://localhost:3002/?article=${articleId}` : 'http://localhost:3002';
  window.open(url, '_blank', 'width=390,height=844');
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

// Kernpunkte im Formular zeilenweise, gespeichert als "• Punkt" je Zeile
const keyPointsText = ref('');
let originalGenerated = { teaser: '', keyPoints: '' };

const editArticle = (article: DashboardArticle) => {
  newArticle.value = {
    ...article,
    tags: (article.tags || []).map((t) => t.name)
  };
  keyPointsText.value = parseKeyTakeaways(article.keyTakeaways).join('\n');
  originalGenerated = { teaser: (article.teaser || '').trim(), keyPoints: keyPointsText.value };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

// Formular speichert nur Tag-Namen, fuer die Anzeige brauchen wir wieder Objekte mit slug/color
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

    // Teaser und Kernpunkte nur mitschicken, wenn sie wirklich geaendert wurden.
    // Sonst wuerde eine reine Textaenderung keine Neugenerierung mehr ausloesen.
    const payload: Record<string, unknown> = { ...newArticle.value };
    if (isEdit) {
      delete payload.teaser;
      delete payload.keyTakeaways;
      const points = keyPointsText.value.split('\n').map((line) => line.replace(/^[•\-*]\s*/, '').trim()).filter(Boolean);
      const teaser = (newArticle.value.teaser || '').trim();
      if (teaser !== originalGenerated.teaser || points.join('\n') !== originalGenerated.keyPoints) {
        payload.teaser = teaser || null;
        payload.keyTakeaways = points.length ? points.map((point) => `• ${point}`).join('\n') : null;
      }
    }

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      showToast('Fehler beim Speichern des Artikels', 'error');
      return;
    }

    const data = await res.json();
    const article = isEdit ? newArticle.value : data;

    if (!isEdit) {
      showToast('Artikel angelegt, Teaser wird erzeugt');
    } else {
      if (selectedArticle.value && selectedArticle.value.id === article.id) {
        const { tags: formTags, ...rest } = newArticle.value;
        selectedArticle.value = { ...selectedArticle.value, ...rest, tags: resolveTagObjects(formTags) };
      }
      showToast(data.generationJobId ? 'Gespeichert, Teaser wird neu erzeugt' : 'Gespeichert');
      if (selectedArticle.value?.id === article.id) fetchVersions(article.id);
    }

    closeModal();
    fetchArticles();
    fetchTags();
  } catch (e) {
    console.error(e);
    showToast('Netzwerkfehler beim Speichern', 'error');
  }
};

// /?article=<id> (z. B. aus der Job-Liste) oeffnet die Vorschau dieses Artikels
const route = useRoute();
const openArticleFromQuery = () => {
  const id = Number(route.query.article);
  const article = Number.isInteger(id) ? articles.value.find((a) => a.id === id) : undefined;
  if (article) selectArticle(article);
};
watch(() => route.query.article, openArticleFromQuery);

// Solange Jobs laufen, alle paar Sekunden nachladen, damit fertige Bilder und
// Teaser sofort in Liste und Vorschau erscheinen. Ein letzter Abruf folgt,
// wenn der letzte Job fertig ist.
let jobPoll: ReturnType<typeof setInterval> | null = null;
let hadOpenJobs = false;
const pollJobs = async () => {
  await fetchJobsStat();
  const open = pendingJobsCount.value > 0;
  if (open || hadOpenJobs) {
    await fetchArticles();
    fetchTags();
  }
  hadOpenJobs = open;
};

onMounted(async () => {
  await fetchArticles();
  openArticleFromQuery();
  fetchTags();
  fetchJobsStat();
  fetchStats();
  jobPoll = setInterval(pollJobs, 4000);
});

onUnmounted(() => {
  if (jobPoll) clearInterval(jobPoll);
});
</script>

<style scoped>
.drawer-enter-active, .drawer-leave-active {
  transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.drawer-enter-from, .drawer-leave-to {
  transform: translateX(100%);
}

.toast-enter-active, .toast-leave-active {
  transition: opacity 0.2s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
