# Tasks

## US-001: Gestión de grupos (entidad Group)

- [x] [P] Crear migración Prisma para tabla `Group` (id UUID, name, description, timestamps)
  - **MDD:** §3 entidad Group
  - **Archivo:** `apps/api/prisma/schema.prisma` (model Group)
  - **Story:** US-001

- [x] [P] Implementar endpoint GET /api/v1/groups — listar grupos (ordenados por createdAt DESC)
  - **MDD:** §4 — GET /groups
  - **Archivo:** `apps/api/src/modules/group/group.controller.ts`, `apps/api/src/modules/group/group.service.ts`
  - **Story:** US-001

- [x] [P] Implementar endpoint POST /api/v1/groups — crear grupo con validación Zod (name requerido, max 100 chars)
  - **MDD:** §4 — POST /groups
  - **Archivo:** `apps/api/src/modules/group/group.controller.ts`, `apps/api/src/validators/group.validator.ts`
  - **Story:** US-001

- [x] [P] Implementar endpoint GET /api/v1/groups/{id} — detalle grupo (incluye participantes asociados)
  - **MDD:** §4 — GET /groups/{id}
  - **Archivo:** `apps/api/src/modules/group/group.controller.ts`, `apps/api/src/modules/group/group.service.ts`
  - **Story:** US-001

- [x] [P] Implementar endpoint PUT /api/v1/groups/{id} — actualizar grupo (name, description)
  - **MDD:** §4 — PUT /groups/{id}
  - **Archivo:** `apps/api/src/modules/group/group.controller.ts`
  - **Story:** US-001

- [x] [P] Implementar endpoint DELETE /api/v1/groups/{id} — eliminar grupo (cascade a GroupParticipant)
  - **MDD:** §4 — DELETE /groups/{id}
  - **Archivo:** `apps/api/src/modules/group/group.controller.ts`
  - **Story:** US-001

- [x] [P] UI: Pantalla de listado de grupos — tabla con nombre, descripción, acciones (editar/eliminar)
  - **MDD:** §2 (React), §4 (GET /groups)
  - **Archivo:** `apps/web/src/pages/GroupsPage.tsx`
  - **Story:** US-001
  - **Estados:** loading, empty, error

- [x] [P] UI: Modal/formulario para crear/editar grupo (name, description)
  - **MDD:** §2 (React), §4 (POST /groups, PUT /groups/{id})
  - **Archivo:** `apps/web/src/components/GroupForm.tsx`
  - **Story:** US-001

**Checkpoint:** Listar, crear, editar y eliminar grupos desde la UI. Base de datos refleja cambios.

## US-002: Gestión de participantes (entidad Participant)

- [x] [P] Crear migración Prisma para tabla `Participant` (id UUID, name, photoUrl, timestamps; CHECK name OR photoUrl)
  - **MDD:** §3 entidad Participant
  - **Archivo:** `apps/api/prisma/schema.prisma` (model Participant)
  - **Story:** US-002

- [x] [P] Crear migración Prisma para tabla `GroupParticipant` (id UUID, groupId FK, participantId FK, unique constraint)
  - **MDD:** §3 entidad GroupParticipant
  - **Archivo:** `apps/api/prisma/schema.prisma` (model GroupParticipant)
  - **Story:** US-002

- [x] [P] Implementar endpoint POST /api/v1/participants — crear participante (name requerido o photoUrl, validación Zod)
  - **MDD:** §4 — POST /participants
  - **Archivo:** `apps/api/src/modules/participant/participant.controller.ts`, `apps/api/src/validators/participant.validator.ts`
  - **Story:** US-002

- [x] [P] Implementar endpoint PUT /api/v1/participants/{id} — actualizar participante
  - **MDD:** §4 — PUT /participants/{id}
  - **Archivo:** `apps/api/src/modules/participant/participant.controller.ts`
  - **Story:** US-002

- [x] [P] Implementar endpoint DELETE /api/v1/participants/{id} — eliminar participante (cascade a GroupParticipant y ProductAssignment)
  - **MDD:** §4 — DELETE /participants/{id}
  - **Archivo:** `apps/api/src/modules/participant/participant.controller.ts`
  - **Story:** US-002

- [x] [P] UI: Pantalla de participantes (listado con búsqueda por nombre, acciones editar/eliminar)
  - **MDD:** §2, §4 (GET /participants no listado explícito, pero necesario para combo)
  - **Archivo:** `apps/web/src/pages/ParticipantsPage.tsx`
  - **Story:** US-002
  - **Estados:** loading, empty, error

