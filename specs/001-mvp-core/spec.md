# Feature Specification: MVP Core — Multi-Project Expense Tracker

**Feature Branch**: `001-mvp-core`
**Created**: 2026-05-01
**Status**: Draft
**Input**: User description: "App web responsive (PWA) para trackear costos en múltiples proyectos (renovación de casa, gastos generales, etc.) con multi-currency (ARS/USD), workspace personal + compartidos para familia/pareja, dashboard, import desde Excel y export CSV."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Cargar un gasto y ver el total acumulado del proyecto (Priority: P1)

Como dueño de una expansión de obra, abro la app desde mi celular en la ferretería, creo el proyecto "Expansión casa", cargo el gasto del cemento que acabo de pagar, y veo el total acumulado del proyecto actualizado al instante.

**Why this priority**: Es el corazón del producto. Si esto no funciona, nada más importa. Reemplaza directamente al Excel actual del usuario.

**Independent Test**: Un usuario nuevo puede registrarse, crear su primer proyecto y cargar un gasto en menos de 2 minutos desde el celular, y ver el total del proyecto reflejando el monto cargado sin recargar la página.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado sin proyectos previos, **When** crea un proyecto "Expansión casa" y carga un gasto de 45.000 ARS con descripción "Cemento x 10", **Then** el total del proyecto pasa a mostrar "45.000 ARS" inmediatamente.
2. **Given** un usuario con un proyecto activo y 3 gastos existentes que totalizan 120.000 ARS, **When** agrega un nuevo gasto de 30.000 ARS, **Then** el total del proyecto pasa a "150.000 ARS" sin requerir refresh.
3. **Given** un usuario en el celular, **When** intenta cargar un gasto sin monto, **Then** el formulario muestra error claro y no se guarda.
4. **Given** un usuario con conexión inestable, **When** envía el gasto y la respuesta tarda, **Then** ve indicador de "guardando" y la fila aparece en la lista marcada como pendiente hasta confirmarse.

---

### User Story 2 — Cargar gastos en USD con tasa del día y ver totales en ambas monedas (Priority: P1)

Como usuario que paga al albañil en USD pero compra materiales en ARS, cargo cada gasto en su moneda original con la tasa del día auto-llenada (editable), y veo el total del proyecto desglosado en ARS y USD.

**Why this priority**: La construcción en Argentina mezcla pagos en ARS y USD constantemente. Sin esto, los totales del proyecto son falsos.

**Independent Test**: Un usuario puede cargar un gasto de 200 USD (con tasa del día auto-completada), y al ver el detalle del proyecto encuentra dos totales separados: total ARS y total USD, ambos correctos.

**Acceptance Scenarios**:

1. **Given** la cotización oficial del día es 1050 ARS por USD, **When** el usuario abre el formulario de nuevo gasto y elige USD, **Then** el campo "tasa de cambio" se autocompleta con 1050 y muestra el equivalente en ARS al lado del monto.
2. **Given** el usuario quiere usar otra tasa (porque pagó al blue), **When** edita el campo "tasa de cambio" a 1200 antes de guardar, **Then** el gasto queda registrado con esa tasa y el equivalente recalculado.
3. **Given** un proyecto con 3 gastos en ARS y 2 en USD, **When** el usuario abre el detalle del proyecto, **Then** ve dos totales: "Total en ARS: X" y "Total en USD: Y", ambos sumando los equivalentes correctos.
4. **Given** un gasto guardado hace 2 meses con tasa 950, **When** la cotización actual es 1300 y el usuario re-visita el detalle del gasto, **Then** los montos en ARS y USD del gasto histórico permanecen iguales (snapshot inmutable).
5. **Given** la cotización del día no se pudo obtener automáticamente, **When** el usuario abre el formulario y elige USD, **Then** el campo "tasa de cambio" aparece vacío con mensaje "ingresá la tasa manualmente" y el formulario no permite guardar sin completarlo.

---

### User Story 3 — Organizar gastos por categoría y vendor (Priority: P2)

