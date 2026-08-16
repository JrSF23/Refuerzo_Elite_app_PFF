# Feature Specification: Frontend administrativo SaaS

**Feature Branch**: `002-admin-frontend`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Rediseñar completamente el frontend. El concepto anterior —sitio público/promocional de un centro
educativo— ya no existe. El producto actual es una aplicación SaaS administrativa cuyo objetivo es mejorar la eficiencia
operativa de centros educativos. Sin landing page, sin marketing, sin hero, sin contacto público. Diseño SaaS sobrio y
profesional, azul #2563EB como acento, sidebar oscura. Arrancar en /login; autenticado, /dashboard."

---

## Objetivo

Sustituir el frontend actual —concebido como sitio vitrina de un único centro— por una **aplicación administrativa**
para el personal de los centros. El producto deja de intentar captar familias y pasa a resolver el trabajo diario de
quien gestiona el centro: matricular, pasar lista, cobrar y saber en qué estado está todo.

El criterio de diseño es la **eficiencia operativa**, no la persuasión. Cada pantalla se juzga por cuántas acciones y
cuánto tiempo cuesta completar una tarea real, no por su impacto visual.

Esta feature es **exclusivamente de frontend**. No añade capacidades de negocio: expone las que la API ya ofrece, que
han sido inventariadas y verificadas contra el código (ver *Apéndice A*). No se introducen endpoints nuevos.

## Usuarios objetivo

| Usuario | Rol técnico | Qué hace en la aplicación | Dispositivo dominante |
|---|---|---|---|
| Administrador del centro | `org_admin` | Todo el ciclo administrativo de su centro: alumnos, tutores, profesores, asignaturas, grupos, matrículas, sesiones, asistencia y pagos. Gestiona las cuentas de su centro. | Escritorio y tableta; móvil de forma ocasional |
| Profesor | `teacher` | Consulta sus grupos y sus alumnos; crea y edita sus sesiones; pasa lista. **No accede a información económica.** | Móvil, de forma predominante |
| Administrador de plataforma | `super_admin` | Alta, edición, suspensión y baja de organizaciones, y gestión de cuentas de cualquier organización. **No accede a datos de negocio de ningún centro.** | Escritorio |

No existe un usuario anónimo. La aplicación no tiene superficie pública.

## Alcance

**Dentro** — App shell y sistema visual; catálogo de textos con función `t()`; autenticación y sesión; dashboard
operativo; alumnos; tutores; profesores; asignaturas; grupos; matrículas; sesiones; asistencia; pagos; cuentas de
usuario; organizaciones; permisos por rol; responsive; estados de carga, vacío y error; accesibilidad.

**Fuera** — Informes y analítica (ver *Future Features*); cualquier endpoint nuevo; cambios en el modelo de datos;
cambios en las reglas de autorización del backend; recuperación de contraseña, alta autoservicio y verificación por
correo, que la API no soporta; **un segundo idioma y su selector**: se entrega la estructura que lo permitirá, no la
funcionalidad.

**Retirado deliberadamente** — Las cinco páginas públicas (inicio, centro, servicios, método, contacto), el layout
público y su contenido de marketing. Es la razón de ser de esta feature; no es funcionalidad administrativa perdida.
Ninguna de esas páginas consume la API. Las rutas retiradas se documentan en FR-009.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar a trabajar (Priority: P1)

Una persona del centro abre la aplicación, se identifica y llega directamente a su puesto de trabajo, con la navegación
que le corresponde por su rol y sin pasar por ninguna página promocional. Al volver más tarde, sigue identificada.

**Why this priority**: sin esto no hay aplicación. Además fija el marco —shell, navegación, sesión, permisos— del que
cuelgan todas las demás historias.

**Independent Test**: entrar con una cuenta de cada uno de los tres roles y comprobar que cada una aterriza donde debe y
ve exactamente las secciones que le corresponden.

**Acceptance Scenarios**:

1. **Given** una persona sin sesión, **When** abre cualquier ruta de la aplicación, **Then** se le lleva a `/login` y,
   tras identificarse, a la ruta que pedía originalmente.
2. **Given** un `org_admin` identificado, **When** entra, **Then** aterriza en `/dashboard` y ve en la navegación
   alumnos, tutores, profesores, asignaturas, grupos, matrículas, sesiones, asistencia, pagos y cuentas.
3. **Given** un `teacher` identificado, **When** entra, **Then** aterriza en `/dashboard` y ve únicamente alumnos,
   grupos, sesiones y asistencia.
4. **Given** un `super_admin` identificado, **When** entra, **Then** aterriza en `/organizaciones` —no en el dashboard,
   que le está vedado— y ve únicamente organizaciones y cuentas.
