# Smoke tests — US-001 Groups (checkpoint)

## Prerrequisitos

```bash
docker compose up -d mysql
npm install
npm run db:generate
cd apps/api && npx prisma migrate deploy && cd ../..
npm run dev:api
```

## Checks

1. Health:
   ```bash
   curl -s http://localhost:3000/api/v1/health
   ```
2. Crear grupo:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/groups \
     -H 'Content-Type: application/json' \
     -d '{"name":"Amigos","description":"Mesa habitual"}'
   ```
3. Listar (createdAt DESC):
   ```bash
   curl -s http://localhost:3000/api/v1/groups
   ```
4. Detalle con participantes:
   ```bash
   curl -s http://localhost:3000/api/v1/groups/{id}
   ```
## Smoke UI US-001 / US-002

Con API + MySQL arriba y `npm run dev:web`:

1. Abrir http://localhost:5173/groups → crear / editar / eliminar grupo.
2. Abrir http://localhost:5173/participants → crear con solo nombre, solo foto URL, o ambos.
3. Buscar por nombre en participantes y verificar filtro `?q=`.
4. Confirmar estados loading / empty / error (parar API para forzar error).

## Smoke US-003 Pipeline

Con `PIPELINE_MOCK=true` (default sin API keys):

1. `curl -s http://localhost:3000/api/v1/health` → `services.ocr`/`services.gemini` = `mock`, `status` = `healthy` o `degraded`.
2. Subir cualquier JPG/PNG:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/tickets/process \
     -F "image=@./ruta/ticket.jpg"
   ```
   Debe devolver Pizza House + 2 productos (mock MDD §4.A.2).
3. UI: http://localhost:5173/tickets/new → Procesar → detalle editable.
4. Probar ingreso manual desde el mismo flujo si el pipeline “falla”.
5. Producción: set `OCR_SPACE_API_KEY`, `GEMINI_API_KEY` y `PIPELINE_MOCK=false`.

## Smoke US-004 Tickets CRUD

1. `curl -s http://localhost:3000/api/v1/tickets` → listado ordenado por fecha.
2. Crear sin imagen:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/tickets \
     -H 'Content-Type: application/json' \
     -d '{"title":"Cena","restaurantName":"Demo","products":[{"name":"Tacos","unitPrice":80}]}'
   ```
3. UI: http://localhost:5173/tickets → ver / eliminar.
4. Detalle: añadir participante, vincular grupo, editar productos.

## Smoke US-005 Asignaciones

1. Con ticket + ≥2 participantes en el ticket:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/assignments \
     -H 'Content-Type: application/json' \
     -d '{"productId":"...","participantId":"..."}'
   ```
2. Compartido:
   ```bash
   curl -s -X POST http://localhost:3000/api/v1/assignments/shared \
     -H 'Content-Type: application/json' \
     -d '{"productId":"...","participantIds":["...","..."]}'
   ```
3. UI detalle ticket → panel Individual/Compartido por producto.

## Stack Docker (producción / demo local)

```bash
cp .env.example .env
bash scripts/prepare-docker-secrets.sh
# Opcional producción:
# echo -n "TU_OCR_KEY" > secrets/ocr_space_api_key
# echo -n "TU_GEMINI_KEY" > secrets/gemini_api_key

docker compose up -d --build
```

- Web: http://localhost (Nginx → SPA + proxy `/api` → `api:3000`)
- API directa: http://localhost:3000/api/v1/health
- Solo MySQL (dev): `docker compose up -d mysql`
