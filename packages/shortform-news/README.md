# @wb-news/shortform-news

Vertikaler Short-Form-News-Feed (ähnlich TikTok/Reels) als Vue-3-Komponenten mit Nuxt-Modul, zur Einbindung in bestehende Nuxt-Projekte.

Das Package bringt den **kompletten Feed** als eine Komponente mit: `<ShortformNewsFeed>` lädt die Artikel von der wb-newsfeed-API und prüft regelmäßig auf neue. Dazu kommen Kategorien mit Unterkategorien, „Für dich“-Sortierung, Likes, Kommentare, Teilen und Analytics-Events. Die einbindende Website (Host) muss nur eines selbst lösen: was passiert, wenn jemand einen Artikel ganz lesen will. Das Modul übergibt dafür nur die Artikel-ID (Vorgabe aus dem Briefing).

Wer eine eigene Datenquelle hat, kann stattdessen die Bausteine `<ShortformFeed>` und `<ShortformCard>` verwenden und die Artikel selbst übergeben.

## Voraussetzungen

| Was | Version | Warum |
|-----|---------|-------|
| Vue | ≥ 3.4 | Komponenten nutzen `<script setup>` mit typisierten `defineProps`/`defineEmits` |
| Nuxt (optional) | 4.x | nur für das Nuxt-Modul `@wb-news/shortform-news/nuxt` |
| Tailwind CSS | 4.x mit `@tailwindcss/vite` | die Komponenten sind mit Tailwind-Utility-Klassen gestylt und bringen **kein** fertiges CSS mit |
| wb-newsfeed-API | – | nur für `ShortformNewsFeed`: erreichbar, und die Adresse des Hosts steht in `CORS_ORIGIN` (siehe Schritt 5) |

Ohne Tailwind v4 im Host erscheinen die Komponenten ungestylt.

## Einbindung in ein bestehendes Nuxt-4-Projekt

Ein lauffähiges Beispiel liegt unter [`examples/nuxt-host/`](../../examples/nuxt-host/). Es ist ein eigenständiges Nuxt-Projekt außerhalb des Monorepo-Workspaces, das das Package wie ein fremdes Projekt als Tarball installiert.

### 1. Installieren

```bash
# im Monorepo: Tarball erzeugen (landet in packages/shortform-news/)
pnpm -C packages/shortform-news pack

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
  modules: ['@wb-news/shortform-news/nuxt'],   // registriert <ShortformNewsFeed>, <ShortformFeed> und <ShortformCard> global
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
  <ShortformNewsFeed ref="feed" api-url="https://api.example.at" @article-read="openArticle" />
</template>

<script setup lang="ts">
import type { ShortformNewsFeed } from '@wb-news/shortform-news';

const feed = ref<InstanceType<typeof ShortformNewsFeed> | null>(null);

// Nur die ID kommt vom Modul. Der Host entscheidet, was passiert:
// eigene Artikelseite, Overlay, externer Link …
const openArticle = (id: number) => navigateTo(`/artikel/${id}`);
// Braucht der Host den geladenen Artikel (Titel, Inhalt, Kernpunkte):
// const article = feed.value?.findArticle(id);
</script>
```

Der Feed ist ein Vollbild-Scroll-Container (`h-screen`, Scroll-Snap). Er gehört daher auf eine eigene Seite oder in einen Bereich mit voller Viewport-Höhe.

### 5. Host bei der API freischalten

Die Komponente ruft die API direkt aus dem Browser auf. Die API lässt nur Adressen zu, die in `CORS_ORIGIN` stehen (`.env` der API, kommagetrennt), zum Beispiel:

```bash
CORS_ORIGIN=http://localhost:3001,http://localhost:3002,https://www.host-website.at
```

Fehlt der Eintrag, blockiert der Browser die Anfragen und der Feed zeigt „Nachrichten konnten nicht geladen werden.“

### Ohne Nuxt (reines Vue)

```ts
import { ShortformNewsFeed, ShortformFeed, ShortformCard } from '@wb-news/shortform-news';
```

Die Tailwind-Einrichtung aus Schritt 3 gilt genauso.

## `ShortformNewsFeed` (kompletter Feed)

### Props

