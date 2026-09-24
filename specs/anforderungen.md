# Anforderungen – wb-newsfeed

Quelle: `../briefing.pdf` (Werbeberg, 30.1.2026) und `../DA_ABA_Antrag.pdf` (ABA-Antrag, 19.2.2026).
Nicht bewertet: `rechtliche-erklaerung.pdf`, schriftliche/formale Teile, Recherche- und Figma-Meilensteine.

Bewertung: ✅ erfüllt = 1 · ⚠️ teilweise = 0,5 · ❌ fehlt = 0 · Pflicht (A–D, 24 Punkte) ergibt den Prozentwert, Optional (E) wird separat gezählt.

Status: bestätigt am 2026-09-22 · letzter Check: 2026-09-24 (Commit `d62bc0b`)

## A. Funktionale Anforderungen (Briefing)

| ID | Anforderung | Status | Beleg / Begründung |
|----|-------------|--------|--------------------|
| F1 | Vertikal scrollbarer Short-Form-News-Feed | ✅ | `packages/shortform-news/src/components/ShortformFeed.vue:2` (overflow-y-scroll + scroll-snap), Karten `ShortformCard.vue:2` |
| F2 | Anzeige von KI-generiertem Short-Form-Content (Teaser) | ✅ | Teaser gerendert `ShortformCard.vue:12`, erzeugt durch Ollama `apps/api/src/services/summarizer.ts:84` |
| F3 | Beim Absprung eindeutigen Identifikator an Host übergeben | ✅ | Event `read` nur mit Artikel-ID `ShortformCard.vue:125`, vom kompletten Feed als `article-read` weitergegeben `ShortformNewsFeed.vue:337`; Host löst ID selbst auf `apps/feed/app/pages/index.vue:80`, `postMessage` `:85`; Demo `examples/host-embed-demo.html:88`. Keine Action-ID (Briefing: „und/oder“) |
| G1 | Generierung aus strukturierten Artikeldaten | ✅ | `summarizer.ts:49` (content, title, category → JSON), Worker `apps/api/src/queue/index.ts:98` |
| G2 | Persistierung generierter Inhalte | ✅ | Spalten `teaser`/`keyTakeaways` `apps/api/src/db/schema.ts:7`, Schreiben `queue/index.ts:107` |
| E1 | Einbindung als Nuxt Component in bestehende Nuxt-Projekte | ✅ | Kompletter Feed als eine Komponente `packages/shortform-news/src/components/ShortformNewsFeed.vue` (Laden, Polling, Kategorien, Für dich, Like/Kommentar/Teilen, Analytics), per Nuxt-Modul registriert `packages/shortform-news/src/module.ts:35`; Host behandelt nur `article-read`. Beispiel-Host außerhalb des Workspaces `examples/nuxt-host/` (Tarball-Install, 3099): sieht aus wie der Feed auf 3002, Kategorien/Unterkategorien/Kommentare/Artikel-ID im Browser geprüft (2026-09-24). `apps/feed` nutzt dieselbe Komponente. Voraussetzungen für Hosts: Tailwind-Import `src/tailwind.css`, Host-Adresse in `CORS_ORIGIN` |
| E2 | Erkennung neuer/geänderter Inhalte (Polling/Push) | ✅ | Polling im Package, Intervall per Prop `pollInterval` (Standard 60 s), identitätserhaltender Merge `ShortformNewsFeed.vue:299`, `:544` |
| E3 | Bereitstellung via REST-API | ✅ | `GET /api/feed` mit Filter + limit/offset `apps/api/src/routes/feed.ts:65` |

## B. Technische Rahmenbedingungen (Briefing)