- [x] [P] UI: Modal/formulario para crear/editar participante (name, photoUrl opcional)
  - **MDD:** §2, §4 (POST/PUT /participants)
  - **Archivo:** `apps/web/src/components/ParticipantForm.tsx`
  - **Story:** US-002

**Checkpoint:** CRUD de participantes desde la UI con validación de nombre o foto.

## US-003: Pipeline inteligente — OCR e IA (procesamiento de ticket)

- [x] [P] Configurar adaptador OCR.Space (OcrPort) con Circuit Breaker, timeout 5s, API key desde env
  - **MDD:** §4.B, §5.3
  - **Archivo:** `apps/api/src/modules/ocr/ocr.adapter.ts`, `apps/api/src/config/ocr.ts`
  - **Story:** US-003

- [x] [P] Configurar adaptador Gemini 2.5 Flash (TicketParserPort) con Circuit Breaker, timeout 5s, API key desde env
  - **MDD:** §4.B, §5.3
  - **Archivo:** `apps/api/src/modules/ai/ai.adapter.ts`, `apps/api/src/config/ai.ts`
  - **Story:** US-003

- [x] [P] Implementar endpoint POST /api/v1/ocr — solo OCR (imagen → texto)
  - **MDD:** §4.A.1 — POST /ocr
  - **Archivo:** `apps/api/src/controllers/ocr.controller.ts`, `apps/api/src/modules/ocr/ocr.service.ts`
  - **Story:** US-003

- [x] [P] Implementar endpoint POST /api/v1/ai/parse-ticket — texto OCR → JSON estructurado (restaurant, items, subtotal, tax, discount, total)
  - **MDD:** §4.A.1 — POST /ai/parse-ticket
  - **Archivo:** `apps/api/src/controllers/ai.controller.ts`, `apps/api/src/modules/ai/ai.service.ts`
  - **Story:** US-003

- [x] [P] Implementar endpoint POST /api/v1/tickets/process — pipeline completo: imagen → OCR → Gemini → crear Ticket + Products
  - **MDD:** §4.A.1 — POST /tickets/process, §5.1 (Template Method)
  - **Archivo:** `apps/api/src/modules/ticket/ticket.service.ts`, `apps/api/src/controllers/ticket.controller.ts`
  - **Story:** US-003

- [x] [P] Validar JSON devuelto por Gemini con reglas de negocio (precios > 0, subtotal ≈ suma items, total ≈ subtotal+tax-discount)
  - **MDD:** §5.2, §6 (IA validación)
  - **Archivo:** `apps/api/src/modules/ai/ai.validator.ts`
  - **Story:** US-003

- [x] [P] Manejar errores de OCR/IA: mostrar mensaje claro y permitir ingreso manual de productos
  - **MDD:** §5.3, §5.6 (Escenario Fallo OCR)
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts` (manejo de errores)
  - **Story:** US-003

- [x] [P] UI: Pantalla de captura de ticket (carga de imagen, previsualización, botón "Procesar")
  - **MDD:** §2, §4 (POST /tickets/process)
  - **Archivo:** `apps/web/src/pages/NewTicketPage.tsx`
  - **Story:** US-003
  - **Estados:** loading, success (redirigir a detalle), error (mostrar fallback manual)

- [x] [P] UI: Mostrar resultado del pipeline (productos detectados, restaurante, totales) con opción de editar productos manualmente
  - **MDD:** §2, §4 (GET /tickets/{id})
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx`
  - **Story:** US-003
  - **Estados:** loading, empty, error

**Checkpoint:** Subir imagen de ticket → procesar OCR+IA → mostrar productos estructurados editables. Fallback manual si falla.

## US-004: Gestión de tickets (CRUD)

- [x] [P] Crear migración Prisma para tabla `Ticket` (id UUID, title, restaurantName, ticketImageUrl, subtotal, tax, discount, total, tipMode, globalTipPercentage, processingStatus, timestamps)
  - **MDD:** §3 entidad Ticket
  - **Archivo:** `apps/api/prisma/schema.prisma` (model Ticket)
  - **Story:** US-004

- [x] [P] Crear migración Prisma para tabla `TicketParticipant` (id UUID, ticketId FK, participantId FK, individualTipPercentage, unique constraint)
  - **MDD:** §3 entidad TicketParticipant
  - **Archivo:** `apps/api/prisma/schema.prisma` (model TicketParticipant)
  - **Story:** US-004