| Prop | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `apiUrl` | `string` | ja | – | Basis-URL der wb-newsfeed-API |
| `categories` | `string[]` | nein | `['Für dich', 'Alle', 'Politik', 'Wirtschaft', 'Sport', 'Technologie', 'Kultur']` | Kategorie-Reiter. `Für dich` = persönliche Sortierung, `Alle` = kein Filter, leeres Array blendet die Leiste aus |
| `pollInterval` | `number` | nein | `60000` | Millisekunden zwischen zwei Prüfungen auf neue/geänderte Artikel, `0` schaltet das ab |
| `analytics` | `boolean` | nein | `true` | Impression-, Lese-, Teilen- und Scroll-Events an `POST /api/analytics/events` senden |
| `pageSize` | `number` | nein | `10` | Artikel pro Anfrage an `GET /api/feed` (höchstens 100). Weitere Seiten lädt der Feed, sobald nur noch 3 Karten unter der sichtbaren liegen |

### Laden und Rendering

- **Seitenweise:** Zuerst kommt nur eine Seite (`?limit=<pageSize>&offset=0`), weitere folgen beim Scrollen. Findet ein Kategorie- oder Tag-Filter auf den geladenen Seiten zu wenig Treffer, lädt der Feed selbst weiter, bis genug da sind oder alles geladen ist. Ein geteilter Link (`?article=<id>`) lädt ebenfalls weiter, bis der Artikel gefunden ist.
- **Nur sichtbare Karten:** Gerendert werden die sichtbare Karte und je zwei davor und danach, der Rest sind leere Platzhalter gleicher Höhe. Bilder laden dadurch erst, wenn ihre Karte in die Nähe kommt.
- **Polling** lädt alle bisher geladenen Artikel neu (in Blöcken zu 100) und tauscht nur geänderte aus.
- **„Für dich“** sortiert jede neu geladene Seite für sich und hängt sie an. Schon gesehene Karten behalten ihren Platz, auch nach Polling oder Likes. Die Sortierung gilt damit innerhalb der Seiten, nicht über alle Artikel.

### Events

| Event | Payload | Wann |
|-------|---------|------|
| `article-read` | `articleId: number` | „Vollständigen Artikel lesen“ geklickt, oder die Seite wurde über einen geteilten Link (`?article=<id>`) geöffnet. Der Host übernimmt Navigation und Darstellung |
| `article-impression` | `article: Article` | Karte ist erstmals zu 50 % sichtbar |
| `like` / `unlike` | `article: Article` | Herz geklickt (Zähler und API-Aufruf erledigt das Modul selbst) |
| `share` | `article: Article` | Artikel geteilt |
| `comment` | `article: Article, comment` | Kommentar erfolgreich gespeichert |

Die Events dienen dazu, eigene Analytics-Systeme anzubinden. Für den Feed selbst muss der Host keines davon behandeln außer `article-read`.

### Methoden (über `ref`)

| Methode | Zweck |
|---------|-------|
| `findArticle(id)` | liefert den geladenen Artikel zur ID aus `article-read` (inkl. `content`, `keyTakeaways`, `tags`) |
| `filterByTag(name)` | Feed nach Tag filtern, z. B. aus Tag-Buttons in der eigenen Artikelansicht |
| `track(eventType, articleId?, metadata?)` | eigenes Analytics-Event über denselben Kanal senden, z. B. `tts_play` |
| `refresh()` | alle bisher geladenen Artikel sofort neu laden |

Likes, Interessen für „Für dich“ und der Kommentar-Name werden nur im Browser gespeichert (`localStorage`), es gibt keine Konten.

## Bausteine: `ShortformFeed`

Vertikaler Scroll-Container ohne eigene Datenanbindung: rendert pro übergebenem Artikel eine `ShortformCard` und reicht deren Events weiter. `ShortformNewsFeed` baut intern darauf auf. Direkt verwenden lohnt sich nur mit eigener Datenquelle.

### Props

| Prop | Typ | Pflicht | Standard | Beschreibung |
|------|-----|---------|----------|--------------|
| `articles` | `Article[]` | ja | – | Anzuzeigende Artikel in Anzeigereihenfolge |
| `apiUrl` | `string` | nein | `''` | Basis-URL, die relativen `imageUrl`-Werten vorangestellt wird |
| `loading` | `boolean` | nein | `false` | Zeigt den Ladezustand, solange `articles` leer ist |
| `trackingEnabled` | `boolean` | nein | `false` | Aktiviert `article-impression` und `scroll-depth` |
| `likedIds` | `number[]` | nein | `[]` | IDs der Artikel, die die Person schon geliked hat (steuert Herz-Zustand) |
| `renderWindow` | `number` | nein | `2` | Karten vor und nach der sichtbaren, die gerendert werden; die übrigen sind leere Platzhalter gleicher Höhe. `Infinity` rendert alle |

