# WB Newsfeed - Short-Form AI News Ingestion & Distribution System

Technical documentation for the WB Newsfeed monorepo architecture, API endpoints, database schema, background worker pipeline, and local development setup.

---

## Monorepo Architecture

The repository is structured as a pnpm/npm workspace containing three decoupled packages:

```
wb-newsfeed/
├── apps/
│   ├── api/          Fastify REST API server, Drizzle ORM client & BullMQ background worker
│   ├── admin/        Nuxt 4 / Vue 3 Desktop CMS Admin Application (Port 3001)
│   └── mobile/       Nuxt 4 / Vue 3 Mobile TikTok-Style Snap Feed Application (Port 3002)
├── docker-compose.yml Postgres 16 & Redis 7 infrastructure definition
└── package.json      Monorepo scripts and dependencies
```

---

## System Requirements

- Node.js >= 20.0.0
- Docker & Docker Compose
- Ollama local LLM runtime (with `qwen2.5:3b-instruct` pulled)

---

## Infrastructure & Environment Configuration

### Services & Ports

| Component | Technology | Default Port | Description |
|---|---|---|---|
| Fastify API | Fastify / Node.js | 3005 | Core REST API service |
| Admin CMS | Nuxt 4 / Vue 3 | 3001 | Content management dashboard |
| Mobile Feed | Nuxt 4 / Vue 3 | 3002 | Full-screen vertical snap scroll application |
| PostgreSQL | Postgres 16 | 5433 | Primary relational data store |
| Redis | Redis 7 | 6379 | Job queue backend for BullMQ |
| Ollama | LLM Engine | 11434 | Local inference runtime |

### Environment Variables (`apps/api/.env`)

```env
PORT=3005
DATABASE_URL=postgres://wb_user:wb_password@localhost:5433/wb_newsfeed
REDIS_URL=redis://localhost:6379
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b-instruct
LOG_LEVEL=info
```

---

## Database Schema (Drizzle ORM / PostgreSQL)

### Tables

#### `articles`
- `id` (UUID, PK, default random)
- `externalId` (VARCHAR 255, optional)
- `title` (TEXT, NOT NULL)
- `content` (TEXT, NOT NULL)
- `author` (VARCHAR 255)
- `source` (VARCHAR 100, default 'manual')
- `url` (TEXT)
- `status` (VARCHAR 50, default 'Veröffentlicht') -- Enum: 'Veröffentlicht' | 'Entwurf'
- `publishedAt` (TIMESTAMP)
- `createdAt` (TIMESTAMP, default NOW)
- `updatedAt` (TIMESTAMP, default NOW)

#### `generationJobs`
- `id` (UUID, PK)
- `articleId` (UUID, FK -> `articles.id` ON DELETE CASCADE)
- `status` (VARCHAR 50, default 'pending') -- Enum: 'pending' | 'processing' | 'completed' | 'failed'
- `attempts` (INTEGER, default 0)
- `maxAttempts` (INTEGER, default 3)
- `error` (TEXT)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

#### `teasers`
- `id` (UUID, PK)
- `articleId` (UUID, FK -> `articles.id` ON DELETE CASCADE)
- `jobId` (UUID, FK -> `generationJobs.id` ON DELETE SET NULL)
- `headline` (TEXT, NOT NULL)
- `summary` (TEXT, NOT NULL)
- `keyTakeaways` (JSONB)
- `sentiment` (VARCHAR 50)
- `language` (VARCHAR 10, default 'de')
- `modelUsed` (VARCHAR 100)
- `createdAt` (TIMESTAMP)

#### `logs`
- `id` (UUID, PK)
- `jobId` (UUID, FK -> `generationJobs.id` ON DELETE CASCADE)
- `level` (VARCHAR 20)
- `message` (TEXT)
- `metadata` (JSONB)
- `createdAt` (TIMESTAMP)

---

## REST API Specification

### 1. Ingest Raw Article
- **Endpoint**: `POST /api/articles`
- **Request Body**:
  ```json
  {
    "title": "Article Title",
    "content": "Full text body...",
    "author": "ORF.at Redaktion",
    "source": "manual",
    "status": "Veröffentlicht"
  }
  ```
- **Response**: `201 Created` with ingested article object and queued job details.

### 2. Fetch Published Mobile Feed
- **Endpoint**: `GET /api/feed`
- **Query Logic**: Retrieves teasers inner-joined with articles where `articles.status = 'Veröffentlicht'`, ordered by creation date descending.
- **Response**:
  ```json
  {
    "count": 2,
    "feed": [
      {
        "teaserId": "uuid",
        "articleId": "uuid",
        "headline": "...",
        "summary": "...",
        "status": "Veröffentlicht"
      }
    ]
  }
  ```

### 3. Update Article Publishing Status
- **Endpoint**: `PATCH /api/articles/:id/status`
- **Request Body**:
  ```json
  {
    "status": "Entwurf"
  }
  ```
- **Response**: `200 OK` with updated article record.

### 4. Fetch All Ingested Articles
- **Endpoint**: `GET /api/articles`
- **Response**: List of all articles with current status and metadata.

### 5. Delete Article
- **Endpoint**: `DELETE /api/articles/:id`
- **Response**: `200 OK` confirmation message.

### 6. Queue Job Status Monitor
- **Endpoint**: `GET /api/jobs`
- **Response**: List of background worker jobs and execution statuses.

---

## Background Worker Architecture (BullMQ)

1. When an article is posted to `POST /api/articles`, a corresponding `generationJob` is inserted into PostgreSQL with status `pending`.
2. A job event `generate-teaser` is added to the BullMQ queue (`teaserQueue`) backed by Redis.
3. The background worker (`apps/api/src/worker.ts`) processes the job asynchronously:
   - Fetches article content.
   - Invokes Ollama API (`http://localhost:11434/api/generate`) with `qwen2.5:3b-instruct`.
   - Generates headline, summary teaser, key takeaways, and sentiment.
   - Inserts generated result into `teasers` table.
   - Updates `generationJobs.status` to `completed`.

---

## Getting Started & Local Setup

### 1. Start Infrastructure Containers
```bash
docker-compose up -d
```

### 2. Run Database Migration
```bash
cd apps/api
npx drizzle-kit push:pg
```

### 3. Start Fastify API Server
```bash
npm --prefix apps/api run dev
```

### 4. Start BullMQ Worker Process
```bash
npm --prefix apps/api run dev:worker
```

### 5. Start Frontend Applications
```bash
# Start Admin CMS (Port 3001)
npm --prefix apps/admin run dev

# Start Mobile TikTok Feed (Port 3002)
npm --prefix apps/mobile run dev
```

---

## Testing & Verification

Execute end-to-end status sync verification script:

```bash
npx tsx scratch/verify_screen_control.ts
```
