---
version: alpha
name: SplitSnap Design System
description: Identidad visual moderna y ligera para la división social de cuentas de restaurante
colors:
  primary: "#533afd"
  secondary: "#ff6118"
  tertiary: "#7f7dfc"
  neutral: "#f8fafd"
typography:
  h1:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 44px
- fontWeight: 300
- lineHeight: 1.03
- letterSpacing: "-0.02em"

  h2:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 22px
- fontWeight: 300
- lineHeight: 1.3
- letterSpacing: "-0.01em"

  body-md:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 16px
- fontWeight: 400
- lineHeight: 1.5

  label-sm:
- fontFamily: "Inter, system-ui, sans-serif"
- fontSize: 14px
- fontWeight: 500
- lineHeight: 1.4
- letterSpacing: "0.01em"

rounded:
  sm: 4px
  md: 6px
  lg: 8px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
- backgroundColor: "{colors.primary}"
- textColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 12px

  button-primary-hover:
- backgroundColor: "#4329e0"
- textColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 12px

  card:
- backgroundColor: "#FFFFFF"
- rounded: "{rounded.md}"
- padding: "{spacing.lg}"

  input:
- backgroundColor: "#FFFFFF"
- rounded: "{rounded.sm}"
- padding: 10px

  badge:
- backgroundColor: "{colors.secondary}"
- textColor: "#FFFFFF"
- rounded: 9999px
- padding: 4px

---

# Guía UX/UI — SplitSnap

## Overview

SplitSnap digitaliza tickets de restaurante con una foto, detecta productos con IA y divide la cuenta según lo que cada comensal consumió. El design system traduce la confianza técnica de Stripe (púrpura signature, tipografía ultraligera, geometría de radios bajos) a un contexto social y cotidiano: compartir cuentas debe sentirse rápido, sin fricción y hasta divertido. La paleta combina un índigo vibrante como acento principal con naranja cálido para acciones lúdicas y fondos neutros muy claros que mantienen el foco en los datos.

## Colors

| Token            | Hex     | Uso                                        |
| :--------------- | :------ | :----------------------------------------- |
| primary          | #533AFD | Botones principales, enlaces, acentos      |
| primary-hover    | #4329E0 | Hover de primary                           |
| secondary        | #FF6118 | Badges, acciones secundarias, alertas      |
| secondary-hover  | #E05500 | Hover de secondary                         |
| tertiary         | #7F7DFC | Fondos suaves, gradientes, estados activos |
| neutral          | #F8FAFD | Fondo de página y superficies quietas      |
| background       | #FFFFFF | Fondo de tarjetas, inputs y modales        |
| foreground       | #061B31 | Texto principal y títulos                  |
| muted-foreground | #64748D | Texto secundario, etiquetas                |
| border           | #E5EDF5 | Bordes de tarjetas, divisores e inputs     |
| destructive      | #DC2626 | Errores y acciones destructivas            |
| success          | #16A34A | Confirmaciones y estados completados       |

Todos los pares de texto cumplen WCAG AA (≥4.5:1). El primary sobre blanco solo se usa como fondo de botón (texto blanco encima), no como color de texto sobre fondo claro.

## Typography

Se usa **Inter** como tipografía principal, elegida por su legibilidad en pantalla y cercanía visual a la sohne-var de Stripe. Para cuerpo se usa peso 400 con line-height 1.5 (óptimo para lectura de tablas y formularios). Los títulos en peso 300 dan un aire editorial ligero que reduce la percepción de densidad en pantallas de datos.

| Estilo   | Font                         | Size | Weight | Line Height | Letter Spacing |
| :------- | :--------------------------- | :--- | :----- | :---------- | :------------- |
| h1       | Inter, system-ui, sans-serif | 44px | 300    | 1.03        | -0.02em        |
| h2       | Inter, system-ui, sans-serif | 22px | 300    | 1.3         | -0.01em        |
| h3       | Inter, system-ui, sans-serif | 18px | 500    | 1.4         | 0              |
| body-md  | Inter, system-ui, sans-serif | 16px | 400    | 1.5         | 0              |
| body-sm  | Inter, system-ui, sans-serif | 14px | 400    | 1.5         | 0              |
| label-sm | Inter, system-ui, sans-serif | 14px | 500    | 1.4         | 0.01em         |
| caption  | Inter, system-ui, sans-serif | 12px | 400    | 1.5         | 0              |
| micro    | Inter, system-ui, sans-serif | 10px | 400    | 1.5         | 0.1px          |

**Regla:** No usar h1 en pantallas internas (solo en landing o bienvenida). Máximo jerarquía h2 dentro de la app. El tamaño base de cuerpo en móvil nunca baja de 16px.

