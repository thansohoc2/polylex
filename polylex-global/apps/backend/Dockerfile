FROM node:23-bookworm-slim AS builder

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-ui/package*.json ./packages/shared-ui/

RUN npm ci --workspaces --include-workspace-root

COPY . .

RUN npm run build --workspace=packages/shared-types \
  && npx prisma generate --schema=apps/backend/prisma/schema.prisma \
  && npm run build --workspace=apps/backend

FROM node:23-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PATH=/app/node_modules/.bin:$PATH

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/package*.json ./apps/backend/
COPY --from=builder /app/apps/backend/node_modules ./apps/backend/node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/packages/shared-types ./packages/shared-types

WORKDIR /app/apps/backend
EXPOSE 8000

CMD ["node", "dist/main.js"]
