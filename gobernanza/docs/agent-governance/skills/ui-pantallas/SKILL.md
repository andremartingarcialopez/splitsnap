---
name: ui-pantallas
description: Pantallas MCP: leer spec de vistas antes de codificar UI.
---

# Skill: Pantallas (UI MCP)

## Cuándo cargar

- Implementar listados, formularios, dashboards o rutas del front.
- Existe `specs/NNN-slug/pantallas.md` o `docs/sdd/pantallas.md`.

## Checklist

1. Abrir pantallas.md y localizar la pantalla de la tarea actual.
2. Importar componentes con el paquete/versión indicados.
3. Cablear props según binding (API contracts + MDD §3).
4. Mobile responsive según design-system.md / MDD.
5. No cerrar la tarea UI sin revisar que la vista coincide con el doc.

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