- [x] [P] Crear migración Prisma para tabla `TicketGroup` (id UUID, ticketId FK, groupId FK, unique constraint)
  - **MDD:** §3 entidad TicketGroup
  - **Archivo:** `apps/api/prisma/schema.prisma` (model TicketGroup)
  - **Story:** US-004

- [x] [P] Crear migración Prisma para tabla `Product` (id UUID, ticketId FK, name, unitPrice, detectedByAI, confidenceScore, timestamps, CHECK price > 0)
  - **MDD:** §3 entidad Product
  - **Archivo:** `apps/api/prisma/schema.prisma` (model Product)
  - **Story:** US-004

- [x] [P] Crear migración Prisma para tabla `ProductAssignment` (id UUID, productId FK, participantId FK, shareRatio, unique constraint, CHECK shareRatio > 0)
  - **MDD:** §3 entidad ProductAssignment
  - **Archivo:** `apps/api/prisma/schema.prisma` (model ProductAssignment)
  - **Story:** US-004

- [x] [P] Implementar endpoint POST /api/v1/tickets — crear ticket manual (sin procesar imagen)
  - **MDD:** §4 — POST /tickets
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/validators/ticket.validator.ts`
  - **Story:** US-004

- [x] [P] Implementar endpoint GET /api/v1/tickets — listar tickets (incluye estado, restaurante, fecha)
  - **MDD:** §4 — GET /tickets
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/modules/ticket/ticket.service.ts`
  - **Story:** US-004

- [x] [P] Implementar endpoint GET /api/v1/tickets/{id} — detalle ticket (incluye productos, participantes, asignaciones, grupo asociado)
  - **MDD:** §4 — GET /tickets/{id}
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/modules/ticket/ticket.service.ts`
  - **Story:** US-004

- [x] [P] Implementar endpoint DELETE /api/v1/tickets/{id} — eliminar ticket (cascade todos los relacionados)
  - **MDD:** §4 — DELETE /tickets/{id}
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`
  - **Story:** US-004

- [x] [P] UI: Pantalla de listado de tickets (tabla con restaurante, fecha, estado, total, acciones)
  - **MDD:** §2, §4 (GET /tickets)
  - **Archivo:** `apps/web/src/pages/TicketsPage.tsx`
  - **Story:** US-004
  - **Estados:** loading, empty, error

- [x] [P] UI: Pantalla de detalle de ticket (muestra productos, participantes, asignaciones, totales, botón recalcular, eliminar)
  - **MDD:** §2, §4 (GET /tickets/{id})
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx`
  - **Story:** US-004
  - **Estados:** loading, error

**Checkpoint:** CRUD de tickets desde la UI, con detalle completo de productos y participantes.

## US-005: Gestión de productos y asignaciones

- [x] [P] Implementar endpoint POST /api/v1/products — agregar producto manual a un ticket
  - **MDD:** §4 — POST /products
  - **Archivo:** `apps/api/src/controllers/product.controller.ts`, `apps/api/src/validators/product.validator.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint PUT /api/v1/products/{id} — editar producto (nombre, precio)
  - **MDD:** §4 — PUT /products/{id}
  - **Archivo:** `apps/api/src/controllers/product.controller.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint DELETE /api/v1/products/{id} — eliminar producto (cascade asignaciones)
  - **MDD:** §4 — DELETE /products/{id}
  - **Archivo:** `apps/api/src/controllers/product.controller.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint GET /api/v1/tickets/{ticketId}/assignments — listar asignaciones de un ticket
  - **MDD:** §4 — GET /tickets/{ticketId}/assignments
  - **Archivo:** `apps/api/src/controllers/assignment.controller.ts`, `apps/api/src/modules/assignment/assignment.service.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint POST /api/v1/assignments — asignar producto a 1 participante (shareRatio default 1)
  - **MDD:** §4 — POST /assignments
  - **Archivo:** `apps/api/src/controllers/assignment.controller.ts`, `apps/api/src/validators/assignment.validator.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint POST /api/v1/assignments/shared — asignar producto compartido a N participantes con shareRatio
  - **MDD:** §4 — POST /assignments/shared
  - **Archivo:** `apps/api/src/controllers/assignment.controller.ts`, `apps/api/src/validators/assignment.validator.ts`
  - **Story:** US-005

- [x] [P] Implementar endpoint DELETE /api/v1/assignments/{id} — eliminar asignación
  - **MDD:** §4 — DELETE /assignments/{id}
  - **Archivo:** `apps/api/src/controllers/assignment.controller.ts`
  - **Story:** US-005