Como usuario, asigno cada gasto a una categoría (Materiales, Mano de obra, etc.) y opcionalmente a un proveedor (Corralón Norte, Albañil Juan), para poder filtrar y reportar después.

**Why this priority**: Sin categorías el dashboard pierde sentido. Sin vendors es imposible saber "cuánto le pagué al albañil". Pero la pantalla principal de "cargar gasto" puede vivir sin esto en versión 0 — por eso P2.

**Independent Test**: Un usuario puede crear una categoría custom "Permisos municipales" y un vendor "Municipalidad de X", asignarlos a un gasto, y luego filtrar la lista por categoría y por vendor.

**Acceptance Scenarios**:

1. **Given** un workspace recién creado, **When** el usuario abre el formulario de gasto, **Then** ve un dropdown de categorías con un set seed predefinido (Materiales, Mano de obra, Servicios, Impuestos, Comida, Transporte, Herramientas, Otros).
2. **Given** un usuario que necesita una categoría que no existe, **When** abre la sección de Categorías, crea "Permisos municipales" con color naranja, **Then** la categoría aparece en el dropdown del próximo gasto.
3. **Given** un usuario tipeando el nombre de un vendor que ya usó antes, **When** escribe "Albañ" en el campo vendor, **Then** ve sugerencias autocompletadas y puede elegir o crear nuevo on-the-fly.
4. **Given** la lista de gastos del proyecto, **When** el usuario aplica filtro "categoría = Materiales", **Then** ve solo los gastos de esa categoría con su subtotal.

---

### User Story 4 — Manejar múltiples proyectos y gastos generales (Priority: P2)

Como usuario tengo varios contextos de gasto (Expansión casa, Gastos generales del hogar, próximo proyecto: Cocina), y necesito ver totales por proyecto y combinados.

**Why this priority**: Es el req explícito del usuario ("multi proyecto") pero el flujo de "primer gasto" funciona con un solo proyecto. Por eso es P2 después del core.

**Independent Test**: Un usuario puede crear 2 proyectos + dejar un gasto sin proyecto (Generales), y ver tres vistas: total Proyecto A, total Proyecto B, total Generales, y total general del workspace.

**Acceptance Scenarios**:

1. **Given** un usuario con 2 proyectos activos, **When** abre el formulario de gasto, **Then** el dropdown "Proyecto" tiene los 2 proyectos + opción "Generales (sin proyecto)".
2. **Given** un gasto cargado en "Generales", **When** el usuario navega a la vista "Generales", **Then** ve el gasto listado y el subtotal de Generales.
3. **Given** un proyecto con presupuesto definido en ARS y USD, **When** el usuario carga gastos, **Then** la vista del proyecto muestra "presupuesto vs gastado" con barra de progreso para ambas monedas.
4. **Given** un proyecto sin gastos aún, **When** se abre su detalle, **Then** se muestra el presupuesto (si tiene) + "0 ARS / 0 USD" como total.
5. **Given** un proyecto que ya no se va a usar, **When** el usuario lo archiva, **Then** desaparece del dropdown de "nuevo gasto" y de la vista principal pero sigue accesible en sección "Archivados" y sus gastos siguen contando en totales globales.

---

### User Story 5 — Dashboard del workspace con totales y distribución (Priority: P2)

Como usuario quiero abrir la app y ver una vista resumen: total gastado en cada moneda, proyectos activos con sus totales, distribución por categoría y evolución mensual.

**Why this priority**: El valor agregado sobre Excel. Es lo que diferencia "app" de "lista".

**Independent Test**: Tras cargar al menos 5 gastos en 2 proyectos y 3 categorías diferentes, el usuario abre el dashboard y ve correctamente: total ARS+USD del workspace, top 3 proyectos por monto, distribución por categoría en gráfico, y los últimos 10 gastos.

**Acceptance Scenarios**:

1. **Given** un workspace con datos, **When** el usuario abre la pantalla principal, **Then** ve en orden: total acumulado ARS y USD, lista de proyectos con barras vs presupuesto, gráfico de distribución por categoría, evolución mensual de los últimos 12 meses, top 5 vendors, y últimos 10 gastos.
2. **Given** un workspace recién creado sin gastos, **When** el usuario abre el dashboard, **Then** ve un estado vacío con CTA "cargá tu primer gasto".
3. **Given** un usuario navegando en mobile, **When** abre el dashboard, **Then** las cards se apilan verticalmente y los gráficos se redimensionan al ancho de pantalla manteniendo legibilidad.

---

### User Story 6 — Filtrar y buscar gastos (Priority: P2)

Como usuario quiero encontrar gastos específicos: "todos los gastos al Corralón Norte de marzo", "gastos en USD del proyecto Cocina", buscar por descripción.

**Why this priority**: Crítico cuando hay >50 gastos cargados. Antes de eso, scroll alcanza.

**Independent Test**: Con 30 gastos cargados, el usuario puede aplicar filtros combinados (rango de fecha + proyecto + categoría) y obtener resultados correctos. Búsqueda por texto encuentra gastos por descripción y nombre de vendor.

**Acceptance Scenarios**:

1. **Given** una lista de gastos, **When** el usuario aplica filtros "rango = marzo 2026 + proyecto = Expansión casa", **Then** ve solo los gastos que cumplen ambos criterios y el total filtrado.
2. **Given** filtros aplicados, **When** el usuario copia la URL y la abre en otra pestaña, **Then** los filtros se restauran (persisten en URL).
3. **Given** el usuario busca "cemento" en la barra de búsqueda, **Then** ve gastos con "cemento" en descripción o en nombre de vendor.
4. **Given** filtros activos, **When** el usuario apaga un filtro con el chip "X", **Then** los resultados se actualizan sin perder el resto de filtros.

---

### User Story 7 — Compartir un workspace con la pareja o familia (Priority: P3)

Como usuario en pareja quiero un workspace "Casa Familia" donde mi pareja también pueda cargar gastos. Al invitarla por email, ella recibe un link, hace click y entra al workspace sin fricción aunque no tenga cuenta todavía.

**Why this priority**: Diferenciador clave para el caso "pareja construyendo casa juntos", pero un usuario solo no lo necesita para empezar a usar la app. Por eso P3.

**Independent Test**: Owner de un workspace invita por email a un segundo usuario; el invitado recibe el link, hace click, completa el signup automático, y entra al workspace pudiendo ver todos los gastos previos y cargar uno nuevo.

**Acceptance Scenarios**:

1. **Given** un workspace compartido recién creado, **When** el owner abre la sección Miembros y agrega el email de su pareja con rol "editor", **Then** ve la invitación pendiente y puede copiar el link manualmente.
2. **Given** un email de invitación enviado, **When** el destinatario hace click en el link y no tiene cuenta, **Then** se le crea automáticamente con su email y queda dentro del workspace al instante.
3. **Given** un workspace compartido con 2 miembros, **When** el segundo miembro carga un gasto, **Then** el owner lo ve aparecer en el dashboard con el nombre del autor visible en el detalle del gasto.
4. **Given** una invitación de hace 8 días, **When** el destinatario intenta usarla, **Then** ve mensaje "invitación expirada" y el owner puede reenviarla.
5. **Given** un workspace con 10 miembros, **When** el owner intenta invitar a un miembro 11, **Then** ve mensaje "alcanzaste el máximo de miembros".
6. **Given** un workspace compartido, **When** dos miembros editan el mismo gasto en simultáneo, **Then** el último que guarda gana, y el otro ve toast "este gasto fue modificado por X mientras editabas — tus cambios no se guardaron".
7. **Given** un usuario miembro de un workspace compartido, **When** intenta borrar su cuenta, **Then** la app le permite hacerlo (sus gastos quedan en el workspace marcados como "Usuario eliminado"), salvo que sea owner del workspace, en cuyo caso debe transferir o borrar el workspace primero.

---

### User Story 8 — Importar gastos viejos desde Excel (Priority: P3)