5. **Given** una sesión cuyo token ha caducado, **When** se realiza cualquier petición, **Then** la sesión se cierra y
   se vuelve a `/login` con un aviso, sin pantalla en blanco ni error críptico.
6. **Given** credenciales incorrectas, **When** se envía el formulario, **Then** se muestra el mensaje devuelto por la
   API junto al formulario y el foco vuelve al primer campo.

---

### User Story 2 - Ver el estado del centro de un vistazo (Priority: P1)

Al entrar, el administrador ve los indicadores del centro y los últimos movimientos; el profesor ve sus grupos, sus
próximas sesiones y la asistencia reciente. Desde ahí salta al detalle.

**Why this priority**: es la pantalla de aterrizaje y la que justifica el producto como herramienta de control. Se
alimenta de un endpoint que ya existe y devuelve todo lo necesario en una sola petición.

**Independent Test**: con datos sembrados, comprobar que cada rol ve su variante y que cada bloque enlaza con la
sección correspondiente.

**Acceptance Scenarios**:

1. **Given** un `org_admin`, **When** abre el dashboard, **Then** ve cinco indicadores (alumnos, profesores, grupos,
   asistencia, pagos) y tres bloques de actividad reciente: últimos alumnos, últimas sesiones y últimos pagos.
2. **Given** un `teacher` con ficha vinculada, **When** abre el dashboard, **Then** ve sus tres indicadores, sus grupos,
   sus próximas sesiones y la asistencia reciente.
3. **Given** un `teacher` **sin** ficha de profesor vinculada, **When** abre el dashboard, **Then** ve todos los
   contadores a cero y un aviso explicando que su cuenta aún no está vinculada y a quién dirigirse, en lugar de una
   pantalla vacía sin explicación.
4. **Given** un centro recién creado y sin datos, **When** se abre el dashboard, **Then** cada bloque muestra su estado
   vacío con la acción que corresponde para empezar.

---

### User Story 3 - Gestionar alumnos y sus tutores (Priority: P1)

El administrador da de alta alumnos, los busca, corrige sus datos, los da de baja y mantiene la ficha de sus tutores.
El profesor consulta los alumnos de sus grupos sin poder modificarlos.

**Why this priority**: el alumno es la entidad central del producto; todo lo demás —matrículas, asistencia, pagos— cuelga
de él.

**Independent Test**: crear, buscar, editar y eliminar un alumno, y comprobar que un profesor solo ve los suyos y en
modo lectura.

**Acceptance Scenarios**:

1. **Given** un `org_admin` en el listado de alumnos, **When** escribe en la búsqueda, **Then** el listado se acota por
   nombre, apellidos, correo, teléfono o centro escolar, y la paginación se reinicia.
2. **Given** un formulario de alumno con un campo obligatorio vacío, **When** se envía, **Then** el error se muestra
   junto a ese campo concreto, no como aviso global, y el foco va al primer campo con error.
3. **Given** un `org_admin` que pulsa eliminar, **When** aparece la confirmación, **Then** debe confirmar
   explícitamente antes de que se realice la baja.
4. **Given** un `teacher`, **When** abre alumnos, **Then** ve solo los alumnos matriculados en los grupos que imparte y
   no dispone de acciones de creación, edición ni borrado.

---

### User Story 4 - Gestionar profesores y asignaturas (Priority: P2)

El administrador mantiene el cuadro de profesores y el catálogo de asignaturas con su tarifa mensual, que son los
prerrequisitos para poder crear grupos.

**Why this priority**: sin asignatura no se puede crear un grupo, y sin grupo no hay matrículas ni sesiones. Es
habilitador, pero se usa con mucha menos frecuencia que los alumnos.

**Independent Test**: crear una asignatura y un profesor, y comprobar que ambos quedan disponibles en el formulario de
grupos.

**Acceptance Scenarios**:

1. **Given** un `org_admin`, **When** crea una asignatura con un código ya usado en su centro, **Then** el error se
   muestra sobre el campo código.
2. **Given** un `teacher`, **When** intenta abrir profesores o asignaturas, **Then** no encuentra la sección en su
   navegación y el acceso directo por URL le devuelve a su dashboard.

---

### User Story 5 - Gestionar grupos y matrículas (Priority: P2)

El administrador crea grupos, les asigna asignatura y profesor, y matricula alumnos con su cuota mensual. El profesor
consulta los grupos que imparte.

**Why this priority**: el grupo es el eje que conecta alumnos, profesores, sesiones y cobros.

**Independent Test**: crear un grupo, matricular un alumno y comprobar que la matrícula aparece asociada a ambos.

**Acceptance Scenarios**:

1. **Given** un formulario de grupo, **When** se despliegan asignatura y profesor, **Then** solo aparecen los del
   propio centro.