- [x] [P] UI: Componente de asignación de productos (selector de participantes, shareRatio editable, toggle compartido/individual)
  - **MDD:** §2, §4 (POST /assignments, POST /assignments/shared, DELETE /assignments/{id})
  - **Archivo:** `apps/web/src/components/AssignmentPanel.tsx`
  - **Story:** US-005
  - **Estados:** loading, empty, error

- [x] [P] UI: En detalle de ticket, mostrar cada producto con sus asignados y permitir agregar/editar/eliminar asignaciones
  - **MDD:** §2, §4 (GET /tickets/{ticketId}/assignments)
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx` (sección de asignaciones)
  - **Story:** US-005

**Checkpoint:** Agregar/editar/eliminar productos y asignaciones desde la UI. Productos compartidos con ratios.

## US-006: Gestión de participantes en ticket

- [x] [P] Implementar endpoint POST /api/v1/tickets/{id}/participants — agregar participante a ticket (crea TicketParticipant)
  - **MDD:** §4 — POST /tickets/{id}/participants
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/modules/ticket/ticket.service.ts`
  - **Story:** US-006

- [x] [P] Implementar endpoint DELETE /api/v1/tickets/{id}/participants/{participantId} — quitar participante del ticket (elimina TicketParticipant y sus ProductAssignments)
  - **MDD:** §4 — DELETE /tickets/{id}/participants/{participantId}
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/modules/ticket/ticket.service.ts`
  - **Story:** US-006
  - **Edge case:** producto huérfano bloquea finalizar (MDD §5.6)

- [x] [P] UI: En detalle de ticket, sección de participantes con botón "Agregar participante" (selector de participantes existentes o crear nuevo)
  - **MDD:** §2, §4 (POST /tickets/{id}/participants)
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx` (sección de participantes)
  - **Story:** US-006
  - **Estados:** loading, empty, error

- [x] [P] UI: Confirmación al eliminar participante que deja productos huérfanos; mostrar advertencia
  - **MDD:** §5.4, §5.6
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx` (modal de confirmación)
  - **Story:** US-006

**Checkpoint:** Agregar/quitar participantes de un ticket. Producto sin asignación bloquea finalizar.

## US-007: Cálculo de división de cuenta

- [x] [P] Implementar motor de cálculo (CalculationService) siguiendo Template Method:
  1. Obtener productos y asignaciones
  2. Monto por participante por producto = unitPrice * (shareRatio / sum shareRatio del producto)
  3. Subtotal individual
  4. Porción IVA = (subtotalIndividual / suma subtotales) * ticket.tax
  5. Porción descuento = (subtotalIndividual / suma subtotales) * ticket.discount
  6. Subtotal con impuestos
  7. Propina (global o individual)
  8. Total individual
  9. Suma total general
  - **MDD:** §5.1
  - **Archivo:** `apps/api/src/modules/calculation/calculation.service.ts`
  - **Story:** US-007

- [x] [P] Implementar endpoint GET /api/v1/tickets/{ticketId}/summary — devolver resumen calculado por participante
  - **MDD:** §4 — GET /tickets/{ticketId}/summary
  - **Archivo:** `apps/api/src/controllers/calculation.controller.ts`, `apps/api/src/modules/calculation/calculation.service.ts`
  - **Story:** US-007

- [x] [P] Implementar endpoint POST /api/v1/tickets/{ticketId}/calculate — forzar recálculo y devolver summary
  - **MDD:** §4 — POST /tickets/{ticketId}/calculate
  - **Archivo:** `apps/api/src/controllers/calculation.controller.ts`
  - **Story:** US-007

- [x] [P] Implementar endpoint PUT /api/v1/tickets/{ticketId}/tip — cambiar modo propina (GLOBAL/INDIVIDUAL) y porcentaje global
  - **MDD:** §4 — PUT /tickets/{ticketId}/tip
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/validators/tip.validator.ts`
  - **Story:** US-007

- [x] [P] Implementar endpoint PUT /api/v1/tickets/{ticketId}/participants/{participantId}/tip — propina individual (solo si tipMode = INDIVIDUAL)
  - **MDD:** §4 — PUT /tickets/{ticketId}/participants/{participantId}/tip
  - **Archivo:** `apps/api/src/controllers/ticket.controller.ts`, `apps/api/src/validators/tip.validator.ts`
  - **Story:** US-007

