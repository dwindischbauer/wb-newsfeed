<template>
  <div class="dashboard-layout">
    <!-- Modern Toast Notification -->
    <transition name="toast">
      <div v-if="toastMessage" :class="['toast-notification', toastType]">
        <span class="toast-dot"></span>
        <span>{{ toastMessage }}</span>
      </div>
    </transition>

    <div class="dashboard-main">
      <div class="stats">
        <div class="stat-card">
          <div class="stat-icon-wrapper blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div>
            <h3>Verwaltete Artikel</h3>
            <p>{{ totalArticlesCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper purple">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div>
            <h3>KI-Jobs aktiv</h3>
            <p>{{ pendingJobsCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper green">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div>
            <h3>Live im Feed</h3>
            <p>{{ publishedArticlesCount }}</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrapper amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          </div>
          <div>
            <h3>Feed-Leserate</h3>
            <p>{{ analyticsSummary.readThroughRate }} <span class="stat-sub">({{ analyticsSummary.totalReads }}/{{ analyticsSummary.totalImpressions }})</span></p>
          </div>
        </div>
      </div>
      
      <div class="articles-section">
        <div class="section-header">
          <div>
            <h3>Artikel verwalten</h3>
            <p class="section-subtitle">Übersicht aller redaktionellen Short-Form-Inhalte</p>
          </div>
          <div class="header-actions-row">
            <div class="search-box">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" v-model="searchQuery" placeholder="Suchen nach Titel, Tags, Autor..." />
              <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">&times;</button>
            </div>
            <button class="primary-btn" @click="openModal">
              <span class="btn-icon">+</span> Neuer Artikel
            </button>
          </div>
        </div>

        <div class="category-filters">
          <button 
            v-for="cat in categories" 
            :key="cat"
            :class="['chip', { active: activeCategory === cat }]"
            @click="activeCategory = cat"
          >
            {{ cat }}
          </button>
        </div>

        <div class="tag-filters" v-if="allTags && allTags.length > 0">
          <span class="filter-label">Filter Tags:</span>
          <button 
            :class="['tag-chip-filter', { active: activeTag === null }]"
            @click="activeTag = null"
          >
            Alle
          </button>
          <button 
            v-for="t in allTags" 
            :key="t.id"
            :class="['tag-chip-filter', { active: activeTag === t.name }]"
            @click="activeTag = activeTag === t.name ? null : t.name"
          >
            #{{ t.name }} <span v-if="t.articleCount > 0" class="badge-count">({{ t.articleCount }})</span>
          </button>
        </div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th>Titel</th>
              <th>Kategorie</th>
              <th>Tags</th>
              <th>Autor</th>
              <th>Status</th>
              <th style="text-align: right;">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="article in filteredArticles" 
              :key="article.id"
              :class="{ 'row-selected': selectedArticle && selectedArticle.id === article.id }"
            >
              <td class="article-title-cell">
                <div class="title-with-thumb">
                  <div 
                    v-if="article.imageUrl" 
                    class="table-thumb" 
                    :style="{ backgroundImage: `url(${config.public.apiUrl}${article.imageUrl})` }"
                  ></div>
                  <span class="title-text">{{ article.title }}</span>
                </div>
              </td>
              <td><span :class="['category-cell-badge', `cat-${article.category?.toLowerCase()}`]">{{ article.category }}</span></td>
              <td>
                <div class="table-tags-list">
                  <span v-for="tag in (article.tags || [])" :key="tag.id || tag.name" class="table-tag-chip">
                    #{{ tag.name }}
                  </span>
                  <span v-if="!article.tags || article.tags.length === 0" class="no-tags">-</span>
                </div>
              </td>
              <td class="author-cell">{{ article.author }}</td>
              <td>
                <span :class="['status-pill', article.status]">
                  <span class="status-dot"></span>
                  {{ article.status === 'published' ? 'Veröffentlicht' : 'Entwurf' }}
                </span>
              </td>
              <td style="text-align: right;">
                <div class="table-actions">
                  <button class="table-action-btn" @click="selectArticle(article)" title="Vorschau anzeigen">
                    Vorschau
                  </button>
                  <button class="table-action-btn-subtle" @click="editArticle(article)" title="Bearbeiten">
                    Bearbeiten
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredArticles.length === 0">
              <td colspan="6" class="empty-state-cell">
                <div class="empty-state-wrapper">
                  <span class="empty-icon">🔍</span>
                  <p class="empty-title">Keine Artikel gefunden</p>
                  <p class="empty-desc">Passe deine Filter an oder erstelle einen neuen Artikel.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div> <!-- End dashboard-main -->

    <div class="preview-panel" v-if="selectedArticle">
      <div class="preview-header">
        <h3>Live-Vorschau</h3>
        <span class="sync-badge">Echtzeit-Sync</span>
      </div>
      <div class="preview-content">
        <div v-if="selectedArticle.imageUrl" class="preview-image" :style="{ backgroundImage: `url(${config.public.apiUrl}${selectedArticle.imageUrl})` }">
          <div class="image-action-overlay">
            <div class="image-action-cluster">
              <button 
                class="action-btn-overlay" 
                :disabled="isGeneratingImage"
                @click="generateImageForArticle"
                title="Neues KI-Bild über LocalAI/Stable Diffusion berechnen"
              >
                <span v-if="isGeneratingImage" class="mini-spinner"></span>
                <span v-else>✨</span>
                KI-Bild neu generieren
              </button>

              <!-- Live update right next to the button -->
              <div v-if="imageGenState" class="live-image-status" :class="`status-${imageGenState.type}`">
                <span v-if="imageGenState.type === 'loading'" class="status-spinner"></span>
                <span v-else-if="imageGenState.type === 'error'" class="status-icon">⚠️</span>
                <span v-else-if="imageGenState.type === 'success'" class="status-icon">✓</span>
                <span class="status-text">{{ imageGenState.message }}</span>
                <span v-if="imageGenState.elapsed" class="status-time">({{ imageGenState.elapsed }}s)</span>
                <button v-if="imageGenState.type === 'error'" class="btn-retry-inline" @click="generateImageForArticle">Wiederholen</button>
              </div>
            </div>
            <button class="action-btn danger-btn remove-image-btn" @click="removeImage(selectedArticle.id)">Bild löschen</button>
          </div>
        </div>
        <div v-else class="preview-image-placeholder" @dragover.prevent @drop.prevent="handleImageDrop">
          <p class="placeholder-text">Kein Bild vorhanden</p>
          <div class="placeholder-actions">
            <div class="image-action-cluster">
              <button 
                class="action-btn primary-action-btn" 
                :disabled="isGeneratingImage"
                @click="generateImageForArticle"
              >
                <span v-if="isGeneratingImage" class="mini-spinner"></span>
                <span v-else>✨</span>
                KI-Bild generieren
              </button>

              <!-- Live update right next to the button -->
              <div v-if="imageGenState" class="live-image-status" :class="`status-${imageGenState.type}`">
                <span v-if="imageGenState.type === 'loading'" class="status-spinner"></span>
                <span v-else-if="imageGenState.type === 'error'" class="status-icon">⚠️</span>
                <span v-else-if="imageGenState.type === 'success'" class="status-icon">✓</span>
                <span class="status-text">{{ imageGenState.message }}</span>
                <span v-if="imageGenState.elapsed" class="status-time">({{ imageGenState.elapsed }}s)</span>
                <button v-if="imageGenState.type === 'error'" class="btn-retry-inline" @click="generateImageForArticle">Wiederholen</button>
              </div>
            </div>

            <label class="action-btn upload-btn">
              Bild hochladen
              <input type="file" accept="image/*" @change="handleImageUpload" style="display: none;" />
            </label>
          </div>
          <p class="drop-hint" v-if="!imageGenState">Oder Bild hierher ziehen</p>
        </div>
        <div class="preview-meta-row">
          <span class="preview-category">{{ selectedArticle.category }}</span>
          <div class="preview-tags-container" v-if="selectedArticle.tags && selectedArticle.tags.length > 0">
            <span v-for="tag in selectedArticle.tags" :key="tag.id || tag.name" class="preview-tag-chip">
              #{{ tag.name }}
            </span>
          </div>
        </div>
        <h2 class="preview-title">{{ selectedArticle.title }}</h2>
        <div class="preview-teaser" v-if="selectedArticle.teaser">
          <strong>KI-Zusammenfassung:</strong> {{ selectedArticle.teaser }}
        </div>
        <div class="preview-takeaways" v-if="selectedArticle.keyTakeaways">
          <strong>Kernpunkte:</strong>
          <ul style="padding-left: 1.2rem; margin: 0.5rem 0 0 0;">
            <li v-for="point in parseKeyTakeaways(selectedArticle.keyTakeaways)" :key="point">{{ point }}</li>
          </ul>
        </div>
        <div class="preview-meta">{{ selectedArticle.author }} • {{ estimateReadingTime(selectedArticle.content) }}</div>
        <div class="preview-body">{{ selectedArticle.content }}</div>
      </div>
      <div class="preview-actions">
        <button class="primary-btn" @click="toggleStatus(selectedArticle)">
          {{ selectedArticle.status === 'published' ? 'In Entwurf umwandeln' : 'Veröffentlichen' }}
        </button>
        <button class="action-btn" @click="openMobilePreview">Mobile Ansicht</button>
        <button class="action-btn" @click="editArticle(selectedArticle)">Artikel bearbeiten</button>
        <button class="action-btn danger-btn" @click="deleteArticle(selectedArticle.id)">Löschen</button>
        <button class="action-btn" @click="selectedArticle = null">Schließen</button>
      </div>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ newArticle.id ? 'Artikel bearbeiten' : 'Artikel einpflegen' }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <div class="flashtext-header-row">
              <label>Fließtext (Aus Zwischenablage einfügen)</label>
              <button 
                type="button" 
                class="btn-magic-extract" 
                :disabled="isExtracting || !newArticle.content || newArticle.content.length < 10"
                @click="autoFillFromContent"
                title="Titel, Kategorie und passende Subtags automatisch aus dem Text generieren"
              >
                <span v-if="isExtracting" class="mini-spinner"></span>
                <span v-else>⚡</span>
                KI Auto-Ausfüllen (Titel & Subtags)
              </button>
            </div>
            <textarea 
              v-model="newArticle.content" 
              rows="6" 
              placeholder="Füge hier den Volltext der Nachricht ein..."
            ></textarea>
          </div>

          <div class="form-group">
            <div class="label-with-action">
              <label>Titel</label>
              <button 
                v-if="newArticle.content && newArticle.content.length >= 10" 
                type="button" 
                class="btn-small-extract" 
                @click="generateTitleOnly"
                title="Titel automatisch aus dem Fließtext ableiten"
              >
                ⚡ Auto-Titel ableiten
              </button>
            </div>
            <input type="text" v-model="newArticle.title" placeholder="Titel der Meldung (wird beim Speichern automatisch generiert falls leer)..." />
          </div>

          <div class="form-group">
            <label>Kategorie</label>
            <select v-model="newArticle.category" @change="onCategoryChange">
              <option value="Auto">KI-Erkennung (Auto)</option>
              <option v-for="cat in categories.slice(1)" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>

          <!-- Kategoriespezifische Subtags Section -->
          <div class="form-group">
            <label class="subtags-section-label">
              Empfohlene Subtags für <span class="active-cat-name">{{ newArticle.category === 'Auto' ? 'Erkennung' : newArticle.category }}</span>:
            </label>
            <div class="subtags-category-grid" v-if="availableSubtags && availableSubtags.length > 0">
              <button 
                type="button"
                v-for="sub in availableSubtags" 
                :key="sub.slug || sub.name"
                :class="['subtag-chip-btn', { selected: isTagSelected(sub.name) }]"
                :style="isTagSelected(sub.name) ? { borderColor: sub.color, backgroundColor: sub.color + '22', color: sub.color } : {}"
                @click="toggleTag(sub.name)"
              >
                <span class="subtag-dot" :style="{ backgroundColor: sub.color }"></span>
                #{{ sub.name }}
              </button>
            </div>

            <!-- Ausgewählte Tags Anzeige -->
            <div class="custom-tags-bar">
              <span class="custom-tags-label">Zugeordnete Subtags:</span>
              <div class="selected-tags-chips">
                <span v-for="t in (newArticle.tags || [])" :key="t" class="active-tag-chip">
                  #{{ t }}
                  <button type="button" @click="toggleTag(t)" class="remove-tag-cross" title="Tag entfernen">&times;</button>
                </span>
                <span v-if="!newArticle.tags || newArticle.tags.length === 0" class="no-tags-hint">
                  Noch keine Tags gewählt (werden beim Speichern automatisch zugeordnet)
                </span>
              </div>
            </div>

            <div class="add-tag-inline">
              <input 
                type="text" 
                v-model="newTagName" 
                placeholder="Eigenen Subtag erstellen (z.B. Innenpolitik)..." 
                @keydown.enter.prevent="addNewTag"
              />
              <button type="button" class="action-btn" @click="addNewTag">+ Hinzufügen</button>
            </div>
          </div>

          <div class="form-group">
            <label>Autor / Quelle</label>
            <input type="text" v-model="newArticle.author" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" @click="closeModal">Abbrechen</button>
          <button class="primary-btn" @click="saveArticle">Speichern & KI Job starten</button>
        </div>
      </div>
    </div>
    
    <div v-if="sysinfo" class="sysinfo-footer">
      API Status: {{ sysinfo.status.toUpperCase() }} | Uptime: {{ formatUptime(sysinfo.uptime) }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { parseKeyTakeaways, estimateReadingTime, CATEGORY_SUBTAGS, autoExtractArticleMetadata } from '@wb-news/shortform-news';

const articles = ref([]);
const categories = ['Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'];
const activeCategory = ref('Alle');
const allTags = ref([]);
const activeTag = ref(null);
const newTagName = ref('');
const searchQuery = ref('');
const selectedArticle = ref(null);
const pendingJobsCount = ref(0);
const isExtracting = ref(false);

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

const totalArticlesCount = computed(() => articles.value.length);
const publishedArticlesCount = computed(() => {
  return articles.value.reduce((count, a) => (a.status === 'published' ? count + 1 : count), 0);
});

const availableSubtags = computed(() => {
  const cat = newArticle.value?.category;
  if (cat && cat !== 'Auto' && CATEGORY_SUBTAGS[cat]) {
    return CATEGORY_SUBTAGS[cat];
  }
  // If Auto, provide top prominent subtags across all categories
  const res = [];
  for (const list of Object.values(CATEGORY_SUBTAGS)) {
    res.push(...list.slice(0, 3));
  }
  return res;
});

const onCategoryChange = () => {
  // Category changed, user will see new subtag chips
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
      if (!newArticle.value.title || newArticle.value.title.trim() === '' || newArticle.value.title === '[Auto-Titel ausstehend]') {
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
      showToast('Titel, Kategorie & Subtags automatisch zugeordnet!', 'success');
    } else {
      throw new Error('API auto-extract returned non-ok');
    }
  } catch (e) {
    // Client-side fallback
    const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
    if (!newArticle.value.title || newArticle.value.title.trim() === '' || newArticle.value.title === '[Auto-Titel ausstehend]') {
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
    showToast('Titel & Subtags aus Fließtext abgeleitet!', 'success');
  } finally {
    isExtracting.value = false;
  }
};

const generateTitleOnly = () => {
  if (!newArticle.value.content || newArticle.value.content.length < 10) return;
  const meta = autoExtractArticleMetadata(newArticle.value.content, newArticle.value.category);
  newArticle.value.title = meta.title;
  showToast('Auto-Titel aktualisiert!', 'success');
};

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

const selectArticle = (article) => {
  selectedArticle.value = article;
};

const config = useRuntimeConfig();

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

const addNewTag = async () => {
  if (!newTagName.value || !newTagName.value.trim()) return;
  const name = newTagName.value.trim();
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      const created = await res.json();
      if (!allTags.value.some(t => t.name.toLowerCase() === created.name.toLowerCase())) {
        allTags.value.push(created);
      }
    }
  } catch (e) {
    console.error(e);
  }
  if (!newArticle.value.tags) newArticle.value.tags = [];
  if (!newArticle.value.tags.some(t => (typeof t === 'string' ? t : t.name) === name)) {
    newArticle.value.tags.push(name);
  }
  newTagName.value = '';
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
    }
  } catch (e) {
    console.error(e);
  }
};

