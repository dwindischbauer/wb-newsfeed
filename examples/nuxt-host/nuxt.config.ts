import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',
  modules: ['@wb-news/shortform-news/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },
  runtimeConfig: {
    public: {
      // Override with NUXT_PUBLIC_FEED_API_URL
      feedApiUrl: 'http://localhost:3005'
    }
  }
});
