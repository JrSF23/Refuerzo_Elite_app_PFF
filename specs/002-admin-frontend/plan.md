# Implementation Plan: Frontend administrativo SaaS

**Branch**: `002-admin-frontend` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-frontend/spec.md`

---

## Summary

Se sustituye el frontend actual —un sitio vitrina para un único centro— por una aplicación administrativa para el
personal de los centros. El backend **no se toca**: la feature expone la superficie de API ya inventariada y verificada
en el Apéndice A de la spec, y no introduce endpoints, migraciones ni cambios de autorización.

El trabajo tiene tres capas y se ordena por dependencia, no por dominio:

1. **Cimientos** — sistema visual con tokens, catálogo de textos con `t()`, cliente de API con tratamiento uniforme de
   errores, sesión, enrutado por rol y app shell. Todo lo demás cuelga de aquí.
2. **Primitivas de interfaz** — un juego pequeño de componentes (tabla, formulario, diálogo, estados) que resuelven de
   una vez la paginación, la búsqueda, la representación móvil, los estados de carga, vacío y error, y la accesibilidad.
   Escribirlos una vez es lo que evita repetir nueve veces los mismos defectos.
3. **Pantallas** — dashboard y las once secciones de datos, construidas sobre las primitivas.

De las once secciones, nueve son listado con formulario y comparten estructura. La palanca de esfuerzo de esta feature
está en la calidad de las primitivas, no en el número de pantallas.

## Technical Context

**Language/Version**: JavaScript (ES2022), React 19.2

**Primary Dependencies**: react-router-dom 7.13, axios 1.14, Vite 8, y `@fontsource-variable/inter` 5.3.0 como único
añadido —solo ficheros de fuente, ningún código; ver Complexity Tracking—. **No se añade ninguna librería**: ni de
componentes, ni de estado, ni de formularios, ni de i18n, ni de tablas.

**Storage**: N/A en el frontend. El token de sesión sigue en el almacenamiento del navegador, como hoy.

**Testing**: verificación manual guiada por `quickstart.md` contra el stack Docker, y render headless con Chrome para
las comprobaciones de ancho y desbordamiento, que es el método que ya se usó y que en la feature anterior corrigió dos
conclusiones equivocadas. El proyecto no tiene hoy runner de pruebas de frontend; introducirlo se evalúa en la Fase 6 y
no se da por supuesto.

**Target Platform**: navegadores actuales de escritorio y móvil. Referencia mínima de ancho: 360 px.

**Project Type**: aplicación web con frontend y backend separados. Solo se modifica `frontend/`.

**Performance Goals**: dashboard utilizable en una sola petición; cada listado, una petición por página. Sin recorridos
de páginas en cliente (FR-015).

**Constraints**: paginación máxima de 50 registros por página impuesta por la API; sin ordenamiento ni filtros de
servidor; sin peticiones a dominios externos, lo que incluye la tipografía (FR-058).

**Scale/Scope**: 3 roles, 12 pantallas principales, 11 entidades. Un solo idioma funcional.

## Constitution Check

Constitución `.specify/memory/constitution.md`, v1.1.0. Se evalúan las once puertas de calidad.

| Puerta | Criterio | Estado | Justificación |
|---|---|---|---|
| 1 | Necesidad real y rol que la solicita | **PASS** | El producto dejó de ser un centro único y pasó a SaaS administrativo en la feature 001. El frontend seguía siendo el del concepto anterior. Los roles que la solicitan son `org_admin` y `teacher`. |
| 2 | Necesaria para el piloto | **PASS** | Sin interfaz administrativa usable no hay piloto que instalar. Informes queda fuera precisamente por aplicar el Principio II. |
| 3 | Reutilización documentada | **PASS** | Se reutilizan la API completa, el modelo de sesión, el cliente axios, el patrón de tabla apilada del T107 y la definición de módulos como fuente de campos. Ver *Reutilización*. |
| 4 | Sin capas no justificadas (**NO NEGOCIABLE**) | **PASS con dos entradas registradas** | Ninguna librería nueva. Las dos únicas adiciones están justificadas por escrito en *Complexity Tracking*: el catálogo de textos, que exige la puerta 11 y se resuelve con un objeto y una función, y `@fontsource-variable/inter`, que solo distribuye ficheros de fuente y ningún código. |
| 5 | Prueba de aislamiento entre organizaciones (**NO NEGOCIABLE**) | **PASS (por herencia, sin regresión)** | La feature **no toca backend**, donde vive el aislamiento y sus 21 ficheros de prueba. El frontend nunca envía `organization_id` en escrituras de negocio (FR-063). La suite del backend debe seguir en verde al cerrar cada fase. |
| 6 | Verificada a 360 px | **PASS por diseño** | FR-028 prohíbe el desplazamiento horizontal, SC-003 lo mide y la Fase 6 lo audita. La verificación es por render headless, no por inspección visual. |
| 7 | Sin coste recurrente | **PASS** | Ninguna dependencia ni servicio de pago. La tipografía se sirve localmente, lo que además elimina la petición a un tercero. |
| 8 | Validación en servidor y transacciones | **PASS (no aplica al frontend)** | La validación del servidor no se sustituye; la del cliente es conveniencia. FR-040 lo declara explícitamente. |
| 9 | Columna de organización en tablas nuevas | **N/A** | No se crean tablas. |
| 10 | Sistema desplegable | **PASS** | Se entrega por fases y cada fase deja la aplicación compilando y usable. Ver *Estrategia de corte*. |
| 11 | Textos por sistema de traducción y sin valores de país | **PASS** | Es el objeto de FR-066 a FR-073. Salda para el código nuevo la mitad abierta de la desviación XII.a registrada en la feature 001. |

**Veredicto**: se puede proceder. Los dos principios NO NEGOCIABLES se cumplen. La feature **no introduce ninguna
desviación propia**; hereda dos preexistentes, XII.b y el almacenamiento del token, ambas registradas abajo.

### Nota sobre la deuda XII.a

La feature 001 dejó XII.a como desviación parcial: el idioma ya era español, pero los textos estaban escritos en el
código. Esta feature la cierra **para todo el frontend nuevo**. Al terminar, el plan de la 001 debe actualizarse para
reflejar que la parte de frontend queda saldada; permanecerá abierta solo la parte del backend fuera de
`lang/es/tenancy.php`.

## Reutilización

Puerta 3 de la constitución. Qué se conserva y qué se retira, con su razón.

**Se conserva**

| Elemento | Cómo se reutiliza |
|---|---|
| `services/api.js` | Se mantiene como base y se le añade el interceptor de 401 y la normalización de errores (FR-064). |
| `context/SessionContext.jsx` | El modelo de sesión —token, usuario, roles, organización desde `/me`— es correcto. Se adapta al nuevo enrutado por rol. |
| `config/modules.js` | **No se conserva como configuración que dirige la interfaz**, pero sí como *fuente de datos verificada*: contiene los campos, tipos, opciones y etiquetas de las nueve entidades, ya contrastados con la API. Se usa como material de partida para las pantallas y para el catálogo de textos. |
| Patrón de tabla apilada (T107) | La técnica de `data-label` con rótulo sobre valor ya está verificada a 360 px. Se generaliza en el componente de tabla. |
| Reglas de validación de los controladores | Determinan qué campos son obligatorios y con qué formato, sin duplicar la validación del servidor. |

**Se retira, con justificación**

| Elemento | Razón |
|---|---|
| `PublicLayout.jsx`, `publicContent.js` y las cinco páginas públicas | Son el concepto que la feature sustituye. Ninguna consume la API: no se pierde funcionalidad administrativa. |
| `ModulePage.jsx` | Una única pantalla genérica que renderiza nueve entidades a partir de configuración. Es la causa de que hoy se muestre búsqueda donde no funciona y de que ninguna pantalla pueda tener el detalle que su dominio necesita. Se sustituye por pantallas explícitas sobre primitivas comunes: misma reutilización, sin el acoplamiento. |
| `index.css` (1237 líneas) | Construido sobre la paleta verde del concepto anterior. La paleta nueva es incompatible y FR-054 exige tokens. Se reescribe. |
| `App.css`, `assets/hero.png`, `assets/react.svg`, `assets/vite.svg` | Sin uso en el producto nuevo. |

## Project Structure

### Documentation (this feature)

```
specs/002-admin-frontend/
├── spec.md              # Especificación (hecho)
├── plan.md              # Este documento
├── research.md          # Decisiones técnicas y alternativas descartadas
├── design-system.md     # Tokens, escalas y anatomía de los componentes
├── quickstart.md        # Guion de verificación manual por rol
├── contracts/
│   └── api-usage.md     # Mapa pantalla → endpoint, derivado del Apéndice A
└── tasks.md             # Generado por /speckit-tasks
```

### Source Code (repository root)

Solo se modifica `frontend/`. `backend/` queda intacto salvo lo indicado en *Cambios en backend*.

```
frontend/src/
├── main.jsx
├── App.jsx                     # Enrutado y redirecciones por rol
│
├── i18n/
│   ├── index.js                # t(), interpolación, formateadores
│   └── locales/
│       └── es.js               # Catálogo por dominio
│
├── styles/
│   ├── tokens.css              # Única fuente de color, espaciado, radio, sombra, tipografía
│   ├── base.css                # Reset y elementos base
│   └── utilities.css
│
├── lib/
│   ├── api.js                  # Cliente axios, interceptores, errores normalizados
│   ├── auth.js                 # Token y su persistencia
│   └── permissions.js          # Qué ve y qué puede hacer cada rol
│
├── components/
│   ├── layout/                 # AppShell, Sidebar, Header, Breadcrumbs, NavDrawer
│   ├── ui/                     # Button, Input, Select, Textarea, Field, Badge,
│   │                           # Card, Modal, Drawer, Dropdown, Toast, Pagination,
│   │                           # SearchInput, Spinner
│   └── data/                   # DataTable, EmptyState, ErrorState, LoadingState,
│                               # ConfirmDialog, ResourcePage
│
├── context/
│   ├── SessionContext.jsx
│   └── ToastContext.jsx
│
├── hooks/
│   ├── useResourceList.js      # Listado paginado con búsqueda y cancelación
│   └── useResourceForm.js      # Envío, errores 422 por campo, doble envío
│
└── pages/
    ├── LoginPage.jsx
    ├── DashboardPage.jsx
    ├── students/  guardians/  teachers/  subjects/
    ├── groups/    enrollments/
    ├── sessions/  attendance/
    ├── payments/
    ├── users/
    └── organizations/