const openMobilePreview = () => {
  window.open('http://localhost:3002', '_blank', 'width=375,height=812');
};

const deleteArticle = async (id) => {
  if (!confirm('Artikel wirklich löschen?')) return;
  try {
    await apiFetch(`${config.public.apiUrl}/api/articles/${id}`, {
      method: 'DELETE'
    });
    selectedArticle.value = null;
    fetchArticles();
    fetchTags();
  } catch (e) {
    console.error(e);
  }
};

const fetchJobsStat = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/jobs`);
    const data = await res.json();
    pendingJobsCount.value = data.filter(j => j.status === 'pending' || j.status === 'processing').length;
  } catch (e) {
    console.error(e);
  }
};

const fetchArticles = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles`);
    const data = await res.json();
    articles.value = data;
  } catch (e) {
    console.error(e);
  }
};

const isModalOpen = ref(false);
const newArticle = ref({ 
  title: '', 
  category: 'Auto', 
  author: 'Redaktion', 
  content: '',
  tags: []
});

const isGeneratingImage = ref(false);
const imageGenState = ref(null);
let genTimer = null;
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

const sysinfo = ref(null);

const fetchSysinfo = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/sysinfo`);
    sysinfo.value = await res.json();
  } catch (e) {
    console.error('API not reachable');
  }
};

const analyticsSummary = ref({
  totalImpressions: 0,
  totalReads: 0,
  totalTtsPlays: 0,
  readThroughRate: '0.0%'
});

const fetchAnalytics = async () => {
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/analytics`);
    if (res.ok) {
      analyticsSummary.value = await res.json();
    }
  } catch (e) {}
};

