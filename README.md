# wb-newsfeed

**KI-gestützter Short-Form-News-Feed als wiederverwendbares Nuxt-4-Modul**  
Diplomarbeit an der HTBLA Leonding (Abteilung Informatik) in Kooperation mit **Werbeberg Digital Communications GmbH & Co KG**.

`wb-newsfeed` verwandelt klassische Nachrichtenartikel automatisch in kompakte Short-Form-Karten (Teaser, Kernpunkte, Themen-Tags und optionales 9:16-Titelbild) und stellt sie in einem vertikal wischbaren Feed bereit, der sich per Komponente in jede Nuxt-4-Website einbauen lässt.

---

## Was das System kann

- **KI-Aufbereitung im Hintergrund:** Erzeugt aus Artikeltexten asynchron über Ollama (`qwen3:14b`, alternativ z. B. `qwen3.5:9b`) reproduzierbare Teaser (max. 3 Sätze), drei Kernpunkte, feste Themen-Tags, Text-Embeddings (`bge-m3`, alternativ `qwen3-embedding`) sowie optional ein 9:16-Titelbild (`Z-Image-Turbo`, `FLUX.1-schnell`, `FLUX.2 [klein]` oder Google Gemini).
- **Wiederverwendbares Nuxt-4-Package (`@wb-news/shortform-news`):** Kompletter vertikaler Snap-Feed als eine Komponente `<ShortformNewsFeed>` – inklusive Lazy-Loading, „Für dich“-Personalisierung im Browser (`localStorage`) und Übergabe der Artikel-ID beim Öffnen (`@article-read`).
- **Admin-CMS:** Übersichtliches Nuxt-4-Dashboard zum Anlegen, Prüfen, Bearbeiten, Versionieren/Wiederherstellen, RSS-/Atom-Importieren und Auswerten von Artikeln.
- **Dokumentierte REST-API:** Fastify-Backend mit Server-Cache, `ETag`/`304 Not Modified` und vollständiger OpenAPI-3.1-Spezifikation (Swagger UI unter `/docs`).

---

## Schnellstart (3 Schritte)

Voraussetzungen: **Node.js 22** (`.nvmrc`), **pnpm 9** (`corepack enable`) und **Docker Desktop**.

```bash
# 1. Umgebungsvariablen & Abhängigkeiten
cp .env.example .env
pnpm install

# 2. Datenbank, Redis & Ollama starten und Modelle laden
docker compose up -d
docker exec wb_newsfeed_ollama ollama pull qwen3:14b
docker exec wb_newsfeed_ollama ollama pull bge-m3

# 3. Datenbankschema anlegen & Anwendungen starten
pnpm --filter @wb-news/api run db:push
pnpm run dev
```

*(Falls Ollama beim Start nicht läuft, nutzt das Backend automatisch einen regelbasierten Fallback, sodass alle Oberflächen trotzdem sofort testbar sind.)*

### Dienste & Adressen

| Dienst | Adresse | Zweck |
|---|---|---|
| **Feed-App** | http://localhost:3002 | Mobiler Short-Form-Feed (Demo-Host) |
| **Admin-CMS** | http://localhost:3001 | Redaktion, Versionen, Jobs, Einstellungen & Analytics |
| **REST-API** | http://localhost:3005 | Fastify-API (`GET /api` für Übersicht; geschützte Routen per `Authorization: Bearer` oder `x-api-key`) |
| **Swagger UI** | http://localhost:3005/docs | Interaktive OpenAPI-3.1-Dokumentation |
| **Bildserver** *(optional)* | http://localhost:8080/health | Lokale 9:16-Titelbilder per GPU |

---

## API in 30 Sekunden

Geschützte Endpunkte akzeptieren wahlweise `Authorization: Bearer <API_KEY>` oder `x-api-key: <API_KEY>` (Standard in `.env.example`: `diplomarbeit-secret-key`). Im Admin unter **Einstellungen → API-Zugang** stehen alle Aufrufe direkt zum Kopieren bereit.

