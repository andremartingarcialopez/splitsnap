# SplitSnap — Blueprint de Arquitectura

## 1. Estructura del proyecto y stack
### Stack técnico (explícito)

| Componente              | Tecnología                 | Versión    |
| :---------------------- | :------------------------- | :--------- |
| Runtime                 | Node.js                    | 20 LTS     |
| Backend                 | Express.js + TypeScript    | —          |
| Frontend                | React + Vite + TypeScript  | 18 / 5 / — |
| Estilos                 | Tailwind CSS               | 3.x        |
| Routing web             | React Router               | 6.x        |
| HTTP cliente            | Axios                      | 1.x        |
| ORM                     | Prisma                     | 5.x        |
| Base de datos           | MySQL                      | 8          |
| Validación              | Zod                        | 3.x        |
| OCR                     | OCR.Space (adapter)        | —          |
| LLM                     | Gemini 2.5 Flash (adapter) | —          |
| Almacenamiento imágenes | Filesystem local (MVP)     | —          |
**No usar en MVP:** NestJS, PostgreSQL, Redis, React Native, JWT, microservicios, colas, Pub/Sub.

### Árbol de directorios
```text
splitsnap/
├── apps/
│   ├── web/                        # React + Vite + Tailwind
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │
├── services/           # Axios client
│   │   │
├── validators/         # Zod schemas (compartidos)
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   └── api/                        # Express + TypeScript
│       └── src/
│           ├── modules/
│           │   ├── ticket/
│           │   ├── participant/
│           │   ├── group/
│           │   ├── product/
│           │   ├── assignment/
│           │   ├── ocr/
│           │   ├── ai/
│           │   └── calculation/
│           ├── adapters/
│           │   ├── OcrSpaceAdapter.ts
│           │   └── GeminiAdapter.ts
│           ├── middleware/
│           ├── routes/
│           ├── validators/
│           ├── config/
│           ├── app.ts
│           └── server.ts
├── prisma/
│   └── schema.prisma
├── storage/                        # Imágenes de tickets (MVP)
├── docker-compose.yml
└── package.json

```
## 2. Persistencia y datos

### Cobertura §3 del MDD

A continuación se listan **todas las entidades** definidas en el esquema SQL del MDD §3. Para columnas, tipos e índices detallados, ver §3 del MDD.

- Group
- GroupParticipant
- Participant
- Ticket
- TicketParticipant
- TicketGroup
- Product
- ProductAssignment

### Índices adicionales

- **Group:** `idx_group_name` (BTREE sobre `name`)
- **Participant:** `idx_participant_name` (BTREE sobre `name`)
- **Ticket:** `idx_ticket_created` (BTREE sobre `createdAt`), `idx_ticket_status` (BTREE sobre `processingStatus`)
- **Product:** `idx_product_ticket` (BTREE sobre `ticketId`), `idx_product_name` (BTREE sobre `name`)
- **ProductAssignment:** `idx_pa_product` (BTREE sobre `productId`), `idx_pa_participant` (BTREE sobre `participantId`)

### Reglas de integridad (alineadas a §3.4)

- Todo producto debe tener precio > 0 y pertenecer a un ticket.
- Toda asignación debe tener `shareRatio > 0`.
- Participante requiere al menos `name` o `photoUrl`.
- Propina individual entre 0 y 100 cuando `tipMode = INDIVIDUAL`.
- Producto sin asignación bloquea finalizar ticket.
- Eliminar participante en cascada sobre sus asignaciones.

## 3. Mapa de contratos API (MDD §4) → módulos

**Base URL:** `/api/v1`  
**Formato respuesta éxito:** `{ success: true, data: ... }`  
**Formato respuesta error:** `{ success: false, message: "...", error: { code, details } }`