2. **Given** una matrícula, **When** se elige alumno y grupo, **Then** ambos desplegables ofrecen únicamente registros
   del propio centro, y elegir un identificador ajeno se rechaza con el mismo error que si no existiera.
3. **Given** un `teacher`, **When** abre grupos, **Then** ve solo los que imparte, en modo lectura.

---

### User Story 6 - Programar sesiones y pasar lista (Priority: P2)

El profesor crea las sesiones de sus grupos y registra la asistencia de cada alumno. El administrador ve y edita todo
lo del centro.

**Why this priority**: es la operación más repetida y la única que el profesor realiza a diario, casi siempre desde el
móvil. Es la historia que más presión pone sobre el diseño móvil.

**Independent Test**: crear una sesión y registrar asistencia de varios alumnos desde un viewport de 360 px.

**Acceptance Scenarios**:

1. **Given** un `teacher`, **When** crea una sesión, **Then** el desplegable de grupo ofrece únicamente los grupos que
   imparte.
2. **Given** un registro de asistencia, **When** se elige el estado, **Then** las opciones son presente, ausente y con
   retraso, y el estado se distingue por color **y** por texto, nunca solo por color.
3. **Given** un `teacher` en un viewport de 360 px, **When** abre asistencia, **Then** la información se presenta en un
   formato usable sin desplazamiento horizontal.
4. **Given** un `teacher`, **When** intenta acceder a una sesión de un grupo que no imparte, **Then** obtiene un estado
   de "no encontrado", no un mensaje que revele su existencia.

---

### User Story 7 - Registrar y seguir los cobros (Priority: P3)

El administrador registra los pagos de los alumnos, con su periodo, forma de pago y estado, y consulta lo cobrado y lo
pendiente.

**Why this priority**: es crítico para el centro, pero depende de que existan alumnos y matrículas. El profesor queda
excluido por completo.

**Independent Test**: registrar un pago asociado a una matrícula y comprobar que un profesor no alcanza la sección ni
por URL.

**Acceptance Scenarios**:

1. **Given** un pago, **When** se elige la matrícula, **Then** solo se aceptan matrículas del alumno seleccionado.
2. **Given** un importe, **When** se muestra, **Then** aparece con su formato monetario y separadores de millar, nunca
   como número desnudo.
3. **Given** un `teacher`, **When** solicita `/pagos` por URL, **Then** se le devuelve a su dashboard y la sección nunca
   aparece en su navegación.

---

### User Story 8 - Administrar las cuentas del centro (Priority: P3)

El administrador da de alta las cuentas de su personal, les asigna rol y, cuando corresponde, vincula una cuenta de
profesor con su ficha.

**Why this priority**: necesario para incorporar personal, pero de uso esporádico.

**Acceptance Scenarios**:

1. **Given** un `org_admin`, **When** crea una cuenta, **Then** los roles ofrecidos son los asignables dentro de una
   organización y la cuenta queda en su propio centro sin necesidad de indicarlo.
2. **Given** una cuenta de rol profesor, **When** se vincula con una ficha de profesor, **Then** el vínculo anterior de
   esa cuenta se deshace y la ficha queda asociada a ella.
3. **Given** un `org_admin`, **When** consulta el listado, **Then** solo ve cuentas de su propia organización.

---

### User Story 9 - Administrar la plataforma (Priority: P3)

El administrador de plataforma da de alta centros, los suspende o reactiva, y gestiona las cuentas de cualquiera de
ellos.

**Why this priority**: es el trabajo del operador del SaaS, no del cliente. Ya existe en el frontend actual y no puede
perderse.

**Acceptance Scenarios**:

1. **Given** un `super_admin`, **When** suspende una organización, **Then** el cambio de estado se refleja y las
   personas de ese centro dejan de poder operar.
2. **Given** una organización con cuentas activas, **When** se intenta eliminar, **Then** se muestra el motivo devuelto
   por la API y no se elimina.
3. **Given** un `super_admin`, **When** navega la aplicación, **Then** no encuentra ninguna sección de datos de negocio
   —alumnos, pagos, asistencia—, porque no le está permitido acceder a ellos.

---

### Edge Cases

- **Sesión caducada a mitad de una tarea.** Cualquier respuesta 401 cierra la sesión y lleva a `/login` conservando la
  ruta de destino. No debe perderse silenciosamente el trabajo sin avisar.
- **Organización suspendida o eliminada durante la sesión.** La API responde 403 en todas las rutas de negocio. La
  aplicación muestra una pantalla explicativa con el motivo, no un error genérico repetido en cada bloque.
- **Profesor sin ficha vinculada.** Todos sus listados devuelven vacío por diseño. Debe distinguirse de "no hay datos"
  con un aviso propio (US2, escenario 3).
- **`super_admin` que abre `/dashboard`.** La API responde 403 porque no puede establecer contexto de organización. La
  aplicación no debe llegar a pedirlo: su ruta de inicio es `/organizaciones`.
