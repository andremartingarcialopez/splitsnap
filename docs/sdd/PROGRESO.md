# Progreso de implementación

Registro **ligero** de avance del **SplitSnap**. El checklist canónico vive en **specs/001-splitsnap/tasks.md** (espejo: `docs/sdd/tasks.md`).

Marca `[x]` aquí solo como atajo rápido; al cerrar ítems, sincroniza con el archivo canónico de tasks.

## Referencias

| Documento | Primario (spec-kit) | Espejo (gobernanza) |
|-----------|---------------------|---------------------|
| Constitución (MDD) | `.specify/memory/constitution.md` | `docs/sdd/mdd.md` |
| Investigación / Paso 0 (si existe) | `specs/001-splitsnap/research.md` | `docs/sdd/research.md` |
| Spec | `specs/001-splitsnap/spec.md` | `docs/sdd/spec.md` |
| Arquitectura (si existe) | `specs/001-splitsnap/architecture.md` | `docs/sdd/architecture.md` |
| Casos de uso (si existe) | `specs/001-splitsnap/use-cases.md` | `docs/sdd/use-cases.md` |
| Historias de usuario (si existe) | `specs/001-splitsnap/user-stories.md` | `docs/sdd/user-stories.md` |
| Blueprint / Plan | `specs/001-splitsnap/plan.md` | `docs/sdd/blueprint.md` |
| Design System (si existe) | `specs/001-splitsnap/design-system.md` | `docs/sdd/ux-ui-guide.md` |
| Pantallas (UI MCP) (si existe) | `specs/001-splitsnap/pantallas.md` | `docs/sdd/pantallas.md` |
| UI project (MCP JSON) (si existe) | `specs/001-splitsnap/ui-project.json` | `docs/sdd/ui-project.json` |
| Contratos API (si existe) | `specs/001-splitsnap/contracts/api-contracts.md` | `docs/sdd/api-contracts.md` |
| Flujos lógicos (si existe) | `specs/001-splitsnap/logic-flows.md` | `docs/sdd/logic-flows.md` |
| Tasks | `specs/001-splitsnap/tasks.md` | `docs/sdd/tasks.md` |
| Infra (si existe) | `specs/001-splitsnap/infra.md` | `docs/sdd/infra.md` |
| Modelo de datos (MDD §3) (si existe) | `specs/001-splitsnap/data-model.md` | `docs/sdd/data-model.md` |
| Quickstart (smoke tests) (si existe) | `specs/001-splitsnap/quickstart.md` | `specs/001-splitsnap/quickstart.md` |
| ADRs (si existe) | `docs/sdd/decisions/*.md` | `docs/sdd/decisions/*.md` |

## Resolución de conflictos SDD

Decisiones acordadas al alinear gobernanza con el MDD. **Prioriza siempre el MDD** ante nuevas contradicciones.

| Tema | Decisión |
|------|----------|
| **MySQL vs PostgreSQL** | confirma el motor en MDD §3 antes de migraciones o schemas. |

## Checklist rápido (primeras tareas abiertas)

- [x] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
- [x] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
- [x] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
- [x] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
- [x] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)
- [x] [P] Implementar endpoint DELETE /api/v1/groups/{id} — eliminar grupo (cascade a GroupParticipant)

### Sesión 0 (2026-07-08)

- Gobernanza instalada en `.cursor/` vía `scripts/install-agent-governance.sh`.
- Scaffold API monorepo según MDD §2: Express.js + TypeScript + Prisma + MySQL (no NestJS).
- US-001 backend Groups completo (migración + CRUD `/api/v1/groups`).
- Gates: typecheck/lint OK; unit tests Zod 6/6 OK.
- Smoke DB pendiente: Docker Compose no disponible en el entorno (`docker compose` / `docker-compose` ausentes).

### Sesión 1 (2026-07-08) — US-001 UI + US-002 completo

- Frontend React 18 + Vite + Tailwind (`apps/web`) con design tokens del UX guide.
- US-001 UI: `GroupsPage` (loading/empty/error) + `GroupForm` modal crear/editar.
- US-002 backend: `Participant` + `GroupParticipant` en schema; CRUD participants + `GET /participants?q=`.
- US-002 UI: `ParticipantsPage` con búsqueda + `ParticipantForm` (name y/o photoUrl).
- Gates: API tests 12/12; web typecheck + production build OK.
- Rutas UI: `/groups`, `/participants` (+ aliases `/gestion-de-group`, `/gestion-de-participant`).
- Arranque: `npm run dev:api` + `npm run dev:web` (proxy Vite → :3000).

### Sesión 2 (2026-07-08) — US-003 Pipeline OCR + IA