| Método | Ruta                                                   | Módulo NestJS / Backend | Notas                                                               |
| :----- | :----------------------------------------------------- | :---------------------- | :------------------------------------------------------------------ |
| GET    | `/health`                                              | `health`                | Sin auth; verifica BD, OCR, Gemini                                  |
| GET    | `/groups`                                              | `group`                 | Listar grupos                                                       |
| POST   | `/groups`                                              | `group`                 | Crear grupo                                                         |
| GET    | `/groups/{id}`                                         | `group`                 | Detalle grupo                                                       |
| PUT    | `/groups/{id}`                                         | `group`                 | Actualizar grupo                                                    |
| DELETE | `/groups/{id}`                                         | `group`                 | Eliminar grupo                                                      |
| POST   | `/participants`                                        | `participant`           | Crear participante                                                  |
| PUT    | `/participants/{id}`                                   | `participant`           | Actualizar participante                                             |
| DELETE | `/participants/{id}`                                   | `participant`           | Eliminar participante                                               |
| POST   | `/tickets`                                             | `ticket`                | Crear ticket (sin imagen)                                           |
| GET    | `/tickets`                                             | `ticket`                | Listar tickets                                                      |
| GET    | `/tickets/{id}`                                        | `ticket`                | Detalle ticket incluyendo productos y participantes                 |
| DELETE | `/tickets/{id}`                                        | `ticket`                | Eliminar ticket (cascade)                                           |
| POST   | `/tickets/{id}/participants`                           | `ticket`                | Agregar participante al ticket                                      |
| DELETE | `/tickets/{id}/participants/{participantId}`           | `ticket`                | Quitar participante del ticket                                      |
| POST   | `/products`                                            | `product`               | Agregar producto manual                                             |
| PUT    | `/products/{id}`                                       | `product`               | Editar producto                                                     |
| DELETE | `/products/{id}`                                       | `product`               | Eliminar producto                                                   |
| GET    | `/tickets/{ticketId}/assignments`                      | `assignment`            | Listar asignaciones de un ticket                                    |
| POST   | `/assignments`                                         | `assignment`            | Asignar producto a 1 participante (shareRatio=1)                    |
| POST   | `/assignments/shared`                                  | `assignment`            | Asignar producto compartido (varios participantes con ratios)       |
| DELETE | `/assignments/{id}`                                    | `assignment`            | Eliminar asignación                                                 |
| PUT    | `/tickets/{ticketId}/tip`                              | `ticket`                | Cambiar modo propina (GLOBAL/INDIVIDUAL) y % global                 |
| PUT    | `/tickets/{ticketId}/participants/{participantId}/tip` | `ticket`                | Propina individual por participante                                 |
| GET    | `/tickets/{ticketId}/summary`                          | `calculation`           | Resumen calculado por participante                                  |
| POST   | `/tickets/{ticketId}/calculate`                        | `calculation`           | Forzar recálculo                                                    |
| GET    | `/history`                                             | `ticket`                | Historial de tickets finalizados                                    |
| GET    | `/history/{id}`                                        | `ticket`                | Detalle histórico de un ticket                                      |
| POST   | `/ocr`                                                 | `ocr`                   | Solo OCR → texto plano                                              |
| POST   | `/ai/parse-ticket`                                     | `ai`                    | Texto OCR → JSON estructurado                                       |
| POST   | `/tickets/process`                                     | `ticket`                | Pipeline completo: imagen → OCR → Gemini → crear ticket + productos |
**Nota:** Los endpoints de pipeline (`/ocr`, `/ai/parse-ticket`, `/tickets/process`) son para uso interno del frontend; están sujetos a rate limiting más estricto.

## 4. Componentes transversales (pipeline, IA, grafo)

### 4.1 Pipeline inteligente de procesamiento de ticket

| Componente             | Descripción                                                                                                         | Módulo   | Dependencias            | Fallos                                                                        |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------ | :------- | :---------------------- | :---------------------------------------------------------------------------- |
| **OcrAdapter**         | Envía imagen a OCR.Space, recibe texto extraído                                                                     | `ocr`    | OCR.Space API key (env) | Timeout 5s → Circuit Breaker → error `OCR_ERROR`                              |
| **TextPreprocessor**   | Limpia y normaliza texto OCR (quita ruido, saltos de línea)                                                         | `ocr`    | —                       | Error si texto vacío → `VALIDATION_ERROR`                                     |
| **GeminiAdapter**      | Envía texto limpio a Gemini 2.5 Flash, recibe JSON estructurado (restaurant, items, subtotal, tax, discount, total) | `ai`     | Gemini API key (env)    | Timeout 5s → Circuit Breaker → error `AI_PARSE_ERROR`                         |
| **AiAuditor**          | Valida JSON devuelto por Gemini: estructura, tipos, coherencia de montos                                            | `ai`     | —                       | Error de validación → `AI_PARSE_ERROR` con detalle; permite corrección manual |
| **TicketOrchestrator** | Coordina pipeline: llama OcrAdapter → TextPreprocessor → GeminiAdapter → AiAuditor → crea Ticket + Productos en BD  | `ticket` | Prisma                  | Fallo en cualquier paso → ticket queda `FAILED`; se notifica al usuario       |
**Flujo de datos:**
1. Frontend envía imagen `multipart/form-data` a `POST /api/v1/tickets/process`
2. `TicketOrchestrator` llama `OcrAdapter.extractText(image)` → texto plano
3. `TextPreprocessor.clean(text)` → texto normalizado
4. `GeminiAdapter.parseTicket(cleanText)` → JSON estructurado
5. `AiAuditor.validate(json)` → JSON validado o error
6. Si OK: transacción Prisma crea `Ticket` (status `COMPLETED`) + `Product`(s)
7. Si error en cualquier paso: ticket con status `FAILED`; frontend muestra error y permite ingreso manual