```

**Structure Decision**: se separa `components/ui` (primitivas sin conocimiento del dominio) de `components/data`
(compuestos que sí conocen el patrón listado-formulario) y de `pages` (una carpeta por entidad). Es la estructura mínima
que permite que las nueve pantallas de entidad compartan comportamiento sin volver a una única pantalla genérica
dirigida por configuración, que es el problema que `ModulePage` tiene hoy. No se introduce ninguna capa por encima de
esto.

## Fases de implementación

Cada fase deja la aplicación compilando y usable (Principio X), y termina con parada y reporte.

### Fase 1 — Cimientos y shell

Tokens y base CSS; catálogo `es.js` e `i18n/index.js`; cliente de API con interceptores; sesión y enrutado por rol con
sus redirecciones; app shell con barra lateral, cabecera, migas y panel deslizante; pantalla de acceso; primitivas de
interfaz.

*Cierra*: US1. *Verificación*: los tres roles aterrizan donde deben; ninguna ruta vedada es alcanzable por URL; shell
sin desbordamiento entre 360 y 1920 px.

### Fase 2 — Dashboard

Las dos variantes desde `GET /dashboard`, con sus estados vacíos y el aviso de profesor sin ficha.

*Cierra*: US2. *Verificación*: una sola petición; ninguna agregación en cliente.

### Fase 3 — Alumnos, tutores, profesores, asignaturas

Primera aplicación real de `ResourcePage`: listado con búsqueda y paginación, formulario, confirmación de borrado y
recorte de lectura para el profesor.

*Cierra*: US3 y US4. *Verificación*: el profesor ve alumnos en solo lectura y no alcanza profesores ni asignaturas.

### Fase 4 — Grupos, matrículas, sesiones, asistencia

Incluye las relaciones entre entidades y los desplegables acotados a la organización. La asistencia es la pantalla que
más exige del diseño móvil.

*Cierra*: US5 y US6. *Verificación*: registrar asistencia completa a 360 px sin desplazamiento horizontal.

### Fase 5 — Pagos, cuentas y organizaciones

Cierra el ciclo económico y las dos pantallas de administración. Aquí se comprueba que el profesor no ve importes en
ningún punto de la aplicación.

*Cierra*: US7, US8 y US9.

### Fase 6 — Auditoría transversal

Barrido de anchos con render headless; auditoría de accesibilidad —teclado, foco, contraste, diálogos, regiones
activas—; provocación deliberada de los estados de carga, vacío y error de cada vista; barrido de literales fuera del
catálogo (SC-012); comprobación de que no hay peticiones fuera del Apéndice A (SC-011). Se decide aquí si merece la pena
introducir un runner de pruebas de frontend, con su justificación.

*Cierra*: SC-003, SC-005, SC-006, SC-008, SC-011, SC-012.

## Cambios en backend

**Ninguno previsto.** La spec se ha escrito contra la superficie existente precisamente para no necesitarlos.

Si durante la implementación aparece un caso que la API no cubre, la regla es: **parar y reportarlo, no ampliarlo por
iniciativa propia**. Ampliar la API cambia el alcance acordado y arrastra la puerta 5 de la constitución, que exige
prueba de aislamiento para todo lo que toque datos de organización.

Un único punto merece vigilancia y **no se corrige en esta feature**: una petición no autenticada sin la cabecera
`Accept: application/json` recibe 500 en lugar de 401. Es un defecto preexistente, detectado al validar la feature 001.
El frontend lo evita enviando siempre la cabecera (FR-062).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| **Dependencia `@fontsource-variable/inter`** | FR-058 exige Inter servida desde el propio origen, sin peticiones a terceros. El stack no tiene forma de producir un `woff2`, y no había ningún fichero de la fuente en el proyecto ni en el sistema. El paquete distribuye **solo ficheros de fuente y ningún código**: no añade superficie de API, ni configuración, ni comportamiento en ejecución. | Se rechazó **Google Fonts**, que es lo que hacía el frontend anterior: pone un tercero en la ruta crítica de renderizado, se degrada con mala conectividad —el escenario real del mercado inicial— y envía datos de navegación de los usuarios fuera. Se rechazó **comprometer los binarios a mano**, que exige obtenerlos igualmente y convierte cada actualización en un trabajo manual. Se rechazó **renunciar a Inter** y usar solo la pila del sistema, que contradice la dirección tipográfica acordada. Nota: el plan afirmaba «cero dependencias nuevas» y esa afirmación era insostenible frente a FR-058; se corrige aquí en lugar de dejarla en pie. |
| Capa propia de textos (`i18n/`) por encima de los literales de React | La puerta 11 y el Principio XII.a la exigen: ningún texto visible puede estar escrito en el código. La feature 001 dejó esta deuda abierta y reescribir el frontend entero es el momento de menor coste para saldarla, porque los componentes se escriben de cero igualmente. | Se rechazó **escribir los textos en los componentes**, que es lo que hay hoy: multiplicaría la deuda por el tamaño del frontend nuevo, mayor que el actual. Se rechazó también **una librería de i18n** (`react-i18next` y equivalentes): con un solo idioma no resuelve ningún problema real, y el Principio IV exige nombrar el problema concreto que justifica cada capa. El mecanismo es un objeto anidado y una función de resolución. |
| **Preexistente, heredada — XII.b**: los importes se muestran sin divisa asociada | El dato se almacena sin moneda desde antes de la constitución. El frontend no puede inventarla sin acoplarse a un país, que es justo lo que XII prohíbe. | Se rechazó fijar la divisa en el frontend. La moneda debe ser configuración de la organización, y eso es una feature de backend con su propia spec. Esta feature **no agrava** la deuda: formatea con la configuración regional y no introduce ningún importe nuevo. |
| **Preexistente, heredada**: el token de sesión vive en el almacenamiento del navegador | Es el mecanismo actual y funciona con Sanctum tal como está configurado. | Se rechazó pasar a cookies de sesión con `SameSite` y CSRF: es más robusto frente a XSS, pero exige cambios de configuración y de rutas en el backend, que esta feature tiene explícitamente vedado. Queda anotado como endurecimiento futuro. |

## Riesgos

| Riesgo | Mitigación |
|---|---|
| Reescribir 1237 líneas de CSS y borrar pantallas puede llevarse por delante comportamiento que hoy funciona | La tabla de *Reutilización* nombra pieza por pieza qué se conserva y por qué. Nada se borra sin que su sustituto esté en pie. |
| Nueve pantallas de entidad tientan a volver a una pantalla genérica dirigida por configuración | El acuerdo es compartir **primitivas**, no una pantalla. Cada entidad tiene su carpeta y puede divergir cuando su dominio lo pida. |
| El catálogo de textos se degrada si alguien escribe un literal suelto | SC-012 lo convierte en comprobación automática, no en disciplina. |
| Las pantallas de escritorio se diseñan primero y el móvil se adapta después, invirtiendo el Principio VI | Cada fase verifica a 360 px antes de darse por cerrada, no solo la Fase 6. |
| El desbordamiento horizontal reaparece en pantallas nuevas | Se mide con el arnés de render headless ya construido, que en la feature anterior detectó desbordamientos que la inspección visual no veía. |

## Próximo paso

Generar `research.md`, `design-system.md`, `contracts/api-usage.md` y `quickstart.md`, y después `tasks.md` con
`/speckit-tasks`. La implementación no comienza hasta que `tasks.md` esté aprobado.