- **Búsqueda sin efecto.** En matrículas, sesiones, asistencia y pagos la API ignora el parámetro de búsqueda. La caja
  de búsqueda **no debe mostrarse** en esas secciones, en lugar de aparecer y no hacer nada, como ocurre hoy.
- **Listado con una sola página.** Los controles de paginación no se muestran.
- **Registro eliminado por otra persona.** Una respuesta 404 al abrir el detalle muestra un estado propio con vuelta al
  listado.
- **Fallo de red o servidor caído.** Estado de error con acción de reintento que no obliga a recargar la página.
- **Texto muy largo.** Nombres, correos y observaciones deben partirse o truncarse sin desbordar horizontalmente.
- **Doble envío de formulario.** El botón queda deshabilitado mientras la petición está en curso.

---

## Requirements *(mandatory)*

### Arquitectura y enrutado

- **FR-001**: La aplicación NO DEBE tener superficie pública. Toda ruta exige sesión iniciada, salvo `/login`.
- **FR-002**: Una persona sin sesión que solicite cualquier ruta DEBE ser llevada a `/login`, y tras identificarse DEBE
  volver a la ruta que pidió.
- **FR-003**: La ruta de inicio tras identificarse DEBE depender del rol: `/dashboard` para `org_admin` y `teacher`;
  `/organizaciones` para `super_admin`. La aplicación NO DEBE solicitar `GET /dashboard` con un `super_admin`, porque la
  API lo rechaza con 403 (verificado en `routes/api.php`).
- **FR-004**: La navegación DEBE mostrar únicamente las secciones que el rol puede usar. Ocultar no basta: el acceso por
  URL directa a una sección no permitida DEBE redirigir a la ruta de inicio del rol.
- **FR-005**: Las rutas DEBEN estar en español, en coherencia con la interfaz.
- **FR-006**: La sesión DEBE persistir entre recargas del navegador y restaurarse al arrancar.
- **FR-007**: Toda respuesta 401 DEBE cerrar la sesión local y llevar a `/login`.
- **FR-008**: El cierre de sesión DEBE invalidar el token en el servidor y limpiar el estado local.
- **FR-009**: Las rutas del concepto anterior (`/`, `/centro`, `/servicios`, `/metodo`, `/contacto` y sus equivalentes
  franceses) DEBEN dejar de servir contenido y redirigir a `/login` o al dashboard según haya sesión. Ningún enlace
  interno DEBE apuntar a ellas.

### Autenticación

- **FR-010**: El formulario de acceso DEBE aceptar nombre de usuario **o** correo en un único campo, tal como acepta la
  API, y una contraseña.
- **FR-011**: Los errores de credenciales DEBEN mostrarse con el mensaje devuelto por la API, sin inventar texto propio
  y sin revelar si el fallo fue del usuario o de la contraseña.
- **FR-012**: El formulario DEBE impedir el doble envío y mostrar estado de progreso mientras se resuelve.
- **FR-013**: La aplicación NO DEBE ofrecer recuperación de contraseña, alta autoservicio ni verificación por correo:
  la API no los soporta y prometerlos en la interfaz sería engañoso.

### Dashboard

- **FR-014**: El dashboard DEBE alimentarse **exclusivamente** de `GET /dashboard`, en una sola petición.
- **FR-015**: La aplicación NO DEBE realizar agregaciones propias recorriendo páginas de los listados.
- **FR-016**: El dashboard DEBE presentar la variante que corresponde al campo `role` de la respuesta, sin deducirla de
  los roles del usuario.
- **FR-017**: Cada bloque de actividad reciente DEBE enlazar con su sección, y cada indicador DEBE ser navegable cuando
  exista una sección equivalente.

### Navegación y shell

- **FR-018**: En escritorio la navegación DEBE ser una barra lateral permanente; en pantallas estrechas DEBE
  convertirse en un panel deslizante que se abre desde la cabecera.
- **FR-019**: El panel deslizante DEBE cerrarse al elegir un destino, al pulsar fuera y al pulsar `Escape`, y DEBE
  devolver el foco al botón que lo abrió.
- **FR-020**: La sección activa DEBE señalarse de forma perceptible sin depender únicamente del color.
- **FR-021**: La cabecera DEBE mostrar en todo momento la organización activa, la identidad de la persona y su rol, y
  ofrecer el cierre de sesión.
- **FR-022**: Las secciones con detalle DEBEN mostrar una ruta de migas que permita volver al nivel anterior.

### Listados y tablas

- **FR-023**: Los listados DEBEN paginarse contra el servidor, respetando el máximo de 50 registros por página que
  impone la API.
