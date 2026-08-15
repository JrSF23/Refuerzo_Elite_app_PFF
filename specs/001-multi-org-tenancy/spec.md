# Feature Specification: Soporte Multi-Organización (Multi-Tenancy)

**Feature Branch**: `001-multi-org-tenancy`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "Implementar soporte multi-organización para transformar Refuerzo Elite V2 en un SaaS. La aplicación actualmente está diseñada para un único centro educativo. Necesitamos permitir múltiples organizaciones dentro de una misma instalación, con datos completamente aislados. Roles iniciales: super_admin, org_admin, teacher."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aislamiento total de datos entre organizaciones (Priority: P1)

Dos centros educativos distintos operan sobre la misma instalación. El personal del Centro A gestiona
sus alumnos, grupos, matrículas, asistencia y pagos con normalidad, y en ningún momento —ni navegando,
ni buscando, ni manipulando identificadores en las peticiones— puede ver ni alterar información del
Centro B. Cada centro percibe el sistema como si fuera exclusivamente suyo.

**Why this priority**: es la razón de ser de la feature y una condición innegociable de la
constitución del producto. Sin este aislamiento no puede incorporarse ni un solo centro piloto, porque
el sistema manejaría datos reales de menores y de pagos.

**Independent Test**: se crean dos organizaciones con datos completos, y se comprueba con un usuario de
cada una que toda operación de lectura, creación, modificación y borrado sobre recursos de la otra
organización resulta inaccesible, incluso conociendo los identificadores exactos.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado del Centro A, **When** solicita el listado de alumnos, **Then**
   obtiene únicamente alumnos del Centro A y ninguno del Centro B.
2. **Given** un usuario del Centro A que conoce el identificador de un alumno del Centro B, **When**
   solicita el detalle de ese alumno, **Then** el sistema responde como si el recurso no existiera, sin
   revelar que pertenece a otra organización.
3. **Given** un usuario del Centro A, **When** intenta modificar o eliminar un pago, grupo, matrícula,
   sesión o registro de asistencia del Centro B, **Then** la operación es rechazada y ningún dato del
   Centro B resulta alterado.
4. **Given** un usuario del Centro A que crea una matrícula, **When** indica un alumno propio pero un
   grupo del Centro B, **Then** el sistema rechaza la operación por referencia inválida y no crea nada.
5. **Given** una petición que incluye explícitamente el identificador de otra organización, **When** se
   procesa, **Then** el sistema ignora ese valor y opera exclusivamente sobre la organización del
   usuario autenticado.
6. **Given** un buscador o filtro sobre cualquier listado, **When** el término coincide con datos de
   otra organización, **Then** no se devuelve ninguna coincidencia ajena.

---

### User Story 2 - Migración del centro actual a su propia organización (Priority: P2)

El centro que hoy usa Refuerzo Elite V2 sigue trabajando sin interrupción tras la transformación. Todos
sus alumnos, tutores, profesores, asignaturas, grupos, matrículas, sesiones, asistencias y pagos quedan
asignados a una organización propia, y su personal continúa accediendo con sus credenciales actuales.

**Why this priority**: sin una ruta de migración, la transformación obligaría a abandonar el centro que
ya usa el producto. Es requisito para poder desplegar el cambio.

**Independent Test**: partiendo de una base de datos con los datos actuales, se ejecuta la migración y
se verifica que ningún registro queda huérfano de organización, que los totales por entidad coinciden
antes y después, y que un usuario existente sigue viendo exactamente los mismos datos.

**Acceptance Scenarios**:

1. **Given** una instalación con los datos del centro actual, **When** se aplica la migración, **Then**
   todos los registros de negocio quedan asignados a una única organización y ninguno queda sin asignar.
2. **Given** un usuario del centro actual, **When** inicia sesión tras la migración, **Then** accede con
   sus credenciales de siempre y ve el mismo conjunto de datos que antes.
3. **Given** la migración completada, **When** se comparan los recuentos de cada entidad antes y después,
   **Then** coinciden exactamente y no se ha perdido ni duplicado ningún registro.

