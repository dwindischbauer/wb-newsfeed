<template>
  <div class="relative h-screen overflow-hidden bg-[var(--sf-bg-color,#000)] text-[var(--sf-text-color,#fff)]">
    <div class="absolute inset-x-0 top-0 z-50 pb-3 [background:linear-gradient(to_bottom,rgba(0,0,0,0.65)_0%,rgba(0,0,0,0.3)_55%,rgba(0,0,0,0)_100%)]">
      <div v-if="categories.length > 0" class="flex overflow-x-auto px-4 pt-[0.85rem] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-1 rounded-full border border-white/[0.16] bg-black/40 p-[0.3rem] backdrop-blur-[14px]">
          <button
            v-for="cat in categories"
            :key="cat"
            type="button"
            class="cursor-pointer whitespace-nowrap rounded-full border-none px-4 py-[0.48rem] text-[0.86rem] transition-all duration-200"
            :class="activeCategory === cat
              ? 'bg-[var(--sf-primary-color,#4ade80)] font-bold text-[var(--sf-primary-text,#000)]'
              : 'bg-transparent font-semibold text-white/[0.82] [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]'"
            @click="selectCategory(cat)"
          >
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Subcategory chips for the active main category -->
      <div v-if="activeSubtags.length > 0" class="flex overflow-x-auto px-4 pt-2 [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        <div class="flex items-center gap-1 rounded-full border border-white/10 bg-black/[0.28] p-[0.22rem]">
          <button
            v-for="sub in activeSubtags"
            :key="sub.slug"
            type="button"
            class="cursor-pointer whitespace-nowrap rounded-full border-none px-[0.8rem] py-[0.36rem] text-[0.76rem] transition-all duration-200"
            :class="activeTagFilter === sub.name
              ? 'bg-[var(--sf-primary-color,#4ade80)] font-bold text-[var(--sf-primary-text,#000)]'
              : 'bg-transparent font-medium text-white/[0.68] [text-shadow:0_1px_6px_rgba(0,0,0,0.5)]'"
            @click="activeTagFilter = activeTagFilter === sub.name ? '' : sub.name"
          >
            {{ sub.name }}
          </button>
        </div>
      </div>

      <!-- Progress bar: how far through the current category/filter the user has scrolled -->
      <div class="mt-2 h-[2px] w-full bg-white/10">
        <div class="h-full bg-[var(--sf-primary-color,#4ade80)] transition-[width] duration-150" :style="{ width: `${feedScrollPercent}%` }"></div>
      </div>
    </div>

    <!-- Active tag filter — only for tags set from outside (e.g. the host's reader),
         the subcategory chips above already show their own active state -->
    <div
      v-if="activeTagFilter && !activeSubtags.some((s) => s.name === activeTagFilter)"
      class="absolute left-4 right-4 top-[60px] z-[45] flex items-center justify-between rounded-full border border-white/30 bg-black/[0.55] px-4 py-2 text-[0.85rem] text-white backdrop-blur-[12px]"
    >
      <span>Tag-Filter: <strong>{{ activeTagFilter }}</strong></span>
      <button type="button" class="rounded-[10px] border-none bg-white/20 px-2 py-[2px] text-[0.75rem] font-bold text-white hover:bg-white/[0.35]" @click="activeTagFilter = ''">✕ Entfernen</button>
    </div>

    <ShortformFeed
      ref="feedComponentRef"
      :articles="visibleArticles"
      :api-url="apiBase"
      :loading="isLoadingFeed"
      :tracking-enabled="true"
      :liked-ids="likedArticleIds"
      @article-read="onArticleRead"
      @article-impression="onArticleImpression"
      @scroll-depth="onScrollDepth"
      @filter-tag="filterByTag"
      @like="handleLike"
      @unlike="handleUnlike"
      @share="handleShare"
      @open-comments="openComments"
    >
      <template #loading>
        <div class="flex h-screen flex-col justify-end gap-3 p-8">
          <div class="mb-2 h-7 w-24 animate-pulse rounded-full bg-white/10"></div>
          <div class="h-8 w-4/5 animate-pulse rounded-lg bg-white/10"></div>
          <div class="h-8 w-3/5 animate-pulse rounded-lg bg-white/10"></div>
          <div class="mt-2 h-4 w-full animate-pulse rounded bg-white/10"></div>
          <div class="h-4 w-5/6 animate-pulse rounded bg-white/10"></div>
          <div class="mt-4 h-12 w-44 animate-pulse rounded-full bg-white/10"></div>
        </div>
      </template>
      <template #empty>
        <template v-if="loadError">Nachrichten konnten nicht geladen werden.</template>
        <template v-else>Keine aktiven Nachrichten für '{{ activeTagFilter || activeCategory }}'.</template>
      </template>
    </ShortformFeed>

    <!-- Share toast -->
    <transition name="sf-fade">
      <div v-if="shareToast" class="fixed bottom-[6.5rem] left-1/2 z-[150] -translate-x-1/2 rounded-full bg-[var(--sf-toast-bg,#14151a)] px-5 py-[0.6rem] text-[0.85rem] font-semibold text-[var(--sf-primary-color,#4ade80)] shadow-[0_8px_24px_rgba(0,0,0,0.4)]">{{ shareToast }}</div>
    </transition>

    <!-- Comments sheet -->
    <transition name="sf-sheet">
      <div v-if="commentsArticle" class="fixed inset-0 z-[140] flex items-end bg-black/[0.55]" @click.self="closeComments">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kommentare"
          class="sf-comments-sheet flex max-h-[75vh] w-full flex-col rounded-t-[24px] bg-[var(--sf-sheet-bg,#fff)] text-[var(--sf-sheet-text,#14151a)] shadow-[0_-10px_40px_rgba(0,0,0,0.35)]"
        >
          <div class="flex items-center justify-between border-b border-black/[0.08] px-5 pb-[0.85rem] pt-[1.1rem]">
            <h3 class="m-0 font-[var(--font-accent,inherit)] text-[1.2rem] font-medium italic">
              Kommentare <span class="text-[0.9rem] font-medium not-italic text-[var(--sf-sheet-muted,#6b7280)]">({{ commentsArticle.commentCount || comments.length }})</span>
            </h3>
            <button type="button" class="h-[30px] w-[30px] cursor-pointer rounded-full border-none bg-black/[0.06] text-[0.9rem] text-inherit" title="Schließen" @click="closeComments">✕</button>
          </div>
          <div class="flex-1 overflow-y-auto px-5 py-2">
            <div v-if="commentsLoading" class="py-10 text-center text-[0.9rem] text-[var(--sf-sheet-muted,#6b7280)]">Lade Kommentare…</div>
            <div v-else-if="comments.length === 0" class="py-10 text-center text-[0.9rem] text-[var(--sf-sheet-muted,#6b7280)]">Noch keine Kommentare. Sei die/der Erste!</div>
            <div v-for="c in comments" :key="c.id" class="flex gap-[0.7rem] border-b border-black/[0.06] py-[0.85rem]">
              <div class="flex h-[34px] w-[34px] flex-shrink-0 items-center justify-center rounded-full bg-[var(--sf-sheet-text,#14151a)] text-[0.85rem] font-bold text-[var(--sf-primary-color,#4ade80)]">{{ (c.authorName || 'A').charAt(0).toUpperCase() }}</div>
              <div class="min-w-0 flex-1">
                <div class="mb-[0.2rem] flex items-baseline gap-2 text-[0.78rem] text-[var(--sf-sheet-muted,#6b7280)]">
                  <strong class="text-[0.85rem] text-[var(--sf-sheet-text,#14151a)]">{{ c.authorName }}</strong>
                  <span>{{ formatRelativeTime(c.createdAt) }}</span>
                </div>
                <p class="m-0 break-words text-[0.9rem] leading-[1.4]">{{ c.text }}</p>
              </div>
            </div>
          </div>
          <form class="flex flex-col gap-2 border-t border-black/[0.08] px-5 pb-5 pt-[0.85rem]" @submit.prevent="submitComment">
            <input
              v-model="commentName"
              type="text"
              maxlength="60"
              placeholder="Dein Name (optional)"
              class="border-none bg-transparent p-0 text-[0.78rem] text-[var(--sf-sheet-muted,#6b7280)] outline-none"
            />
            <div class="flex items-center gap-2">
              <input
                v-model="commentText"
                type="text"
                maxlength="1000"
                placeholder="Kommentar schreiben…"
                class="flex-1 rounded-full border border-black/[0.12] bg-[var(--sf-sheet-input-bg,#f3f4f6)] px-[1.1rem] py-[0.65rem] text-[0.9rem] text-inherit outline-none focus:border-[var(--sf-sheet-accent,#16a34a)]"
              />
              <button
                type="submit"
                class="whitespace-nowrap rounded-full border-none bg-[var(--sf-sheet-text,#14151a)] px-5 py-[0.65rem] text-[0.85rem] font-bold text-[var(--sf-primary-color,#4ade80)] disabled:cursor-not-allowed disabled:opacity-40"
                :disabled="!commentText.trim() || commentSubmitting"
              >
                Senden
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import ShortformFeed from './ShortformFeed.vue';
import {
  rankPersonalizedArticles,
  CATEGORY_SUBTAGS,
  type Article,
  type UserInterests
} from '../utils';

interface CommentItem {
  id: number;
  authorName: string;
  text: string;
  createdAt: string;
}

type CountField = 'likeCount' | 'commentCount' | 'shareCount';

const FOR_YOU = 'Für dich';
const ALL = 'Alle';

const props = withDefaults(defineProps<{
  /** Base URL of the wb-newsfeed API, e.g. `https://api.example.at` */
  apiUrl: string;
  /** Category tabs; 'Für dich' = personalized order, 'Alle' = no filter. Empty array hides the bar. */
  categories?: string[];
  /** Milliseconds between checks for new/changed articles; 0 disables polling. */
  pollInterval?: number;
  /** Send impression/read/share/scroll events to `POST /api/analytics/events`. */
  analytics?: boolean;
}>(), {
  categories: () => [FOR_YOU, ALL, 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur'],
  pollInterval: 60000,
  analytics: true
});

const emit = defineEmits<{
  'article-read': [articleId: number];
  'article-impression': [article: Article];
  like: [article: Article];
  unlike: [article: Article];
  share: [article: Article];
  comment: [article: Article, comment: CommentItem];
}>();

const apiBase = computed(() => props.apiUrl.replace(/\/$/, ''));

const articles = ref<Article[]>([]);
const isLoadingFeed = ref(true);
const loadError = ref(false);
const feedComponentRef = ref<InstanceType<typeof ShortformFeed> | null>(null);
const feedScrollPercent = ref(0);
const activeCategory = ref(props.categories[0] ?? ALL);
const activeTagFilter = ref('');

// Granular subcategory chips (e.g. Politik -> Innenpolitik/Außenpolitik) for the active main category
const activeSubtags = computed(() => CATEGORY_SUBTAGS[activeCategory.value] || []);

const selectCategory = (cat: string) => {
  activeCategory.value = cat;
  activeTagFilter.value = '';
};

// --- Interest model (device-local, privacy-first) ---
const userInterests = ref<Required<UserInterests>>({ categories: {}, tags: {} });

const loadUserInterests = () => {
  try {
    const saved = localStorage.getItem('wb_user_interests');
    if (saved) userInterests.value = JSON.parse(saved);
  } catch {
    // storage unavailable — start without interests
  }
};

const recordInterestInteraction = (article: Article | undefined, weight = 1) => {
  if (!article) return;
  const interests = userInterests.value;

  if (article.category) {
    interests.categories[article.category] = Math.max(0, (interests.categories[article.category] || 0) + weight * 2);
  }
  for (const tag of article.tags || []) {
    const slug = (tag.slug || tag.name || '').toLowerCase();
    if (!slug) continue;
    interests.tags[slug] = Math.max(0, (interests.tags[slug] || 0) + weight * 3);
  }

  try {
    localStorage.setItem('wb_user_interests', JSON.stringify(interests));
  } catch {
    // storage unavailable — interest tracking is best-effort only
  }
};

const isPublished = (a: Article) => !a.status || a.status === 'published';

// The "Für dich" order is pinned per fetched list, not recomputed on every
// like/read/impression — otherwise interacting with an article reshuffles the
// feed mid-browse. Interest updates apply to the *next* fetched list.
const personalizedOrder = ref<Article[]>([]);
watch(
  articles,
  () => {
    personalizedOrder.value = rankPersonalizedArticles(articles.value.filter(isPublished), userInterests.value);
  },
  { immediate: true }
);

const hasTag = (a: Article, tagQuery: string) =>
  !!a.tags && a.tags.some((t) => (t.slug || t.name || '').toLowerCase() === tagQuery);

const visibleArticles = computed(() => {
  const tagQuery = activeTagFilter.value.toLowerCase();
  if (activeCategory.value === FOR_YOU) {
    return tagQuery ? personalizedOrder.value.filter((a) => hasTag(a, tagQuery)) : personalizedOrder.value;
  }

  let filtered = articles.value.filter(isPublished);
  if (tagQuery) filtered = filtered.filter((a) => hasTag(a, tagQuery));
  if (activeCategory.value !== ALL) filtered = filtered.filter((a) => a.category === activeCategory.value);
  return filtered;
});

// --- Loading + polling ---
const fetchFeed = async (): Promise<Article[]> => {
  const res = await fetch(`${apiBase.value}/api/feed`);
  if (!res.ok) throw new Error(`GET /api/feed failed: ${res.status}`);
  return res.json();
};

const loadArticles = async () => {
  try {
    articles.value = await fetchFeed();
    loadError.value = false;
  } catch (e) {
    console.error('Failed to fetch articles:', e);
    articles.value = [];
    loadError.value = true;
  } finally {
    isLoadingFeed.value = false;
  }
};

// Merge freshly-polled articles in place, preserving object identity for
// unchanged articles so open cards/overlays don't flicker.
const pollForUpdates = async () => {
  try {
    const fresh = await fetchFeed();
    const currentById = new Map(articles.value.map((a) => [a.id, a]));
    articles.value = fresh.map((f) => {
      const existing = currentById.get(f.id);
      return existing && JSON.stringify(existing) === JSON.stringify(f) ? existing : f;
    });
    loadError.value = false;
  } catch (e) {
    console.error('Failed to poll for updates:', e);
  }
};

// --- Analytics ---
const track = (eventType: string, articleId: number | null = null, metadata: Record<string, unknown> | null = null) => {
  if (!props.analytics) return;
  try {
    const url = `${apiBase.value}/api/analytics/events`;
    const payload = JSON.stringify({ eventType, articleId, metadata });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  } catch (e) {
    console.error('Failed to send analytics:', e);
  }
};

const findArticle = (articleId: number) => articles.value.find((a) => a.id === articleId);

// The module only signals the article ID — resolving and displaying the full
// article is the host's job (briefing: navigation stays outside the module).
const onArticleRead = (articleId: number) => {
  const article = findArticle(articleId);
  recordInterestInteraction(article, 2);
  track('read', articleId, { category: article?.category });
  emit('article-read', articleId);
};

const onArticleImpression = (article: Article) => {
  recordInterestInteraction(article, 0.5);
  track('impression', article.id, { category: article.category });
  emit('article-impression', article);
};

// Reported once per list (category/filter change resets it), not on every scroll tick
let deepScrollTracked = false;
const onScrollDepth = (fraction: number) => {
  feedScrollPercent.value = Math.min(100, Math.max(0, fraction * 100));
  if (fraction >= 0.8 && !deepScrollTracked) {
    deepScrollTracked = true;
    track('scroll_depth', null, { depth: fraction, category: activeCategory.value });
  }
};

const scrollFeedToTop = () => {
  feedScrollPercent.value = 0;
  deepScrollTracked = false;
  nextTick(() => {
    const el = feedComponentRef.value?.$el as HTMLElement | undefined;
    if (el) el.scrollTop = 0;
  });
};

// Switching category/subtag swaps the list under the same scroll container —
// without this the new list would inherit the old scroll offset.
watch([activeCategory, activeTagFilter], scrollFeedToTop);

const filterByTag = (tagName: string) => {
  activeTagFilter.value = tagName;
};

// --- Likes (device-local, same pattern as interests) ---
const likedArticleIds = ref<number[]>([]);

const loadLikedArticles = () => {
  try {
    const saved = localStorage.getItem('wb_liked_articles');
    if (saved) likedArticleIds.value = JSON.parse(saved);
  } catch {
    // storage unavailable — start without likes
  }
};

const persistLikedArticles = () => {
  try {
    localStorage.setItem('wb_liked_articles', JSON.stringify(likedArticleIds.value));
  } catch {
    // storage unavailable — likes stay in-memory only for this session
  }
};

const patchArticleCount = (articleId: number, field: CountField, delta: number) => {
  const article = findArticle(articleId);
  if (article) article[field] = Math.max(0, (article[field] || 0) + delta);
};

const postAction = (articleId: number, action: 'like' | 'unlike' | 'share') =>
  fetch(`${apiBase.value}/api/articles/${articleId}/${action}`, { method: 'POST' }).catch((e) => {
    console.error(`Failed to send ${action}:`, e);
  });

const handleLike = (article: Article) => {
  if (likedArticleIds.value.includes(article.id)) return;
  likedArticleIds.value = [...likedArticleIds.value, article.id];
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', 1);
  recordInterestInteraction(article, 3);
  postAction(article.id, 'like');
  emit('like', article);
};

// Unlike takes back the like's interest boost, so 'Für dich' doesn't keep
// favouring a topic the user changed their mind about.
const handleUnlike = (article: Article) => {
  likedArticleIds.value = likedArticleIds.value.filter((id) => id !== article.id);
  persistLikedArticles();
  patchArticleCount(article.id, 'likeCount', -1);
  recordInterestInteraction(article, -3);
  postAction(article.id, 'unlike');
  emit('unlike', article);
};

// --- Share ---
const shareToast = ref('');
let shareToastTimeout: ReturnType<typeof setTimeout> | null = null;

const showShareToast = (msg: string) => {
  shareToast.value = msg;
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
  shareToastTimeout = setTimeout(() => {
    shareToast.value = '';
  }, 2500);
};

// Shared links point back to the current page with ?article=<id>; on load the
// module signals that ID via article-read so the host opens its reader.
const handleShare = async (article: Article) => {
  const url = new URL(window.location.href);
  url.searchParams.set('article', String(article.id));
  const shareUrl = url.toString();

  try {
    if (navigator.share) {
      await navigator.share({ title: article.title, text: article.teaser || article.title, url: shareUrl });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showShareToast('Link kopiert');
    }
    patchArticleCount(article.id, 'shareCount', 1);
    track('share', article.id, { category: article.category });
    postAction(article.id, 'share');
    emit('share', article);
  } catch {
    // User cancelled the native share sheet — not an error
  }
};

// --- Comments ---
const commentsArticle = ref<Article | null>(null);
const comments = ref<CommentItem[]>([]);
const commentsLoading = ref(false);
const commentName = ref('');
const commentText = ref('');
const commentSubmitting = ref(false);

const openComments = async (article: Article) => {
  commentsArticle.value = article;
  comments.value = [];
  commentsLoading.value = true;
  try {
    const savedName = localStorage.getItem('wb_comment_name');
    if (savedName) commentName.value = savedName;
  } catch {
    // storage unavailable — name field stays empty
  }
  try {
    const res = await fetch(`${apiBase.value}/api/articles/${article.id}/comments`);
    if (res.ok) comments.value = await res.json();
  } catch (e) {
    console.error('Failed to load comments:', e);
  } finally {
    commentsLoading.value = false;
  }
};

const closeComments = () => {
  commentsArticle.value = null;
  commentText.value = '';
};

const submitComment = async () => {
  const text = commentText.value.trim();
  const article = commentsArticle.value;
  if (!text || !article) return;
  commentSubmitting.value = true;
  const authorName = commentName.value.trim() || 'Anonym';
  try {
    localStorage.setItem('wb_comment_name', authorName);
  } catch {
    // storage unavailable — name is not remembered
  }

  try {
    const res = await fetch(`${apiBase.value}/api/articles/${article.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, text })
    });
    const data = await res.json();
    if (data.success) {
      comments.value.unshift(data.comment);
      patchArticleCount(article.id, 'commentCount', 1);
      commentText.value = '';
      emit('comment', article, data.comment);
    }
  } catch (e) {
    console.error('Failed to submit comment:', e);
  } finally {
    commentSubmitting.value = false;
  }
};

const formatRelativeTime = (dateStr: string) => {
  if (!dateStr) return '';
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins} Min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `vor ${hours} Std`;
  return `vor ${Math.floor(hours / 24)} Tg`;
};

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && commentsArticle.value) closeComments();
};

let pollIntervalId: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  loadUserInterests();
  loadLikedArticles();
  window.addEventListener('keydown', onKeydown);
  if (props.pollInterval > 0) pollIntervalId = setInterval(pollForUpdates, props.pollInterval);

  await loadArticles();
  const sharedId = Number.parseInt(new URLSearchParams(window.location.search).get('article') ?? '', 10);
  if (!Number.isNaN(sharedId) && findArticle(sharedId)) onArticleRead(sharedId);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  if (pollIntervalId) clearInterval(pollIntervalId);
  if (shareToastTimeout) clearTimeout(shareToastTimeout);
});

defineExpose({
  /** Resolve an ID from `article-read` to the loaded article (incl. content/keyTakeaways). */
  findArticle,
  /** Filter the feed by tag, e.g. from tag buttons in the host's reader. */
  filterByTag,
  /** Send a custom analytics event through the same channel, e.g. `tts_play`. */
  track,
  /** Reload the feed immediately. */
  refresh: pollForUpdates
});
</script>

<style scoped>
.sf-fade-enter-active,
.sf-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.sf-fade-enter-from,
.sf-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.sf-sheet-enter-active,
.sf-sheet-leave-active {
  transition: opacity 0.25s ease;
}
.sf-sheet-enter-active .sf-comments-sheet,
.sf-sheet-leave-active .sf-comments-sheet {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.sf-sheet-enter-from,
.sf-sheet-leave-to {
  opacity: 0;
}
.sf-sheet-enter-from .sf-comments-sheet,
.sf-sheet-leave-to .sf-comments-sheet {
  transform: translateY(100%);
}
</style>