- **FR-024**: La búsqueda DEBE mostrarse **solo** en las secciones cuyo endpoint la soporta: alumnos, tutores,
  profesores, asignaturas, grupos, cuentas y organizaciones. NO DEBE mostrarse en matrículas, sesiones, asistencia ni
  pagos (ver *Apéndice A*).
- **FR-025**: La búsqueda DEBE reiniciar la paginación a la primera página.
- **FR-026**: La aplicación NO DEBE ofrecer ordenamiento ni filtros de columna. La API no los soporta, y aplicarlos solo
  sobre la página cargada daría al usuario la impresión falsa de estar ordenando o filtrando el conjunto completo.
  El orden es el que fija la API. Ver *Future Features*.
- **FR-027**: Cada listado DEBE indicar el total de registros y el rango mostrado.
- **FR-028**: Cuando una tabla deje de ser usable por el ancho disponible, DEBE transformarse en una representación por
  tarjetas con rótulo y valor. El desplazamiento horizontal NO ES una solución aceptable (Principio VI).
- **FR-029**: Las acciones sobre una fila DEBEN ser alcanzables en cualquier ancho, sin quedar fuera del área visible.

### Formularios

- **FR-030**: Los errores de validación devueltos por la API DEBEN mostrarse junto al campo correspondiente.
- **FR-031**: Al fallar la validación, el foco DEBE ir al primer campo con error.
- **FR-032**: Todo campo DEBE tener una etiqueta asociada de forma programática; el texto de ayuda no sustituye a la
  etiqueta.
- **FR-033**: Los campos obligatorios DEBEN señalarse antes de enviar, no solo al fallar.
- **FR-034**: Los desplegables que referencian otras entidades DEBEN ofrecer únicamente registros de la organización
  activa.
- **FR-035**: Toda acción destructiva DEBE exigir confirmación explícita e indicar qué se va a eliminar.
- **FR-036**: Los formularios DEBEN impedir el doble envío.

### Permisos por rol

- **FR-037**: El `teacher` NO DEBE ver, en ninguna pantalla, importes, tarifas ni información de cobros. Las secciones
  de asignaturas, matrículas y pagos —las tres que contienen campos monetarios— le están vedadas.
- **FR-038**: El `teacher` DEBE tener acceso de solo lectura a alumnos y grupos, y de escritura a sesiones y asistencia.
- **FR-039**: El `super_admin` NO DEBE tener acceso a ninguna sección de datos de negocio.
- **FR-040**: La interfaz NO DEBE ser la única barrera: se apoya en la autorización del servidor, que ya existe, y nunca
  la sustituye.

### Estados de la interfaz

- **FR-041**: Toda vista que dependa de datos remotos DEBE tener estado de carga, estado vacío y estado de error
  diferenciados entre sí.
- **FR-042**: El estado de carga DEBE reservar el espacio del contenido para evitar saltos de maquetación.
- **FR-043**: El estado vacío DEBE distinguir "todavía no hay registros" de "la búsqueda no ha encontrado nada", y
  ofrecer en cada caso la acción adecuada.
- **FR-044**: El estado de error DEBE permitir reintentar sin recargar la página.
- **FR-045**: El resultado de toda acción de escritura DEBE confirmarse de forma visible y no intrusiva.
- **FR-046**: Los avisos de resultado DEBEN ser anunciados a los lectores de pantalla mediante una región activa.

### Accesibilidad

- **FR-047**: Toda la aplicación DEBE poder manejarse solo con teclado, en un orden de foco que siga el orden visual.
- **FR-048**: El foco DEBE ser siempre visible, con un indicador que no dependa únicamente del color.
- **FR-049**: Los diálogos DEBEN atrapar el foco mientras están abiertos y devolverlo al elemento que los abrió.
- **FR-050**: El contraste de texto y de los elementos de interfaz DEBE cumplir WCAG 2.1 AA.
- **FR-051**: La información transmitida por color —estados de asistencia, de pago, de organización— DEBE ir acompañada
  siempre de texto.
- **FR-052**: Las imágenes decorativas DEBEN quedar ocultas a los lectores de pantalla; las informativas DEBEN tener
  texto alternativo.
- **FR-053**: El idioma del documento DEBE declararse como español.

### Sistema visual

- **FR-054**: DEBE existir un sistema visual único, definido con propiedades personalizadas de CSS, del que dependan
  todas las pantallas. Ningún color, espaciado ni radio DEBE escribirse suelto en un componente.
- **FR-055**: La paleta DEBE ser: fondo `#F8FAFC`, superficie `#FFFFFF`, barra lateral `#111827`, texto principal
  `#111827`, texto secundario `#64748B`, borde `#E5E7EB`, primario `#2563EB`, éxito `#16A34A`, aviso `#D97706`, error
  `#DC2626`, información `#0284C7`.
