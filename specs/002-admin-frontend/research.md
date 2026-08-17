# Research: decisiones técnicas

**Feature**: `002-admin-frontend` | **Fecha**: 2026-08-16

Cada decisión registra la alternativa descartada y por qué. Las que afectan a la simplicidad (Principio IV) o a la
internacionalización (Principio XII) están además en el *Complexity Tracking* de `plan.md`.

---

## D1 — Sin librería de componentes

**Decisión**: se construyen las primitivas a mano sobre elementos HTML nativos.

**Alternativas descartadas**

- **Material UI, Ant Design, Chakra**: traen su propio lenguaje visual, que habría que combatir para llegar a la paleta
  pedida, y añaden entre 300 KB y 1 MB al bundle. El Principio VII pesa aquí: el mercado inicial accede desde móvil con
  conectividad limitada.
- **shadcn/ui**: es la opción más afín, pero arrastra Tailwind y Radix. Tailwind reescribe cómo se escribe todo el CSS
  del proyecto; es un cambio de stack, no una dependencia.

**Razón**: el juego de componentes que esta feature necesita es pequeño y de comportamiento conocido. El coste de
escribirlo es menor que el de doblegar una librería, y el Principio IV exige nombrar el problema concreto que
justificaría la capa. No lo hay.

**Consecuencia asumida**: la accesibilidad de diálogo, menú y panel deslizante —foco atrapado, `Escape`, devolución del
foco, roles ARIA— hay que implementarla y verificarla explícitamente. Es trabajo real, recogido en la Fase 1 y auditado
en la Fase 6. Es el precio de esta decisión y se paga a conciencia.

---

## D2 — Catálogo de textos propio

**Decisión**: `i18n/index.js` exporta `t(clave, params)` y resuelve contra un objeto anidado en `locales/es.js`.

**Forma**

```js
t('students.create')                    // "Crear alumno"
t('common.showingRange', { from, to, total })
```

- Claves por dominio, con `common` para lo transversal.
- Interpolación por parámetro con nombre, nunca concatenando fragmentos traducidos (FR-072): el orden de las palabras
  cambia entre idiomas y la concatenación es lo que hace intraducible un código que ya usa `t()`.
- Clave inexistente: en desarrollo, aviso en consola; en producción, se devuelve la propia clave. Nunca cadena vacía —
  un hueco en blanco es un fallo invisible que llega a producción; una clave a la vista, no (FR-071).

**Alternativa descartada**: `react-i18next` resuelve plurales, géneros y carga por idioma. Con un solo idioma no resuelve
ninguno de esos problemas, y el Principio IV exige un consumidor actual y concreto.

**Preparación para un segundo idioma** (FR-070): los componentes solo conocen `t`. Añadir un idioma es añadir un fichero
en `locales/` y cambiar cuál se selecciona. Se comprueba en la Fase 6 con un catálogo de prueba que no se entrega
(SC-013).

**Sobre los plurales**: el español y las cifras del producto permiten resolverlos con claves distintas
(`students.countOne` / `students.countMany`) y una elección explícita en el punto de uso. Si un idioma futuro necesita
más formas, el cambio queda dentro de `i18n/`, no en los componentes.

---

## D3 — Sin librería de estado ni de formularios

**Decisión**: `useState`, `useContext` y dos hooks propios, `useResourceList` y `useResourceForm`.

**Alternativas descartadas**

- **TanStack Query**: aporta caché, reintentos e invalidación. La aplicación tiene poca compartición de datos entre
  pantallas y una caché mal invalidada en datos administrativos muestra cifras obsoletas, que es peor que volver a
  pedirlas.
- **Redux / Zustand**: no hay estado global más allá de la sesión y los avisos, ya resueltos con contexto.
- **React Hook Form**: los formularios son planos y la validación real está en el servidor. Lo que sí hay que resolver
  —mapear los errores 422 al campo correcto— no lo da ninguna librería, porque es específico del formato de Laravel.

**Consecuencia**: `useResourceList` concentra paginación, búsqueda, cancelación de peticiones y estados de carga, vacío y
error. Es el punto que hay que escribir bien una vez.

