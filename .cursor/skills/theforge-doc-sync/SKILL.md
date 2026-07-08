---
name: theforge-doc-sync
description: Reporta gaps de documentación SDD vía MCP The Forge cuando el código diverge de los entregables (inline o al revisar el diff al cerrar la sesión / antes de commit).
---

# The Forge doc sync

## Cuándo usar

El código implementado es correcto pero el SDD (MDD, Blueprint, Tasks, contratos, flujos, infra…) no lo refleja. Dos disparadores:

- **Inline:** detectas el desvío mientras implementas.
- **Fin de sesión / pre-commit:** revisas el diff acumulado antes de cerrar la tarea o commitear.

En greenfield pre-producción esto es lo normal: entra funcionalidad nueva o afloran faltantes de documentación. **No abras una etapa nueva por cada desvío** (proliferan etapas difíciles de auditar); reconcilia el SDD de la **etapa activa** con este flujo.

## Pasos (fin de sesión / pre-commit)

1. `git diff` (o `git diff --staged`) para ver qué cambió realmente.
2. Contrasta con el SDD: ¿el cambio contradice o no está en el MDD §, `docs/sdd/*` o `specs/001-splitsnap/tasks.md`?
3. Lee `.theforge-project.json` → `projectId`, `stageId`.
4. Por cada desvío relevante, llama `report_documentation_gap` con:
   - `description`: qué cambió y por qué el SDD queda desalineado (≥40 caracteres).
   - `evidence.reference`: cita §, T-, ruta `docs/sdd/` o `specs/001-splitsnap/tasks.md`.
   - `evidence.codePaths`: archivos del diff que lo justifican.
   - `affectedArtifacts`: solo los que cambian (el **MDD se parchea siempre**).
5. Continúa con el código correcto; la reconciliación parcial se aplica sola o queda `PENDING_APPROVAL` en Workshop.
6. Confirma con `get_agent_session_log` / `get_change_log`.

## Mapa cambio → affectedArtifacts

| Cambio en código | affectedArtifacts típicos |
| --- | --- |
| Endpoint nuevo/borrado/renombrado | `apiContracts`, `logicFlows`, `tasks` |
| Entidad o modelo de datos | `blueprint`, `apiContracts` |
| Flujo o regla de negocio | `logicFlows`, `useCases`, `userStories` |
| Pantalla / UI | `uxUiGuide`, `pantallas` |
| Infra / deploy | `infra` |

## Notas

- **Agrupa** por desvío; no un gap por línea. Hay dedup (24 h) y rate limit (~10/h).
- Sin `DOC_GAP_AUTO_APPLY=1` el gap queda `PENDING_APPROVAL` (se aprueba en Workshop).
- Reserva **abrir etapa** para hitos reales (cambio de alcance, handoff), no para drift de documentación.

## Hechos del proyecto (SplitSnap)

- **Backend:** NestJS
- **Frontend:** y
- **Mobile:** React Native

**Globs backend:**
- `backend/**`

**Globs frontend:**
- `frontend/**`

**Docs SDD:**
- `docs/sdd/mdd.md`