const formatUptime = (seconds) => {
  if (!seconds) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const openModal = () => {
  newArticle.value = { 
    title: '', 
    category: 'Auto', 
    author: 'Redaktion', 
    content: '',
    tags: []
  };
  newTagName.value = '';
  isModalOpen.value = true;
};

const editArticle = (article) => {
  newArticle.value = { 
    ...article,
    tags: (article.tags || []).map(t => (typeof t === 'string' ? t : t.name))
  };
  newTagName.value = '';
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
      let errDetail = 'Unbekannter Serverfehler';
      try {
        const errorData = await res.json();
        if (errorData.message?.includes('ECONNREFUSED') || errorData.message?.includes('Failed query')) {
          errDetail = 'Datenbank offline (PostgreSQL Port 5433 nicht erreichbar – bitte Docker starten)';
        } else {
          errDetail = errorData.error || errorData.message || 'Unbekannt';
        }
      } catch {
        errDetail = `HTTP ${res.status}`;
      }
      showToast('Fehler beim Speichern: ' + errDetail, 'error');
      return;
    }
    
    // For POST, res returns the article. For PUT, it just returns success.
    const article = isEdit ? newArticle.value : await res.json();
    
    if (!isEdit) {
      const jobRes = await apiFetch(`${config.public.apiUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: article.id, type: 'teaser_generation' })
      });
      const job = await jobRes.json();
      pollJobStatus(job.id);
      showToast('Artikel angelegt! KI generiert Titel, Teaser & Tags...', 'success');
    } else {
      // If editing, update selected article immediately
      if (selectedArticle.value && selectedArticle.value.id === article.id) {
        selectedArticle.value = { ...selectedArticle.value, ...newArticle.value };
      }
      showToast('Artikel erfolgreich aktualisiert', 'success');
    }
    
    closeModal();
    fetchArticles();
    fetchTags();
  } catch (e) {
    console.error(e);
    showToast('Netzwerkfehler beim Speichern', 'error');
  }
};

const pollJobStatus = async (jobId) => {
  if (!jobId) return;
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const res = await apiFetch(`${config.public.apiUrl}/api/jobs/${jobId}`);
      if (res.ok) {
        const job = await res.json();
        
        if (job.type === 'image_generation') {
          if (job.status === 'processing') {
            if (imageGenState.value) {
              imageGenState.value.message = 'LocalAI / Pollinations generiert Bild...';
            }
          }
        }

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(pollInterval);
          pollInterval = null;
          
          if (job.type === 'image_generation') {
            stopGenTimer();
            isGeneratingImage.value = false;
            if (job.status === 'failed') {
              const err = job.error || 'Fehler beim Generieren';
              imageGenState.value = {
                type: 'error',
                message: err.length > 35 ? err.slice(0, 35) + '...' : err,
                errorDetail: err
              };
              showToast('Bild-Generierung fehlgeschlagen', 'error');
            } else {
              imageGenState.value = {
                type: 'success',
                message: `Bild fertiggestellt (${genSeconds}s)!`
              };
              showToast('KI-Bild erfolgreich generiert!', 'success');
              setTimeout(() => {
                if (imageGenState.value?.type === 'success') {
                  imageGenState.value = null;
                }
              }, 6000);
            }
          } else if (job.type === 'teaser_generation' && job.status === 'completed') {
            showToast('KI-Aufbereitung erfolgreich abgeschlossen!', 'success');
          }
          
          if (selectedArticle.value && selectedArticle.value.id === job.articleId) {
            const updatedArticleRes = await apiFetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}`);
            if (updatedArticleRes.ok) {
              selectedArticle.value = await updatedArticleRes.json();
            }
          }
          
          fetchArticles();
          fetchTags();
          fetchJobsStat();
        }
      }
    } catch (e) {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    }
  }, 2000);
};

