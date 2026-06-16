# PolyLex Zalo Mini App

Mini App channel for PolyLex running in Zalo environment.

## Prerequisites
- Node.js >= 20
- npm >= 10
- `zmp-cli` installed globally for deploy (`npm i -g zmp-cli`)
- Backend API reachable via `VITE_API_BASE_URL`

## Environment
Create `.env` in this folder:

```bash
VITE_API_BASE_URL=https://ebms.store/api/v1
```

For local development, create `.env.development`:

```bash
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=https://ebms.store
```

Dev server proxies `/api/*` to `VITE_API_PROXY_TARGET` (default: `https://ebms.store`).

To switch back to local backend, set:

```bash
VITE_API_PROXY_TARGET=http://localhost:8000
```

## Development

```bash
npm run dev --workspace=apps/zalo-miniapp
```

## Build

```bash
npm run build --workspace=apps/zalo-miniapp
```

## Deploy

```bash
npm run deploy --workspace=apps/zalo-miniapp
```

## Pre-release Re-check Checklist
- Verify Zalo login success and JWT exchange.
- Verify existing backend social providers still work.
- Verify vocabulary list loads with valid token.
- Verify guest mode still allows entry without Zalo login.
- Verify backend build and test commands pass.
