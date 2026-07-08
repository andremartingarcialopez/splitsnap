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

- [ ] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
- [ ] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
- [ ] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
- [ ] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
- [ ] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)
