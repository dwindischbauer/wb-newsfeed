<template>
  <div class="mx-auto max-w-[1440px] px-4 pb-12 pt-6 md:px-8">
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
      <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div v-for="stat in stats" :key="stat.label" class="rounded-xl border border-border-subtle bg-bg-card px-5 py-4">
          <div class="text-[0.76rem] text-text-secondary">{{ stat.label }}</div>
          <div class="mt-1 text-[1.7rem] font-bold leading-none text-text-primary">{{ stat.value }}</div>
        </div>
      </div>

      <div class="rounded-xl border border-border-subtle bg-bg-card p-6">
        <div class="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 class="m-0 text-[1.15rem] font-bold text-[#14151a]">Artikel</h2>

          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-2 rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.45rem] text-text-secondary focus-within:border-border-focus">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Titel, Autor oder Tag suchen"
                class="w-[160px] border-none bg-transparent text-[0.8rem] text-[#14151a] outline-none placeholder:text-text-muted"
              />
              <button v-if="searchQuery" class="cursor-pointer border-none bg-transparent text-[1rem] text-text-muted" @click="searchQuery = ''">&times;</button>
            </div>
            <button
              class="cursor-pointer whitespace-nowrap rounded-lg border border-border-subtle bg-white px-4 py-[0.55rem] text-[0.82rem] font-semibold text-accent-ink hover:bg-black/[0.04]"
              @click="isImportOpen = true"
            >
              RSS importieren
            </button>
            <button
              class="cursor-pointer whitespace-nowrap rounded-lg border-none bg-accent-ink px-4 py-[0.55rem] text-[0.82rem] font-semibold text-white hover:opacity-90"
              @click="openModal"
            >
              Neuer Artikel
            </button>
          </div>
        </div>

        <!-- Filter Chips (Categories) -->
        <div class="mb-[0.85rem] flex flex-wrap gap-2">
          <button
            v-for="cat in categories"
            :key="cat"
            class="cursor-pointer rounded-full border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.35rem] text-[0.76rem] font-medium text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.07)] hover:text-[#14151a]"
            :class="{ 'border-accent-lime bg-accent-lime font-semibold text-[#14151a]': activeCategory === cat }"
            @click="activeCategory = cat; activeTag = null"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Unterkategorien der gewaehlten Kategorie, bei "Alle" die vorhandenen Tags -->
        <div
          v-if="canonicalSubtagsForActiveCategory.length > 0"
          class="mb-5 flex flex-wrap items-center gap-[0.45rem] rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.02)] px-3 py-2"
        >
          <span class="text-[0.72rem] font-semibold text-text-muted">Unterkategorie</span>
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
          <span class="text-[0.72rem] font-semibold text-text-muted">Tags</span>
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

        <div class="overflow-x-auto">
          <table class="w-full border-separate [border-spacing:0_4px]">
            <thead>
              <tr>
                <th class="w-[70px] border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Bild</th>
                <th class="border-b border-border-subtle px-4 py-3 text-left text-[0.72rem] font-semibold uppercase tracking-[0.03em] text-text-muted">Titel</th>
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
                      alt=""
                      loading="lazy"
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
                      @click="selectArticle(article)"
                    >
                      Vorschau
                    </button>
                    <button
                      class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.6rem] py-1 text-[0.72rem] font-medium text-text-secondary transition-all duration-200 hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                      @click="toggleStatus(article)"
                    >
                      {{ article.status === 'published' ? 'Entwurf' : 'Live' }}
                    </button>
                    <button
                      class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.6rem] py-1 text-[0.72rem] font-medium text-[#f87171] transition-all duration-200 hover:bg-[rgba(239,68,68,0.2)]"
                      @click="deleteArticle(article.id)"
                    >
                      Löschen
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredArticles.length === 0">
                <td colspan="6" class="px-4 py-12 text-center">
                  <p class="m-0 text-[0.85rem] text-text-muted">Keine Artikel gefunden.</p>
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
        class="fixed right-0 top-0 z-[200] flex h-screen w-[440px] max-w-[90vw] flex-col border-l border-border-subtle bg-[rgba(255,255,255,0.9)] shadow-[-10px_0_40px_rgba(20,20,20,0.14)] backdrop-blur-[20px]"
      >
        <div class="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <h3 class="m-0 text-[1.05rem] font-bold text-[#14151a]">Vorschau</h3>
          <button class="cursor-pointer border-none bg-transparent text-[1.5rem] leading-none text-text-muted hover:text-[#14151a]" @click="selectedArticle = null">&times;</button>
        </div>

        <div class="flex flex-1 flex-col gap-5 overflow-y-auto p-6 [&>*]:shrink-0">
          <div
            class="relative flex h-[260px] w-full items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-[#efece3] bg-cover bg-center"
            :class="{ 'border-2 border-dashed': !selectedArticle.imageUrl }"
            :style="selectedArticle.imageUrl ? { backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` } : {}"
            @dragover.prevent
            @drop.prevent="handleImageDrop"
          >
            <p v-if="!selectedArticle.imageUrl && !isGeneratingImage" class="m-0 px-6 text-center text-[0.8rem] text-text-secondary">Kein Titelbild. Datei hierher ziehen oder erzeugen lassen.</p>
            <div v-if="isGeneratingImage" class="absolute inset-0 flex items-center justify-center bg-black/45 text-[0.82rem] font-medium text-white">
              Bild wird erzeugt … {{ genElapsed }} s
            </div>
          </div>
          <div class="-mt-2 flex flex-wrap items-center gap-2 text-[0.76rem]">
            <button
              class="cursor-pointer rounded-md border border-border-subtle bg-white px-3 py-[0.35rem] font-semibold text-accent-ink hover:bg-black/[0.04] disabled:opacity-50"
              :disabled="isGeneratingImage"
              @click="generateImageForArticle"
            >
              {{ selectedArticle.imageUrl ? 'Neu erzeugen' : 'Bild erzeugen' }}
            </button>
            <label class="cursor-pointer rounded-md border border-border-subtle bg-white px-3 py-[0.35rem] text-text-secondary hover:bg-black/[0.04]">
              Hochladen
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
            <button
              v-if="selectedArticle.imageUrl"
              class="cursor-pointer border-none bg-transparent px-1 text-[#c0392b] hover:underline"
              @click="removeImage(selectedArticle.id)"
            >
              Entfernen
            </button>
            <span v-if="imageError" class="basis-full text-[0.74rem] text-[#c0392b]">{{ imageError }}</span>
          </div>
          <details v-if="selectedArticle.imagePrompt" class="-mt-2 text-[0.74rem] text-text-secondary">
            <summary class="cursor-pointer">Bildprompt</summary>
            <p class="m-0 mt-1 leading-[1.45]">{{ selectedArticle.imagePrompt }}</p>
          </details>

          <div class="flex flex-wrap items-center gap-[0.6rem]">
            <span class="rounded-full border border-[rgba(92,122,20,0.3)] bg-[#efece3] px-[0.65rem] py-1 text-[0.72rem] font-bold text-[#5c7a14]">{{ selectedArticle.category }}</span>
            <div v-if="selectedArticle.tags && selectedArticle.tags.length > 0" class="flex flex-wrap gap-[0.35rem]">
              <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-[0.2rem] text-[0.7rem] text-text-secondary">
                #{{ tag.name }}
              </span>
            </div>
          </div>

          <h2 class="m-0 text-[1.25rem] font-extrabold leading-[1.35] text-[#14151a]">{{ selectedArticle.title }}</h2>

          <div v-if="selectedArticle.teaser" class="rounded-[10px] border border-border-subtle p-[0.95rem]">
            <strong class="mb-2 block text-[0.78rem] text-[#24252a]">Teaser</strong>
            <p class="m-0 text-[0.8rem] leading-[1.5] text-[#5a5b61]">{{ selectedArticle.teaser }}</p>
          </div>

          <div v-if="selectedArticle.keyTakeaways" class="rounded-[10px] border border-border-subtle p-[0.95rem]">
            <strong class="mb-2 block text-[0.78rem] text-[#24252a]">Kernpunkte</strong>
            <ul class="m-0 pl-5 text-[0.8rem] leading-[1.5] text-[#5a5b61] [&>li]:mb-[0.3rem]">
              <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point">
                {{ point }}
              </li>
            </ul>
          </div>

          <div class="rounded-[10px] border border-border-subtle p-[0.95rem]">
            <strong class="mb-2 block text-[0.78rem] text-[#24252a]">Nutzung im Feed</strong>
            <dl v-if="selectedStats" class="m-0 grid grid-cols-2 gap-x-4 gap-y-[0.35rem] text-[0.78rem] text-[#5a5b61]">
              <dt>Aufrufe</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ selectedStats.impressions }}</dd>
              <dt>Ø Zeit auf der Karte</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ formatSeconds(selectedStats.avgDwellSeconds) }}</dd>
              <dt>Schnell weitergewischt</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ selectedStats.quickSkips }}</dd>
              <dt>Geöffnet</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ selectedStats.reads }}</dd>
              <dt>Ø Lesedauer</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ formatSeconds(selectedStats.avgReadSeconds) }}</dd>
              <dt>Likes · Kommentare · Teilen</dt><dd class="m-0 text-right font-semibold text-[#24252a]">{{ selectedStats.likes }} · {{ selectedStats.comments }} · {{ selectedStats.shares }}</dd>
            </dl>
            <p v-else class="m-0 text-[0.78rem] text-text-muted">Noch keine Daten.</p>
          </div>

          <!-- Versionen (GET /api/articles/:id/versions) -->
          <div v-if="versions.length > 0" class="rounded-[10px] border border-border-subtle p-[0.95rem]">
            <div class="mb-2 flex items-baseline justify-between text-[0.78rem] text-[#24252a]">
              <strong>Versionen</strong>
              <span class="text-[0.72rem] text-text-muted">{{ versions.length }} gespeichert</span>
            </div>
            <ol class="m-0 flex list-none flex-col p-0">
              <li
                v-for="(v, idx) in versions"
                :key="v.id"
                class="flex items-start gap-3 border-t border-border-subtle py-[0.6rem] first:border-t-0 first:pt-0 last:pb-0"
              >
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-x-[0.45rem] gap-y-[0.15rem] text-[0.72rem] text-[#5a5b61]">
                    <span class="font-semibold text-[#24252a]">v{{ v.version }}</span>
                    <span>{{ versionSourceLabel(v) }}</span>
                    <span>{{ formatDateTime(v.createdAt) }}</span>
                  </div>
                  <div v-if="v.model" class="mt-[0.1rem] truncate font-mono text-[0.68rem] text-text-muted">
                    {{ v.model }} · T {{ v.temperature }} · Seed {{ v.seed }}
                  </div>
                  <p class="m-0 mt-[0.2rem] line-clamp-2 text-[0.78rem] leading-[1.45] text-[#3f4046]">{{ v.teaser || '–' }}</p>
                </div>
                <span v-if="idx === 0" class="shrink-0 pt-[0.1rem] text-[0.72rem] font-semibold text-[#4d6612]">aktuell</span>
                <button
                  v-else
                  type="button"
                  class="shrink-0 rounded-full border border-border-subtle bg-white px-[0.7rem] py-[0.25rem] text-[0.72rem] font-semibold text-accent-ink transition-colors hover:bg-black/[0.04] disabled:opacity-50"
                  :disabled="restoringVersion !== null"
                  @click="restoreVersion(v.version)"
                >
                  {{ restoringVersion === v.version ? '…' : 'Wiederherstellen' }}
                </button>
              </li>
            </ol>
          </div>

          <div class="text-[0.74rem] text-text-muted">
            {{ selectedArticle.author }} • {{ estimateReadingTime(selectedArticle.content) }} • {{ formatDate(selectedArticle.createdAt) }}
          </div>

          <div class="whitespace-pre-line text-[0.82rem] leading-[1.6] text-[#3f4046]">
            {{ selectedArticle.content }}
          </div>
        </div>

        <div class="flex flex-col gap-[0.6rem] border-t border-border-subtle bg-[rgba(255,255,255,0.85)] px-6 py-5">
          <button
            class="cursor-pointer rounded-lg border-none bg-accent-ink px-4 py-[0.55rem] text-[0.82rem] font-semibold text-white hover:opacity-90"
            @click="toggleStatus(selectedArticle)"
          >
            {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
          </button>
          <button
            class="cursor-pointer rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.05)] p-2 text-[0.8rem] font-medium text-[#24252a] transition-all duration-200 hover:bg-[rgba(20,20,20,0.1)]"
            @click="openMobilePreview(selectedArticle.id)"
          >
            Im Feed ansehen
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

    <!-- RSS-Import -->
    <div
      v-if="isImportOpen"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(20,20,20,0.18)] p-4"
      @click.self="isImportOpen = false"
    >
      <form class="flex w-[520px] max-w-full flex-col gap-4 rounded-2xl border border-border-subtle bg-[#f4f2ec] p-7" @submit.prevent="runImport">
        <h3 class="m-0 text-[1.25rem] font-bold text-[#14151a]">RSS importieren</h3>
        <label class="flex flex-col gap-[0.4rem] text-[0.78rem] font-semibold text-text-secondary">
          Feed-Adresse
          <input v-model="importForm.url" type="url" required class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none focus:border-border-focus" />
        </label>
        <div class="flex flex-wrap items-center gap-5 text-[0.8rem] text-text-secondary">
          <label class="flex items-center gap-2">
            Anzahl
            <input v-model.number="importForm.limit" type="number" min="1" max="100" class="w-[70px] rounded-lg border border-border-subtle bg-white px-2 py-1" />
          </label>
          <label class="flex items-center gap-2">
            <input v-model="importForm.fullText" type="checkbox" />
            Volltext von der Artikelseite laden
          </label>
        </div>
        <p class="m-0 text-[0.76rem] text-text-muted">Bereits importierte Artikel werden übersprungen. Teaser, Kategorie und Tags entstehen danach im Hintergrund.</p>
        <p v-if="importResult" class="m-0 text-[0.8rem] text-[#24252a]">{{ importResult }}</p>
        <div class="flex justify-end gap-3">
          <button type="button" class="cursor-pointer rounded-lg border border-border-subtle bg-transparent px-4 py-[0.55rem] text-[0.82rem] text-text-secondary" @click="isImportOpen = false">Schließen</button>
          <button type="submit" :disabled="isImporting" class="cursor-pointer rounded-lg border-none bg-accent-ink px-4 py-[0.55rem] text-[0.82rem] font-semibold text-white disabled:opacity-50">
            {{ isImporting ? 'Importiere …' : 'Importieren' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Artikel anlegen / bearbeiten -->
    <div
      v-if="isModalOpen"
      class="fixed inset-0 z-[300] flex items-center justify-center bg-[rgba(20,20,20,0.18)] p-4 backdrop-blur-[8px]"
      @click.self="closeModal"
    >
      <div class="max-h-[90vh] w-[680px] max-w-full overflow-y-auto rounded-2xl border border-border-subtle bg-[#f4f2ec] p-7 shadow-[0_16px_50px_rgba(20,20,20,0.16)]">
        <div class="mb-6 flex items-start justify-between">
          <h3 class="m-0 text-[1.25rem] font-bold text-[#14151a]">{{ newArticle.id ? 'Artikel bearbeiten' : 'Neuer Artikel' }}</h3>
          <button class="cursor-pointer border-none bg-transparent text-[1.6rem] leading-none text-text-muted hover:text-[#14151a]" @click="closeModal">&times;</button>
        </div>

        <form class="flex flex-col gap-5" @submit.prevent="saveArticle">
          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex items-center justify-between">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Text</label>
              <div class="flex gap-[0.4rem]">
                <button
                  type="button"
                  class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-text-secondary hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
                  @click="pasteFromClipboard"
                >
                  Einfügen
                </button>
                <button
                  type="button"
                  class="cursor-pointer rounded-md border border-[rgba(111,143,26,0.3)] bg-[rgba(111,143,26,0.12)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-[#6f8f1a] hover:bg-[rgba(20,20,20,0.08)]"
                  :disabled="isExtracting"
                  @click="autoFillFromContent"
                >
                  <span v-if="isExtracting" class="h-3 w-3 animate-[spin_0.8s_linear_infinite] rounded-full border-2 border-[rgba(20,20,20,0.2)] border-t-current"></span>
                  Titel und Tags vorschlagen
                </button>
              </div>
            </div>
            <textarea
              v-model="newArticle.content"
              rows="6"
              placeholder="Artikeltext oder Agenturmeldung"
              required
              class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
              @input="onContentInput"
            ></textarea>
          </div>

          <div class="flex flex-col gap-[0.4rem]">
            <div class="flex items-center justify-between">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Titel</label>
              <button
                type="button"
                class="cursor-pointer rounded-md border border-border-subtle bg-[rgba(20,20,20,0.04)] px-[0.55rem] py-1 text-[0.72rem] font-medium text-text-secondary hover:bg-[rgba(20,20,20,0.08)] hover:text-[#14151a]"
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
              required
              class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-[0.4rem]">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Kategorie</label>
              <select
                v-model="newArticle.category"
                class="rounded-lg border border-border-subtle bg-[rgba(20,20,20,0.03)] px-[0.85rem] py-[0.65rem] font-[inherit] text-[0.82rem] text-[#14151a] outline-none transition-colors duration-200 focus:border-border-focus"
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

            <div class="flex flex-col gap-[0.4rem]">
              <label class="text-[0.78rem] font-semibold text-text-secondary">Autor</label>
              <input
                v-model="newArticle.author"
                type="text"
                list="author-suggestions"
                placeholder="Name oder Quelle"
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

          <div class="flex flex-col gap-[0.4rem]">
            <label class="text-[0.78rem] font-semibold text-text-secondary">Unterkategorien</label>
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

          <div class="mt-3 flex justify-end gap-3 border-t border-border-subtle pt-4">
            <button type="button" class="cursor-pointer rounded-lg border border-border-subtle bg-transparent px-[1.1rem] py-[0.55rem] text-[0.82rem] text-text-secondary hover:bg-[rgba(20,20,20,0.05)] hover:text-[#14151a]" @click="closeModal">Abbrechen</button>
            <button
              type="submit"
              class="cursor-pointer rounded-lg border-none bg-accent-ink px-4 py-[0.55rem] text-[0.82rem] font-semibold text-white hover:opacity-90"
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

const stats = computed(() => [
  { label: 'Artikel', value: articles.value.length },
  { label: 'Veröffentlicht', value: articles.value.filter((a) => a.status === 'published').length },
  { label: 'Entwürfe', value: articles.value.filter((a) => a.status === 'draft').length },
  { label: 'Jobs in Arbeit', value: pendingJobsCount.value }
]);

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

// Farben fuer Kategorie- und Status-Pillen in der Tabelle
const categoryPillClasses: Record<string, string> = {
  politik: 'bg-[rgba(239,68,68,0.15)] text-[#f87171]',
  wirtschaft: 'bg-[rgba(16,185,129,0.15)] text-[#34d399]',
  sport: 'bg-[rgba(245,158,11,0.15)] text-[#fbbf24]',
  technologie: 'bg-[rgba(111,143,26,0.15)] text-[#5c7a14]',
  kultur: 'bg-[rgba(217,70,239,0.15)] text-[#e879f9]',
  chronik: 'bg-[rgba(71,85,105,0.12)] text-[#475569]'
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

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newArticle.value)
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
