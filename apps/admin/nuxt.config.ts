import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()]
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:3005'
    }
  }
});
