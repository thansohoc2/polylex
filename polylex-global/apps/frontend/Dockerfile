FROM node:23-alpine AS builder

WORKDIR /app
ENV PATH=/app/node_modules/.bin:$PATH

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/shared-ui/package*.json ./packages/shared-ui/

# This image only builds the Web app. Native Capacitor postinstall patches are
# applied by mobile workflows and are intentionally skipped here.
RUN npm ci --workspaces --include-workspace-root --ignore-scripts

COPY . .

# apps/frontend/.env.production is already in the build context (committed to git)
# Vite automatically loads it when building in production mode
RUN npm run build --workspace=packages/shared-types \
	&& npm run build --workspace=apps/frontend

FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
