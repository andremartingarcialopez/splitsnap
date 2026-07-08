# syntax=docker/dockerfile:1
# SplitSnap API — Node 20 LTS, Express + Prisma (MDD §7.1)
# Build context: repositorio raíz (docker compose build api)

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace=@splitsnap/api --include-workspace-root

FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate && npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app/backend

ENV NODE_ENV=production \
    PORT=3000 \
    STORAGE_DIR=/data/uploads

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system app \
  && useradd --system --gid app --home /app app \
  && mkdir -p /data/uploads \
  && chown -R app:app /app /data

COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/package.json ./
COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER app
EXPOSE 3000
# Persistencia: montar /data/uploads vía docker-compose.yml o Railway Volumes (no usar VOLUME aquí).

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["migrate-and-start"]