## Layout & Spacing

Se usa un grid de 8px como unidad base. Todos los paddings, margins y gaps deben ser múltiplos de 8px (o 4px en micro-espaciado).

| Token      | Valor | Uso típico                                              |
| :--------- | :---- | :------------------------------------------------------ |
| spacing-xs | 4px   | Micro separación entre badge y texto                    |
| spacing-sm | 8px   | Gap entre inputs en un formulario                       |
| spacing-md | 16px  | Padding interno de tarjetas, separación entre secciones |
| spacing-lg | 24px  | Margen entre grupos de componentes                      |
| spacing-xl | 32px  | Separación de secciones mayores                         |

**Breakpoints:**
- sm: 640px (móvil horizontal)
- md: 768px (tablet)
- lg: 1024px (escritorio)
- xl: 1280px (escritorio grande)

**Touch targets:** Todos los elementos interactivos deben medir al menos 44×44px. En móvil, botones ocupan ancho completo cuando hay espacio.

## Elevation & Depth

Se usan sombras sutiles para jerarquía visual, evitando profundidad excesiva que compita con el contenido.

| Nivel | Elevación                          | Uso                                          |
| :---- | :--------------------------------- | :------------------------------------------- |
| 0     | none                               | Superficies planas (fondo, tarjetas default) |
| 1     | `0 1px 2px rgba(6, 27, 49, 0.06)`  | Tarjetas elevadas, inputs enfocados          |
| 2     | `0 2px 8px rgba(6, 27, 49, 0.08)`  | Modales, dropdowns, tooltips                 |
| 3     | `0 4px 16px rgba(6, 27, 49, 0.12)` | Diálogos modales, notificaciones toast       |

**Z-index stacking:**
- dropdown: 10
- sticky header: 20
- modal overlay: 30
- modal content: 40
- toast/notification: 50

## Shapes

| Token        | Valor  | Uso                                      |
| :----------- | :----- | :--------------------------------------- |
| rounded-sm   | 4px    | Inputs, botones, badges                  |
| rounded-md   | 6px    | Tarjetas, modales, menús                 |
| rounded-lg   | 8px    | Contenedores grandes, imágenes de ticket |
| rounded-full | 9999px | Badges de avatar, indicadores            |

## Components

### Button

| Variante    | Background           | Text Color          | Rounded      | Padding   | Hover                               |
| :---------- | :------------------- | :------------------ | :----------- | :-------- | :---------------------------------- |
| primary     | {colors.primary}     | #FFFFFF             | {rounded.sm} | 12px 20px | {colors.primary-hover}              |
| secondary   | {colors.neutral}     | {colors.foreground} | {rounded.sm} | 12px 20px | border: {colors.border}             |
| ghost       | transparent          | {colors.primary}    | {rounded.sm} | 8px 12px  | background: rgba(83, 58, 253, 0.06) |
| destructive | {colors.destructive} | #FFFFFF             | {rounded.sm} | 12px 20px | darken 10%                          |

**Estados:** disabled → opacidad 0.5, cursor not-allowed. Loading → spinner dentro del botón, mismo ancho.

### Card

```css
background: #FFFFFF;
border: 1px solid {colors.border};
border-radius: {rounded.md};
padding: {spacing.lg};
box-shadow: {elevation 1};

```
### Usada para tickets, productos, participantes. En móvil ocupa ancho completo con margen sm.

### Input

```css
background: #FFFFFF;
border: 1px solid {colors.border};
border-radius: {rounded.sm};
padding: 10px 12px;
font: {body-md};

**Focus:** ring-2 ring-primary/30. **Error:** border-destructive + mensaje debajo. **Disabled:** bg-neutral, opacidad 0.6.

```
### Badge

```css
background: {colors.secondary};
color: #FFFFFF;
border-radius: 9999px;
padding: 2px 8px;
font: {caption};

Usado para modo propina (global/individual), estado del ticket (completado/procesando). También variante neutral para contadores.

```
## Do's and Don'ts

| ✓ Do                                                            | ✗ Don't                                          |
| :-------------------------------------------------------------- | :----------------------------------------------- |
| Usar primary solo en botones principales (máximo uno por vista) | Poner primary en más de un CTA por pantalla      |
| Mantener padding consistente (múltiplos de 8px)                 | Mezclar espaciados de 6px con 10px               |
| Texto de cuerpo ≥16px en móvil                                  | Usar fuente menor a 14px en cualquier contenido  |
| Respetar jerarquía tipográfica (h2 → body → label)              | Saltar de h1 a body en secciones internas        |
| Badge secundario solo para info no crítica                      | Badge secundario para errores (usar destructive) |
| Usar loading skeleton con altura reservada                      | Dejar espacio vacío que cause CLS                |