- **FR-056**: El azul primario DEBE reservarse para la acción principal, el estado activo y el foco. NO DEBE dominar
  superficies amplias.
- **FR-057**: El verde NO DEBE usarse como color de identidad; queda reservado al estado de éxito.
- **FR-058**: La tipografía DEBE ser Inter, servida localmente. NO DEBE depender de una petición a un dominio externo,
  que introduce un punto de fallo y una fuga de datos de navegación hacia terceros.
- **FR-059**: DEBEN existir como componentes reutilizables: barra lateral, cabecera, migas, botón, campo de texto,
  desplegable, tabla, tarjeta, distintivo, diálogo, panel deslizante, menú desplegable, aviso emergente, estado vacío,
  estado de carga, estado de error, paginación, búsqueda.
- **FR-060**: Los puntos de ruptura DEBEN derivarse del espacio que cada componente necesita, no de anchos de
  dispositivo arbitrarios; cada uno debe poder justificarse midiendo el contenido.

### Integración con la API

- **FR-061**: La aplicación DEBE consumir únicamente los endpoints inventariados en el *Apéndice A*.
- **FR-062**: Toda petición DEBE enviar `Accept: application/json`. Sin esa cabecera la API responde 500 o una redirección
  en lugar de 401 ante peticiones no autenticadas (defecto preexistente conocido).
- **FR-063**: La aplicación NO DEBE enviar nunca `organization_id` en las escrituras de datos de negocio: el servidor lo
  asigna desde el contexto y aceptarlo del cliente reabriría una vía de fuga entre organizaciones.
- **FR-064**: Los errores 422 DEBEN interpretarse campo a campo; 403 y 404 DEBEN tener su propio tratamiento y no
  colapsarse en un mensaje genérico.
- **FR-065**: Las peticiones en curso DEBEN cancelarse cuando dejan de ser relevantes, para que una respuesta tardía no
  pise a otra más reciente.

### Textos e internacionalización

- **FR-066**: Ningún texto visible al usuario DEBE estar escrito dentro de un componente. Todos DEBEN resolverse a
  través de una función `t(clave)` contra un catálogo centralizado. Es la exigencia literal del Principio XII.a de la
  constitución, hoy incumplida y registrada como deuda; esta feature la salda para todo el código nuevo.
- **FR-067**: El catálogo DEBE organizarse por dominio o pantalla, con un espacio `common` para lo transversal
  —guardar, cancelar, eliminar, confirmar, buscar—, de modo que las claves se lean como `students.create` o
  `common.cancel`.
- **FR-068**: NO DEBE introducirse una librería de internacionalización. El mecanismo DEBE ser propio y mínimo: un
  catálogo y una función de resolución. El Principio IV exige que toda capa adicional nombre el problema real que
  resuelve, y con un solo idioma una librería no resuelve ninguno.
- **FR-069**: El MVP DEBE tener **un único idioma funcional, el español**. NO DEBE construirse selector de idioma,
  detección automática ni carga de catálogos bajo demanda.
- **FR-070**: La estructura DEBE permitir añadir un segundo idioma **sin tocar los componentes**: añadir un catálogo y
  seleccionarlo debe ser suficiente. Esto es lo que convierte la decisión en preparación estructural y no en una
  funcionalidad prematura.
- **FR-071**: Una clave inexistente NO DEBE romper la pantalla ni mostrar un hueco vacío. DEBE ser detectable en
  desarrollo y degradar de forma visible pero inocua en producción.
- **FR-072**: Los valores variables dentro de un texto —recuentos, nombres, fechas— DEBEN interpolarse por parámetro.
  NO DEBEN construirse concatenando fragmentos traducidos, porque el orden de las palabras cambia entre idiomas y esa
  concatenación es precisamente lo que impide traducir después.
- **FR-073**: Las cifras, importes y fechas DEBEN formatearse con la API de internacionalización del navegador y la
  configuración regional del idioma activo, no con formato fijo escrito a mano.

### Key Entities

Todas ya existen en el backend; esta feature no introduce ni modifica ninguna.

- **Organization**: el centro educativo. Discriminante de todo el aislamiento. Estado activo o suspendido, y borrado
  lógico independiente del estado.
- **User**: cuenta de acceso. Pertenece a una organización, salvo el `super_admin`. Tiene exactamente un rol operativo.
- **Student**: alumno. Puede tener tutor, y es el eje de matrículas, asistencia y pagos.
- **Guardian**: tutor o responsable del alumno.
- **Teacher**: ficha de profesor, vinculable a una cuenta de usuario.
- **Subject**: asignatura, con código único por centro y tarifa mensual.
- **ClassGroup**: grupo de una asignatura, con profesor, horario, capacidad y estado.
- **Enrollment**: matrícula de un alumno en un grupo, con cuota mensual y estado.
- **ClassSession**: sesión concreta de un grupo, con fecha, horas y aula.
- **Attendance**: asistencia de un alumno a una sesión: presente, ausente o con retraso.
- **Payment**: cobro asociado a un alumno, con importe, periodo, forma de pago y estado.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador completa el alta de un alumno en menos de 60 segundos desde el dashboard, sin instrucción
  previa.
