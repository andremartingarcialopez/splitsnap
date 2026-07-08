# Prompt inicial — implementa este handoff

**Misión:** Implementar **SplitSnap** desde el entregable TheForge, tarea a tarea, respetando spec-kit y gobernanza IA.

## Prerrequisitos (humano)

- Descomprime el ZIP en la **raíz del repositorio destino** (mismo nivel que `AGENTS.md` e `IMPLEMENT.md`).
- Abre el repo en la herramienta de agente (Cursor, Claude Code, GitHub Copilot, OpenHands, etc.).

## Paso 1 — Instalar gobernanza IA (acción del agente)

**Tu primera acción** en esta sesión es instalar gobernanza ejecutando el script en **terminal/shell** desde la raíz del repo. Cursor, Claude Code, Copilot y herramientas similares pueden correr shell si el usuario **aprueba permisos de terminal** cuando se soliciten.

**Ejecuta en terminal:**

```bash
chmod +x scripts/install-agent-governance.sh
./scripts/install-agent-governance.sh
```

**Verifica** que exista `.cursor/rules/` (y `.cursor/skills/` si aplica) antes de continuar al Paso 2. El script copia reglas, skills y referencias de `docs/agent-governance/` hacia `.cursor/`.

**No pidas al usuario** que ejecute el script salvo que falle por permisos, rutas inexistentes o un error que no puedas resolver.

## Paso 1.5 — Vincular The Forge MCP (si aplica)

Si existe **`.theforge-project.json`** en la raíz del repo:

1. Copia `docs/agent-governance/mcp.json.example` → `.cursor/mcp.json` (si no lo hizo el script).
2. Sustituye `{{API_URL}}` y `{{MCP_M2M_SECRET}}` con tu Secret MCP de The Forge.
3. Lee `docs/agent-governance/references/THEFORGE-LINK.md` para `projectId` y `stageId`.
4. Si la documentación SDD contradice el código correcto, usa MCP **`report_documentation_gap`** (ver skill `theforge-doc-sync`).

## Paso 2 — Orden de lectura (obligatorio)

Lee **en este orden** antes de escribir código (layout **spec-kit primario**; espejo en `docs/sdd/`):

1. **`IMPLEMENT.md`** — bootstrap spec-kit, instalación y mapa de rutas
2. **`AGENTS.md`** — entrada cross-tool e instalación de gobernanza
3. **`.specify/memory/constitution.md`** — Constitución (MDD); espejo: `docs/sdd/mdd.md`
4. **`specs/001-splitsnap/research.md`** — Paso 0 / investigación (**si existe**)
5. **`specs/001-splitsnap/spec.md`** — requisitos y criterios de aceptación
6. **`specs/001-splitsnap/architecture.md`**, **`use-cases.md`**, **`user-stories.md`** — cuando existan
7. **`specs/001-splitsnap/plan.md`** — Blueprint / plan técnico
8. **`specs/001-splitsnap/design-system.md`** y **`pantallas.md`** — **antes de implementar UI**
9. **`specs/001-splitsnap/contracts/api-contracts.md`** y **`logic-flows.md`** — contratos y flujos (**vinculantes** si existen)
10. **`docs/agent-governance/references/AGENT-PROMPT.md`** — contexto del proyecto (stack, módulos, conflictos SDD)
11. **`specs/001-splitsnap/tasks.md`** — checklist de ejecución (espejo: `docs/sdd/tasks.md`)
12. **`specs/001-splitsnap/infra.md`**, **`data-model.md`**, **`docs/sdd/decisions/*.md`**, **`quickstart.md`** — cuando existan
13. **`THEFORGE-DOC-CONSUMPTION-GUIDE.md`** — reglas completas de consumo (misma guía en `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`)

**Ante conflicto entre artefactos, gana el MDD.** No te limites a MDD/Spec/Plan/Tasks: usa todo lo presente en el ZIP según la tarea.

## Paso 3 — Primera tarea abierta

Implementa la **primera tarea pendiente** del checklist:

- [ ] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
- [ ] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
- [ ] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
- [ ] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
- [ ] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)

Cruza con **`specs/001-splitsnap/plan.md`**, **`spec.md`**, contratos API, flujos lógicos, **`pantallas.md`** (si hay UI) y **`docs/sdd/architecture.md`** según lo que exija la tarea. Al cerrar un checkpoint, ejecuta smoke tests de **`specs/001-splitsnap/quickstart.md`**.

## Paso 4 — Gates antes de cerrar

- Lint, typecheck y tests del paquete tocado (ver MDD §2 y scripts del repo).
- Contratos API alineados a `contracts/api-contracts.md` (spec-kit) o `docs/sdd/api-contracts.md` cuando la tarea toque endpoints.
- Respeta subflujos en `docs/agent-governance/references/workflows.md`.

## Paso 5 — Actualizar progreso

Marca la tarea completada en **`docs/sdd/PROGRESO.md`** y en **`specs/001-splitsnap/tasks.md`** (canónico spec-kit).

## Stack detectado (TheForge)

- **Backend:** NestJS
- **Frontend:** y
- **Mobile:** React Native
- **Infra / deploy:** Docker

## Resolución de conflictos SDD

Decisiones acordadas al alinear gobernanza con el MDD. **Prioriza siempre el MDD** ante nuevas contradicciones.

| Tema | Decisión |
|------|----------|
| **MySQL vs PostgreSQL** | confirma el motor en MDD §3 antes de migraciones o schemas. |

## Compatibilidad multi-herramienta

- **Cursor:** adjunta `@PROMPT-INICIAL.md`, `@IMPLEMENT.md`, `@AGENTS.md` y los archivos de la tarea.
- **Claude Code:** incluye este archivo, `IMPLEMENT.md` y `docs/agent-governance/references/AGENT-PROMPT.md` en el contexto inicial.
- **Copilot / otros:** pega este prompt completo y referencia rutas relativas del repo.

## Sesiones siguientes

Tras la sesión 0, usa el comando **`/implementar-tarea`** (Cursor) o repite pasos 3–5 leyendo `docs/agent-governance/references/AGENT-PROMPT.md` y la siguiente tarea abierta en `specs/001-splitsnap/tasks.md`.
