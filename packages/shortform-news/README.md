# @wb-news/shortform-news

Vue-3-Komponenten für einen vertikalen Short-Form-News-Feed (ähnlich TikTok/Reels), inklusive Nuxt-Modul zur Einbindung in bestehende Nuxt-Projekte.

Das Package rendert nur die Oberfläche. Daten laden, Tracking auswerten und den Vollartikel anzeigen übernimmt das einbindende System (Host). Die Komponenten melden dafür Ereignisse (Events) nach außen.

## Voraussetzungen

| Was | Version | Warum |
|-----|---------|-------|
| Vue | ≥ 3.4 | Komponenten nutzen `<script setup>` mit typisierten `defineProps`/`defineEmits` |
| Nuxt (optional) | 4.x | nur für das Nuxt-Modul `@wb-news/shortform-news/nuxt` |
| Tailwind CSS | 4.x mit `@tailwindcss/vite` | die Komponenten sind mit Tailwind-Utility-Klassen gestylt und bringen **kein** fertiges CSS mit |

Ohne Tailwind v4 im Host erscheinen die Komponenten ungestylt.

## Einbindung in ein bestehendes Nuxt-4-Projekt

Getestet mit einem frischen Nuxt-4-Projekt, das das Package als Tarball installiert (`pnpm pack`).

### 1. Installieren

```bash
# im Monorepo: Tarball erzeugen (landet in packages/shortform-news/)
pnpm --filter @wb-news/shortform-news pack

# im Host-Projekt installieren
npm install /pfad/zu/wb-news-shortform-news-1.0.0.tgz

# Tailwind v4, falls der Host es noch nicht hat
npm install tailwindcss @tailwindcss/vite
```

Innerhalb des Monorepos ist das Package als Workspace-Package `@wb-news/shortform-news` verfügbar. `pnpm install` baut `dist/` automatisch (`prepare`-Skript).

### 2. `nuxt.config.ts`

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  modules: ['@wb-news/shortform-news/nuxt'],   // registriert <ShortformFeed> und <ShortformCard> global
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] }
});
```

### 3. Tailwind die Komponenten zeigen (wichtig)

Tailwind v4 durchsucht `node_modules` nicht. Ohne den folgenden Import erzeugt Tailwind keine einzige Klasse der Komponenten:

```css
/* app/assets/css/main.css */
@import 'tailwindcss';
@import '@wb-news/shortform-news/tailwind.css';
```

`tailwind.css` enthält nur eine `@source`-Anweisung auf die mitgelieferten Komponenten. Gleichwertig, falls der Host keinen Import nutzen will:

```css
@source '../../../node_modules/@wb-news/shortform-news/dist/components';
```

(Der Pfad ist relativ zur CSS-Datei.) Die Apps im Monorepo zeigen per `@source` direkt auf `packages/shortform-news/src`.

### 4. Verwenden

```vue
<template>
  <ShortformFeed
    :articles="articles"
    api-url="https://api.example.at"
    :loading="pending"
    :tracking-enabled="true"
    :liked-ids="likedIds"
    @article-read="openArticle"
    @article-impression="trackImpression"
    @like="(a) => likedIds.push(a.id)"
    @unlike="(a) => likedIds.splice(likedIds.indexOf(a.id), 1)"
  />
</template>

<script setup lang="ts">
import type { Article } from '@wb-news/shortform-news';

const likedIds = ref<number[]>([]);
const { data: articles, pending } = await useFetch<Article[]>('/api/feed');