---

### User Story 3 - El super administrador gestiona las organizaciones (Priority: P3)

La persona responsable de la plataforma da de alta un nuevo centro piloto: crea la organización, crea su
administrador y le entrega el acceso. También puede suspender una organización que deja de operar.

**Why this priority**: es lo que permite incorporar centros piloto sin intervención manual en la base de
datos, pero llega después del aislamiento porque un alta sin aislamiento garantizado sería peligrosa.

**Independent Test**: con una cuenta de super administrador se crea una organización nueva y su
administrador, y se comprueba que ese administrador entra y ve su organización vacía, sin rastro de otras.

**Acceptance Scenarios**:

1. **Given** un super administrador autenticado, **When** crea una organización con sus datos básicos,
   **Then** la organización queda registrada y disponible para recibir usuarios.
2. **Given** una organización recién creada, **When** el super administrador da de alta a su
   administrador, **Then** ese usuario puede iniciar sesión y ve únicamente su propia organización.
3. **Given** una organización suspendida, **When** cualquiera de sus usuarios intenta acceder, **Then**
   se le deniega el acceso con un mensaje claro y sus datos permanecen intactos.
4. **Given** un usuario que no es super administrador, **When** intenta crear, modificar o listar
   organizaciones, **Then** la operación es rechazada.
5. **Given** un super administrador autenticado, **When** intenta consultar alumnos, grupos o pagos de
   cualquier organización, **Then** la operación es rechazada: su alcance se limita a organizaciones y
   cuentas de usuario.

---

### User Story 4 - El administrador de organización gestiona su centro (Priority: P4)

El administrador de un centro gestiona su propio personal, alumnos, grupos, matrículas, asistencia y
pagos, sin ninguna capacidad sobre otros centros ni sobre la plataforma.

**Why this priority**: es el uso cotidiano principal del producto, pero se apoya en que el aislamiento y
el alta de organizaciones ya funcionen.

**Independent Test**: con una cuenta de administrador de organización se ejecuta el ciclo completo de
gestión dentro de su centro y se verifica que no aparece ninguna opción ni recurso de plataforma.

**Acceptance Scenarios**:

1. **Given** un administrador de organización, **When** gestiona alumnos, profesores, asignaturas,
   grupos, matrículas, sesiones, asistencia y pagos, **Then** todas las operaciones se aplican dentro de
   su organización.
2. **Given** un administrador de organización, **When** da de alta a un nuevo usuario de su centro,
   **Then** ese usuario queda vinculado automáticamente a su organización sin poder elegir otra.
3. **Given** un administrador de organización, **When** intenta acceder a funciones de gestión de
   organizaciones, **Then** la operación es rechazada.

---

### User Story 5 - El profesor accede solo a lo suyo (Priority: P5)

Un profesor consulta los grupos que imparte, ve a los alumnos matriculados en ellos y registra la
asistencia de sus sesiones. No accede a alumnos de otros grupos, ni a información económica.

**Why this priority**: amplía el valor del producto al profesorado, pero el piloto puede arrancar con
administradores mientras esta capa se afina.

**Independent Test**: con una cuenta de profesor se comprueba que solo aparecen sus grupos y los alumnos
matriculados en ellos, y que los pagos no son accesibles en ninguna forma.

**Acceptance Scenarios**:

1. **Given** un profesor autenticado, **When** consulta sus grupos, **Then** ve únicamente los grupos que
   tiene asignados dentro de su organización.
2. **Given** un profesor, **When** consulta alumnos, **Then** ve solo los matriculados en los grupos que
   imparte, y no el resto de alumnos del centro.
3. **Given** un profesor, **When** registra la asistencia de una sesión de un grupo suyo, **Then** la
   operación se completa correctamente.
4. **Given** un profesor, **When** intenta registrar asistencia en una sesión de un grupo que no imparte,
   **Then** la operación es rechazada.
5. **Given** un profesor, **When** intenta acceder a pagos, **Then** la operación es rechazada.
6. **Given** un usuario con rol profesor sin ficha de profesor vinculada, **When** consulta grupos o
   alumnos, **Then** no obtiene ninguno, en lugar de obtener todos los del centro.

