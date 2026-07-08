# Infraestructura y Despliegue — SplitSnap

## 1. Dockerfile multietapa

### 1.1 API (Express + TypeScript)

# Build stage
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/api/package*.json ./
RUN npm ci --only=production
COPY apps/api/ .
RUN npm run build  # compila TypeScript a dist/

# Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 3000
CMD ["node", "dist/main.js"]

### 1.2 Web (React + Vite + Nginx)

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY apps/web/package*.json ./
RUN npm ci
COPY apps/web/ .
RUN npm run build

# Runtime stage
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

```
## 2. docker-compose.yml

```yaml
version: "3.8"
services:
api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: splitsnap-api
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV=production
      PORT=3000
      DATABASE_URL=${DATABASE_URL}
      OCR_SPACE_API_KEY=${OCR_SPACE_API_KEY}
      GEMINI_API_KEY=${GEMINI_API_KEY}
      CORS_ORIGIN=${CORS_ORIGIN}
      MAX_UPLOAD_MB=${MAX_UPLOAD_MB:-5}
      CALC_TOTAL_VARIANCE_THRESHOLD=${CALC_TOTAL_VARIANCE_THRESHOLD:-0.05}
    volumes:
      - images_data:/app/uploads
    depends_on:
        condition: service_healthy
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: splitsnap-web
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
  api:
    image: mysql:8.0
    container_name: splitsnap-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE=splitsnap
      MYSQL_USER=splitsnap
      MYSQL_PASSWORD=${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    # No se exponen puertos al exterior; comunicación interna por nombre de contenedor
    volumes:
    ### Notas sobre puertos y DNS interno
```

## 3. Variables de entorno (.env.example)

```env
# Base de datos (MySQL)
DATABASE_URL=mysql://splitsnap:${MYSQL_PASSWORD}@splitsnap-mysql:3306/splitsnap
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_PASSWORD=your_db_password

# API
NODE_ENV=production
PORT=3000

# Integraciones externas
OCR_SPACE_API_KEY=your_ocr_space_key
GEMINI_API_KEY=your_gemini_key

# Configuración web
CORS_ORIGIN=http://localhost:80

# Límites y umbrales
MAX_UPLOAD_MB=5
CALC_TOTAL_VARIANCE_THRESHOLD=0.05
```

## 4. Volúmenes y persistencia

| Volumen       | Montaje          | Propósito                                                        |
| :------------ | :--------------- | :--------------------------------------------------------------- |
| `mysql_data`  | `/var/lib/mysql` | Datos persistentes de MySQL (no se pierden al reiniciar)         |
| `images_data` | `/app/uploads`   | Imágenes de tickets subidas (para que persistan entre reinicios) |
Ambos volúmenes se declaran en el `docker-compose.yml` y se montan automáticamente al levantar los contenedores. No se requiere configuración adicional.

## Cumplimiento con el MDD

- **Servicios**: `web`, `api`, `mysql` — exactamente los definidos en §7.1 (Nginx + Vite build, Node 20 + Express, MySQL 8).
- **Variables de entorno**: cubre todas las requeridas en §7.2: `DATABASE_URL`, `PORT`, `NODE_ENV`, `OCR_SPACE_API_KEY`, `GEMINI_API_KEY`, `CORS_ORIGIN`, `MAX_UPLOAD_MB`, `CALC_TOTAL_VARIANCE_THRESHOLD`.
- **Volúmenes**: `mysql_data` para BD, `images_data` para almacenamiento local de imágenes (§2.1: "Almacenamiento imágenes: Local / referencia URL en BD (MVP)").
- **Stack excluido**: no se incluyen NestJS, PostgreSQL, Redis, microservicios, colas ni otros componentes fuera del alcance MVP.
- **Comunicación interna**: MySQL no expone puertos; API usa nombre de contenedor (`splitsnap-mysql:3306`) según §2.4 DNS interno.

---

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                                             |
| :------ | :--------- | :--------------------------------------------------------------------------------- |
| 1.0     | Abril 2026 | Creación inicial del documento de Infraestructura y Despliegue para SplitSnap MVP. |