| ID | Anforderung | Status | Beleg / Begründung |
|----|-------------|--------|--------------------|
| T1 | Nuxt 4 (SSR) + TypeScript | ✅ | `nuxt ^4.5.2` in admin/feed, SSR Default aktiv; `pnpm typecheck` grün (deckt nur admin/feed ab, nicht api/package) |
| T2 | Tailwind CSS v4 | ✅ | `tailwindcss ^4.3.3` + `@tailwindcss/vite` `apps/feed/nuxt.config.ts:7` |
| T3 | ESLint projektweit | ✅ | `eslint.config.mjs` in allen 4 Workspaces, `pnpm lint`: 0 Fehler, 10 Warnungen (api); in CI `.github/workflows/ci.yml` |
| T4 | Feed-UI als wiederverwendbares Package | ✅ | `packages/shortform-news` (unbuild, Exports `.`, `./utils`, `./nuxt`) |
| T5 | Backend für asynchrone Generierung/Verwaltung/Bereitstellung | ✅ | BullMQ-Queue + Worker `apps/api/src/queue/index.ts:12`, `:83`; Jobs-API `routes/jobs.ts` |

## C. Geplante Ergebnisse Stefan Schachner (ABA, ohne Duplikate zu A/B)

| ID | Anforderung | Status | Beleg / Begründung |
|----|-------------|--------|--------------------|
| S1 | Responsives, mobiles UI | ✅ | `h-screen` + Snap-Karten, Viewport-Meta `apps/feed/nuxt.config.ts:15`; Host-Demo in 375×812 `examples/host-embed-demo.html` |
| S2 | Performantes Rendering und Lazy-Loading | ✅ | Seitenweises Laden `?limit=&offset=` (Prop `pageSize`, Standard 10), Nachladen bei ≤ 3 restlichen Karten (`ensureBuffer` in `ShortformNewsFeed.vue`); nur sichtbare ± 2 Karten gerendert, Rest Platzhalter gleicher Höhe (`renderWindow`, `ShortformFeed.vue:7`) → Bilder laden erst in der Nähe; Impressions pro Artikel dedupliziert; Polling über geladenen Bereich. Browser 375×812 (2026-09-24): Start 1 Anfrage/3 Karten/2 Bilder statt 28 Karten/27 Bilder, Seite 2 bei Karte 7, Ende nach Seite 3, Sport lädt Seite 2 selbst, `?article=56` lädt bis Seite 3, `refresh` → `limit=20`, „Für dich“-Reihenfolge stabil. Tests `utils.test.ts` (pagination helpers) |
| S3 | Konfigurierbare Darstellung/Styling | ✅ | CSS-Custom-Properties `--sf-*` + Slots `media`/`content`/`loading`/`empty` `ShortformFeed.vue:19`; dokumentiert `packages/shortform-news/README.md:52` |
| S4 | Event-Handling für Tracking/Analytics | ✅ | Emits `article-impression`, `article-read`, `scroll-depth`, `like`, `share` … `ShortformFeed.vue:53` |
| S5 | Technische Doku zur Einbindung | ✅ | `packages/shortform-news/README.md`: Voraussetzungen, Einbindung in 5 Schritten inkl. Tailwind-`@source` und CORS-Freischaltung `README.md:91`, Props/Events/Methoden von `ShortformNewsFeed` `README.md:109`, Bausteine mit Slots, `Article`-Typ, alle CSS-Variablen; `examples/nuxt-host/README.md` |

## D. Geplante Ergebnisse David Windischbauer (ABA, ohne Duplikate zu A/B)