---

### Edge Cases

- **Códigos y correos duplicados entre centros**: hoy los códigos de asignatura y de grupo, y los correos
  de alumnos, profesores y tutores, son únicos en todo el sistema. Dos centros distintos deben poder usar
  el mismo código de asignatura ("MAT-1") o registrar a personas con el mismo correo sin colisionar, y sin
  que el error de duplicado revele la existencia de datos ajenos.
- **Usuario sin organización asignada**: un usuario que no es super administrador y carece de organización
  no debe poder operar sobre ningún dato; el sistema deniega el acceso en lugar de mostrar un listado vacío.
- **Profesor sin ficha vinculada**: un usuario con rol profesor cuya cuenta no está asociada a ninguna
  ficha de profesor no debe ver ningún grupo ni alumno. El fallo debe cerrar el acceso, nunca abrirlo.
- **Ficha de profesor reasignada a otra cuenta**: al cambiar el vínculo, el usuario anterior debe perder
  el acceso a esos grupos de forma inmediata.
- **Super administrador ante datos de negocio**: sus intentos de acceder a alumnos, grupos o pagos deben
  ser rechazados igual que los de un usuario de otra organización, sin excepción por privilegio.
- **Referencias cruzadas en escritura**: cualquier operación que reciba identificadores de entidades
  relacionadas (alumno, grupo, matrícula, sesión, asignatura, profesor, tutor) debe verificar que **todas**
  pertenecen a la organización del usuario, no solo la principal.
- **Organización suspendida o eliminada**: sus datos no deben quedar accesibles ni contabilizados, pero
  tampoco deben desaparecer de forma irrecuperable.
- **Sesión abierta cuando cambia el estado**: si una organización se suspende mientras sus usuarios tienen
  sesión activa, el acceso debe cortarse en la siguiente petición, no al expirar la sesión.
- **Registros históricos y de auditoría**: los eventos de auditoría deben quedar atribuidos a su
  organización y no ser visibles desde otra.
- **Operaciones masivas y exportaciones**: listados largos, informes y exportaciones deben respetar el
  mismo aislamiento que las consultas individuales.
- **Borrado lógico**: un registro eliminado lógicamente sigue perteneciendo a su organización y no debe
  volverse visible para otra.

## Requirements *(mandatory)*

### Functional Requirements

**Modelo de organización**

- **FR-001**: El sistema MUST permitir que múltiples organizaciones educativas coexistan en una única
  instalación, cada una con su propio conjunto de datos.
- **FR-002**: Cada organización MUST tener, como mínimo, un nombre identificativo, un identificador
  legible y un estado que determine si puede operar.
- **FR-003**: Toda entidad de negocio (alumnos, tutores, profesores, asignaturas, grupos, sesiones,
  matrículas, asistencias, pagos y eventos de auditoría) MUST pertenecer a exactamente una organización.
- **FR-004**: Cada usuario MUST pertenecer exactamente a una organización, salvo los super
  administradores de plataforma, que MUST NOT pertenecer a ninguna.
- **FR-004a**: Una misma persona que trabaje en dos organizaciones MUST usar una cuenta distinta en cada
  una, con credenciales independientes. El sistema MUST NOT permitir que una cuenta opere sobre más de
  una organización.

**Aislamiento**

- **FR-005**: El sistema MUST resolver la organización activa exclusivamente a partir del usuario
  autenticado.
- **FR-006**: El sistema MUST ignorar cualquier identificador de organización enviado por el cliente y
  MUST NOT usarlo para determinar el ámbito de la operación.
- **FR-007**: Toda consulta de datos de negocio MUST estar restringida a la organización activa de forma
  automática, sin depender de que cada punto de acceso recuerde aplicar el filtro.
- **FR-008**: El acceso a un recurso de otra organización MUST responder como recurso inexistente, sin
  distinguirlo de un identificador que no existe en absoluto.