## Accesibilidad (WCAG AA)

- **Contraste:** Todos los pares de texto cumplen ≥4.5:1 (foreground sobre background 10.5:1; primary sobre blanco solo en botones con texto blanco).
- **Foco visible:** Todos los elementos interactivos muestran un anillo de foco de 2px solid primary con offset 2px.
- **Navegación por teclado:** Tab order lógico (formularios → acciones principales → secundarias). Skip link al contenido principal.
- **Áreas táctiles:** Mínimo 44×44px en todos los targets. Inputs y botones en móvil usan altura 48px.
- **Animaciones:** Duración 200-300ms, solo transform y opacity. Se respeta `prefers-reduced-motion` desactivando animaciones no esenciales.
- **Forms:** Cada input tiene `<label>` asociado vía `for` + `id`. Errores se muestran debajo del campo con aria-describedby.
- **Iconos solitarios:** Llevan `aria-label` descriptivo.

---

## Prompt para Google Stitch (producto)

Genera un prototipo funcional de alta fidelidad para **SplitSnap**, una aplicación web mobile-first que permite a grupos de comensales dividir cuentas de restaurante fotografiando el ticket. La app usa OCR + IA para extraer productos, y un motor de cálculo que reparte proporcionalmente IVA, descuentos y propina según el consumo real de cada persona (no división uniforme). No requiere registro de usuarios — es una herramienta de un solo uso por sesión.

**Usuarios:** Organizadores informales de comidas en grupo (amigos, compañeros de trabajo, familias) que usan su propio celular o laptop en el restaurante.

**Pantallas y flujos (inferidos de especificación):**

1. **Inicio / Landing** → Una pantalla limpia con un gran CTA "Tomar foto del ticket" (cámara) o "Subir imagen". Breve explicación del valor: "Divide cuentas justas en segundos".
2. **Captura de ticket** → Selector de archivo (cámara o galería) con feedback de carga. Validación de formato (JPG/PNG, <5MB). Si falla OCR, muestra mensaje amigable con opción de ingreso manual.
3. **Revisión de productos** → Lista de productos detectados por IA, editables (nombre, precio, eliminar, agregar manual). Cada producto con toggle para asignar participantes.
4. **Participantes** → Lista de comensales (nombre opcional + foto opcional). Se pueden agregar/quitar. Soporta grupos reutilizables (cargar desde grupos guardados). Al menos un participante requerido.
5. **Asignación de productos** → Interfaz para vincular productos a participantes. Productos compartidos (ej. pizza) se asignan a múltiples personas con shareRatio equitativo (1). Productos individuales tienen un solo dueño.
6. **Configuración de propina** → Selector de modo: Global (un porcentaje único) o Individual (porcentaje por persona). Por defecto 10% global.
7. **Resumen y cálculo** → Tabla con subtotales, IVA proporcional, descuento, propina y total por persona. Total general del ticket. Botón "Finalizar" validado (todos los productos asignados, al menos 1 participante). Si hay diferencia > umbral (configurable) con el total impreso, alerta naranja.
8. **Resultado compartible** → Vista de resumen final con montos por persona. Botón "Compartir" (copia al portapapeles o comparte vía Web Share API). Un CTA "Dividir otro ticket" para reiniciar.
9. **Grupos reutilizables** → CRUD simple: crear, editar, eliminar grupos de participantes frecuentes. Seleccionable al crear un nuevo ticket.

**Flujos transversales:**
- Estado vacío en lista de productos si no hay imagen o falla OCR: "Aún no hay productos. Sube un ticket o agrégalos manualmente."
- Estado carga en OCR: skeleton animado con texto "Analizando ticket...".
- Estado error en OCR/IA: mensaje claro con opción de reintentar o ingreso manual.
- Confirmación al eliminar participante con productos asignados: modal advirtiendo que los productos quedarán huérfanos.
- Producto sin asignar: se marca visualmente (borde naranja) y bloquea el botón "Finalizar".

**Stack UI:** React 18 + Vite + TypeScript + Tailwind CSS. Componentes basados en shadcn/ui (Button, Card, Input, Badge, Dialog, DataTable, Form, Toast). El design system está definido en `design-system.md` con tokens de color y tipografía.