```bash
# 1. Artikel anlegen (Teaser, Kernpunkte & Tags entstehen asynchron im Hintergrund)
curl -X POST http://localhost:3005/api/articles \
  -H "Authorization: Bearer diplomarbeit-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"title": "Neuer Artikel", "content": "Volltext mit mindestens 10 Zeichen...", "status": "published"}'

# 2. Oder synchron in einer einzigen Antwort generieren (ohne Job-Polling)
curl -X POST http://localhost:3005/api/articles/generate \
  -H "Authorization: Bearer diplomarbeit-secret-key" \
  -H "Content-Type: application/json" \
  -d '{"content": "Volltext mit mindestens 10 Zeichen...", "generateImage": false}'

# 3. Öffentlichen Feed abrufen (ohne API-Key)
curl "http://localhost:3005/api/feed?limit=10&offset=0"
```

### Optional: Lokaler Bildserver (Titelbilder)

Für lokale Titelbilder auf einer NVIDIA-GPU (≥ 12 GB VRAM, Python 3.11) in einem zweiten Terminal starten – oder alternativ einen `GEMINI_API_KEY` in `.env` hinterlegen:

```bash
cd services/image
python -m venv .venv
.venv/Scripts/pip install torch --index-url https://download.pytorch.org/whl/cu128
.venv/Scripts/pip install -r requirements.txt
.venv/Scripts/python -m uvicorn server:app --port 8080
```

*(Unter Linux `.venv/bin/...` verwenden. Bereit, sobald `/health` `"loaded": true` liefert.)*

---

## Einbindung in ein bestehendes Nuxt-4-Projekt

Ein fertiges Beispiel außerhalb des Workspaces liegt unter [`examples/nuxt-host/`](examples/nuxt-host/).

**1. Nuxt-Modul registrieren (`nuxt.config.ts`):**

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  modules: ['@wb-news/shortform-news/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] }
});
```

**2. Tailwind auf das Package hinweisen (`app/assets/css/main.css`):**

```css
@import 'tailwindcss';
@import '@wb-news/shortform-news/tailwind.css';
```

**3. Komponente einbinden und Absprung behandeln (`app/pages/index.vue`):**

```vue
<template>
  <ShortformNewsFeed
    api-url="http://localhost:3005"
    @article-read="(id) => navigateTo(`/artikel/${id}`)"
  />
</template>
```

Die Host-Adresse muss in der `.env` der API unter `CORS_ORIGIN` eingetragen sein (z. B. `http://localhost:3099`).  
Alle Props, Events, Slots und CSS-Variablen (`--sf-*`): [`packages/shortform-news/README.md`](packages/shortform-news/README.md).

---

## Projektstruktur & Dokumentation

```text
wb-newsfeed/
├── apps/
│   ├── api/                 Fastify REST-API, BullMQ-Worker, Drizzle-Schema, openapi.yaml
│   ├── feed/                Demo-Feed-App (Nuxt 4)
│   └── admin/               Admin-CMS (Nuxt 4)
├── packages/shortform-news/ Wiederverwendbares Vue/Nuxt-Package (@wb-news/shortform-news)
├── services/image/          Optionaler Python-Bildserver (Z-Image-Turbo / FLUX.1-schnell)
├── examples/                Einbindung als Nuxt-Host & per iframe
├── docs/architektur.md      Systemarchitektur & Abläufe
├── specs/anforderungen.md   Abgleich gegen Briefing & Diplomarbeitsantrag
└── thesis/                  Schriftliche Diplomarbeit (LaTeX & PDF)
```

- **Architektur & Datenmodell:** [`docs/architektur.md`](docs/architektur.md)
- **OpenAPI-Spezifikation:** [`apps/api/openapi.yaml`](apps/api/openapi.yaml)
- **Anforderungscheck:** [`specs/anforderungen.md`](specs/anforderungen.md)
- **Qualitätsprüfungen:** `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build` (automatisiert in [`.github/workflows/ci.yml`](.github/workflows/ci.yml))

---

## Team & Projektpartner

| Rolle | Person | Schwerpunkt |
|---|---|---|
| **Schüler (Verantwortlich)** | David Windischbauer | Backend: Fastify-API, PostgreSQL/Drizzle, BullMQ-Worker, Ollama-Generierung & Embeddings, Versionierung, RSS-Import, Bildserver, OpenAPI-Doku |
| **Schüler** | Stefan Schachner | Frontend: Nuxt-4-Package `@wb-news/shortform-news`, Feed-App, Admin-CMS, UI/UX, Host-Integration & Client-Personalisierung |
| **Betreuer** | Martin Huemer | HTBLA Leonding |
| **Projektpartner** | Werbeberg Digital Communications GmbH & Co KG | Ansprechperson: Michael Medweschek |