---

## D4 — Cancelación de peticiones

**Decisión**: `AbortController` por petición de listado, cancelando la anterior al cambiar búsqueda o página.

**Razón**: sin ello, teclear rápido en la búsqueda deja varias peticiones en vuelo y **la respuesta más lenta puede
pisar a la más reciente**, mostrando resultados que no corresponden a lo escrito. El `ModulePage` actual ya lo hace y es
un acierto que se conserva (FR-065).

**Detalle**: axios señala la cancelación como `CanceledError`; hay que distinguirla de un error real para no mostrar un
estado de error al usuario por una petición que se canceló a propósito.

---

## D5 — Tratamiento uniforme de errores

**Decisión**: un interceptor de respuesta normaliza todo error a `{ status, message, fieldErrors }`.

| Estado | Significado aquí | Tratamiento |
|---|---|---|
| 401 | Token caducado o inválido | Cerrar sesión local y llevar a `/login` conservando el destino (FR-007) |
| 403 | Rol insuficiente, u organización suspendida o eliminada | Pantalla explicativa con el motivo del servidor; no reintentar |
| 404 | No existe **o pertenece a otra organización** | Estado propio con vuelta al listado. Nunca insinuar que existe |
| 422 | Validación | Repartir `errors` campo a campo (FR-030) |
| 5xx / red | Fallo del servidor o de conexión | Estado de error con reintento sin recargar (FR-044) |

**Sobre el 404**: el backend responde 404 y no 403 ante un identificador de otra organización, deliberadamente, para no
revelar su existencia. El frontend **no debe deshacer esa decisión** con un mensaje del tipo «no tienes permiso»: eso
confirmaría que el registro existe.

---

## D6 — Enrutado por rol

**Decisión**: la ruta de inicio se deriva del rol; `super_admin` va a `/organizaciones`, los demás a `/dashboard`.

**Razón**: verificado en `backend/routes/api.php`, `GET /dashboard` está bajo el middleware `tenant` con
`role.any:org_admin,teacher`. El `super_admin` no pertenece a ninguna organización, no puede establecer contexto y
recibe **403**. Enviarle al dashboard produciría un error en cada inicio de sesión.

**Alternativa descartada**: un dashboard de plataforma con métricas agregadas. No hay endpoint que lo alimente, y
`/organizations` expone deliberadamente solo `users_count` —ningún recuento de alumnos ni de pagos— porque el
administrador de plataforma no debe conocer el contenido de un centro. Inventarlo sería contradecir esa decisión.

---

## D7 — Permisos en el cliente

**Decisión**: un módulo `lib/permissions.js` declara, por rol, qué secciones se ven y qué acciones se ofrecen. Es la
única fuente de esa verdad en el frontend.

**Regla**: la interfaz **no es una barrera de seguridad** (FR-040). El servidor ya autoriza con Policies y middleware.
El módulo evita ofrecer acciones que van a fallar y evita filtrar por la interfaz información que el rol no debe ver
—los importes para el profesor—, pero nunca sustituye a la comprobación del servidor.

**Consecuencia**: la tabla de permisos del cliente debe reflejar exactamente `routes/api.php`. Si divergen, manda el
servidor. Está reproducida en `contracts/api-usage.md` para poder contrastarla.

---

## D8 — Tabla con representación móvil

**Decisión**: un solo componente `DataTable` que, cuando el ancho disponible no basta, se presenta como tarjetas con
rótulo sobre valor.

**Base**: la técnica ya está verificada en la feature 001 (T107) a 360 px reales — cabecera oculta con `clip-path`,
celdas en bloque con `data-label` y `overflow-wrap: anywhere`. Se generaliza.

**Lo que se corrige respecto a hoy**: la decisión de cambiar de forma se toma por **el espacio que la tabla necesita**,
no por un ancho de dispositivo fijo (FR-060). Una tabla de tres columnas cortas y otra de ocho no cambian a la vez.

**Alternativa descartada**: desplazamiento horizontal. Lo prohíbe el Principio VI de forma explícita.

---