const generateImageForArticle = async () => {
  if (!selectedArticle.value) return;
  isGeneratingImage.value = true;
  startGenTimer();
  imageGenState.value = {
    type: 'loading',
    message: 'KI generiert Cover (LocalAI / Pollinations)...',
    elapsed: 0
  };

  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}/generate-image`, {
      method: 'POST'
    });
    stopGenTimer();
    isGeneratingImage.value = false;

    if (res.ok) {
      const data = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      imageGenState.value = {
        type: 'success',
        message: `Bild fertiggestellt (${genSeconds}s)!`
      };
      showToast('KI-Bild erfolgreich generiert!', 'success');
      fetchArticles();
      setTimeout(() => {
        if (imageGenState.value?.type === 'success') {
          imageGenState.value = null;
        }
      }, 5000);
    } else {
      // Fallback: enqueue via jobs API with fixed job ID resolution
      const jobRes = await apiFetch(`${config.public.apiUrl}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: selectedArticle.value.id, type: 'image_generation' })
      });
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        const effectiveId = jobData.id || jobData.jobId;
        startGenTimer();
        isGeneratingImage.value = true;
        imageGenState.value = {
          type: 'loading',
          message: 'In Queue eingereiht...',
          elapsed: genSeconds
        };
        pollJobStatus(effectiveId);
      } else {
        imageGenState.value = {
          type: 'error',
          message: 'Fehler beim Generieren'
        };
        showToast('Fehler bei der Bild-Generierung', 'error');
      }
    }
  } catch (e) {
    stopGenTimer();
    isGeneratingImage.value = false;
    imageGenState.value = {
      type: 'error',
      message: 'Netzwerkfehler'
    };
    showToast('Netzwerkfehler', 'error');
  }
};