- [x] [P] UI: En detalle de ticket, mostrar resumen de cálculo por participante (subtotal, IVA, descuento, propina, total)
  - **MDD:** §2, §4 (GET /tickets/{ticketId}/summary)
  - **Archivo:** `apps/web/src/pages/TicketDetailPage.tsx` (sección de resumen)
  - **Story:** US-007
  - **Estados:** loading, error

- [x] [P] UI: Configuración de propina (selector global/individual, input de porcentaje) en detalle de ticket
  - **MDD:** §2, §4 (PUT /tickets/{ticketId}/tip, PUT /tickets/{ticketId}/participants/{participantId}/tip)
  - **Archivo:** `apps/web/src/components/TipConfig.tsx`
  - **Story:** US-007
  - **Estados:** loading, error

**Checkpoint:** Calcular división con productos compartidos, IVA, descuento, propina. Modo global/individual.

## US-008: Historial de tickets

- [x] [P] Implementar endpoint GET /api/v1/history — listar tickets finalizados (processingStatus = COMPLETED) con resumen
  - **MDD:** §4 — GET /history
  - **Archivo:** `apps/api/src/controllers/history.controller.ts`, `apps/api/src/modules/history/history.service.ts`
  - **Story:** US-008

- [x] [P] Implementar endpoint GET /api/v1/history/{id} — detalle histórico completo (incluye cálculo por participante)
  - **MDD:** §4 — GET /history/{id}
  - **Archivo:** `apps/api/src/controllers/history.controller.ts`, `apps/api/src/modules/history/history.service.ts`
  - **Story:** US-008

- [x] [P] UI: Pantalla de historial (lista de tickets pasados con fecha, restaurante, total, participantes)
  - **MDD:** §2, §4 (GET /history)
  - **Archivo:** `apps/web/src/pages/HistoryPage.tsx`
  - **Story:** US-008
  - **Estados:** loading, empty, error

- [x] [P] UI: Pantalla de detalle histórico (muestra resumen completo, sin posibilidad de editar)
  - **MDD:** §2, §4 (GET /history/{id})
  - **Archivo:** `apps/web/src/pages/HistoryDetailPage.tsx`
  - **Story:** US-008
  - **Estados:** loading, error

**Checkpoint:** Navegar al historial, ver tickets pasados con su resumen de división.

## US-009: Health check y monitoreo

- [x] [P] Implementar endpoint GET /api/v1/health — verificar estado de BD, OCR, Gemini (ping a cada servicio, timeout 5s)
  - **MDD:** §4 — GET /health, §7.4
  - **Archivo:** `apps/api/src/controllers/health.controller.ts`, `apps/api/src/modules/health/health.service.ts`
  - **Story:** US-009

- [x] [P] Configurar middleware de logging de errores en adapters externos (sin exponer API keys)
  - **MDD:** §7.4
  - **Archivo:** `apps/api/src/middlewares/errorLogger.ts`
  - **Story:** US-009

**Checkpoint:** Endpoint /health responde con estado de servicios.

## Infraestructura tasks

- [x] [P] Configurar Dockerfile para `apps/api` (Node 20 LTS, build TypeScript, expone puerto 3000)
  - **MDD:** §7.1
  - **Archivo:** `apps/api/Dockerfile`

- [x] [P] Configurar Dockerfile para `apps/web` (Nginx + Vite build, copia dist, proxy /api a api:3000)
  - **MDD:** §7.1
  - **Archivo:** `apps/web/Dockerfile`

- [x] [P] Configurar docker-compose.yml con servicios: api, web, mysql (volumen persistente 10Gi)
  - **MDD:** §7.1, §7.3
  - **Archivo:** `docker-compose.yml`

- [x] [P] Configurar variables de entorno en `.env.example` (DATABASE_URL, PORT, NODE_ENV, OCR_SPACE_API_KEY, GEMINI_API_KEY, CORS_ORIGIN, MAX_UPLOAD_MB, CALC_TOTAL_VARIANCE_THRESHOLD)
  - **MDD:** §7.2
  - **Archivo:** `apps/api/.env.example`

- [x] [P] Configurar Nginx reverse proxy en web: servir SPA y redirigir `/api/*` a `http://api:3000`
  - **MDD:** §7.1
  - **Archivo:** `apps/web/nginx.conf`

- [x] [P] Configurar Prisma schema con todas las entidades, relaciones y restricciones (CHECK, UNIQUE, FOREIGN KEYS)
  - **MDD:** §3.2
  - **Archivo:** `apps/api/prisma/schema.prisma`

- [x] [P] Configurar migración inicial de Prisma (npx prisma migrate dev)
  - **MDD:** §3.2
  - **Archivo:** `apps/api/prisma/migrations/`

