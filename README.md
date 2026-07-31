# WB Newsfeed Monorepo 📰🤖

Automatisierte KI-Teaser Generierung & Short-Form Newsfeed-System mit **zwei interaktiven Web-Applikationen** für den **WB Publisher**.

---

## 🌟 Übersicht & Architektur

Das Monorepo gliedert sich in drei Kernmodule:

1. **`apps/admin`** (Port 3001): **WB Publisher Admin Dashboard (Desktop CMS)**
   - Interaktive Artikel-Übersichtstabelle mit Kategorie-Filtern (`Alle`, `Politik`, `Wirtschaft`, `Sport`, `Technologie`, `Kultur`).
   - Sofortschließendes Modal zum Einpflegen neuer Artikel (`POST /api/articles`), das beliebige Texte im Hintergrund verarbeitet.
   - Live **BullMQ Job Monitor**, der in Echtzeit den Status der KI-Teaser-Generierung anzeigt (`pending`, `processing`, `completed`).
   - Live **Smartphone-Vorschau**: Jedes ausgewählte Element wird sofort auf dem eingebetteten Handy-Bildschirm gerendert!

2. **`apps/mobile`** (Port 3002): **Short-Form Mobile Newsfeed Web App**
   - Eigenständige, mobile-optimierte Web-Applikation (Smartphone Viewport).
   - Interaktive Kategorie-Filterleiste.
   - Interaktive News-Cards mit `• KI-generiert` Badge, Hero-Bild-Upload-Container, Schlagzeile, Zusammenfassung und leuchtend grünem CTA-Button (`Weiterlesen →` `#10B981`).

3. **`apps/api`** (Port 3000): **Fastify REST API & BullMQ Background Worker**
   - Ingestion Pipeline, PostgreSQL via Drizzle ORM, BullMQ Worker auf Redis & Ollama LLM integration (`qwen2.5:3b-instruct`).

```
                              +--------------------+
                              |  Nuxt Admin CMS    |
                              |  (apps/admin:3001) |
                              +---------+----------+
                                        |
                                        |  (POST /api/articles)
                                        v
+-------------------+         +--------------------+         +--------------------+
| Nuxt Mobile Feed  | <------ | Fastify API Server | ------> | BullMQ / Redis     |
| (apps/mobile:3002)| (GET    | (apps/api:3000)    |         | Queue & Worker     |
+-------------------+  /feed) +---------+----------+         +---------+----------+
                                        |                              |
                                        v                              v
                              +--------------------+         +--------------------+
                              | PostgreSQL 16      |         | Ollama LLM Engine  |
                              | (Drizzle ORM)      |         | (qwen2.5:3b)       |
                              +--------------------+         +--------------------+
```

---

## 🛠️ Autorenschaft & Committer

- **Backend API, Infrastruktur & Warteschlange (`apps/api`)**: **Stefan Schachner** (`Stefan Schachner <stefan.schachner1@students.htl-leonding.ac.at>`)
- **Desktop Admin CMS & Mobile Web App UI (`apps/admin`, `apps/mobile`)**: **dwindischbauer** (`dwindischbauer <d.windischbauer@students.htl-leonding.ac.at>`)

---

## 🚀 Quickstart & Ausführung aller Services

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Infrastruktur (Docker Compose) starten
```bash
docker-compose up -d
```
*(PostgreSQL auf Port 5433, Redis auf Port 6379, Ollama auf Port 11434)*

### 3. Datenbank-Migration ausführen
```bash
npx --prefix apps/api drizzle-kit push:pg
```

### 4. Applikationen starten

- **Backend API & Worker**:
  ```bash
  npm --prefix apps/api run dev
  npm --prefix apps/api run dev:worker
  ```
- **Desktop Admin CMS** (auf [http://localhost:3001](http://localhost:3001)):
  ```bash
  npm --prefix apps/admin run dev
  ```
- **Mobile Newsfeed Web App** (auf [http://localhost:3002](http://localhost:3002)):
  ```bash
  npm --prefix apps/mobile run dev
  ```

---

## 📅 Commit Timeline (13.07.2026 – 31.07.2026)

- **Woche 1 (13.07 - 19.07)**: Monorepo Base, Docker Compose (Postgres, Redis, Ollama), Fastify Server, Zod Config, Drizzle Schema *(Stefan Schachner)*.
- **Woche 2 (20.07 - 25.07)**: Migrationen, Ingestion Adapter, BullMQ Queueing, Worker, Ollama Client Wrapper, API Endpunkte *(Stefan Schachner)*.
- **Woche 3 (26.07 - 29.07)**: **dwindischbauer** – Nuxt 4 Desktop CMS Admin Dashboard (`apps/admin`), Modal, Job Monitor & Nuxt 4 Mobile Newsfeed Web App (`apps/mobile`), Category Filter, Hero Card.
- **Woche 4 (30.07 - 31.07)**: Vitest Tests *(Stefan Schachner)*, CMS Polling Adapter, README & Health Checks Finalisierung *(dwindischbauer)*.
