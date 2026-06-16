# PolyLex Global

A production-ready, multilingual vocabulary learning SaaS platform built as a monorepo.

## Architecture

```
polylex-global/
├── apps/
│   ├── backend/          # NestJS API (TypeScript + Prisma + PostgreSQL + Redis)
│   └── frontend/         # React 19 + Vite + TailwindCSS 4 + Zustand
│   └── zalo-miniapp/     # Zalo Mini App (React + Vite + zmp-sdk/zmp-ui)
├── packages/
│   └── shared-types/     # TypeScript types shared between FE and BE
├── docker-compose.yml    # PostgreSQL 16 + Redis 7
└── package.json          # npm workspaces root
```

## Tech Stack

| Layer       | Tech                                        |
|------------|---------------------------------------------|
| Backend    | NestJS 10, TypeScript, Prisma, PostgreSQL 16 |
| Frontend   | React 19, Vite, TailwindCSS 4, Zustand      |
| Zalo Mini App | React 19, Vite, zmp-sdk, zmp-ui          |
| Cache      | Redis 7                                      |
| Auth       | JWT (access 15m + refresh 7d), bcryptjs     |
| Algorithm  | ACRE (Adaptive Cognitive Reinforcement Engine) |
| AI         | OpenAI (feature-flagged via `OPENAI_ENABLED`) |
| TTS        | Browser Web Speech API (zero cost)          |

## Getting Started

### Prerequisites
- Node.js ≥ 20
- npm ≥ 10
- Docker + Docker Compose

### 1. Start infrastructure
```bash
npm run docker:up
# PostgreSQL on :5432, Redis on :6379
```

### 2. Configure backend environment
```bash
cd apps/backend
cp .env.example .env
# Edit .env and set strong JWT secrets
```

### 3. Install dependencies
```bash
# From repo root
npm install
```

### 4. Run Prisma migrations & seed
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
# Seeds 35 languages
```

### 5. Start development servers
```bash
# From repo root — starts both backend (:3000) and frontend (:5173)
npm run dev

# Or individually:
npm run dev:backend
npm run dev:frontend
npm run dev:zalo
```

### 6. Open the app
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/v1
- Swagger docs: http://localhost:3000/api/docs

Zalo Mini App (dev):
- `npm run dev:zalo`
- Build artifact: `npm run build:zalo`
- Deploy via Zalo CLI: `npm run deploy:zalo`

## ACRE Algorithm

ACRE (Adaptive Cognitive Reinforcement Engine) is a pure function spaced-repetition algorithm that improves on Anki's SM-2:

- **Ebbinghaus forgetting curve** — exponential decay memory model
- **Response-time weighting** — fast recall = stronger memory signal
- **Confidence-level weighting** — explicit metacognition
- **Leech detection** — threshold = 8 consecutive failures
- **Adaptive mode recommendation** — escalates from flashcard → sentence as memory strengthens

Location: `apps/backend/src/modules/review/acre/acre.engine.ts`

Run ACRE unit tests:
```bash
cd apps/backend
npm test
```

## Multi-tenancy

Single-schema multi-tenancy via `organization_id`:
- `organization_id IS NULL` = global public vocabulary
- `organization_id = <uuid>` = org-scoped vocabulary

Query pattern: `WHERE organizationId = orgId OR organizationId IS NULL`

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/languages` | List all languages |
| GET | `/api/v1/users/me` | Current user profile |
| GET | `/api/v1/vocabulary` | Search vocabulary |
| POST | `/api/v1/vocabulary/:id/add-to-my-list` | Add word to learning list |
| GET | `/api/v1/review/queue` | Today's due cards (timezone-aware) |
| POST | `/api/v1/review/submit` | Submit review result (runs ACRE) |
| GET | `/api/v1/roadmap/:lang` | CEFR roadmap recommendations |
| GET | `/api/v1/analytics/heatmap` | Activity heatmap data |
| GET | `/api/v1/analytics/retention` | 30-day retention rate |
| GET | `/api/v1/gamification/stats` | Streak, XP, badges |

## Environment Variables

See `apps/backend/.env.example` for the full list.

Key variables:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string
- `JWT_ACCESS_SECRET` — Min 32 chars
- `JWT_REFRESH_SECRET` — Min 32 chars
- `OPENAI_ENABLED=false` — Set to `true` to enable AI features
- `OPENAI_API_KEY` — Required if `OPENAI_ENABLED=true`

## Full App Auto Deploy (Self-hosted)

This repository supports full-stack deployment (postgres + redis + backend + frontend)
through GitHub Actions workflow `.github/workflows/main.yml`.

### Prerequisites
- Self-hosted GitHub Actions runner with Docker Engine + Docker Compose
- Project checked out under workspace root so `polylex-global/` is available
- Deploy environment file on server: `polylex-global/.env.deploy`

### 1) Prepare deploy env file on server
```bash
cd polylex-global
cp .env.deploy.example .env.deploy
# then update secrets and ports for your server
```

### 2) Push to main to deploy
- Workflow is triggered on `push` to `main`
- Deploy stages:
	1. Bring up infra (`postgres`, `redis`)
	2. Wait infra health checks
	3. Run production migration: `npm run migrate:deploy`
	4. Build and start backend + frontend
	5. Wait application health checks
	6. Run smoke checks on frontend and `/api/v1/health`

### 3) Production migration strategy
- Production deploy uses `prisma migrate deploy`
- Do **not** use `prisma migrate dev` in production workflow
- Add new migration files in repo before pushing to `main`