const uploadImageFile = async (file) => {
  if (!selectedArticle.value || !file) return;
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${selectedArticle.value.id}/image`, {
      method: 'POST',
      body: formData
    });
    if (res.ok) {
      const data = await res.json();
      selectedArticle.value.imageUrl = data.imageUrl;
      fetchArticles();
      showToast('Bild erfolgreich hochgeladen!', 'success');
    } else {
      showToast('Fehler beim Bild-Upload', 'error');
    }
  } catch (e) {
    console.error(e);
    showToast('Upload-Fehler', 'error');
  }
};

const handleImageUpload = (event) => {
  const file = event.target.files[0];
  if (file) uploadImageFile(file);
};

const handleImageDrop = (event) => {
  const file = event.dataTransfer?.files[0];
  if (file && file.type.startsWith('image/')) {
    uploadImageFile(file);
  }
};

const removeImage = async (id) => {
  if (!confirm('Bild wirklich löschen?')) return;
  try {
    const res = await apiFetch(`${config.public.apiUrl}/api/articles/${id}/image`, {
      method: 'DELETE'
    });
    if (res.ok) {
      if (selectedArticle.value && selectedArticle.value.id === id) {
        selectedArticle.value.imageUrl = null;
      }
      fetchArticles();
      showToast('Bild entfernt', 'success');
    }
  } catch (e) {
    console.error(e);
  }
};

let pollInterval = null;
let statsInterval = null;
let articlesInterval = null;

onMounted(() => {
  fetchArticles();
  fetchJobsStat();
  fetchTags();
  fetchSysinfo();
  fetchAnalytics();
  
  statsInterval = setInterval(() => {
    fetchJobsStat();
    fetchAnalytics();
  }, 5000);
  articlesInterval = setInterval(fetchArticles, 10000);

  window.addEventListener('message', handleMessage);
});

const handleMessage = (event) => {
  if (event.data && event.data.type === 'article_opened') {
    const openedArticle = articles.value.find(a => a.id === event.data.articleId);
    if (openedArticle) {
      selectArticle(openedArticle);
    }
  }
};

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
  if (statsInterval) clearInterval(statsInterval);
  if (articlesInterval) clearInterval(articlesInterval);
  window.removeEventListener('message', handleMessage);
});
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: calc(100vh - 72px);
}
.dashboard-main {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}
.preview-panel {
  width: 400px;
  background: white;
  border-left: 1px solid #eee;
  display: flex;
  flex-direction: column;
}
.preview-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.preview-header h3 { margin: 0; }
.sync-badge {
  background: #dbeafe;
  color: #1e40af;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: bold;
}
.preview-content {
  padding: 1.5rem;
  flex: 1;
  overflow-y: auto;
}
.preview-image {
  width: 100%;
  height: 220px;
  background-size: cover;
  background-position: center;
  border-radius: 8px;
  margin-bottom: 1rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.image-action-overlay {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(15, 23, 42, 0.78);
  backdrop-filter: blur(8px);
  padding: 6px 10px;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2);
}

.action-btn-overlay {
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
}
.action-btn-overlay:hover:not(:disabled) {
  background: white;
  transform: translateY(-1px);
}
.action-btn-overlay:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.remove-image-btn {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}
.remove-image-btn:hover {
  background: #dc2626;
}

.preview-image-placeholder {
  width: 100%;
  min-height: 200px;
  background-color: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  text-align: center;
}

.placeholder-text {
  margin: 0;
  font-weight: 500;
  font-size: 0.9rem;
}

.placeholder-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
}

.image-action-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.primary-action-btn {
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.primary-action-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}
.primary-action-btn:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.live-image-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  animation: fadeInStatus 0.2s ease forwards;
}

@keyframes fadeInStatus {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

.live-image-status.status-loading {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.live-image-status.status-error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.live-image-status.status-success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.status-spinner {
  width: 13px;
  height: 13px;
  border: 2px solid #93c5fd;
  border-top-color: #1d4ed8;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(0,0,0,0.2);
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
  flex-shrink: 0;
}

.status-time {
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  opacity: 0.85;
}

.btn-retry-inline {
  background: #b91c1c;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 0.7rem;
  font-weight: 700;
  cursor: pointer;
  margin-left: 2px;
  transition: background 0.1s ease;
}
.btn-retry-inline:hover {
  background: #991b1b;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  background: white;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
}
.upload-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.drop-hint {
  font-size: 0.75rem;
  margin: 0;
  color: #94a3b8;
}
.preview-category {
  display: inline-block;
  background: #f3f4f6;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 1rem;
}
.preview-title { margin: 0 0 1rem 0; font-size: 1.2rem; }
.preview-teaser {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #3b82f6;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.preview-takeaways {
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 4px;
  border-left: 4px solid #22c55e;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}
.preview-takeaways p {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
}
.preview-meta { color: #666; font-size: 0.8rem; margin-bottom: 1.5rem; }
.preview-body { line-height: 1.6; white-space: pre-wrap; }
.preview-actions {
  padding: 1.5rem;
  border-top: 1px solid #eee;
}
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
}
.stat-card {
  background: white;
  padding: 1.25rem 1.5rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.08);
}
.stat-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-wrapper.blue { background: #eff6ff; color: #2563eb; }
.stat-icon-wrapper.purple { background: #faf5ff; color: #9333ea; }
.stat-icon-wrapper.green { background: #f0fdf4; color: #16a34a; }
.stat-icon-wrapper.amber { background: #fffbeb; color: #d97706; }

.stat-sub {
  font-size: 0.8rem;
  font-weight: 500;
  color: #64748b;
  margin-left: 4px;
}

.stat-card h3 {
  margin: 0;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  font-weight: 600;
}
.stat-card p {
  margin: 0.25rem 0 0;
  font-size: 1.75rem;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.articles-section {
  margin-top: 2rem;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}
.section-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #64748b;
}
.header-actions-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 20px;
  padding: 0.4rem 0.85rem;
  transition: all 0.2s ease;
}
.search-box:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}
.search-icon {
  color: #94a3b8;
  margin-right: 0.5rem;
}
.search-box input {
  border: none;
  outline: none;
  font-size: 0.85rem;
  width: 220px;
  color: #1e293b;
}
.clear-search-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0;
}

.primary-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
  transition: all 0.15s ease;
}
.primary-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);
}
.btn-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.category-filters {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}
.chip {
  padding: 0.35rem 1rem;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  color: #475569;
  transition: all 0.15s ease;
}
.chip:hover {
  border-color: #cbd5e1;
  color: #0f172a;
}
.chip.active {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
  font-weight: 600;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.data-table th {
  background: #f8fafc;
  padding: 0.85rem 1.25rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
}
.data-table td {
  padding: 0.9rem 1.25rem;
  font-size: 0.9rem;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}
.data-table tbody tr {
  transition: background-color 0.15s ease;
}
.data-table tbody tr:hover {
  background-color: #f8fafc;
}
.data-table tbody tr.row-selected {
  background-color: #f0fdf4 !important;
}

.title-with-thumb {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.table-thumb {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  border: 1px solid #e2e8f0;
}
.title-text {
  font-weight: 600;
  color: #0f172a;
}

.category-cell-badge {
  display: inline-block;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}
.category-cell-badge.cat-politik { background: #fee2e2; color: #b91c1c; }
.category-cell-badge.cat-wirtschaft { background: #dcfce7; color: #15803d; }
.category-cell-badge.cat-sport { background: #fef3c7; color: #b45309; }
.category-cell-badge.cat-technologie { background: #e0e7ff; color: #4338ca; }
.category-cell-badge.cat-kultur { background: #fae8ff; color: #86198f; }

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-pill.published {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}
.status-pill.published .status-dot {
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}
.status-pill.draft {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.status-pill.draft .status-dot {
  background: #94a3b8;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
}
.table-action-btn {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.table-action-btn:hover {
  background: #dbeafe;
}
.table-action-btn-subtle {
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 0.25rem 0.65rem;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.table-action-btn-subtle:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.empty-state-cell {
  text-align: center;
  padding: 3rem 1.5rem !important;
}
.empty-state-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}
.empty-title {
  margin: 0;
  font-weight: 700;
  color: #334155;
}
.empty-desc {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: #94a3b8;
}

/* Toast Notifications */
.toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #0f172a;
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.1);
}
.toast-notification.success {
  border-left: 4px solid #22c55e;
}
.toast-notification.error {
  border-left: 4px solid #ef4444;
}
.toast-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}
.toast-notification.error .toast-dot {
  background: #ef4444;
}
.toast-enter-active, .toast-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  border-radius: 8px;
  width: 600px;
  max-width: 90vw;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}
.modal-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
}
.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}
.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.form-group label {
  font-weight: 500;
  font-size: 0.9rem;
}
.form-group input, .form-group select, .form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}
.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

/* Tags Styling */
.tag-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  padding: 0.5rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.filter-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #64748b;
  margin-right: 0.25rem;
}
.tag-chip-filter {
  background: white;
  border: 1px solid #cbd5e1;
  color: #334155;
  padding: 0.25rem 0.6rem;
  border-radius: 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tag-chip-filter:hover {
  border-color: #3b82f6;
  color: #1d4ed8;
}
.tag-chip-filter.active {
  background: #3b82f6;
  color: white;
  border-color: #2563eb;
  font-weight: 600;
}
.badge-count {
  font-size: 0.75rem;
  opacity: 0.85;
}

.table-tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  max-width: 200px;
}
.table-tag-chip {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  padding: 0.15rem 0.45rem;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 500;
}
.no-tags {
  color: #94a3b8;
  font-size: 0.8rem;
}
.category-cell-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
}

.preview-meta-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.preview-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.preview-tag-chip {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #2563eb;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.modal-tags-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.4rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.tag-toggle-btn {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 0.3rem 0.65rem;
  border-radius: 14px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.tag-toggle-btn.selected {
  background: #2563eb;
  color: white;
  border-color: #1d4ed8;
  font-weight: 600;
}
.add-tag-inline {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.35rem;
}
.add-tag-inline input {
  flex: 1;
  font-size: 0.85rem;
}
.field-hint {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.25rem 0 0 0;
}

.flashtext-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.btn-magic-extract {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: #4f46e5;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-magic-extract:hover:not(:disabled) {
  background: #e0e7ff;
  border-color: #a5b4fc;
}

.btn-magic-extract:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.btn-small-extract {
  padding: 0.2rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0284c7;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 5px;
  cursor: pointer;
}

.subtags-section-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 500;
  color: #334155;
  margin-bottom: 0.4rem;
}

.active-cat-name {
  color: #2563eb;
  font-weight: 700;
}

.subtags-category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
}

.subtag-chip-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.7rem;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s ease;
}

.subtag-chip-btn:hover {
  border-color: #94a3b8;
  background: #f1f5f9;
}

.subtag-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.custom-tags-bar {
  margin-bottom: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
}

.custom-tags-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-bottom: 0.35rem;
}

.selected-tags-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  align-items: center;
}

.active-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.2rem 0.55rem;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  color: #1d4ed8;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.remove-tag-cross {
  background: transparent;
  border: none;
  color: #93c5fd;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  cursor: pointer;
}

.remove-tag-cross:hover {
  color: #1e3a8a;
}

.no-tags-hint {
  font-size: 0.75rem;
  color: #94a3b8;
  font-style: italic;
}
</style>