const openArticle = (id: number) => navigateTo(`/artikel/${id}`);
const trackImpression = (article: Article) => { /* an Analytics senden */ };
</script>
```

Der Feed ist ein Vollbild-Scroll-Container (`h-screen`, Scroll-Snap). Er gehört daher auf eine eigene Seite oder in einen Bereich mit voller Viewport-Höhe.

### Ohne Nuxt (reines Vue)

```ts
import { ShortformFeed, ShortformCard } from '@wb-news/shortform-news';
```

Die Tailwind-Einrichtung aus Schritt 3 gilt genauso.

## `ShortformFeed`

Vertikaler Scroll-Container, rendert pro Artikel eine `ShortformCard` und reicht deren Events weiter.

### Props

| Prop | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `articles` | `Article[]` | ja | – | Anzuzeigende Artikel in Anzeigereihenfolge |
| `apiUrl` | `string` | nein | `''` | Basis-URL, die relativen `imageUrl`-Werten vorangestellt wird |
| `loading` | `boolean` | nein | `false` | Zeigt den Ladezustand, solange `articles` leer ist |
| `trackingEnabled` | `boolean` | nein | `false` | Aktiviert `article-impression` und `scroll-depth` |
| `likedIds` | `number[]` | nein | `[]` | IDs der Artikel, die die Person schon geliked hat (steuert Herz-Zustand) |

### Events

| Event | Payload | Wann |
|-------|---------|------|
| `article-read` | `articleId: number` | Klick auf „Vollständigen Artikel lesen“. Es wird bewusst **nur die ID** übergeben: der Host löst sie selbst auf und übernimmt Navigation/Darstellung |
| `article-impression` | `article: Article` | Karte ist erstmals zu 50 % sichtbar (einmal pro Karte, nur mit `trackingEnabled`) |
| `scroll-depth` | `percentage: number` (0–1) | bei jedem Scrollen, Anteil des bereits gesehenen Feeds (nur mit `trackingEnabled`) |
| `like` | `article: Article` | Herz geklickt, Artikel war noch nicht in `likedIds` |
| `unlike` | `article: Article` | Herz geklickt, Artikel war schon in `likedIds` |
| `share` | `article: Article` | Teilen-Button |
| `open-comments` | `article: Article` | Kommentar-Button |
| `filter-tag` | `tag: string` | reserviert; die Standard-Karte zeigt keine Tags und löst es derzeit nicht aus |

Like-Zustand und Zähler verwaltet der Host: Das Package zeigt nur an, was in `likedIds` und `article.likeCount` steht.

### Slots

| Slot | Slot-Props | Ersetzt |
|------|-----------|---------|
| `media` | `{ article }` | oberen Bildbereich jeder Karte (Standard: Kategorie-Badge über dem Bild) |
| `content` | `{ article, readAction }` | Text- und Button-Bereich jeder Karte. `readAction()` löst `article-read` aus |
| `loading` | – | Text im Ladezustand (Standard: „Lade Nachrichten...“) |
| `empty` | – | Text bei leerer Liste (Standard: „Keine Nachrichten verfügbar.“) |

Die Aktionsleiste (Like, Kommentare, Teilen) bleibt auch mit eigenem `content`-Slot erhalten.

## `ShortformCard`

Eine einzelne Karte. Normalerweise rendert `ShortformFeed` sie; direkt verwenden lohnt sich nur für eigene Container.

| Prop | Typ | Pflicht | Beschreibung |
|------|-----|---------|--------------|
| `article` | `Article` | ja | anzuzeigender Artikel |
| `apiUrl` | `string` | nein | wie beim Feed |
| `trackingEnabled` | `boolean` | nein | aktiviert `impression` |
| `liked` | `boolean` | nein | Herz-Zustand |

Events: `read(articleId)`, `impression(article)`, `like(article)`, `unlike(article)`, `share(article)`, `open-comments(article)`, `filter-tag(tag)` (Bedeutung wie beim Feed).
Slots: `card-media` (`{ article }`), `card-content` (`{ article, readAction }`).

## Datentyp `Article`

```ts
interface Article {
  id: number;
  title: string;
  teaser?: string | null;       // Kurztext auf der Karte
  content?: string | null;      // nur für die Lesezeit-Schätzung genutzt
  author?: string | null;       // Standard-Anzeige: „Redaktion“
  imageUrl?: string | null;     // absolut oder relativ zu apiUrl
  category?: string;            // Badge oben rechts
  tags?: { id?: number | string; name: string; slug?: string; color?: string }[];
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  createdAt?: string | Date | null;
}
```

Die Einträge von `GET /api/feed` der wb-newsfeed-API enthalten alle diese Felder (plus weitere wie `keyTakeaways`, `status`) und können direkt übergeben werden.

## Hilfsfunktionen

Über `@wb-news/shortform-news` bzw. `@wb-news/shortform-news/utils`:

| Funktion | Zweck |
|----------|-------|
| `estimateReadingTime(text, wpm = 200)` | „3 Min Lesezeit“ |
| `formatEngagementCount(n)` | `1200` → `1.2K` |
| `truncate(str, length = 100)`, `stripHtml(html)` | Textaufbereitung |
| `parseKeyTakeaways(raw)` | Aufzählung aus KI-Text in `string[]` |
| `calculatePersonalizedScore` / `rankPersonalizedArticles` | „Für dich“-Sortierung nach Kategorie-/Tag-Interessen und Aktualität |
| `autoExtractArticleMetadata(text)` | Titel/Kategorie-Vorschlag ohne KI (Fallback) |

## Styling über CSS-Variablen

Alle Farben und Größen lassen sich im Host überschreiben. Werte in Klammern sind die Standards.

```css
:root {
  --sf-bg-color: #000;                         /* Hintergrund Feed/Karte */
  --sf-text-color: #fff;                       /* Text auf der Karte */
  --sf-media-bg: #1f2937;                      /* Bildbereich ohne Bild */
  --sf-overlay-color: rgba(0, 0, 0, 0.9);      /* Verlauf unter dem Text */
  --sf-primary-color: #4ade80;                 /* Button + aktives Herz */
  --sf-primary-text: #000;                     /* Text auf dem Button */
  --sf-badge-bg: rgba(255, 255, 255, 0.15);    /* Kategorie-Badge */
  --sf-badge-border: rgba(255, 255, 255, 0.3);
  --sf-badge-color: white;
  --sf-empty-color: #888;                      /* Lade-/Leer-Text */
  --sf-title-size: 2rem;
  --sf-teaser-size: 1rem;
  --sf-padding: 2rem;                          /* Innenabstand (Bildbereich: 1rem) */
  --font-accent: inherit;                      /* Schrift des Kategorie-Badges */
}
```

## Einbettung per iframe

Die Feed-App `apps/feed` lässt sich per `<iframe>` in ein fremdes System einbetten. Beim Öffnen eines Artikels sendet sie `window.parent.postMessage({ type: 'article_opened', articleId }, '*')`. Das macht die App in ihrem `article-read`-Handler, nicht das Package selbst. Der Host prüft `event.origin` gegen die bekannte iframe-Quelle, bevor er der Nachricht vertraut. Beispiel ohne Vue/Nuxt: [`examples/host-embed-demo.html`](../../examples/host-embed-demo.html).

## Entwicklung

```bash
pnpm --filter @wb-news/shortform-news build   # dist/ neu bauen (ESM + .d.ts, via unbuild)
pnpm --filter @wb-news/shortform-news dev     # Watch-Modus
pnpm --filter @wb-news/shortform-news test
```

Der Feed im Monorepo nutzt `dist/`. Nach Änderungen im Package neu bauen und den Feed-Dev-Server neu starten.
