---
name: monorepo-packages
description: Paquetes del monorepo fuera del design system principal.
---

# Monorepo packages

## Cuándo cargar

- Cambios en `packages/*` que no sean el DS UI.
- Publicación explícita de un paquete nombrado.

## Checklist

- Scripts del paquete en su `package.json`.
- No publicar sin petición explícita del paquete.

## Hechos del proyecto (SplitSnap)

- **Backend:** NestJS
- **Frontend:** y
- **Mobile:** React Native
- **Infra / deploy:** Docker

**Módulos Blueprint:**
- `frontend`

**Globs backend:**
- `backend/**`
- `backend/prisma/schema.prisma/**`
- `backend/Dockerfile/**`
- `backend/prisma/migrations/**`
- `backend/src/**`

**Globs frontend:**
- `frontend/**`
- `frontend/Dockerfile/**`
- `frontend/nginx.conf/**`
- `frontend/src/App.tsx/**`

**Capas:**
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

**Tasks (extracto):**
- [ ] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
- [ ] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
- [ ] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
- [ ] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
- [ ] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)

**Docs SDD:**
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

## Resolución de conflictos SDD

Decisiones acordadas al alinear gobernanza con el MDD. **Prioriza siempre el MDD** ante nuevas contradicciones.

| Tema | Decisión |
|------|----------|
| **MySQL vs PostgreSQL** | confirma el motor en MDD §3 antes de migraciones o schemas. |