- [x] [P] Configurar CI/CD básico (GitHub Actions u otro): lint, test, build, deploy (opcional para MVP)
  - **MDD:** §7 (implícito)
  - **Archivo:** `.github/workflows/ci.yml`

- [x] [P] Configurar variables de entorno en producción (secrets para OCR y Gemini)
  - **MDD:** §7.2
  - **Archivo:** `docker-compose.yml` (secrets section)

## Seguridad tasks

- [x] [P] Agregar middleware Helmet en Express (configurar CSP, X-Frame-Options, etc.)
  - **MDD:** §6
  - **Archivo:** `apps/api/src/middlewares/security.ts`

- [x] [P] Configurar CORS para origen del frontend (desde variable CORS_ORIGIN)
  - **MDD:** §6
  - **Archivo:** `apps/api/src/config/cors.ts`

- [x] [P] Implementar rate limiting por IP (más estricto en rutas /ocr, /ai/parse-ticket, /tickets/process)
  - **MDD:** §6
  - **Archivo:** `apps/api/src/middlewares/rateLimit.ts`

- [x] [P] Validar MIME type y tamaño de upload de imágenes (max 5 MB, solo JPG/JPEG/PNG)
  - **MDD:** §5.2, §6
  - **Archivo:** `apps/api/src/middlewares/upload.ts`

- [x] [P] Configurar Prisma con consultas parametrizadas (por defecto, pero verificar)
  - **MDD:** §6
  - **Archivo:** `apps/api/src/config/prisma.ts`

- [x] [P] Validar JSON de IA con Zod (reglas de negocio: precios > 0, estructura esperada)
  - **MDD:** §5.2, §6
  - **Archivo:** `apps/api/src/validators/aiResponse.validator.ts`

## Frontend tasks adicionales (UI general)

- [x] [P] Configurar proyecto React + Vite + TypeScript con Tailwind CSS
  - **MDD:** §2.1
  - **Archivo:** `apps/web/` (package.json, vite.config.ts, tailwind.config.js)

- [x] [P] Configurar React Router con rutas principales: `/`, `/tickets`, `/tickets/new`, `/tickets/:id`, `/groups`, `/participants`, `/history`, `/history/:id`
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/App.tsx`

- [x] [P] Configurar layout principal (AppLayout) con navegación lateral o superior (Tickets, Grupos, Participantes, Historial)
  - **MDD:** §2.1, UI/UX Design Intent
  - **Archivo:** `apps/web/src/components/AppLayout.tsx`

- [x] [P] Crear componente de estado vacío (EmptyState) con CTA contextual
  - **MDD:** UI/UX Design Intent
  - **Archivo:** `apps/web/src/components/EmptyState.tsx`

- [x] [P] Crear componente de error (ErrorState) con mensaje y botón de reintento
  - **MDD:** UI/UX Design Intent
  - **Archivo:** `apps/web/src/components/ErrorState.tsx`

- [x] [P] Crear componente de loading (spinner/skeleton) con altura reservada
  - **MDD:** UI/UX Design Intent
  - **Archivo:** `apps/web/src/components/LoadingState.tsx`

- [x] [P] Configurar Axios con base URL `/api/v1` y manejo global de errores
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/api/client.ts`

- [x] [P] Implementar hook personalizado useTicket(ticketId) para obtener datos de ticket
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/hooks/useTicket.ts`

- [ ] [P] Implementar hook useGroups() para listar grupos
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/hooks/useGroups.ts`

- [ ] [P] Implementar hook useParticipants() para listar participantes
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/hooks/useParticipants.ts`

- [ ] [P] Implementar hook useHistory() para listar historial
  - **MDD:** §2.1
  - **Archivo:** `apps/web/src/hooks/useHistory.ts`

- [ ] [P] Responsive: en viewport < md, tablas de tickets/grupos/historial se muestran como cards apiladas
  - **MDD:** UI/UX Design Intent
  - **Archivo:** `apps/web/src/components/TicketList.tsx` (responsive)

- [ ] [P] Touch targets ≥ 44×44px en todos los botones y enlaces
  - **MDD:** UI/UX Design Intent
  - **Archivo:** `apps/web/src/styles/globals.css` (clases utilitarias)

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                                                                                                                          |
| :------ | :--------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | Abril 2026 | Creación inicial del documento Tasks para SplitSnap MVP, derivado del MDD v1.1. Cubre todas las secciones §1-§7 con tareas backend, frontend e infraestructura. |