**Dirección visual:** Moderna y ligera, inspirada en la elegancia de Stripe. Paleta principal: índigo (#533AFD) como acento, naranja (#FF6118) para acciones secundarias, fondos blancos y neutros muy claros. Tipografía Inter con pesos ligeros (300) en títulos y 400 en cuerpo. Radios bajos (4-6px), sombras sutiles. La experiencia debe sentirse rápida, sin fricción y amigable — colores cálidos en badges y alertas, tipografía aireada.

**Accesibilidad:** WCAG AA (contraste ≥4.5:1), áreas táctiles ≥44×44px, foco visible, navegación por teclado, prefers-reduced-motion.

**Variantes:** Generar versión desktop y mobile. En mobile, las tablas de productos/participantes se convierten en cards apiladas. Los formularios ocupan ancho completo en móvil.

**Supuestos:** No hay autenticación ni persistencia entre sesiones (datos en localStorage o estado de la app). El límite de participantes se asume en 10 por ticket. El umbral de alerta de diferencia de total se fija en 5% (configurable por el usuario en una pantalla futura).

---

## Registro de cambios del documento

| Versión | Fecha      | Descripción del cambio                                                                                  |
| :------ | :--------- | :------------------------------------------------------------------------------------------------------ |
| 1.0     | Junio 2026 | Creación inicial de la Guía UX/UI para SplitSnap con tokens inspirados en Stripe y prompt Google Stitch |

## Design System (inferido del MCP gráfico)

> Design system inferido de **@imj_media/ui 1.12.0** vía el MCP gráfico compatible activo. Sustituye la inferencia heurística/Ariadne mientras el MCP esté conectado.

### Colores

| Token         | Valor              |
| :------------ | :----------------- |
| `primary`     | rgb(54, 89, 194)   |
| `secondary`   | rgb(240, 69, 69)   |
| `tertiary`    | rgb(33, 196, 94)   |
| `destructive` | rgb(235, 179, 8)   |
| `foreground`  | rgb(48, 51, 54)    |
| `background`  | rgb(247, 247, 250) |
| `muted`       | rgb(247, 247, 250) |
| `border`      | rgb(199, 199, 204) |
| `success`     | rgb(33, 196, 94)   |
| `warning`     | rgb(235, 179, 8)   |
| `danger`      | rgb(240, 69, 69)   |
| `info`        | rgb(5, 181, 212)   |

### Tipografía

| Token       | Valor                                                          |
| :---------- | :------------------------------------------------------------- |
| `font-sans` | {"fontFamily":"'Inter', system-ui, -apple-system, sans-serif"} |
| `body-sm`   | {"fontSize":"14px","fontWeight":"400","lineHeight":"1.5"}      |
| `body-md`   | {"fontSize":"16px","fontWeight":"400","lineHeight":"1.5"}      |
| `label-sm`  | {"fontSize":"14px","fontWeight":"500","lineHeight":"1.25"}     |
| `h1`        | {"fontSize":"20px","fontWeight":"700","lineHeight":"1.2"}      |
| `h2`        | {"fontSize":"18px","fontWeight":"600","lineHeight":"1.25"}     |

### Espaciado

| Token | Valor |
| :---- | :---- |
| `0`   | 0     |
| `2`   | 2px   |
| `4`   | 4px   |
| `6`   | 6px   |
| `8`   | 8px   |
| `12`  | 12px  |
| `16`  | 16px  |
| `20`  | 20px  |
| `24`  | 24px  |
| `32`  | 32px  |
| `40`  | 40px  |
| `48`  | 48px  |
| `64`  | 64px  |
| `96`  | 96px  |

### Radios

| Token  | Valor  |
| :----- | :----- |
| `sm`   | 8px    |
| `md`   | 8px    |
| `lg`   | 10px   |
| `full` | 9999px |

### Catálogo de componentes

| Componente   | Paquete                | Reemplaza (genérico)                             |
| :----------- | :--------------------- | :----------------------------------------------- |
| `Table`      | `@imj_media/ui@1.12.0` | `DataTable`, `ReferenceTable`, `OrbitDataGrid`   |
| `Table`      | `@imj_media/ui@1.12.0` | `KanbanBoard`, `KanbanOrderBoard`, `OrbitKanban` |
| `Ghantt`     | `@imj_media/ui@1.12.0` | `GanttChart`, `TimelineBoard`                    |
| `Lists`      | `@imj_media/ui@1.12.0` | `ListView`, `MasterListView`                     |
| `Lists`      | `@imj_media/ui@1.12.0` | `FeedList`, `NotificationList`                   |
| `Filters`    | `@imj_media/ui@1.12.0` | `SearchBar`, `FilterPanel`                       |
| `Header`     | `@imj_media/ui@1.12.0` | `PageHeader`, `FilterHeader`                     |
| `Modal`      | `@imj_media/ui@1.12.0` | `EntityForm`, `EditDialog`                       |
| `DatePicker` | `@imj_media/ui@1.12.0` | `DateInput`, `DateRangePicker`                   |