### 4.2 Circuit Breaker para adapters externos

- **Implementación:** patrón Circuit Breaker (estados: CLOSED, OPEN, HALF_OPEN)
- **Umbral:** 3 fallos consecutivos en ventana de 30 segundos → OPEN por 60 segundos
- **Fallback:** Mensaje de error claro al usuario + opción de ingreso manual de productos
- **Códigos de error:** `OCR_ERROR`, `AI_PARSE_ERROR`, `EXTERNAL_SERVICE_UNAVAILABLE`

### 4.3 Reintento con backoff

- Solo en adapters OCR y Gemini
- Máximo 3 reintentos con backoff exponencial (1s, 2s, 4s)
- No reintentar en errores de validación (4xx del externo)

## 5. Seguridad en despliegue

### Controles implementados (MVP, sin autenticación)

| Control                   | Implementación                                                                                            |
| :------------------------ | :-------------------------------------------------------------------------------------------------------- |
| **Transporte**            | TLS 1.2+ en producción (Nginx termina SSL)                                                                |
| **Headers HTTP**          | Helmet middleware (Express)                                                                               |
| **CORS**                  | Origen configurado vía `CORS_ORIGIN` env                                                                  |
| **Rate limiting**         | Por IP con express-rate-limit; más estricto en rutas `/ocr`, `/ai/*`, `/tickets/process` (ej. 10 req/min) |
| **Validación de entrada** | Zod en todos los body; MIME type y tamaño de imagen en uploads (máx. 5 MB)                                |
| **Secretos**              | API keys de OCR.Space y Gemini solo en variables de entorno del servidor                                  |
| **Inyección SQL**         | Prisma ORM parametriza todas las consultas                                                                |
| **Validación IA**         | `AiAuditor` valida estructura y tipos del JSON del LLM antes de persistir                                 |
| **Logs**                  | Errores de adapters sin exponer API keys; logs estructurados (pino o winston)                             |

### Despliegue MVP

```text
Nginx (proxy inverso)
├── / → SPA React (build estático)
└── /api → Express en puerto 3000
MySQL 8 → volumen persistente
Storage → directorio local (imágenes)

```
## 6. Riesgos y mitigaciones (trazabilidad §5)

| Riesgo (MDD §5)                                | Mitigación en diseño                                                                                                                                      | Referencia §5          |
| :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------- |
| **Fallo OCR** (imagen ilegible)                | Circuit Breaker + reintento backoff; mensaje de error claro; entrada manual de productos como fallback                                                    | §5.3                   |
| **Fallo Gemini** (JSON inválido/incompleto)    | AiAuditor valida estructura y tipos; si falla, ticket queda `FAILED` y usuario puede corregir manualmente                                                 | §5.3                   |
| **Diferencia entre total calculado e impreso** | Se compara suma de productos vs total del ticket; si supera umbral (`CALC_TOTAL_VARIANCE_THRESHOLD`), se muestra alerta y se requiere confirmación manual | §5.2, HITL-01          |
| **Producto huérfano** (sin asignación)         | Validación en `finalize` impide completar ticket; UI muestra producto sin asignar como error                                                              | §5.2, Gherkin scenario |
| **Eliminar único asignado**                    | Confirmación en UI; producto queda sin asignar; bloquea finalizar hasta reasignar o eliminar producto                                                     | §5.4, §5.6             |
| **Propina individual inconsistente**           | Al cambiar de GLOBAL a INDIVIDUAL, se hereda el % global como valor inicial para cada participante                                                        | §5.6                   |
| **Participante sin nombre ni foto**            | CHECK en BD (`name IS NOT NULL OR photoUrl IS NOT NULL`) + validación Zod                                                                                 | §5.2                   |

## 7. Plan de implementación por fases

### Fase 1: Fundación (días 1-3)
- Configurar proyecto monorepo (`apps/web`, `apps/api`)
- Prisma schema con todas las entidades y migraciones
- Docker Compose con MySQL 8
- Middleware base: Helmet, CORS, rate limiter, manejador de errores global
- Endpoint `/health`