Como usuario que ya tenía un Excel con los gastos de mi casa anterior, quiero importarlo todo de una vez sin retipear.

**Why this priority**: Reduce fricción de migración y desbloquea el caso de uso "consolidar histórico". Pero no bloquea el uso de la app desde cero.

**Independent Test**: Un usuario descarga el template Excel, lo completa con 50 filas (incluyendo categorías y vendors nuevos), lo sube, ve preview con errores marcados en rojo, confirma, y los 50 gastos quedan cargados en el workspace.

**Acceptance Scenarios**:

1. **Given** la sección de import, **When** el usuario hace click en "descargar template", **Then** obtiene un archivo .xlsx con 9 columnas y 1 fila de ejemplo.
2. **Given** un Excel completado, **When** el usuario lo sube, **Then** ve preview con todas las filas, errores en rojo (filas inválidas), y conteo "X válidas, Y con error".
3. **Given** una fila con categoría que no existe, **When** se hace el import, **Then** se crea la categoría on-the-fly con color asignado por defecto.
4. **Given** una fila con monto vacío o moneda inválida, **When** se hace el import, **Then** esa fila queda en error y no se importa, pero el resto sí.
5. **Given** una fila en USD sin tasa, **When** se hace el import, **Then** se usa la tasa del día de la fecha del gasto (no la del día actual).

---

### User Story 9 — Exportar a CSV (Priority: P3)

Como usuario quiero descargar mis gastos en CSV para llevarlos al contador, archivar, o procesarlos en Excel.

**Why this priority**: Fundamental para confianza ("mis datos no están atrapados"), pero no bloquea uso diario.

**Independent Test**: Un usuario aplica filtros (proyecto + rango de fechas) y descarga CSV — el archivo contiene exactamente los gastos visibles con todas las columnas relevantes (fecha, proyecto, categoría, vendor, descripción, monto, moneda, tasa, equivalentes).

**Acceptance Scenarios**:

1. **Given** la lista de gastos con filtros aplicados, **When** el usuario hace click "Exportar CSV", **Then** descarga un .csv con encabezado y filas que coinciden exactamente con la vista filtrada.
2. **Given** sin filtros, **When** se exporta CSV, **Then** se incluyen todos los gastos del workspace.
3. **Given** un gasto con descripción que contiene comas o saltos de línea, **When** se exporta, **Then** los campos quedan correctamente escapados según RFC 4180.

---

### User Story 10 — Instalar la app en el celular (PWA) y cambiar idioma (Priority: P3)

Como usuario quiero "instalar" la app en la pantalla de inicio de mi celu para abrirla rápido sin escribir URL, y poder usar la app en español por defecto pero alternar a inglés.

**Why this priority**: Mejora UX considerablemente, pero la app ya funciona en browser sin esto.

**Independent Test**: Desde Safari iOS o Chrome Android, el usuario ve un prompt o usa el menú "Add to Home Screen", y la app queda con icono propio. La app abre en modo standalone (sin barra de browser). Switch en settings cambia entre español e inglés y persiste.

**Acceptance Scenarios**:

1. **Given** la app en Chrome Android, **When** el usuario abre el menú del browser, **Then** ve opción "Instalar app" funcional.
2. **Given** la app instalada, **When** el usuario la abre desde el ícono, **Then** se abre en modo standalone sin barra de browser, y opera idénticamente a la versión web.
3. **Given** un browser con idioma inglés, **When** un usuario nuevo accede, **Then** la UI aparece en inglés.
4. **Given** un usuario con UI en español, **When** cambia el idioma a inglés en settings, **Then** la UI cambia inmediatamente y persiste tras refresh.

---

### Edge Cases

