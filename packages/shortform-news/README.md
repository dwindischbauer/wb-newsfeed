# @wb-news/shortform-news

Eine Vue 3 Komponenten-Bibliothek zur Darstellung vertikaler "Shortform" Nachrichten-Feeds (ähnlich TikTok/Reels).

## Installation

Innerhalb des Monorepos steht das Package als pnpm-Workspace-Package automatisch allen Apps zur Verfügung (`@wb-news/shortform-news`).

Es ist zusätzlich als eigenständig **build- und publishbares** Package aufgesetzt: `pnpm build` erzeugt via `unbuild` ein reales `dist/` (ESM + `.d.ts`), sodass es auch außerhalb des Monorepos via `npm install @wb-news/shortform-news` installiert werden könnte.

### Build/publish

```bash
pnpm --filter @wb-news/shortform-news build   # einmaliger Build nach dist/
pnpm --filter @wb-news/shortform-news dev      # Watch-Modus (unbuild --watch)
```

### Als externes Nuxt-Modul

Neben dem Komponenten-Bibliotheks-Export bringt das Package einen echten Nuxt-Modul-Entry mit. Ein externes Nuxt-Projekt kann `<ShortformCard>`/`<ShortformFeed>` ohne manuellen Import global registrieren:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@wb-news/shortform-news/nuxt']
});
```

## Komponenten

### `ShortformFeed`

Die Hauptkomponente, die den vertikalen Scroll-Container und die Logik (inkl. Tracking) bereitstellt.

**Props:**
- `articles` (Array): Array von Nachrichten-Objekten.
- `apiUrl` (String): Basis-URL für Assets (z.B. Bilder).
- `loading` (Boolean): Zeigt Lade-Status.
- `trackingEnabled` (Boolean): Aktiviert IntersectionObserver Event-Tracking.

**Events:**
- `@article-read(articleId: number)`: Wird gefeuert, wenn ein Benutzer "Vollständigen Artikel lesen" klickt. Übergibt **nur die Artikel-ID**, kein volles Artikel-Objekt — das Modul entscheidet bewusst nicht selbst, wie/wo der Vollartikel dargestellt wird. Das einbindende System löst die ID selbst gegen seine eigenen Daten auf und übernimmt Navigation/Darstellung.
- `@article-impression(article)`: Wird gefeuert, wenn eine Karte zu 50% sichtbar wird.
- `@scroll-depth(percentage)`: Wird beim Scrollen gefeuert.

**Cross-Frame-Einbindung:** Wird das Modul (bzw. eine es einbindende App) per `<iframe>` in ein fremdes Host-System eingebettet, sendet es beim Öffnen eines Artikels zusätzlich `window.parent.postMessage({ type: 'article_opened', articleId }, '*')`. Der Host validiert dabei selbst `event.origin` gegen die bekannte iframe-Quelle, bevor er der Payload vertraut — ein lauffähiges Beispiel dafür liegt unter [`examples/host-embed-demo.html`](../../examples/host-embed-demo.html) (reines HTML/JS, keine Nuxt/Vue-Abhängigkeit auf Host-Seite).

### `ShortformCard`

Die einzelne Card-Komponente innerhalb des Feeds.

## Styling (Custom Properties)

Das Styling kann über CSS-Variablen global überschrieben werden:

```css
:root {
  --sf-bg-color: #000;
  --sf-text-color: #fff;
  --sf-primary-color: #4ade80;
  --sf-primary-text: #000;
  --sf-title-size: 2rem;
  --sf-teaser-size: 1rem;
}
```

## Verwendung

```vue
<template>
  <ShortformFeed 
    :articles="articles" 
    :apiUrl="apiUrl"
    :trackingEnabled="true"
    @article-read="openReader"
    @article-impression="trackImpression"
  />
</template>

<script setup>
import { ShortformFeed } from '@wb-news/shortform-news';
// ...
</script>
```
