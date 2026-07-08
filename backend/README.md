# SplitSnap API

Backend MVP según **MDD §2**: Express.js + TypeScript + Prisma + MySQL 8.

## Arranque

1. Instala Docker Desktop (incluye `docker compose`) o MySQL 8 local.
2. Desde la raíz del monorepo:

```bash
docker compose up -d mysql   # si tienes Compose v2
npm install
npm run db:generate
cd apps/api && npx prisma migrate deploy && cd ../..
npm run dev:api
```

API en `http://localhost:3000` — base `/api/v1`.

## Endpoints Groups (US-001)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/groups` | Listar (createdAt DESC) |
| POST | `/api/v1/groups` | Crear (`name` max 100) |
| GET | `/api/v1/groups/:id` | Detalle + participantes |
| PUT | `/api/v1/groups/:id` | Actualizar name/description |
| DELETE | `/api/v1/groups/:id` | Eliminar (cascade GP) |

Smoke: `specs/001-splitsnap/quickstart.md`.