| ID | Anforderung | Status | Beleg / Begründung |
|----|-------------|--------|--------------------|
| D1 | KI-Generierung reproduzierbar und konfigurierbar | ✅ | `temperature` (Default 0) und `seed` (Default 42) aus Settings `apps/api/src/services/summarizer.ts:30`, als Ollama-`options` gesendet; im Admin einstellbar `apps/admin/app/pages/settings.vue:118`. Modell/Temperatur/Seed + Content-Hash je Version gespeichert (`generation_versions`, siehe D3) |
| D2 | Async Verarbeitung neuer **und geänderter** Inhalte | ✅ | `enqueueGeneration` `apps/api/src/queue/index.ts:34`: `POST /api/articles` queued selbst (`routes/articles.ts:584`), `PUT` bei geändertem `content` (`:272`), Quick-Route ebenso. E2E getestet (Job 12/13 automatisch) |
| D3 | Versionierung generierter Inhalte | ✅ | Tabelle `generation_versions` `apps/api/src/db/schema.ts:73` (Quelle ai/fallback/manual, Modell, Parameter, Content-Hash, Job), geschrieben in Worker `queue/index.ts:115`, `/generate`, Retry, manuelle Teaser-Edits; `GET /api/articles/:id/versions` `routes/articles.ts:322`, Restore als neue Version `:333`; Admin-Drawer `apps/admin/app/pages/index.vue:564`. E2E + Browser getestet |
| D4 | CMS-unabhängig und modular | ⚠️ | Generischer REST-Ingest `POST /api/articles`, Package ohne CMS-Bezug. Kein Quell-Adapter/Import-Schnittstelle; Schema-Default `ORF.at Redaktion` `schema.ts:11` |
| D5 | Performance: Caching und Queueing | ✅ | Queueing: BullMQ `apps/api/src/queue/index.ts`. Caching: Feed-Liste im Speicher, invalidiert per Fingerprint (`count`/`max(updated_at)` + Tag-Links, TTL 60 s) `apps/api/src/routes/feed.ts:19`, `:73`; ETag + `no-cache` → 304 `:108`. Getestet: MISS→HIT, 304 bei If-None-Match, neuer ETag nach Like |
| D6 | Doku von Schnittstellen und Architektur | ✅ | OpenAPI 3.1 `apps/api/openapi.yaml` (alle 33 Endpunkte, Auth, Schemas; per Skript gegen Routen im Code abgeglichen, 0 Abweichungen); Abläufe/Datenmodell `docs/architektur.md` (3 Mermaid-Diagramme, Syntax geprüft); verlinkt in `README.md` |

## E. Optional (Briefing „Erweiterungsideen“ + T6) – nicht im Prozentwert

| ID | Anforderung | Status | Beleg / Begründung |
|----|-------------|--------|--------------------|
| O1 | Feed-Personalisierung | ✅ | „Für dich“-Ranking `rankPersonalizedArticles`, `ShortformNewsFeed.vue:257`; Unlike nimmt den Like-Boost zurück `:419`; Tests `utils.test.ts:110` |
| O2 | Content-Personalisierung | ❌ | Ein Teaser für alle, keine Zielgruppen-Varianten |
| O3 | Admin-Dashboard (Nuxt 4 SSR, bevorzugt PrimeVue) | ✅ | `apps/admin/app/pages/{index,jobs,settings}.vue`; ohne PrimeVue (nur „bevorzugt“) |
| O4 | Analytics: Webhooks und/oder Client-Events | ⚠️ | Client-Events + `POST /api/analytics/events` `routes/analytics.ts:12`; keine konfigurierbaren Webhooks |
| O5 | Audio Content | ⚠️ | „Vorlesen“ im Reader per Browser-Web-Speech `apps/feed/app/pages/index.vue:104` + Event `tts_play`; keine serverseitig generierten Audiodateien |

## Rechnung (2026-09-24, nach S2)

| Block | ✅ | ⚠️ | ❌ | Punkte |
|-------|----|----|----|--------|
| A (8) | 8 | 0 | 0 | 8 |
| B (5) | 5 | 0 | 0 | 5 |
| C (5) | 5 | 0 | 0 | 5 |
| D (6) | 5 | 1 | 0 | 5,5 |
| **Pflicht (24)** | 23 | 1 | 0 | **23,5** |

23,5 / 24 = **97,9 %** · Optional: 2 ✅ + 2 ⚠️ = 3 / 5

## Funktionstest (2026-09-23)

Laufzeit-Prüfung, nicht im Prozentwert. Umgebung: Postgres/Redis healthy, api/admin/feed laufen, **Ollama nicht installiert**, LocalAI aus.

