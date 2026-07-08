# Historias de Usuario y backlog

## Epic: Procesamiento de Tickets (Pipeline Inteligente)

### 🎯 Objetivo del Epic

Permitir al usuario tomar una foto de un ticket de restaurante, procesarla mediante OCR y Gemini, y obtener productos estructurados editables para su posterior asignación.

⸻

### ✅ Criterios de Éxito

- Una foto legible produce un ticket con productos detectados (UAT-01).
- Si OCR o Gemini fallan, se permite ingreso manual de productos.
- Tiempo de procesamiento total ≤ 10 segundos (OCR+IA).

⸻

### 🧱 Alcance

**Incluye:**
- Subida de imagen (JPG/JPEG/PNG, ≤5 MB)
- OCR con OCR.Space
- Interpretación con Gemini 2.5 Flash
- Creación automática de ticket y productos
- Manejo de errores con mensajes claros y opción de ingreso manual

**Fuera de alcance:**
- Asignación automática de productos a participantes
- Edición de la imagen después de subida

⸻

### ⚠️ Riesgos y Suposiciones

**Riesgos:**
- Dependencia de servicios externos (OCR.Space, Gemini) con posible latencia o caída
- Calidad de imagen puede afectar precisión

**Suposiciones:**
- El usuario tiene una foto del ticket en su dispositivo
- Se cuenta con API keys configuradas en entorno

⸻

### 🧾 Historia de Usuario: US-001 Procesar ticket mediante fotografía

**Como:** Usuario operador  
**Quiero:** Tomar una foto de un ticket de restaurante y que el sistema lo procese automáticamente  
**Para:** Obtener los productos del ticket de forma estructurada y editable sin tener que escribirlos manualmente

⸻

### ✅ Criterios de Aceptación

- AC1: El usuario puede seleccionar una imagen desde su dispositivo (JPG, JPEG, PNG)
- AC2: Al enviar, se muestra un indicador de progreso mientras se procesa (OCR + IA)
- AC3: Si el procesamiento es exitoso, se crea un ticket con `processingStatus = "COMPLETED"` y se muestran los productos detectados
- AC4: Si OCR falla (texto vacío o error), se muestra un mensaje claro y se permite agregar productos manualmente
- AC5: Si Gemini falla (JSON inválido o error), se permite editar los productos obtenidos de OCR o agregar manualmente
- AC6: El tiempo total de procesamiento no excede 10 segundos; si supera, se muestra timeout y se habilita ingreso manual

⸻

### 🛠️ Notas Técnicas

- Pipeline: `POST /api/v1/tickets/process` con `multipart/form-data` (campo `image`)
- Adapter OCR.Space con timeout 5s y Circuit Breaker (3 intentos)
- Adapter Gemini con timeout 5s y validación de JSON de salida
- El ticket se crea con `processingStatus = "PROCESSING"` y luego se actualiza a `COMPLETED` o `FAILED`

⸻

### 🧪 Casos de Prueba / QA Notes

- Verificar que imagen legible (ej. ticket nítido) devuelve productos correctos
- Verificar que imagen borrosa o en blanco muestra error y permite ingreso manual
- Verificar timeout simulado (OCR lento) muestra mensaje y habilita alternativa

⸻

### 🎨 Criterios UI

- **Ruta:** `/` (pantalla principal) o modal de creación de ticket
- **Componentes:** Button, Input (file), ProgressIndicator, Alert, Form (para ingreso manual)
- **AC-UI1:** Botón "Tomar foto" o "Seleccionar imagen" visible en la pantalla principal
- **AC-UI2:** Durante el procesamiento, se muestra una barra de progreso indeterminada o spinner
- **AC-UI3:** En caso de error,

## Registro de cambios del documento

| Versión | Fecha | Descripción del cambio |
| --- | --- | --- |
| 1.0 | Julio 2026 | Creación inicial de Historias de usuario |