- **FR-009**: Toda operación de escritura que referencie otras entidades MUST validar que todas ellas
  pertenecen a la organización activa, y rechazar la operación completa en caso contrario.
- **FR-010**: Una petición autenticada cuyo usuario no tenga organización activa ni sea super
  administrador MUST ser rechazada antes de alcanzar ninguna lógica de negocio.
- **FR-011**: Los usuarios de una organización suspendida MUST perder el acceso en su siguiente petición,
  conservándose íntegros sus datos.

**Roles y permisos**

- **FR-012**: El sistema MUST ofrecer tres roles iniciales: super administrador, administrador de
  organización y profesor.
- **FR-013**: El super administrador MUST poder crear, consultar, modificar y suspender organizaciones, y
  dar de alta al administrador inicial de cada una.
- **FR-013a**: El super administrador MUST NOT poder consultar, crear, modificar ni eliminar datos de
  negocio de ninguna organización (alumnos, tutores, profesores, asignaturas, grupos, sesiones,
  matrículas, asistencias y pagos). Su alcance se limita a las organizaciones y a las cuentas de usuario.
- **FR-013b**: Las pruebas de aislamiento MUST cubrir también al super administrador, demostrando que no
  alcanza los datos de negocio de ninguna organización.
- **FR-014**: El administrador de organización MUST poder gestionar todos los datos de su propia
  organización, incluidos sus usuarios, y MUST NOT poder acceder a funciones de gestión de organizaciones.
- **FR-015**: El profesor MUST poder consultar únicamente los grupos que imparte y los alumnos
  matriculados en ellos, y registrar la asistencia de las sesiones de esos grupos.
- **FR-015a**: La ficha de profesor MUST poder vincularse opcionalmente a una cuenta de usuario. Los
  grupos que "imparte" un usuario con rol profesor son los asignados a la ficha de profesor vinculada a
  su cuenta.
- **FR-015b**: El sistema MUST admitir fichas de profesor sin cuenta de usuario asociada (personal que no
  accede al sistema) y MUST mantener la relación como uno a uno: una ficha de profesor no puede
  vincularse a dos cuentas ni una cuenta a dos fichas.
- **FR-015c**: Un usuario con rol profesor sin ficha vinculada MUST ser tratado como profesor sin grupos
  asignados: no accede a ningún grupo, alumno ni sesión, en lugar de acceder a todos.
- **FR-016**: El profesor MUST NOT poder acceder a información de pagos en ninguna forma, ni a alumnos no
  matriculados en sus grupos.
- **FR-017**: Los permisos MUST evaluarse siempre dentro del ámbito de la organización activa.
- **FR-018**: Cuando un usuario es dado de alta por un administrador de organización, su organización MUST
  asignarse automáticamente a la del administrador, sin que pueda especificarse otra.

**Unicidad y datos**

- **FR-019**: Los identificadores de negocio que hoy son únicos en todo el sistema (códigos de asignatura,
  códigos de grupo, y correos de alumnos, profesores y tutores) MUST pasar a ser únicos dentro de cada
  organización, permitiendo que dos organizaciones usen el mismo valor.
- **FR-020**: Los mensajes de error por duplicado MUST NOT revelar la existencia de datos de otra
  organización.
- **FR-021**: Los registros eliminados lógicamente MUST conservar su organización y MUST NOT volverse
  accesibles desde otra.

**Migración**

- **FR-022**: El sistema MUST proporcionar una ruta de migración que asigne todos los datos existentes del
  centro actual a una organización propia, sin pérdida ni duplicación de registros.
- **FR-023**: Tras la migración, los usuarios existentes MUST poder seguir accediendo con sus credenciales
  actuales y ver el mismo conjunto de datos.

**Verificación**

- **FR-024**: El sistema MUST incluir pruebas automatizadas que demuestren que un usuario de la
  organización A no puede consultar, crear, modificar ni eliminar recursos de la organización B.
- **FR-025**: Esa cobertura MUST abarcar todas las entidades de negocio y las cuatro operaciones (lectura
  de listado, lectura de detalle, escritura y borrado).