| Bereich | Ergebnis | Befund |
|---------|----------|--------|
| Checks | ✅ | lint 0 Fehler/10 Warnungen, typecheck ok (nur Volar-Plugin-Warnung `vue-router/volar/sfc-route-blocks`), 25/25 Tests, build ok |
| API Lesen | ✅ | `/api/feed` (+Kategorie/limit), `/articles`, `/tags`, `/jobs`, `/settings`, `/analytics` → 200; unbekannte ID → 404; ohne Key → 401 (Feed/Engagement bewusst öffentlich, `server.ts:39`) |
| API CRUD | ✅ | Artikel anlegen/ändern/löschen, Like/Unlike/Share, Kommentare, Analytics-Event, Job anlegen; Löschen kaskadiert Kommentare/Events/Jobs |
| KI-Generierung | ❌ | Ollama fehlt → `summarizeArticle` fällt still auf Heuristik zurück (`summarizer.ts:98`), Worker speichert trotzdem „completed / Text-Teaser generiert“ (`queue/index.ts:53`), `source: 'fallback'` wird ignoriert. Sichtbar: Teaser = Titel + Textanfang (Artikel 81). **Update 2026-09-23:** Fallback wird jetzt im Job-Ergebnis („Fallback ohne KI“) und als Versionsquelle `fallback` ausgewiesen `queue/index.ts:198` |
| Modellliste | ⚠️ | `/api/settings/models` liefert bei nicht erreichbarem Ollama hartcodierte Defaults (`settings.ts:51`), Admin meldet „erfolgreich aktualisiert“ |
| Bildgenerierung | ❌ | LocalAI aus / amd64-only (bekannt) |
| Feed (375×812) | ✅ | Rendering, Kategorie-Filter + Aktiv-Hervorhebung, Subtags, Like/Unlike, Kommentar-Sheet, Reader mit KI-Kernpunkten, Vorlesen-Button; keine Console-Errors |
| Feed-A11y | ✅ | Kommentar-Sheet schließt per Escape `ShortformNewsFeed.vue:534`, `role=dialog` (2026-09-24) |
| Admin | ✅ | Dashboard, Job-Queue, Einstellungen laden, keine Console-Errors. **Update 2026-09-23:** Bildupload lief auf nicht existierende Route (404) und Bild-Löschen wurde nicht gespeichert – behoben in `a1b6189`, Drawer-Layout in `27ef850` |
| Sicherheit | ⚠️ | Fallback-API-Key `diplomarbeit-secret-key` hartcodiert, wenn `API_KEY` fehlt (`server.ts:51`) |

## Verlauf

