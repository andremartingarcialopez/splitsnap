# Pantallas — SplitSnap

> Mapa accionable pantalla → ruta → componente → API. Catálogo: **@imj_media/ui** 1.12.0. Endpoints **solo** de api-contracts.

**Librería:** @imj_media/ui 1.12.0 · **Contrato UI MCP:** 1.0.0

## Usuario autenticado

| Ruta | Página | US | Componentes (@imj_media/ui) | API principal | Estados |
|------|--------|-----|------------------|---------------|---------|
| /gestion-de-group | GestiónDeGroupPage | — | `Table` `@imj_media/ui@1.12.0` | GET /groups, POST /groups | loading, empty, error |
| /gestion-de-participant | GestiónDeParticipantPage | — | `Table` `@imj_media/ui@1.12.0` | POST /participants, PUT /participants/{id} | loading, empty, error |
| /gestion-de-groupparticipant | GestiónDeGroupParticipantPage | — | `Table` `@imj_media/ui@1.12.0` | fuera de alcance v1 | loading, empty, error |
| /gestion-de-ticket | GestiónDeTicketPage | — | `Table` `@imj_media/ui@1.12.0` | POST /tickets, GET /tickets | loading, empty, error |
| /gestion-de-ticketparticipant | GestiónDeTicketParticipantPage | — | `Table` `@imj_media/ui@1.12.0` | fuera de alcance v1 | loading, empty, error |
| /gestion-de-ticketgroup | GestiónDeTicketGroupPage | — | `Table` `@imj_media/ui@1.12.0` | fuera de alcance v1 | loading, empty, error |
| /gestion-de-product | GestiónDeProductPage | — | `Table` `@imj_media/ui@1.12.0` | POST /products, PUT /products/{id} | loading, empty, error |
| /gestion-de-productassignment | GestiónDeProductAssignmentPage | — | `Table` `@imj_media/ui@1.12.0` | fuera de alcance v1 | loading, empty, error |

## Layout transversal

- **Layout shell:** nav por rol (ver tablas anteriores); iconos y orden según journey.
- **Modales globales:** documentar impersonación, quota LLM 80%/100% en Tasks si aplican.
- **Responsive:** sm 640 / md 768 / lg 1024 / xl 1280; tablas → cards/stack bajo md.

## Fuera de alcance v1

- CRUD admin `GroupParticipant` — sin endpoint en api-contracts v1
- CRUD admin `TicketParticipant` — sin endpoint en api-contracts v1
- CRUD admin `TicketGroup` — sin endpoint en api-contracts v1
- CRUD admin `ProductAssignment` — sin endpoint en api-contracts v1

## Anexo — Catálogo (@imj_media/ui)

> Referencia rápida. **Tokens visuales solo en `design-system.md`.** Detalle por pantalla en tablas anteriores.

| Componente | Rutas |
|------------|-------|
| `Table @imj_media/ui@1.12.0` | /gestion-de-group, /gestion-de-participant, /gestion-de-groupparticipant, /gestion-de-ticket, /gestion-de-ticketparticipant, /gestion-de-ticketgroup, /gestion-de-product, /gestion-de-productassignment |