- **Cotización del día no disponible**: la app muestra warning visible al cargar gastos en USD y obliga a tasa manual. Reintenta automáticamente al día siguiente.
- **Usuario sin internet** (intermitente): lecturas iniciales del shell de la app cargan desde cache; mutaciones (cargar gasto) requieren conexión y muestran estado pendiente con retry automático.
- **Borrar categoría con gastos asociados**: cascade — los gastos asociados también se borran. Confirmación requiere typear el nombre de la categoría.
- **Borrar proyecto con gastos**: cascade — todos los gastos del proyecto se borran. Confirmación con doble paso.
- **Borrar workspace**: solo owner. Cascade total. Confirmación requiere typear el nombre del workspace.
- **Editar un gasto recurrente futuro vs ya creado**: fuera de scope MVP (recurrentes son v1.1).
- **Excel con encoding raro o columnas faltantes**: se rechaza el archivo entero con mensaje claro indicando qué falta.
- **Excel con >1000 filas**: se aceptan, pero el preview se pagina y el import muestra progress bar.
- **Edición concurrente en workspace compartido**: last-write-wins. La UI del miembro perdedor muestra toast con quién pisó el cambio.
- **Cambio de email de un miembro**: no se permite desde la app (delegado al provider de auth). El email del miembro queda como display name.
- **Proyecto con presupuesto solo en ARS y gastos en USD**: la app muestra "USD: X (sin presupuesto definido)" sin barra de progreso; barras solo aparecen si hay presupuesto en esa moneda.
- **Owner intenta abandonar un workspace compartido del que es único owner**: bloqueado. Debe transferir ownership primero o borrar el workspace.

## Requirements *(mandatory)*

### Functional Requirements

#### Auth & Onboarding

- **FR-001**: El sistema DEBE permitir registro con email + password o magic link.
- **FR-002**: Al registrarse exitosamente, el sistema DEBE crear automáticamente un workspace personal "Mi espacio" con el set seed de categorías predefinidas.
- **FR-003**: El sistema DEBE soportar recovery de password vía email.
- **FR-004**: El sistema DEBE bloquear el borrado de cuenta si el usuario es owner único de algún workspace compartido.

#### Workspaces

- **FR-005**: El sistema DEBE permitir a un usuario crear workspaces compartidos adicionales además del personal.
- **FR-006**: El sistema DEBE mostrar un selector de workspace activo en la barra lateral con persistencia del último seleccionado.
- **FR-007**: El sistema DEBE soportar dos roles por workspace: `owner` (todos los permisos) y `editor` (CRUD de gastos/proyectos/categorías/vendors pero no manejo de miembros ni borrado de workspace).
- **FR-008**: El sistema DEBE limitar a 10 el número máximo de miembros por workspace.
- **FR-009**: El sistema DEBE permitir transferir ownership a otro miembro existente.

#### Invitaciones

- **FR-010**: El sistema DEBE permitir invitar por email con generación de magic link de aceptación.
- **FR-011**: El sistema DEBE proveer link copiable como alternativa al email.
- **FR-012**: La invitación DEBE expirar a los 7 días desde creación, con opción de reenvío.
- **FR-013**: Al aceptar una invitación, si el invitado no tiene cuenta, el sistema DEBE crearla automáticamente y unirlo al workspace.

#### Proyectos

- **FR-014**: El sistema DEBE permitir crear proyectos con nombre, tipo (renovación / general / otro), fechas opcionales y presupuesto opcional en ARS y/o USD.
- **FR-015**: El sistema DEBE permitir archivar proyectos sin borrarlos (mantienen sus gastos en totales globales pero no aparecen en dropdown de nuevo gasto).
- **FR-016**: El sistema DEBE permitir borrar proyectos con confirmación de doble paso (cascade a gastos).
- **FR-017**: El sistema DEBE soportar el caso "Generales" como gastos sin proyecto asignado.

#### Gastos

