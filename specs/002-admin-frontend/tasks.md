# Tasks: Frontend administrativo SaaS

**Input**: Design documents from `/specs/002-admin-frontend/`

**Prerequisites**: spec.md, plan.md, research.md, design-system.md, contracts/api-usage.md, quickstart.md

**Tests**: no se generan tareas de prueba automatizada de frontend. El proyecto no tiene runner y la spec no lo pide;
la decisión y su justificación están en research.md D11. La verificación es el guion de `quickstart.md` más el arnés de
render headless. La suite del backend (246 pruebas) debe seguir en verde y se comprueba al cerrar cada fase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: puede ejecutarse en paralelo con otras marcadas — ficheros distintos, sin dependencia pendiente
- **[US#]**: historia de usuario que cierra, según spec.md

## Path Conventions

Todo bajo `frontend/src/`. **No se modifica `backend/`** (plan.md → *Cambios en backend*).

---

## Nota sobre el orden de las fases

Las fases 3, 4 y 5 se han reagrupado respecto al enunciado original **por dependencia real entre entidades**:

- **Grupos** pasa de la fase 3 a la 4: un grupo exige asignatura y profesor existentes (`subject_id` obligatorio), así
  que no puede construirse antes que ellos.
- **Pagos** pasa de la fase 4 a la 5: un pago se asocia a una matrícula, y la matrícula se construye en la fase 4.

El contenido total es idéntico; solo cambia el reparto, de modo que cada fase se pueda probar de verdad al terminarla.
Informes queda fuera del MVP por decisión explícita y no genera ninguna tarea (spec.md → *Future Features*).

---

## Fase 1: Cimientos y shell (US1)

**Objetivo**: la aplicación arranca, se entra con los tres roles, cada uno aterriza donde debe y el shell responde en
todos los anchos. Es la fase que fija el marco del que cuelga todo lo demás.

**Independent Test**: escenarios 1 y 2 de `quickstart.md` completos con las cinco cuentas sembradas.

### 1a. Limpieza y sistema visual

- [ ] T001 Retirar el concepto público: borrar `pages/PublicHomePage.jsx`, `CentrePage.jsx`, `ServicesPage.jsx`, `MethodPage.jsx`, `ContactPage.jsx`, `components/PublicLayout.jsx`, `content/publicContent.js`, `App.css` y `assets/hero.png`, `assets/react.svg`, `assets/vite.svg`
- [ ] T002 Crear `styles/tokens.css` con los tokens de color, tipografía, espaciado, radio, sombra y layout de design-system.md §1–§4
- [ ] T003 Crear `styles/base.css` con reset, elementos base, foco visible global y `prefers-reduced-motion`
- [ ] T004 [P] Incorporar Inter como fuente local en `public/fonts/` (woff2, grosores 400/500/600/700) y declararla con `@font-face` y `font-display: swap` — sin peticiones externas (FR-058)
- [ ] T005 Sustituir `index.css` por la nueva base y eliminar el `@import` de Google Fonts y la paleta verde del concepto anterior
- [ ] T006 Actualizar `frontend/index.html`: `lang="es"`, título de la aplicación y color de tema (FR-053)

### 1b. Catálogo de textos

- [ ] T007 Crear `i18n/index.js` con `t(clave, params)`: resolución sobre objeto anidado, interpolación por parámetro con nombre, aviso en consola en desarrollo y degradación a la clave en producción (FR-066, FR-071, FR-072)
- [ ] T008 Añadir a `i18n/index.js` los formateadores `formatDate`, `formatTime`, `formatNumber` y `formatCurrency` sobre `Intl`, con la configuración regional del idioma activo (FR-073)
- [ ] T009 Crear `i18n/locales/es.js` con el espacio `common` — guardar, cancelar, eliminar, confirmar, buscar, cargando, sin resultados, reintentar, acciones, valor vacío (FR-067)
- [ ] T010 [P] Sembrar `i18n/locales/es.js` con los espacios `auth`, `nav`, `dashboard` y los estados de dominio (asistencia, pago, organización, activo/inactivo), tomando como material las etiquetas ya validadas de `config/modules.js`

### 1c. Cliente de API y sesión

- [ ] T011 Reescribir `lib/api.js` sobre el axios actual: `Accept: application/json` siempre (FR-062) e interceptor que normaliza todo error a `{ status, message, fieldErrors }` (research.md D5)
- [ ] T012 Añadir al interceptor el tratamiento de 401 —cerrar sesión y llevar a `/login` conservando el destino— y distinguir `CanceledError` de un error real, para no mostrar error por una cancelación deliberada (FR-007, D4)
- [ ] T013 Crear `lib/auth.js` con la persistencia del token y su restauración al arrancar (FR-006)
- [ ] T014 Adaptar `context/SessionContext.jsx`: cargar `/me`, exponer usuario, roles y organización activa, y el cierre de sesión contra `POST /logout` (FR-008, FR-021)
- [ ] T015 Crear `lib/permissions.js` con la matriz de secciones y acciones por rol, reproduciendo la de contracts/api-usage.md §7 (FR-004, D7)

### 1d. Primitivas de interfaz

- [ ] T016 [P] `components/ui/Button.jsx`: variantes primary, secondary, ghost, danger; estado de carga que conserva el ancho y deshabilita (FR-036)
- [ ] T017 [P] `components/ui/Field.jsx` más `Input`, `Select` y `Textarea`: etiqueta asociada, texto de ayuda y error enlazados con `aria-describedby`, `aria-invalid` y `aria-required` (FR-032, FR-033)
- [ ] T018 [P] `components/ui/Badge.jsx` con los cinco tonos y la correspondencia de estados de design-system.md §5 — siempre con texto (FR-051)
- [ ] T019 [P] `components/ui/Card.jsx` y `components/ui/Spinner.jsx`
- [ ] T020 `components/ui/Modal.jsx`: foco atrapado, cierre con `Escape` y al pulsar fuera, devolución del foco al disparador, `role="dialog"` y `aria-modal` (FR-049)
- [ ] T021 `components/ui/Drawer.jsx` sobre la misma base de foco y cierre que Modal (FR-019)
- [ ] T022 [P] `components/ui/Dropdown.jsx` navegable con teclado
- [ ] T023 `context/ToastContext.jsx` y `components/ui/Toast.jsx` con región `aria-live` — `polite` en general, `assertive` en errores (FR-045, FR-046)
- [ ] T024 [P] `components/ui/Pagination.jsx`: anterior, siguiente, posición y total; oculto con una sola página (FR-027)
- [ ] T025 [P] `components/ui/SearchInput.jsx` con retardo de escritura y botón de limpiar
- [ ] T026 [P] `components/data/EmptyState.jsx`, `ErrorState.jsx` y `LoadingState.jsx`, visualmente distinguibles entre sí; el vacío distingue inicial de búsqueda sin resultados (FR-041, FR-043, FR-044)
- [ ] T027 `components/data/ConfirmDialog.jsx` sobre Modal, nombrando qué se elimina (FR-035)

### 1e. Shell y enrutado

- [ ] T028 `components/layout/Sidebar.jsx`: secciones filtradas por `lib/permissions.js`, sección activa marcada sin depender solo del color (FR-004, FR-020)
- [ ] T029 `components/layout/Header.jsx`: organización activa, identidad y rol, cierre de sesión y botón de navegación en anchos estrechos (FR-021)
- [ ] T030 [P] `components/layout/Breadcrumbs.jsx` (FR-022)
- [ ] T031 `components/layout/AppShell.jsx`: barra lateral fija en escritorio y panel deslizante por debajo de `--bp-sidebar`, con la capa de oscurecimiento (FR-018)
- [ ] T032 Reescribir `pages/LoginPage.jsx`: un solo campo de usuario o correo, sin recuperación ni registro, errores del servidor junto al formulario (FR-010, FR-011, FR-013)
- [ ] T033 Reescribir `App.jsx`: rutas en español, guarda de autenticación con destino conservado, y redirección por rol —`super_admin` a `/organizaciones`, el resto a `/dashboard`— (FR-002, FR-003, FR-005)
- [ ] T034 Añadir en `App.jsx` la guarda por rol: una sección no permitida redirige a la ruta de inicio del rol, no muestra un 403 sin tratar (FR-004)
- [ ] T035 Retirar las rutas del concepto anterior y sus redirecciones francesas, sustituyéndolas por el destino que corresponda según haya sesión (FR-009)

**Checkpoint 1**: `npm run build` limpio · escenarios 1 y 2 de quickstart completos · shell sin desbordamiento en los diez anchos · `php artisan test` en verde.

---

## Fase 2: Dashboard (US2)

**Objetivo**: la pantalla de aterrizaje operativa para las dos variantes.

**Independent Test**: escenario 3 de `quickstart.md`.

- [ ] T036 [US2] Crear `hooks/useDashboard.js`: una sola petición a `GET /dashboard`, con sus tres estados (FR-014, FR-015)
- [ ] T037 [US2] `components/dashboard/StatCard.jsx`, con enlace a la sección cuando exista equivalente (FR-017)
- [ ] T038 [US2] `components/dashboard/RecentPanel.jsx`: bloque de actividad reciente con estado vacío propio y enlace a su sección (FR-017, FR-043)
- [ ] T039 [US2] `pages/DashboardPage.jsx` con la variante de administración: 5 indicadores y los bloques de alumnos, sesiones y pagos recientes
- [ ] T040 [US2] Variante de profesor: 3 indicadores, sus grupos, próximas sesiones y asistencia reciente, eligiendo por el campo `role` de la respuesta y no por los roles del usuario (FR-016)
- [ ] T041 [US2] Aviso de cuenta de profesor sin ficha vinculada, distinguible de «no hay datos» (US2.3)
- [ ] T042 [P] [US2] Añadir el espacio `dashboard` completo a `i18n/locales/es.js`

**Checkpoint 2**: escenario 3 completo · una sola petición verificada en la pestaña de red · dashboard sin desbordamiento a 360 px.

---

## Fase 3: Alumnos, tutores, profesores y asignaturas (US3, US4)

**Objetivo**: primera aplicación real del patrón de listado con formulario, y las entidades que habilitan las fases
siguientes.

**Independent Test**: escenarios 4 y 5 de `quickstart.md` sobre estas cuatro secciones.

### 3a. Patrón compartido

- [ ] T043 `hooks/useResourceList.js`: paginación contra servidor con tope de 50, búsqueda que reinicia a la página 1, cancelación con `AbortController` y los tres estados (FR-023, FR-025, FR-065)
- [ ] T044 `hooks/useResourceForm.js`: envío, reparto de los errores 422 campo a campo, foco al primer campo con error y bloqueo de doble envío (FR-030, FR-031, FR-036)
- [ ] T045 `components/data/DataTable.jsx`: barra de herramientas, tabla, paginación, y los cuatro estados. La caja de búsqueda solo se renderiza si la pantalla la declara soportada (FR-024)
- [ ] T046 Añadir a `DataTable` la representación por tarjetas, con el cambio de forma decidido por el ancho **del propio contenedor** mediante `ResizeObserver`, no por ancho de ventana (FR-028, FR-060, D8)
- [ ] T047 `components/data/ResourcePage.jsx`: compone `DataTable`, formulario en `Drawer`, `ConfirmDialog` y avisos, dejando a cada pantalla sus columnas, campos y permisos

### 3b. Pantallas

- [ ] T048 [US3] `pages/students/`: listado con búsqueda, formulario con los 11 campos y sus obligatorios, borrado confirmado (contracts §3)
- [ ] T049 [US3] Recorte de solo lectura para el profesor en alumnos: sin acciones de crear, editar ni borrar (US3.4)
- [ ] T050 [P] [US3] `pages/guardians/`: listado con búsqueda y formulario de 7 campos
- [ ] T051 [P] [US4] `pages/teachers/`: listado con búsqueda y formulario de 6 campos
- [ ] T052 [P] [US4] `pages/subjects/`: listado con búsqueda y formulario de 5 campos, con la tarifa mensual formateada como importe (FR-073, SC-010)
- [ ] T053 [P] [US3] [US4] Añadir los espacios `students`, `guardians`, `teachers` y `subjects` a `i18n/locales/es.js`

**Checkpoint 3**: escenarios 4 y 5 sobre estas secciones · el profesor ve alumnos en lectura y no alcanza profesores ni asignaturas · tablas en tarjetas a 360 px.

---

## Fase 4: Grupos, matrículas, sesiones y asistencia (US5, US6)

**Objetivo**: las entidades con relaciones, y el flujo diario del profesor, que es el que más exige del diseño móvil.

**Independent Test**: escenario 6.4 de `quickstart.md` — asistencia completa desde 360 px.

- [ ] T054 `components/ui/RelationSelect.jsx`: desplegable alimentado de otro recurso, acotado a la organización activa y con su propio estado de carga (FR-034)
- [ ] T055 [US5] `pages/groups/`: listado con búsqueda y formulario con asignatura y profesor por `RelationSelect`, capacidad y estado
- [ ] T056 [US5] Recorte de solo lectura para el profesor en grupos, mostrando solo los que imparte (US5.3)
- [ ] T057 [US5] `pages/enrollments/`: listado **sin caja de búsqueda** (FR-024), formulario con alumno y grupo, cuota y estado
- [ ] T058 [US6] `pages/sessions/`: listado **sin búsqueda**, formulario con grupo, título, fecha, horas y aula. Normalizar `H:i` al enviar y `HH:MM:SS` al recibir (contracts §3)
- [ ] T059 [US6] Acotar el desplegable de grupo en sesiones a los que imparte el profesor (US6.1)
- [ ] T060 [US6] `pages/attendance/`: listado **sin búsqueda** y registro con los tres estados, distinguidos por color **y** texto (FR-051)
- [ ] T061 [US6] Optimizar el registro de asistencia para móvil: es la pantalla de uso diario del profesor y la referencia de SC-002
- [ ] T062 [P] [US5] [US6] Añadir los espacios `groups`, `enrollments`, `sessions` y `attendance` a `i18n/locales/es.js`

**Checkpoint 4**: registrar asistencia de un grupo completo a 360 px sin desplazamiento horizontal · ninguna de las cuatro secciones muestra caja de búsqueda.

---

## Fase 5: Pagos, cuentas y organizaciones (US7, US8, US9)

**Objetivo**: cerrar el ciclo económico y la administración de cuentas y plataforma.

**Independent Test**: escenarios 5.4, 5.6, 5.7 y 5.8 de `quickstart.md`.

- [ ] T063 [US7] `pages/payments/`: listado **sin búsqueda**, formulario con alumno, tutor, matrícula, importe, periodo, fecha, forma de pago y estado
- [ ] T064 [US7] Acotar el desplegable de matrícula a las del alumno seleccionado (US7.1)
- [ ] T065 [US7] Formatear todos los importes con separador de millar y dos decimales (SC-010)
- [ ] T066 [US8] `pages/users/`: listado con búsqueda, formulario con rol y contraseña opcional al editar. Los roles ofrecidos dependen de quién crea (contracts §4)
- [ ] T067 [US8] Vinculación de cuenta de profesor con su ficha mediante `teacher_id` (US8.2)
- [ ] T068 [US9] `pages/organizations/`: listado con búsqueda, formulario y `users_count`. **No** intentar mostrar ningún otro recuento (US9.3)
- [ ] T069 [US9] Acciones de suspender y activar, con el estado presentado como eje independiente del borrado lógico (contracts §5)
- [ ] T070 [US9] Pantalla de cuentas de una organización para la plataforma, usando el filtro `organization_id` de `/users` — el único filtro de la API (contracts §4)
- [ ] T071 [US9] Mostrar tal cual el mensaje del servidor al intentar eliminar una organización con cuentas activas (US9.2)
- [ ] T072 [P] [US7] [US8] [US9] Añadir los espacios `payments`, `users` y `organizations` a `i18n/locales/es.js`
- [ ] T073 Pantalla explicativa para organización suspendida o eliminada, a partir del 403 del servidor, en lugar de un error genérico repetido en cada bloque (Edge cases)

**Checkpoint 5**: el profesor no ve ningún importe en toda la aplicación · el `super_admin` no alcanza ninguna sección de negocio.

---

## Fase 6: Auditoría transversal

**Objetivo**: cerrar los criterios de éxito que solo pueden comprobarse sobre la aplicación completa.

- [ ] T074 Barrido de las diez anchuras sobre todas las pantallas con el arnés de iframe y render headless; desbordamiento 0 en todas (SC-003)
- [ ] T075 Auditoría de teclado: recorrido completo, sin trampas de foco, orden de foco igual al visual (FR-047, SC-005)
- [ ] T076 Auditoría de contraste con analizador automático, con atención a los tres colores de estado que no valen como texto sobre blanco (FR-050, SC-006, design-system.md §1)
- [ ] T077 Auditoría con lector de pantalla: etiquetas, avisos anunciados, diálogos e imágenes decorativas (FR-046, FR-049, FR-052)
- [ ] T078 Provocar deliberadamente los tres estados —carga, vacío, error— en cada vista con datos remotos y comprobar que son distinguibles (FR-041, SC-008)
- [ ] T079 Barrido automático de literales en posición de contenido fuera de `src/i18n/`; cero resultados (FR-066, SC-012)
- [ ] T080 Comprobar con un catálogo de prueba desechable que añadir un idioma no exige tocar ningún componente (FR-070, SC-013)
- [ ] T081 Revisar la pestaña de red en un recorrido completo: ninguna petición fuera del Apéndice A, ningún `organization_id` en escrituras, ninguna petición a dominio externo (SC-009, SC-011, FR-063)
- [ ] T082 Revisión visual completa contra design-system.md: ningún color, espaciado ni radio suelto fuera de los tokens (FR-054)
- [ ] T083 Evaluar por escrito si procede introducir un runner de pruebas de frontend, con su justificación según el Principio IV (research.md D11)
- [ ] T084 Actualizar `specs/001-multi-org-tenancy/plan.md`: la desviación XII.a queda saldada en su parte de frontend
- [ ] T085 Ejecutar `php artisan test` y confirmar las 246 pruebas en verde — cualquier fallo indica que se tocó backend sin querer

**Checkpoint final**: quickstart completo con los tres roles · build limpio · backend en verde.

---

## Dependencias

```
Fase 1 ──> Fase 2 ──┐
   │                ├──> Fase 4 ──> Fase 5 ──> Fase 6
   └──> Fase 3 ─────┘
```

- La **fase 1 bloquea todo**: tokens, catálogo, cliente de API, sesión y primitivas.
- Las fases 2 y 3 son independientes entre sí una vez cerrada la 1.
- La **fase 4 exige la 3**: un grupo necesita asignatura y profesor; una sesión necesita grupo.
- La **fase 5 exige la 4**: un pago se asocia a una matrícula.
- La **fase 6 exige todo lo anterior**, porque audita el conjunto.

Dentro de la fase 3, T043 a T047 bloquean T048 a T053: el patrón compartido antes que las pantallas.

## Paralelismo

- **T004** con T002–T003; **T016–T019, T022, T024–T026** entre sí; **T030** con T028–T029.
- **T050, T051, T052** entre sí una vez cerrado T047.
- Las tareas de catálogo marcadas [P] pueden ir con las pantallas de su fase.

## Resumen

| Fase | Tareas | Historias |
|---|---|---|
| 1 — Cimientos y shell | T001–T035 (35) | US1 |
| 2 — Dashboard | T036–T042 (7) | US2 |
| 3 — Alumnos, tutores, profesores, asignaturas | T043–T053 (11) | US3, US4 |
| 4 — Grupos, matrículas, sesiones, asistencia | T054–T062 (9) | US5, US6 |
| 5 — Pagos, cuentas, organizaciones | T063–T073 (11) | US7, US8, US9 |
| 6 — Auditoría transversal | T074–T085 (12) | todas |
| **Total** | **85** | **9** |

**Alcance mínimo demostrable**: fases 1 y 2. Con ellas se entra con los tres roles y se ve el estado del centro, que es
ya una aplicación coherente aunque no permita editar.
