# Beispiel: Feed in einem fremden Nuxt-Projekt

Dieses Projekt steht für eine beliebige bestehende Nuxt-4-Website, die den Short-Form-Feed einbindet. Es liegt bewusst **außerhalb** des pnpm-Workspaces und installiert `@wb-news/shortform-news` als Tarball, genauso wie es ein externes Projekt tun würde.

Die gesamte Einbindung besteht aus:

- `nuxt.config.ts`: Nuxt-Modul `@wb-news/shortform-news/nuxt` und Tailwind-Plugin
- `app/assets/css/main.css`: `@import '@wb-news/shortform-news/tailwind.css';` plus optional eigene Farben über `--sf-*`-Variablen
- `app/pages/index.vue`: `<ShortformNewsFeed>` und eine eigene, bewusst einfache Artikelansicht für die ID aus `article-read`

## Starten

Voraussetzung: API läuft auf `http://localhost:3005` und `CORS_ORIGIN` in der `.env` des Monorepos enthält `http://localhost:3099` (steht so in `.env.example`).

```bash
pnpm -C packages/shortform-news pack   # im Monorepo-Root: Tarball bauen
cd examples/nuxt-host
npm install
npm run dev                            # http://localhost:3099
```

Nach Änderungen am Package: Tarball neu packen und `npm install` erneut ausführen.

Andere API-Adresse: `NUXT_PUBLIC_FEED_API_URL=https://api.example.at npm run dev`.