**Compatibilidad**

- **FR-026**: La interfaz pública existente MUST mantenerse bajo la misma versión (`/api/v1`), sin obligar
  a los clientes actuales a cambiar de versión.

### Key Entities *(include if feature involves data)*

- **Organización**: el centro educativo, academia u organización académica que usa el producto. Es la
  unidad de aislamiento: define qué datos existen para quién. Atributos mínimos: nombre, identificador
  legible, estado operativo, fecha de alta.
- **Usuario**: persona que accede al sistema. Pertenece a una organización, salvo los super
  administradores de plataforma, que no pertenecen a ninguna. Tiene uno o más roles.
- **Alumno**: estudiante del centro. Pertenece a una organización y opcionalmente a un tutor.
- **Tutor**: adulto responsable de uno o varios alumnos. Pertenece a una organización.
- **Profesor**: docente del centro, asignable a grupos. Pertenece a una organización.
- **Asignatura**: materia impartida, con su código y tarifa mensual de referencia. Pertenece a una
  organización.
- **Grupo**: agrupación de alumnos para una asignatura, con profesor, horario, capacidad y curso
  académico. Pertenece a una organización.
- **Sesión**: clase concreta de un grupo en una fecha. Pertenece a una organización a través de su grupo.
- **Matrícula**: vínculo entre un alumno y un grupo, con fecha, cuota y estado. Pertenece a una
  organización.
- **Asistencia**: presencia o ausencia de un alumno en una sesión. Pertenece a una organización.
- **Pago**: cobro registrado a un alumno o su tutor, con importe, periodo y método. Pertenece a una
  organización. Es información sensible restringida a los administradores.
- **Evento de auditoría**: traza de una acción realizada por un usuario sobre una entidad. Pertenece a la
  organización en la que ocurrió.

### Restricciones impuestas *(heredadas del usuario y de la constitución)*

Estas decisiones vienen dadas y no son objeto de análisis en la fase de planificación:

- Base de datos compartida con discriminador de organización; **no** una base de datos por organización.
- No se introducen paquetes externos de multi-tenancy salvo necesidad estrictamente demostrada.
- Se conserva el mecanismo de autenticación y el de roles y permisos ya existentes.
- El identificador de organización en usuarios admite valor vacío, reservado a super administradores.
- Se mantiene la ruta `/api/v1`.

### Fuera de alcance

- Auto-registro de organizaciones por parte de los centros.
- Facturación, suscripciones y cobros en línea.
- Marketplace.
- El rol de alumno como usuario con acceso propio.
- Personalización visual por organización (logotipo, colores, dominio propio).
- Traspaso de datos entre organizaciones.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En una instalación con dos organizaciones pobladas, el 100% de los intentos de acceso a
  datos de otra organización —lectura, creación, modificación y borrado, sobre todas las entidades de
  negocio— resultan infructuosos.
- **SC-002**: Ninguna respuesta del sistema permite deducir la existencia, el volumen o el contenido de
  los datos de otra organización, ni siquiera a partir de mensajes de error o tiempos de respuesta.
- **SC-003**: Un nuevo centro puede quedar operativo —organización creada, administrador dado de alta y
  primer acceso realizado— en menos de 10 minutos y sin intervención manual sobre la base de datos.
- **SC-004**: Tras la migración del centro actual, el recuento de registros de cada entidad coincide
  exactamente con el previo, y ningún registro queda sin organización asignada.
- **SC-005**: Un usuario del centro migrado completa sus tareas habituales sin cambios en su forma de
  trabajar y sin necesidad de formación adicional.
- **SC-006**: Dos organizaciones pueden usar simultáneamente los mismos códigos de asignatura y de grupo,
  y registrar personas con el mismo correo, sin conflicto.
- **SC-007**: El profesor ve exclusivamente sus grupos y los alumnos matriculados en ellos; el número de
  alumnos visibles coincide con la suma de matriculados en sus grupos.
- **SC-008**: Las pruebas automatizadas de aislamiento cubren el 100% de las entidades de negocio y se
  ejecutan en cada verificación de cambios.
