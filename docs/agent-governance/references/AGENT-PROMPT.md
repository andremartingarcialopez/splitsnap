# Agent prompt — contexto del proyecto

Referencia **interna** generada por TheForge. Úsala tras la sesión 0 (`PROMPT-INICIAL.md`) o con `/implementar-tarea`.

## Documentos del proyecto

- `docs/sdd/mdd.md`
- `docs/sdd/blueprint.md`
- `docs/sdd/spec.md`
- `docs/sdd/architecture.md`
- `docs/sdd/tasks.md`
- `docs/sdd/use-cases.md`
- `docs/sdd/user-stories.md`
- `docs/sdd/api-contracts.md`
- `docs/sdd/logic-flows.md`
- `docs/sdd/ux-ui-guide.md`
- `docs/sdd/pantallas.md`
- `docs/sdd/infra.md`
- `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`
- `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`
- `AGENTS.md`

## Stack detectado

- **Backend:** NestJS
- **Frontend:** y
- **Mobile:** React Native
- **Infra / deploy:** Docker

## Módulos / rutas (Blueprint)

- `apps/web`

## Capas de arquitectura

- 1. Contexto y alcance
- 2. Vista de módulos / capas
- 2.1 Backend (Express.js + TypeScript)
- 2.2 Frontend (React 18 + Vite + TypeScript + Tailwind CSS)
- 2.3 Capas compartidas
- 3. Modelo y persistencia
- 3.1 Esquema SQL (MySQL 8, Prisma ORM)
- 3.2 Diagrama entidad-relación
- 4. APIs y contratos
- 4.1 Endpoints REST

## Primeras tareas (desde Tasks)

- [ ] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
- [ ] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
- [ ] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
- [ ] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
- [ ] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)

## Resolución de conflictos SDD

Decisiones acordadas al alinear gobernanza con el MDD. **Prioriza siempre el MDD** ante nuevas contradicciones.

| Tema | Decisión |
|------|----------|
| **MySQL vs PostgreSQL** | confirma el motor en MDD §3 antes de migraciones o schemas. |

## Instrucciones para el agente

1. Si `.cursor/rules/` no existe, **Ejecuta en terminal** `chmod +x scripts/install-agent-governance.sh && ./scripts/install-agent-governance.sh` y verifica la instalación. No pidas al usuario salvo que falle.
2. Lee `AGENTS.md`, `IMPLEMENT.md`, `.specify/memory/constitution.md` y `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`.
3. Implementa siguiendo **Tasks** (canónico en spec-kit bajo `specs/…/tasks.md`, espejo `docs/sdd/tasks.md`), **Blueprint/plan** y el resto de entregables SDD del ZIP; actualiza `docs/sdd/PROGRESO.md` al cerrar ítems.
4. Respeta subflujos en `docs/agent-governance/references/workflows.md`.