- Schema Ticket ampliado (subtotal/tax/discount/total/tipMode/…) + modelo `Product`; migración `20260708010000_ticket_product_pipeline`.
- Puertos `OcrPort` / `TicketParserPort`; adapters OCR.Space + Gemini 2.5 Flash con Circuit Breaker (3/30s→OPEN 60s) y backoff 1/2/4s.
- Mock pipeline (`PIPELINE_MOCK=true` o sin API keys) para desarrollo local.
- Endpoints: `POST /ocr`, `POST /ai/parse-ticket`, `POST /tickets/process`, `GET /tickets/:id`, `POST /tickets/manual`, CRUD productos del ticket.
- AiAuditor (`ai.validator.ts`) + rate limit 10/min en rutas de pipeline; multer JPG/PNG ≤5 MB; storage local `/uploads`.
- UI: `NewTicketPage` (preview + Procesar + fallback manual) y `TicketDetailPage` (editar/añadir/eliminar productos).
- Gates: API tests 19/19; web typecheck + build OK.
- Home UI → `/tickets/new`.

### Sesión 3 (2026-07-08) — US-004 CRUD tickets completo

- Schema MDD §3 completo: `TicketParticipant`, `ProductAssignment` (+ FKs); migración `20260708020000_ticket_participant_assignment`.
- API: `GET/POST /tickets`, `DELETE /tickets/:id`, detalle enriquecido (productos+asignaciones, participantes, grupos).
- Extra (anticipando US-006): `POST/DELETE …/participants`, `POST …/groups` (importa participantes del grupo).
- UI: `TicketsPage` listado (loading/empty/error) + detalle con participantes/grupos/productos/eliminar.
- Gates: API tests 23/23; web typecheck + build OK.
- Home UI → `/tickets`.

### Sesión 4 (2026-07-08) — US-005 productos y asignaciones

- API canónica MDD: `POST/PUT/DELETE /products`, `GET /tickets/:id/assignments`, `POST /assignments`, `POST /assignments/shared`, `DELETE /assignments/:id`.
- Reglas: participante debe estar en el ticket; compartido ≥2; shareRatio default 1 (equitativo); shared reemplaza asignaciones previas del producto.
- UI: `AssignmentPanel` (individual/compartido, ratios opcionales) integrado por producto en `TicketDetailPage`.
- Gates: API tests 30/30; web typecheck + build OK.

### Sesión 5 (2026-07-08) — US-006 participantes en ticket + US-007 cálculo

- US-006: preview `GET …/participants/:id/remove-preview`; DELETE devuelve `orphanedProducts`; UI crear participante inline + confirmación con aviso de huérfanos.
- US-007: `CalculationService` (MDD §5.1 Template Method); `GET/POST …/summary|calculate`; `PUT …/tip` y `PUT …/participants/:id/tip` (copia % global al pasar a INDIVIDUAL).
- UI: `TipConfig.tsx`, `SummaryPanel.tsx` (tabla por participante, alertas canFinalize/varianza).
- Gates: API tests 33/33; web typecheck + build OK.

### Sesión 6 (2026-07-08) — US-008 historial de tickets

- Schema: campo `finalizedAt` en `Ticket`; migración `20260708030000_ticket_finalized_at`.
- `POST /tickets/:id/finalize` valida `canFinalize` (productos huérfanos → `ORPHAN_PRODUCT`) y marca `finalizedAt`.
- API historial: `GET /history` (lista con `grandTotal` calculado), `GET /history/:id` (detalle + summary, solo lectura).
- UI: `HistoryPage`, `HistoryDetailPage`, nav Historial; botón **Finalizar ticket** en `SummaryPanel`.
- Gates: API tests 33/33; web typecheck + build OK.

### Sesión 7 (2026-07-08) — US-009 health check y monitoreo

- `HealthService`: ping paralelo BD (`SELECT 1`), OCR.Space (POST reachability) y Gemini (GET modelo), timeout 5s cada uno.
- `GET /api/v1/health` → `healthy` | `degraded` | `unhealthy` (503 si BD caída); incluye `latencyMs` por servicio y `pipelineMock`.
- `errorLogger.ts`: `redactSecrets` + `logAdapterError` integrado en adapters OCR/Gemini y `errorHandler` para códigos externos.
- Gates: API tests 36/36; typecheck API OK.

### Sesión 8 (2026-07-08) — Infraestructura Docker + CI

- `apps/api/Dockerfile` (Node 20, multistage, Prisma migrate on start, volumen `/data/uploads`).
- `apps/web/Dockerfile` + `nginx.conf` (SPA + proxy `/api` y `/uploads` → `api:3000`).
- `docker-compose.yml` completo: mysql + api + web, healthchecks, secrets OCR/Gemini, volúmenes persistentes.
- `.env.example` raíz, `scripts/prepare-docker-secrets.sh`, `.dockerignore`, `.github/workflows/ci.yml`.
- Gates: tests/typecheck/build locales OK; imágenes Docker validables con `docker compose build`.

### Sesión 9 (2026-07-08) — Seguridad + frontend transversal

- Seguridad: `middleware/security.ts` (Helmet CSP/HSTS), `config/cors.ts`, `apiRateLimit` + `pipelineRateLimit`, `validators/aiResponse.validator.ts`.
- Frontend: `api/client.ts` (Axios + interceptor), `ErrorState`, `LoadingState`, `TicketList`, hooks (`useTicket`, `useTickets`, `useGroups`, `useParticipants`, `useHistory`), `styles/globals.css` touch targets.
- Gates: API tests 38/38; web typecheck + build OK.