- **SC-009**: Los clientes existentes siguen funcionando sin modificar la versión de la interfaz que
  consumen.

## Assumptions

Valores adoptados por defecto ante detalles no especificados. Se documentan para poder ser revisados:

- **Migración del centro actual**: se crea una organización para el centro que hoy usa Refuerzo Elite V2 y
  se le asignan todos los datos existentes. No se contempla otro escenario de arranque.
- **Alcance de las entidades**: se consideran de negocio y por tanto pertenecientes a una organización
  todas las entidades del dominio actual: alumnos, tutores, profesores, asignaturas, grupos, sesiones,
  matrículas, asistencias, pagos y eventos de auditoría.
- **Sesiones y asistencias**: aunque su pertenencia se deduce del grupo, se les asigna organización propia
  para poder filtrarlas directamente y evitar fugas en consultas que no pasen por el grupo.
- **Unicidad**: los identificadores hoy globales (códigos de asignatura y de grupo, correos de alumnos,
  profesores y tutores) pasan a ser únicos por organización. El correo de las **cuentas de usuario** sigue
  siendo único en todo el sistema, consecuencia de Q1: una persona presente en dos centros necesita dos
  correos distintos.
- **Respuesta ante acceso cruzado**: se responde "no encontrado" en lugar de "prohibido", para no revelar
  la existencia del recurso.
- **Estados de organización**: activa y suspendida son suficientes para el piloto; no se contemplan
  estados intermedios.
- **Profesores y pagos**: el profesor no accede a información económica de ningún tipo.
- **Soporte a centros**: al no poder el super administrador ver datos de negocio (Q2), la resolución de
  incidencias que requieran ver datos reales se hace mediante una cuenta temporal creada por el
  administrador del propio centro, que este revoca al terminar.
- **Tutores**: pertenecen a una única organización; un mismo adulto con hijos en dos centros se registra
  por duplicado, uno en cada organización.
- **Idioma y formatos**: se mantiene el comportamiento actual; la preparación de idiomas y monedas
  corresponde a otra feature.
- **Interfaz de usuario**: la aplicación existente sigue funcionando; esta feature no rediseña pantallas,
  solo restringe lo que cada usuario ve.
- **Volumen previsto**: decenas de organizaciones y unos pocos miles de alumnos por organización durante
  el piloto.

## Dependencias

- Base de datos con los datos actuales del centro y capacidad de ejecutar la migración con copia de
  seguridad previa verificada.
- Mecanismo de autenticación y de roles ya presentes en Refuerzo Elite V2.
- Constitución del producto v1.0.0, en particular los principios V (Seguridad por diseño) y IX
  (Multi-tenancy desde el núcleo), que son no negociables.

## Clarifications

### Sesión 2026-08-13

- **Q1: ¿Puede una misma persona ser usuario de varias organizaciones con el mismo correo?**
  → **No. Un usuario pertenece a una sola organización.** Una persona que trabaje en dos centros necesita
  dos cuentas con correos distintos. Recogido en FR-004 y FR-004a.
  *Consecuencia*: el Principio IX de la constitución afirma que "un mismo usuario puede tener roles
  distintos en organizaciones distintas". Esa frase queda contradicha y requiere enmienda del documento
  de constitución.

- **Q2: ¿Puede el super administrador consultar los datos de negocio dentro de una organización?**
  → **No.** Su alcance se limita a gestionar organizaciones y cuentas de usuario. El soporte a un centro
  se presta mediante una cuenta temporal creada dentro de esa organización por su propio administrador.
  Recogido en FR-013a y FR-013b.
  *Diferido*: impersonación auditada y consentida, como feature posterior al piloto.

- **Q3: ¿Cómo se determina qué grupos "imparte" un usuario con rol profesor?**
  → **Vinculando la ficha de profesor a una cuenta de usuario** (relación uno a uno opcional). Se
  conservan las fichas de profesor sin cuenta, para personal que no accede al sistema. Recogido en
  FR-015a, FR-015b y FR-015c.
