# Spec - Dividir Cuentas de Restaurante

## 1. Objetivos

**Problema:** Dividir cuentas de restaurante entre grupos es lento, propenso a errores y genera fricción. Las aplicaciones existentes requieren captura manual de cada producto.

**Usuario objetivo:** Usuario operador (organizador de la división, paga el total y asigna productos a los participantes).

**Propósito:** Agilizar la división de cuentas mediante la captura automatizada del ticket vía fotografía, interpretación por IA, y una interfaz que permita asignar productos a participantes, calcular impuestos y propinas, y guardar el historial.

## 2. Alcance

**Dentro del alcance (MVP):**
- Captura de ticket mediante fotografía o imagen desde el dispositivo.
- Digitalización de imagen y extracción de texto (servicio externo).
- Interpretación por IA de productos, precios, subtotal, impuestos y total.
- Edición manual de productos detectados (añadir, eliminar, modificar nombre/precio).
- Asignación de productos a participantes (individual o compartida, con división equitativa en compartidos).
- Gestión de participantes (nombre opcional, fotografía opcional – al menos uno requerido).
- Gestión de grupos reutilizables (crear, editar, eliminar, añadir/remover participantes).
- Cálculo de totales por participante siguiendo el orden fijo: división de compartidos → subtotal individual → porción de impuestos → subtotal con impuestos → propina (global o individual) → total individual → total general.
- Configuración de propina: modo global (mismo % para todos) o individual (% por persona con herencia inicial del global).
- Visualización de resumen con total por persona y total general.
- Guardado de tickets en historial local.
- Consulta de historial (listado con fecha, restaurante, total, número de participantes; detalle de ticket).
- Manejo de edge cases documentados (eliminación de participantes/productos, fallos de servicios externos, etc.).

**Fuera de alcance:**
- Inicio de sesión / registro de usuarios.
- Multiusuario / cuentas personales.
- Sincronización en la nube entre dispositivos.
- Pagos electrónicos / integración bancaria.
- Aplicación móvil nativa (solo web responsive).
- Estadísticas avanzadas.
- Exportar PDF.
- Sugerencia automática de asignaciones por IA.
- Tickets colaborativos en tiempo real.

**Dependencias conocidas:**
- Servicio externo de digitalización de imágenes (foto a texto).
- Servicio externo de inteligencia artificial (interpretación de texto a productos estructurados).

## 3. Criterios de éxito

- El usuario operador puede iniciar un ticket, capturar una foto (o seleccionar imagen), y el sistema muestra los productos, precios, subtotal, impuestos y total interpretados por IA, listos para editar.
- Todos los productos detectados son editables (nombre, precio) y se pueden añadir o eliminar manualmente antes de finalizar el ticket.
- El usuario puede asignar cada producto a uno o varios participantes; los productos compartidos se dividen equitativamente.
- El sistema calcula los montos individuales de impuestos y propinas siguiendo el orden de cálculo definido, y el total general coincide con la suma de totales individuales.
- El modo de propina (global/individual) se configura sin errores; al cambiar a individual, todos los participantes heredan el % global como valor inicial.
- El usuario puede añadir participantes en cualquier momento antes de finalizar, reasignar productos (incluyendo ya asignados) y los compartidos se redistribuyen automáticamente.
- Los tickets se guardan y aparecen en el historial con fecha, restaurante, total y número de participantes; al abrir el detalle se muestra toda la información del ticket.
- Los grupos se crean, editan y eliminan; los participantes se añaden o quitan; los grupos se reutilizan al crear nuevos tickets.
- Todos los edge cases documentados se manejan sin bloqueos: ticket ilegible (mensaje claro con opción de reintentar o ingreso manual), fallo de digitalización/IA (mensaje e ingreso manual), eliminación de participante con asignaciones (confirmación y ajuste automático), eliminación de producto con asignaciones (se permite y se desasigna), productos sin nombre/precio (se requiere completar), diferencia entre total calculado e impreso (permite corrección manual de impuestos), propina 0%, nombres duplicados, participantes solo con foto o solo con nombre.
- El sistema no permite finalizar un ticket con productos sin asignar.

## 4. User journeys (resumidos)

1. **Crear y dividir un ticket:** El usuario crea un nuevo ticket, selecciona participantes (desde grupos, manualmente o mixto), captura una foto del ticket, espera la digitalización e interpretación por IA, revisa y edita productos detectados, asigna cada producto a uno o varios participantes, configura la propina (global o individual), visualiza el resumen con total por persona, guarda el ticket en el historial y opcionalmente guarda el grupo de participantes.

2. **Gestionar grupos:** El usuario accede a "Mis Grupos", crea un nuevo grupo con nombre y descripción, añade o quita participantes, edita o elimina grupos existentes, y al crear un nuevo ticket puede cargar participantes desde uno o varios grupos.

3. **Consultar historial:** El usuario accede al historial de tickets, ve un listado con fecha, restaurante, total y número de participantes, selecciona un ticket y visualiza el detalle completo (productos, asignaciones, cálculos, propina).

4. **Cambiar modo de propina:** Durante la creación de un ticket, el usuario elige propina global (ej. 10%) que aplica a todos; si cambia a propina individual, cada participante hereda el % global como valor inicial y el usuario ajusta solo aquellos con un porcentaje diferente; el sistema recalcula automáticamente los totales.

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                                    |
| :------ | :--------- | :------------------------------------------------------------------------ |
| 1.0     | Abril 2026 | Creación inicial del Spec a partir del Benchmark (DBGA) y resumen fase 0. |