- **SC-002**: Un profesor registra la asistencia de un grupo completo desde un teléfono de 360 px sin desplazamiento
  horizontal en ningún punto del flujo.
- **SC-003**: Ninguna pantalla de la aplicación produce desplazamiento horizontal entre 360 px y 1920 px de ancho.
- **SC-004**: Las tres rutas de inicio por rol son correctas y ninguna produce una petición que la API rechace por
  permisos.
- **SC-005**: Toda la aplicación es operable solo con teclado, sin trampas de foco y con el foco siempre visible.
- **SC-006**: El contraste cumple WCAG 2.1 AA en el 100 % del texto y de los elementos de interfaz, verificado con
  herramienta automática.
- **SC-007**: Ninguna sección vedada a un rol es alcanzable por URL directa.
- **SC-008**: Toda vista con datos remotos presenta sus tres estados —carga, vacío, error— comprobables provocándolos.
- **SC-009**: La aplicación no realiza ninguna petición a un dominio externo.
- **SC-010**: Ningún importe se muestra como número desnudo, sin formato monetario.
- **SC-011**: Cero peticiones a endpoints no inventariados en el *Apéndice A*, verificable en el registro de red.
- **SC-012**: Cero textos visibles escritos dentro de un componente, verificable con un barrido automático sobre
  `src/` que no encuentre literales en posición de contenido fuera de `src/i18n/`.
- **SC-013**: Añadir un segundo idioma requiere crear un catálogo y seleccionarlo, sin modificar ningún componente.
  Se comprueba con un catálogo de prueba, que no se entrega.

---

## Assumptions

- Se reutiliza la autenticación por token que ya existe; no se introduce ningún otro mecanismo.
- El almacenamiento del token se mantiene como está hoy, en el navegador. Endurecerlo a cookies de sesión exigiría
  cambios en el backend y queda fuera de esta feature.
- Se mantienen React, React Router, Axios y Vite. No se introduce librería de componentes, de estado ni de formularios:
  el Principio IV las exige justificar con un consumidor concreto, y no lo hay.
- La organización activa se toma de `GET /me`, que ya la devuelve. No hay cambio de organización dentro de la sesión.
- La moneda se muestra con el formato regional de español; el importe sigue almacenándose sin divisa asociada, que es la
  deuda XII.b ya registrada y ajena a esta feature.
- El personal de los centros usa navegadores actuales; no se da soporte a versiones sin propiedades personalizadas de
  CSS.
- Las cinco páginas públicas se retiran por completo. No se reubican ni se conservan tras autenticación.
- **Decidido**: los textos visibles pasan por un catálogo con una función `t()` propia, sin librería (FR-066 a FR-073).
  Se salda así la mitad abierta del Principio XII.a para todo el código nuevo. El catálogo vive en `src/i18n/`, con
  `index.js` y `locales/es.js`. **El ejemplo original de esta decisión usaba extensión `.ts`; el proyecto no tiene
  TypeScript instalado y todo el frontend es JavaScript, así que se usa `.js`.** Introducir TypeScript sería un cambio
  de stack, no un detalle de esta feature, y el Principio IV lo exigiría justificar aparte.
- El catálogo cubre el frontend nuevo. Los textos del backend ya están en español, y los de la feature de tenancy pasan
  por `lang/es/tenancy.php`; unificar ambos lados bajo un mismo sistema queda fuera de esta feature.

---

## Future Features

### Informes y analítica

**Fuera del MVP por decisión explícita.** No se implementa ninguna pantalla de informes, no se realizan agregaciones en
el cliente y no se añade ningún endpoint.

La razón es que hoy **no existe superficie de API que pueda sostener un informe correcto**. Lo único disponible es
`GET /dashboard`, que devuelve contadores globales fijos y cinco registros recientes, y los listados paginados con un
máximo de 50 registros por página. Construir informes sobre eso obligaría a recorrer decenas de páginas por consulta y
a agregar en el navegador: muchas peticiones, resultados que se desvían en cuanto los datos cambian entre páginas, y una
cifra presentada como total que no lo es. Un informe que engaña es peor que no tener informes.

Una iteración futura del backend necesitaría, como mínimo:

- **Agregación en servidor**, resuelta en SQL y no en PHP recorriendo colecciones: totales cobrados y pendientes por
  periodo, porcentaje de asistencia por grupo y por alumno, ocupación de grupos frente a su capacidad, y altas y bajas
  por intervalo.