### Events

| Event | Payload | Wann |
|-------|---------|------|
| `article-read` | `articleId: number` | Klick auf „Vollständigen Artikel lesen“. Es wird bewusst **nur die ID** übergeben: der Host löst sie selbst auf und übernimmt Navigation/Darstellung |
| `article-impression` | `article: Article` | Karte ist erstmals zu 50 % sichtbar (einmal pro Artikel, auch wenn die Karte neu gerendert wird; nur mit `trackingEnabled`) |
| `scroll-depth` | `percentage: number` (0–1) | bei jedem Scrollen, Anteil des bereits gesehenen Feeds (nur mit `trackingEnabled`) |
| `active-index` | `index: number` | sichtbare Karte hat gewechselt; zum Nachladen weiterer Seiten |
| `like` | `article: Article` | Herz geklickt, Artikel war noch nicht in `likedIds` |
| `unlike` | `article: Article` | Herz geklickt, Artikel war schon in `likedIds` |
| `share` | `article: Article` | Teilen-Button |
| `open-comments` | `article: Article` | Kommentar-Button |
| `filter-tag` | `tag: string` | reserviert; die Standard-Karte zeigt keine Tags und löst es derzeit nicht aus |

Bei direkter Verwendung verwaltet der Host Like-Zustand und Zähler: `ShortformFeed` zeigt nur an, was in `likedIds` und `article.likeCount` steht.

### Slots

| Slot | Slot-Props | Ersetzt |
|------|-----------|---------|
| `media` | `{ article }` | oberen Bildbereich jeder Karte (Standard: Kategorie-Badge über dem Bild) |
| `content` | `{ article, readAction }` | Text- und Button-Bereich jeder Karte. `readAction()` löst `article-read` aus |
| `loading` | – | Text im Ladezustand (Standard: „Lade Nachrichten...“) |
| `empty` | – | Text bei leerer Liste (Standard: „Keine Nachrichten verfügbar.“) |

Die Aktionsleiste (Like, Kommentare, Teilen) bleibt auch mit eigenem `content`-Slot erhalten.

## Bausteine: `ShortformCard`

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
  keyTakeaways?: string | null; // KI-Kernpunkte, für die Artikelansicht des Hosts
  status?: string;              // nur 'published' wird angezeigt
}
```

Die Einträge von `GET /api/feed` der wb-newsfeed-API haben genau diese Felder (plus `updatedAt`).

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
  --font-accent: inherit;                      /* Schrift von Badge und Kommentar-Titel */

  /* nur ShortformNewsFeed: Kommentarfenster und Hinweis „Link kopiert“ */
  --sf-sheet-bg: #fff;
  --sf-sheet-text: #14151a;
  --sf-sheet-muted: #6b7280;
  --sf-sheet-input-bg: #f3f4f6;
  --sf-sheet-accent: #16a34a;                  /* Rahmen des Eingabefelds im Fokus */
  --sf-toast-bg: #14151a;
}
```

## Einbettung per iframe

Alternativ zur Nuxt-Komponente lässt sich die fertige Feed-App `apps/feed` per `<iframe>` in beliebige Websites einbetten, auch ohne Nuxt. Beim Öffnen eines Artikels sendet sie `window.parent.postMessage({ type: 'article_opened', articleId }, '*')`. Das macht die App in ihrem `article-read`-Handler, nicht das Package selbst. Der Host prüft `event.origin` gegen die bekannte iframe-Quelle, bevor er der Nachricht vertraut. Beispiel ohne Vue/Nuxt: [`examples/host-embed-demo.html`](../../examples/host-embed-demo.html).

## Entwicklung

```bash
pnpm --filter @wb-news/shortform-news build   # dist/ neu bauen (ESM + .d.ts, via unbuild)
pnpm --filter @wb-news/shortform-news dev     # Watch-Modus
pnpm --filter @wb-news/shortform-news test
```

Der Feed im Monorepo nutzt `dist/`. Nach Änderungen im Package neu bauen und den Feed-Dev-Server neu starten.
