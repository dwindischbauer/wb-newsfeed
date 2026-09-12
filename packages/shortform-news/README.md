# @wb-news/shortform-news

Eine Vue 3 Komponenten-Bibliothek zur Darstellung vertikaler "Shortform" Nachrichten-Feeds (ähnlich TikTok/Reels).

## Installation

Dieses Package ist Teil des Monorepos und wird automatisch in die `apps/feed` Applikation injiziert.

## Komponenten

### `ShortformFeed`

Die Hauptkomponente, die den vertikalen Scroll-Container und die Logik (inkl. Tracking) bereitstellt.

**Props:**
- `articles` (Array): Array von Nachrichten-Objekten.
- `apiUrl` (String): Basis-URL für Assets (z.B. Bilder).
- `loading` (Boolean): Zeigt Lade-Status.
- `trackingEnabled` (Boolean): Aktiviert IntersectionObserver Event-Tracking.

**Events:**
- `@article-read(article)`: Wird gefeuert, wenn ein Benutzer "Vollständigen Artikel lesen" klickt.
- `@article-impression(article)`: Wird gefeuert, wenn eine Karte zu 50% sichtbar wird.
- `@scroll-depth(percentage)`: Wird beim Scrollen gefeuert.

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