- **FR-018**: El sistema DEBE permitir registrar un gasto con: monto, moneda (ARS o USD), descripción opcional, fecha de pago, proyecto opcional, categoría obligatoria, vendor opcional, notas opcionales, archivo adjunto opcional.
- **FR-019**: Para gastos en USD, el sistema DEBE auto-completar la tasa de cambio con la cotización oficial del día (editable por el usuario antes de guardar).
- **FR-020**: Al guardarse, el sistema DEBE calcular y persistir snapshot inmutable de: monto, moneda, tasa de cambio usada, equivalente en ARS, equivalente en USD.
- **FR-021**: El sistema NUNCA DEBE recalcular el equivalente histórico de un gasto al cambiar la cotización del día.
- **FR-022**: El sistema DEBE permitir editar gastos con last-write-wins en workspaces compartidos.
- **FR-023**: El sistema DEBE permitir borrar gastos con confirmación simple.

#### Categorías y Vendors

- **FR-024**: El sistema DEBE seedear 8 categorías default al crear cada workspace: Materiales, Mano de obra, Servicios, Impuestos, Comida, Transporte, Herramientas, Otros.
- **FR-025**: El sistema DEBE permitir CRUD de categorías custom (nombre, color, icono).
- **FR-026**: El sistema DEBE permitir CRUD de vendors con autocomplete al cargar gasto.
- **FR-027**: Borrar una categoría o vendor con gastos asociados DEBE eliminar también los gastos en cascade, requiriendo confirmación explícita.

#### FX Rates

- **FR-028**: El sistema DEBE obtener diariamente la cotización oficial USD/ARS desde una fuente pública confiable y almacenarla.
- **FR-029**: Si la cotización del día no se pudo obtener, el formulario de gasto en USD DEBE bloquear el guardado hasta que el usuario ingrese una tasa manual.
- **FR-030**: El sistema NUNCA DEBE permitir editar tasas históricas almacenadas (immutable).

#### Dashboard

- **FR-031**: La pantalla principal DEBE mostrar: total ARS + total USD del workspace, lista de proyectos con barras vs presupuesto, distribución por categoría (chart), evolución mensual (chart 12 meses), top 5 vendors, últimos 10 gastos.
- **FR-032**: El dashboard DEBE responder a filtros globales: rango de fechas, proyecto, categoría, vendor, moneda.

#### Búsqueda y Filtros

- **FR-033**: El sistema DEBE permitir búsqueda full-text por descripción del gasto y nombre de vendor.
- **FR-034**: El sistema DEBE permitir filtros combinables: rango de fechas, proyecto, categoría, vendor, moneda.
- **FR-035**: Los filtros activos DEBEN persistir en la URL para compartir / refresh / volver atrás.

#### Import / Export

- **FR-036**: El sistema DEBE proveer un template Excel descargable con 9 columnas: `fecha | proyecto | categoria | vendor | descripcion | moneda | monto | fx_rate | nota`.
- **FR-037**: El sistema DEBE validar el Excel subido fila por fila, mostrar preview con errores marcados, e importar solo las filas válidas tras confirmación del usuario.
- **FR-038**: Categorías y vendors no existentes en una fila válida DEBEN crearse automáticamente al importar.
- **FR-039**: Para filas en USD sin `fx_rate`, el sistema DEBE usar la cotización oficial almacenada para la fecha del gasto. Si no hay cotización para esa fecha, la fila se marca como inválida.
- **FR-040**: El sistema DEBE permitir exportar a CSV la vista actual de gastos (con filtros aplicados o sin ellos), siguiendo RFC 4180 para escape de campos.

#### i18n

- **FR-041**: El sistema DEBE soportar idiomas español (default) e inglés.
- **FR-042**: El sistema DEBE auto-detectar idioma del browser en primera visita (es-* → español, otros → inglés).
- **FR-043**: El usuario DEBE poder cambiar el idioma desde settings con persistencia.

#### PWA

- **FR-044**: El sistema DEBE ser instalable como PWA en iOS, Android y desktop modernos (manifest + icons + service worker).
- **FR-045**: La app DEBE cargar el shell offline desde cache (lectura mínima sin conexión); las mutaciones requieren conexión.

#### Settings

- **FR-046**: El sistema DEBE proveer una pantalla de settings con: perfil (nombre, idioma), gestión de workspaces (crear/borrar/abandonar/transferir), gestión de miembros por workspace (invitar/remover/cambiar rol), cambio de email/password, borrado de cuenta.

