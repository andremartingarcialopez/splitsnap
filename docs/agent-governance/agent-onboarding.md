# Onboarding para agentes implementadores

1. **Sesión 0:** pega o adjunta **`PROMPT-INICIAL.md`** (raíz) en tu agente.
2. Lee **`IMPLEMENT.md`** y **`.specify/memory/constitution.md`** (layout spec-kit primario).
3. Lee **`docs/agent-governance/COMO-USAR-GOBERNANZA-IA.md`** (guía principal).
4. Si aún no instalaste gobernanza en `.cursor/`, sigue **`docs/agent-governance/INSTALACION.md`**.
5. Contexto del proyecto: **`docs/agent-governance/references/AGENT-PROMPT.md`**; checklist en **`specs/NNN-slug/tasks.md`** (espejo `docs/sdd/tasks.md`).
6. Consulta la guía de consumo: `docs/agent-governance/references/THEFORGE-DOC-CONSUMPTION-GUIDE.md`.
7. Carga `AGENTS.md` y las rules/skills en `.cursor/` según la tarea.
8. Sesiones siguientes: comando **`/implementar-tarea`** o repite pasos 3–5 de `PROMPT-INICIAL.md`.

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
