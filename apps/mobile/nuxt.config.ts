export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/mobile.css'],
  app: {
    head: {
      title: 'WB Publisher - Short-Form Newsfeed',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' },
        { name: 'theme-color', content: '#09090b' },
        { name: 'description', content: 'Mobiles KI-generiertes Newsfeed-Modul für WB Publisher' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000'
    }
  }
});
