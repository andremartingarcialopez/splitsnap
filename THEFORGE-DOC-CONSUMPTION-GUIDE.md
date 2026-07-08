# Guía de consumo de documentos TheForge

Resumen para agentes que implementan desde entregables SDD incluidos en el handoff The Forge.

## Orden de lectura (primario spec-kit, espejo docs/sdd)

1. **`IMPLEMENT.md`** — bootstrap, instalación de gobernania y mapa de rutas.
2. **`.specify/memory/constitution.md`** — Constitución (MDD); espejo: `docs/sdd/mdd.md`.
3. **`specs/001-splitsnap/research.md`** — Paso 0 / investigación (si existe); espejo: `docs/sdd/research.md`.
4. **`specs/001-splitsnap/spec.md`** — Requisitos y criterios de aceptación; espejo: `docs/sdd/spec.md`.
5. **`specs/001-splitsnap/architecture.md`**, **`use-cases.md`**, **`user-stories.md`** — cuando existan.
6. **`specs/001-splitsnap/plan.md`** — Blueprint / plan técnico; espejo: `docs/sdd/blueprint.md`.
7. **`specs/001-splitsnap/design-system.md`** y **`pantallas.md`** — **antes de UI** (espejos `ux-ui-guide.md`, `pantallas.md`). Si existe **`pantallas.md`**, gana sobre heurísticas de Blueprint §8.
8. **`specs/001-splitsnap/contracts/api-contracts.md`** y **`specs/001-splitsnap/logic-flows.md`** — contratos y flujos (**vinculantes** si existen).
9. **`specs/001-splitsnap/tasks.md`** — Checklist de implementación; espejo: `docs/sdd/tasks.md`.
10. **`specs/001-splitsnap/infra.md`**, **`data-model.md`**, **`docs/sdd/decisions/*.md`**, **`quickstart.md`** — cuando existan.

### Mapeo de rutas

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

### Artefactos Workshop (cuando aplican)

Estos pasos del flujo The Forge **no siempre** van como archivos spec-kit dedicados; consúltalos en el ZIP o en Workshop antes de implementar:

| Artefacto | Ubicación | Notas |
|-----------|-------------|-------|
| BRD | The Forge (etapa) · contexto en `specs/001-splitsnap/research.md` | Obligatorio en proyectos NEW antes del MDD; no siempre hay archivo BRD dedicado en el ZIP. |
| AEM | The Forge (`aemContent`) | Análisis y Estudio de Mercado (Benchmark + Paso 0 + BRD); incluye dictamen de inversión digital. No siempre hay archivo dedicado en el ZIP. |
| Handoff Spec | `handoff-spec.md` (raíz, integración LEGACY) | Contrato NEW ↔ LEGACY entre equipos; no es espejo `docs/sdd/`. |
| Integración | Panel Workshop + trazabilidad de etapa | Coordinación entre flujos NEW y LEGACY en The Forge. |
| Gobernanza IA | `AGENTS.md`, `docs/agent-governance/**`, `IMPLEMENT.md` | Rules, skills, commands y onboarding para agentes implementadores. |

**El layout spec-kit es canónico.** Los archivos bajo `docs/sdd/` son espejo para rules/skills; ante conflicto de contenido, gana el primario.

## Prioridad ante conflictos

**El MDD manda.** Si un entregable contradice otro, sigue MDD §2–§6 y documenta la resolución en `docs/sdd/PROGRESO.md`.

## Gates antes de cerrar tareas

- Lint, typecheck y tests del paquete tocado.
- Contratos API alineados a `specs/001-splitsnap/contracts/` o `docs/sdd/api-contracts.md` cuando exista.
- Actualizar `docs/sdd/PROGRESO.md` y **`specs/001-splitsnap/tasks.md`** al completar ítems de Tasks.