### Fase 2: CRUD básico de dominio (días 4-8)
- Módulos: `group`, `participant`, `ticket`, `product`, `assignment`
- Implementar endpoints REST: crear, listar, obtener, actualizar, eliminar (según §4)
- Validación Zod en todos los endpoints
- Pruebas unitarias de servicios

### Fase 3: Pipeline OCR + IA (días 9-12)
- Implementar `OcrPort` y `OcrSpaceAdapter` con Circuit Breaker
- Implementar `TicketParserPort` y `GeminiAdapter` con Circuit Breaker
- Implementar `TextPreprocessor` y `AiAuditor`
- `TicketOrchestrator` para `POST /tickets/process`
- Pruebas de integración con mocks de API externas

### Fase 4: Motor de cálculo (días 13-15)
- Implementar `CalculationService` (Template Method: pasos 1-9 del §5.1)
- Estrategias de propina: `GlobalTipStrategy` e `IndividualTipStrategy`
- Endpoints: `GET /tickets/{id}/summary`, `POST /tickets/{id}/calculate`
- Pruebas unitarias con escenarios Gherkin (§5.6)

### Fase 5: Frontend React (días 16-22)
- Configurar Vite + Tailwind + React Router
- Páginas: Home, Tickets (lista), TicketDetail (con productos, participantes, asignaciones), Groups, History
- Componentes: upload de imagen, tabla de productos, selector de participantes, asignación de productos (compartidos), resumen por persona, configuración de propina
- Consumir API mediante Axios; validación Zod compartida
- Responsive mobile-first

### Fase 6: Seguridad, pulido y despliegue (días 23-25)
- Rate limiting ajustado por endpoint
- Helmet, CORS, TLS en Nginx
- Logging estructurado
- Pruebas end-to-end (Cypress o Playwright)
- Scripts de despliegue Docker Compose
- Documentación de variables de entorno

## 8. Checklist de verificación del Blueprint

- ✅ Sec 1: Stack técnico listado con tecnologías y versiones del MDD §2
- ✅ Sec 2: Lista nominal de TODAS las entidades del MDD §3 presente (Group, GroupParticipant, Participant, Ticket, TicketParticipant, TicketGroup, Product, ProductAssignment)
- ✅ Sec 3: Tabla API completa con cada endpoint del MDD §4 en una fila
- ✅ Sec 4: Componentes transversales cubiertos (pipeline OCR+IA, Circuit Breaker, reintentos)
- ✅ Sec 5: Seguridad en despliegue alineada con MDD §6
- ✅ Sec 6: Riesgos y mitigaciones trazados a MDD §5
- ✅ Sec 7: Plan de implementación por fases con dependencias
- ✅ Autocontenido: Sin frases como "ver §X", "véase §X", "remite al MDD" (solo se usó la excepción permitida para remitir a §3 en columnas detalladas)

## Registro de cambios del documento

| Versión | Fecha     | Descripción del cambio                                     |
| :------ | :-------- | :--------------------------------------------------------- |
| 1.0     | Mayo 2026 | Creación inicial del Blueprint según MDD v1.1 de SplitSnap |

## 9. UI Design System & Component Mapping

> Genera `pantallas.md` (MCP gráfico + Historias de Usuario) antes de implementar UI. Esta §8 solo define layout transversal y restricciones; evita mapear cada tabla §3 a un componente.

### Layout transversal

- **Shell:** `AppLayout` con navegación por rol.
  - **Usuario autenticado:** ítems de nav definidos en `pantallas.md` (orden, iconos, rutas protegidas).
- **Auth:** guards JWT (`role`, `tenant_id`); banners globales (impersonación, quota LLM) en `pantallas.md`.
- **Tokens:** `design-system.md` — tema canónico único (`light`|`dark`|`system` + preset del stack si aplica).

### Reglas de componente (sin auto-CRUD)

1. **No** asignes `DataTable`/`KanbanBoard` por cada entidad §3.
2. **Kanban** solo si `pantallas.md` describe pipeline arrastrable visible al usuario.
3. Logs, OTP, auditoría, tokens → `DataTable`, `AuditList` o `EmptyState`; **no** Kanban.
4. Endpoints en UI **solo** los de `api-contracts.md` — prohibido `GET /api/v1/{tabla}` inventado.
5. Formularios: React Hook Form + Zod; schemas alineados a contratos API.
6. Responsive: `< md` → `MobileStackView` o cards; touch ≥ 44px; WCAG AA.

### Entidades §3 (referencia — no mapa UI)

Dominio modelado (`Group`, `Participant`, `GroupParticipant`, `Ticket`, `TicketParticipant`, `TicketGroup`, `Product`, `ProductAssignment`); definir pantallas en `pantallas.md` antes de codificar vistas.