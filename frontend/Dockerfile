# syntax=docker/dockerfile:1
# SplitSnap Web — Vite build + Nginx (MDD §7.1)
# Build context: repositorio raíz (docker compose build web)

FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci --workspace=@splitsnap/web --include-workspace-root

COPY frontend ./frontend
WORKDIR /app/frontend

# En producción el navegador usa el proxy Nginx → api:3000
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

FROM nginx:1.27-alpine AS runner

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
