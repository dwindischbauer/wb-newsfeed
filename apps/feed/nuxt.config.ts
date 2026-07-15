export default defineNuxtConfig({
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4,
  },
  app: {
    head: {
      title: 'WB News Feed',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0' },
        { name: 'theme-color', content: '#000000' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:3005'
    }
  }
});
