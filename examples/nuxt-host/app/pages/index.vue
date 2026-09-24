<template>
  <div>
    <ShortformNewsFeed ref="feedRef" :api-url="config.public.feedApiUrl" @article-read="openArticle" />

    <!-- The module only hands over the article ID; what happens next is up to
         the host. This stand-in host just shows a simple detail view. -->
    <div v-if="openArticleData" class="fixed inset-0 z-[200] overflow-y-auto bg-white p-6 text-neutral-900">
      <button type="button" class="mb-4 rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white" @click="openArticleData = null">
        Zurück zum Feed
      </button>
      <p class="mb-2 text-xs text-neutral-500">Vom Modul erhaltene Artikel-ID: {{ openArticleData.id }}</p>
      <h1 class="mb-4 text-2xl font-bold">{{ openArticleData.title }}</h1>
      <p class="whitespace-pre-wrap leading-relaxed">{{ openArticleData.content }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Article, ShortformNewsFeed } from '@wb-news/shortform-news';

const config = useRuntimeConfig();
const feedRef = ref<InstanceType<typeof ShortformNewsFeed> | null>(null);
const openArticleData = ref<Article | null>(null);

const openArticle = (articleId: number) => {
  openArticleData.value = feedRef.value?.findArticle(articleId) ?? null;
};
</script>