- **Acotación por intervalo de fechas**, que hoy ningún endpoint acepta.
- **Agrupación por dimensión** —grupo, asignatura, profesor, periodo— con el desglose que la interfaz vaya a mostrar.
- **Respeto del aislamiento y del recorte por rol**: toda agregación pasa por el mismo global scope, y el profesor no
  puede recibir cifras económicas ni de alumnos que no imparte, igual que hoy no recibe sus registros.
- **Exportación**, si se quiere entregar el informe fuera de la aplicación, con su propio endpoint y su control de
  acceso.

Corresponde a una feature propia, con su spec, su plan y sus pruebas de aislamiento.

### Ordenamiento y filtros en los listados

Descartados en el MVP por la misma razón: la API acepta únicamente `search` y `per_page`, y el orden lo fija el servidor.
Soportarlos exigiría, en `BaseApiController`, parámetros de orden y dirección validados contra una lista blanca por
controlador —nunca contra un nombre de columna recibido del cliente— y filtros sobre los campos de estado que ya existen.

### Búsqueda en los listados que hoy no la tienen

`Enrollment`, `ClassSession`, `Attendance` y `Payment` no declaran campos buscables, de modo que el parámetro `search`
se ignora. Habilitarla es declarar esos campos en cada controlador; mientras no se haga, la interfaz no ofrece la caja
de búsqueda en esas secciones (FR-024).

### Otros

Recuperación de contraseña, edición del perfil propio, cambio de organización dentro de la sesión y un segundo idioma.
Ninguno tiene hoy endpoint que lo soporte.

---

## Apéndice A — Inventario verificado de la API

Extraído de `backend/routes/api.php` y de los controladores el 2026-08-16. **Es la única superficie que esta feature
puede consumir.** Prefijo `/api/v1`.

### Comportamiento común de los listados

Los controladores de negocio heredan de `BaseApiController`: `index` acepta `search` (una sola cadena, `LIKE` sobre los
campos declarados como buscables) y `per_page` (por defecto 10, **máximo 50**), ordena por `latest()` y devuelve el
paginador de Laravel. **No acepta ordenamiento ni filtros.**

| Endpoint | Métodos | Roles | Búsqueda por |
|---|---|---|---|
| `POST /login` | — | público | — |
| `GET /me`, `POST /logout` | — | autenticado | — |
| `GET /dashboard` | GET | `org_admin`, `teacher` | — |
| `/students` | index, show | `org_admin`, `teacher` | nombre, apellidos, correo, teléfono, centro escolar |
| `/students` | store, update, destroy | `org_admin` | ídem |
| `/class-groups` | index, show | `org_admin`, `teacher` | nombre, código, curso académico, estado |
| `/class-groups` | store, update, destroy | `org_admin` | ídem |
| `/class-sessions` | CRUD completo | `org_admin`, `teacher` | **ninguna** |
| `/attendances` | CRUD completo | `org_admin`, `teacher` | **ninguna** |
| `/guardians` | CRUD completo | `org_admin` | nombre, apellidos, correo, teléfono |
| `/teachers` | CRUD completo | `org_admin` | nombre, apellidos, correo, especialidad |
| `/subjects` | CRUD completo | `org_admin` | nombre, código, nivel |
| `/enrollments` | CRUD completo | `org_admin` | **ninguna** |
| `/payments` | CRUD completo | `org_admin` | **ninguna** |
| `/users` | CRUD completo | `super_admin`, `org_admin` | según controlador propio |
| `/organizations` | CRUD completo | `super_admin` | según controlador propio |
| `POST /organizations/{id}/suspend` · `/activate` | POST | `super_admin` | — |

### Recortes de alcance que aplica el servidor

- Todas las rutas de negocio pasan por el middleware de tenant: sin organización activa, válida y no suspendida, se
  responde 403.
- El `teacher` recibe únicamente sus grupos, las sesiones de esos grupos, la asistencia de esas sesiones y los alumnos
  matriculados en ellos. Un profesor sin ficha vinculada recibe conjuntos vacíos.
- Un identificador de otra organización responde **404**, nunca 403, para no revelar su existencia.
- El `super_admin` queda fuera del middleware de tenant y, por tanto, **no puede acceder a ninguna ruta de negocio,
  incluido `/dashboard`**.

### Valores admitidos

- Estado de alumno, grupo y matrícula: `active`, `inactive`.
- Estado de asistencia: `present`, `absent`, `late`.
- Estado de pago: `paid`, `pending`, `cancelled`. Forma de pago: `cash`, `card`, `transfer`.
- Estado de organización: `active`, `suspended`.
- Roles asignables por un `org_admin`: los de organización. Un `super_admin` puede además crear cuentas de plataforma,
  que no llevan organización.