## D9 — Sin ordenamiento ni filtros

**Decisión**: no se ofrecen.

**Razón**: la API acepta únicamente `search` y `per_page`; el orden lo fija `latest()` en el servidor. La única
excepción es el filtro `organization_id` de `/users`, disponible solo para la plataforma, que sí se usa.

**Alternativa descartada**: ordenar y filtrar la página cargada. Daría al usuario la impresión de estar ordenando el
conjunto completo cuando ordena 10 registros de 800. Una interfaz que miente sobre lo que hace es peor que una que no
ofrece la función.

---

## D10 — Tipografía servida localmente

**Decisión**: Inter se empaqueta como fuente local con `@font-face`, en formato `woff2` y con `font-display: swap`.

**Alternativa descartada**: Google Fonts por CDN, que es lo que hace hoy el `index.css` actual. Introduce una petición a
un tercero en la ruta crítica de renderizado, funciona mal con conectividad pobre —el escenario real del mercado
inicial— y envía datos de navegación de los usuarios a un tercero sin necesidad.

**Alcance**: solo los grosores que se usan, para no cargar la familia completa.

---

## D11 — Verificación

**Decisión**: verificación manual guiada por `quickstart.md` más render headless con Chrome para anchos y
desbordamiento. No se introduce runner de pruebas de frontend en esta feature; se evalúa en la Fase 6 con
justificación escrita.

**Razón**: el proyecto no tiene hoy pruebas de frontend, y añadir el entorno —runner, biblioteca de render, dobles de
API— es una decisión de infraestructura propia que compite con entregar la aplicación. La suite del backend, 246
pruebas, sigue cubriendo el aislamiento, que es lo que el Principio V declara no negociable.

**Lo que sí es obligatorio**: la comprobación de anchos por render headless, porque en la feature 001 la inspección
visual llevó **dos veces** a conclusiones equivocadas sobre desbordamientos, y solo medir en un navegador real las
corrigió.

### D11.a — Revisión: se introduce el runner en la Fase 2, no en la 6

**Decisión revisada el 2026-08-17.** Se añaden `vitest`, `jsdom` y `@testing-library/react` como dependencias de
desarrollo, y `npm test` a los scripts.

**Qué la forzó**: un fallo en producción de desarrollo —«Cannot read properties of null (reading 'role')»— que dejaba la
aplicación en blanco al entrar. Era **intermitente**, porque dependía de una carrera entre una petición cancelada y la
que la sustituía. El arnés de navegador headless no lo reprodujo en cuatro intentos con las cuatro cuentas: pasaba
siempre.

Un fallo que depende del orden de resolución de dos promesas no se puede provocar a mano con fiabilidad. Con un doble de
la API, en cambio, el orden se controla exactamente y el caso se reproduce siempre. La prueba de regresión escrita
**falla con el código anterior** y pasa con el corregido; eso es lo que la hace valer.

**Por qué esto sí nombra un problema concreto** (Principio IV): la verificación por navegador cubre lo que se ve —anchos,
enrutado, permisos— y es insustituible para eso. No cubre estados que dependen del tiempo. Son dos herramientas para dos
clases de defecto, y la segunda acaba de demostrar que hacía falta.

**Alcance**: no se pretende cobertura amplia. Se prueban los estados que no se pueden provocar a mano —restauración de
sesión, carreras de peticiones, ramas de error— y las garantías que no deben romperse nunca.

---

## D12 — Estrategia de sustitución

**Decisión**: el frontend nuevo se construye **sustituyendo** el actual en la misma rama, sin convivencia.

**Alternativa descartada**: levantar la aplicación nueva junto a la vieja y conmutar al final. Duplicaría el enrutado y
la sesión, y obligaría a mantener dos sistemas de estilos con paletas incompatibles.

**Cómo se mantiene desplegable** (Principio X): cada fase deja la aplicación compilando y usable. Las pantallas
antiguas se retiran cuando su sustituta está en pie, no antes. La Fase 1 es la única que cambia el marco completo, y
por eso incluye ya el acceso y el shell funcionando de extremo a extremo.