### Key Entities

- **Workspace**: contenedor multi-tenant. Personal (auto-creado) o compartido (creado por owner). Tiene nombre, tipo, dueño.
- **Workspace Member**: relación usuario-workspace con rol (owner | editor) y fecha de unión.
- **Invitation**: invitación pendiente con email, rol, token, fecha de expiración (7d).
- **Project**: contenedor de gastos dentro de un workspace. Tiene nombre, tipo, fechas opcionales, presupuestos opcionales (ARS/USD), estado (activo/archivado).
- **Category**: clasificación de gasto, dentro de un workspace. Custom + default seed. Atributos: nombre, color, icono.
- **Vendor**: proveedor o contratista, dentro de un workspace. Atributos: nombre, contacto opcional.
- **Expense**: registro de gasto. Pertenece a un workspace, opcionalmente a un proyecto, con categoría obligatoria y vendor opcional. Snapshot inmutable de monto + currency + fx_rate + equivalentes ARS/USD. Adjunto opcional. Autor (`created_by`).
- **Daily FX Rate**: cotización oficial diaria. Una fila por fecha. Inmutable.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario nuevo puede registrarse, crear un proyecto, y cargar su primer gasto en menos de **2 minutos** desde cualquier dispositivo.
- **SC-002**: La carga de un gasto desde el formulario hasta verlo reflejado en el total del proyecto toma menos de **2 segundos** en conexión 4G estándar.
- **SC-003**: El dashboard del workspace carga visiblemente en menos de **1.5 segundos** en conexión 4G con hasta 1000 gastos.
- **SC-004**: El **95%** de los gastos cargados desde el celular se guardan al primer intento sin errores de UX.
- **SC-005**: Importar un Excel con **500 filas válidas** completa la operación en menos de **30 segundos**.
- **SC-006**: La búsqueda full-text devuelve resultados en menos de **500 ms** con hasta 5000 gastos.
- **SC-007**: Los totales `amount_ars` y `amount_usd` reportados por el dashboard son **idénticos** a la suma manual de los gastos individuales (precisión 100%).
- **SC-008**: La conversión multi-moneda mantiene los montos históricos sin desviación frente a cambios futuros de la cotización (snapshot verificable).
- **SC-009**: Un invitado a un workspace compartido puede aceptar la invitación y cargar su primer gasto en el workspace en menos de **3 minutos** desde el click inicial del email.
- **SC-010**: La app es instalable como PWA y abre en modo standalone en iOS Safari, Chrome Android y Chrome desktop sin errores de manifest.
- **SC-011**: La app cumple WCAG 2.1 nivel AA en todas las pantallas críticas (login, dashboard, formulario de gasto, lista, detalle).
- **SC-012**: La cobertura i18n es del **100%** — ningún string user-visible aparece sin traducir en ninguno de los idiomas soportados.

## Assumptions

- El usuario tiene email válido para signup e invitaciones.
- Existe una fuente pública confiable para la cotización oficial USD/ARS (asumimos disponibilidad básica con fallback a tasa manual si falla).
- El usuario opera principalmente desde un dispositivo a la vez (no hay requirement de sync multi-device en tiempo real más allá de last-write-wins).
- Los gastos son de uso doméstico/personal, no requieren facturación electrónica AFIP ni integración fiscal.
- El volumen esperado por workspace es de hasta 5000 gastos en el horizonte de 1-2 años.
- Mobile y desktop conviven en un solo codebase responsive (no hay app nativa).
- Idiomas iniciales son ES y EN; otros (PT, etc.) se evalúan post-MVP.
- OCR de recibos, recurrentes, etapas de obra, PDF export, dark mode, alertas de presupuesto y offline writes son features explícitamente fuera del MVP (planificadas para v1.1 / v2.0).
- La precisión del snapshot FX se considera adecuada con 6 decimales en la tasa y 2 en los montos derivados.
- El usuario acepta hard delete con cascade como comportamiento estándar (decisión congelada en constitution v1.0.0).