| Datum | Commit | Pflicht erfüllt | Prozent | Anmerkung |
|-------|--------|-----------------|---------|-----------|
| 2026-09-22 | `c007d94` | 19 / 24 | 79,2 % | Erster Check; lint/typecheck/test grün |
| 2026-09-23 | `c007d94` | 19 / 24 | 79,2 % | Code unverändert; O5 korrigiert (⚠️); Funktionstest: Ollama fehlt, KI läuft nur im stillen Fallback |
| 2026-09-23 | `c007d94` | 19 / 24 | 79,2 % | 2. Check: kein Code-Diff seit letztem Check, Belege stichprobenartig verifiziert; Ollama weiterhin nicht installiert |
| 2026-09-23 | `e4fb8d2` | 19,5 / 24 | 81,3 % | D1 ✅: temperature/seed konfigurierbar und an Ollama übergeben |
| 2026-09-23 | `1f4b470` | 21 / 24 | 87,5 % | D2 ✅ Neugenerierung bei Anlage/Änderung serverseitig; D3 ✅ Versions-Tabelle + Restore + Admin-Ansicht |
| 2026-09-23 | `0e76b8e` | 22 / 24 | 91,7 % | D5 ✅ Feed-Cache + ETag/304; D6 ✅ OpenAPI-Spec + Architektur-Doku |
| 2026-09-24 | `0e76b8e` | 22 / 24 | 91,7 % | Kein Code-Diff seit D5/D6; alle Datei:Zeile-Belege geprüft, 8 verrutschte Zeilen korrigiert (F2, G1, G2, E3, T5, D1, O1) |
| 2026-09-24 | `64c486e` | 23 / 24 | 95,8 % | E1 ✅ (zu großzügig: nur Karten waren im Package) Einbindung in frischem Nuxt-4-Host getestet, 4 Package-Fehler behoben; S5 ✅ README komplett |
| 2026-09-24 | `d62bc0b` | 23 / 24 | 95,8 % | E1 jetzt belastbar: kompletter Feed `ShortformNewsFeed` im Package, `examples/nuxt-host` = gleiche Ansicht wie 3002; Escape-Fix, Unlike-Boost-Fix |
| 2026-09-24 | `d62bc0b` | 23 / 24 | 95,8 % | Übergabe-Check für David: kein Code-Diff, offene Belege (S2, D4, O2, O4, O5, Sicherheit) erneut verifiziert; lint/typecheck/25 Tests grün; Ollama weiterhin nicht installiert |
| 2026-09-24 | `ea4ac77` | 23,5 / 24 | 97,9 % | S2 ✅ Pagination, gefenstertes Rendering (Bilder nur nahe Karten), Polling über geladenen Bereich; im Browser geprüft; lint/typecheck/27 Tests/build grün |

## Übergabe an David (2026-09-24)

Stand `d62bc0b`. Nach dem Pull einmal `pnpm --filter @wb-news/api run db:push` (Tabelle `generation_versions`; ohne `--force`, Vorschau lesen).
Nach Änderungen im Package: `pnpm --filter @wb-news/shortform-news run build` und den Feed-Dev-Server neu starten.

Alle Punkte hier sind Backend (Davids Teil); S2 (Frontend, Stefan) ist erledigt.

| Prio | ID | Aufgabe | Wo | Fertig, wenn |
|------|----|---------|----|--------------|
| 1 | D4 | Quell-Adapter/Import-Schnittstelle (z. B. RSS oder JSON-Mapping) auf `POST /api/articles` aufsetzen; Schema-Default-Autor `ORF.at Redaktion` entfernen (Default leer/konfigurierbar) | `apps/api/src/routes/articles.ts`, neuer `apps/api/src/services/…`, `apps/api/src/db/schema.ts:11`, `openapi.yaml`, `docs/architektur.md` | Zwei unterschiedliche Quellen importieren ohne Codeänderung am Kern; Doku + OpenAPI ergänzt → Pflicht 24/24 |
| 2 | – | Ollama installieren (`brew install ollama`, `ollama pull qwen2.5:3b-instruct`) und D1 mit echtem Modell prüfen: gleicher Artikel + gleiche Settings → gleicher Teaser | `apps/api/src/services/summarizer.ts:30` | Zwei Generierungen, identischer Output, Versionsquelle `ai` statt `fallback` |
| 3 | – | Sicherheit: Fallback-Key entfernen, API beim Start ohne `API_KEY` abbrechen | `apps/api/src/server.ts:51` | Start ohne `API_KEY` schlägt mit klarer Meldung fehl |
| 4 | – | `/api/settings/models` meldet nicht erreichbares Ollama als Fehler statt hartcodierter Defaults | `apps/api/src/routes/settings.ts:51` | Admin zeigt Fehlermeldung, wenn Ollama aus ist |
| 5 | O4 | Optional: konfigurierbare Webhooks für Analytics-Events | `apps/api/src/routes/analytics.ts:12` | Webhook-URL im Admin setzbar, Event kommt an |
| 6 | O5/O2 | Optional: serverseitige Audiodateien; Teaser-Varianten je Zielgruppe | – | nur falls Zeit |

Offen mit Stefan zu klären: Bildgenerierung (LocalAI nur amd64, Alternativen Pollinations/kuratierte Fotos).
