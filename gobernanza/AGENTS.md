# AGENTS

Punto de entrada para agentes de código (Cursor, Claude Code, Copilot, etc.).

## Documentos SDD (layout dual)

Lee primero el layout **spec-kit** en la raíz del repo; `docs/sdd/*` es espejo para gobernanza. **No te limites a MDD, Spec, Plan y Tasks**: implementa según el alcance del proyecto leyendo también arquitectura, casos, H.U., design system, pantallas, API, flujos, infra y ADRs cuando estén en el ZIP.

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

## Instalación de gobernanza

El ZIP **no incluye** la carpeta oculta `.cursor/` (macOS/Finder la oculta al extraer). Los artefactos viven en `docs/agent-governance/`; instálalos en el repo destino así:

1. Lee `IMPLEMENT.md` y `.specify/memory/constitution.md`.
2. Lee `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md` y `docs/agent-governance/INSTALACION.md`.
3. Copia o mapea cada archivo según la tabla (o ejecuta `scripts/install-agent-governance.sh`).

| Archivo en ZIP | Destino en repo destino |
|----------------|-------------------------|
| `docs/agent-governance/rules/*.mdc` | `.cursor/rules/*.mdc` |
| `docs/agent-governance/skills/*/SKILL.md` | `.cursor/skills/*/SKILL.md` |
| `docs/agent-governance/references/*` | `.cursor/references/*` |
| `docs/agent-governance/agents/*` | `.cursor/agents/*` |
| `docs/agent-governance/commands/*` | `.cursor/commands/*` |
| `docs/agent-governance/mcp.json.example` | `.cursor/mcp.json` |

- **Uso del paquete:** `docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`
- **Onboarding:** `docs/agent-governance/agent-onboarding.md`
- **Instalación paso a paso:** `docs/agent-governance/INSTALACION.md`

## Hechos del proyecto (SplitSnap)

- **Backend:** NestJS
- **Frontend:** y
- **Mobile:** React Native

**Globs backend:**
- `apps/api/**`

**Globs frontend:**
- `apps/web/**`

**Docs SDD:**
- `docs/sdd/mdd.md`

## Resolución de conflictos SDD

Decisiones acordadas al alinear gobernanza con el MDD. **Prioriza siempre el MDD** ante nuevas contradicciones.

| Tema | Decisión |
|------|----------|
| **MySQL vs PostgreSQL** | confirma el motor en MDD §3 antes de migraciones o schemas. |
| **Stack backend** | prioriza NestJS del MDD §2; no uses Express en Blueprint/Tasks/governance. |
