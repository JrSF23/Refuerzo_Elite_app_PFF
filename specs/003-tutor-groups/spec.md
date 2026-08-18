# Feature Specification: Grupos tutoriales

**Feature Branch**: `003-tutor-groups`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Quiero que los alumnos aparezcan agrupados por su aula/grupo, con el profesor tutor
responsable en la cabecera de cada bloque. No uses `Student.guardian`, que es el tutor legal, ni `class_groups`, que son
grupos de asignatura a los que un alumno pertenece varias veces con profesores distintos. […] Reagrupar a los alumnos
por grupos, por ejemplo «primero ESO mañana», y que exista el formulario para añadir un grupo nuevo con un profesor
responsable, turno, estudiante responsable del grupo, y poco más."

---

## Objetivo

Introducir el **grupo tutorial** —el aula a la que pertenece un alumno, con un profesor responsable— como entidad de
primera clase, y presentar el listado de alumnos organizado por ese grupo.

Hoy el concepto no existe en el modelo. Esta feature no reorganiza una vista: **añade el hecho que falta** y luego deja
que la interfaz lo refleje.

**Sobre «no rehacer el modelo».** Un grupo con turno, profesor responsable y alumno delegado **no existe en ninguna
tabla actual**, así que la tabla nueva es inevitable: sin ella no hay dónde guardar esos tres datos. Lo que sí se evita
—y es lo que hace pequeño el cambio— es tocar nada de lo que ya funciona: `class_groups`, `students.school_level`,
`guardians` y `enrollments` se quedan exactamente como están. El cambio es **una tabla nueva y una columna**, no una
reestructuración.

## El hallazgo que motiva la feature

Se inspeccionó el esquema completo —11 tablas de negocio— buscando una entidad que representara aula, clase o grupo de
alumnos. **No existe.** El único candidato, `class_groups`, queda descartado por los propios datos del centro:

```
Matemáticas — Grupo A  →  Alejandro (2º ESO)
                          Javier    (1º ESO)
                          Lucía     (4º ESO)
                          Carmen    (2º Bachiller)
```

Un grupo de asignatura **mezcla cuatro niveles académicos**. Un aula no puede. Además `class_groups.subject_id` es
obligatorio: por definición es el grupo *de una asignatura*, y un alumno pertenece a varios:

```
Lucía Fernández Pérez  →  Matemáticas — Grupo A  (María García López)
                       +  Inglés B2 — Grupo Tarde (sin profesor)
```

No hay un grupo que «posea» al alumno, así que no hay de dónde derivar un tutor único.

Lo demás tampoco sirve, y conviene dejarlo escrito para que nadie lo reintente:

| Candidato | Qué es en realidad |
|---|---|
| `students.school_level` | **Texto libre** en el alumno («4º ESO»). Sin id, sin relación, sin tutor. |
| `students.guardian_id` | El **tutor legal** —padre o madre—. Es por alumno, no por grupo. |
| `class_groups.teacher_id` | El profesor de un **grupo de asignatura**. Un alumno tiene varios y distintos. |
| `class_sessions.room` | **Texto libre** («Aula 1»). Es el aula física de una sesión concreta. |

## Usuarios objetivo

| Usuario | Rol | Qué hace |
|---|---|---|
| Administrador del centro | `org_admin` | Crea los grupos del curso académico, les asigna tutor y adscribe alumnos. |
| Profesor | `teacher` | Consulta los grupos de los que es tutor y sus alumnos. No los modifica. |

El `super_admin` queda fuera: no accede a datos de negocio de ningún centro.

## Alcance

**Dentro** — La entidad grupo tutorial y su CRUD; la asignación de un alumno a su grupo; el profesor tutor; el orden
académico de los grupos; el listado de alumnos agrupado; y las pruebas de aislamiento que la constitución exige a toda
entidad de organización.

**Fuera** — Histórico de cambios de grupo a lo largo del curso; promoción automática de un curso al siguiente; más de un
tutor por grupo; el aula física como entidad; y sustituir `class_groups`, que se queda como está porque su significado
—grupo de asignatura— es correcto y hay funcionalidad viva sobre él.

**Explícitamente NO se toca** — `students.school_level` se conserva. Es el nivel académico del alumno y es un dato
distinto del grupo al que se le adscribe; normalmente coincidirán, pero el modelo no debe forzarlo.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear los grupos del curso y asignarles tutor (Priority: P1)

El administrador da de alta los grupos tutoriales del curso académico —«4º ESO - A», «1º Bachiller - B»— y designa al
profesor responsable de cada uno.

**Why this priority**: sin grupos no hay nada que agrupar. Es el hecho que falta.

**Independent Test**: crear dos grupos, asignar tutor a uno y dejar el otro sin tutor, y comprobar que ambos existen y
se distinguen.

**Acceptance Scenarios**:

1. **Given** un `org_admin`, **When** crea un grupo con nombre, turno y curso académico, **Then** el grupo queda dado de
   alta en su centro sin que haya indicado la organización.
2. **Given** un grupo, **When** se le asigna un profesor tutor, **Then** el desplegable ofrece únicamente profesores del
   propio centro.
2b. **Given** un grupo con alumnos adscritos, **When** se designa alumno delegado, **Then** el desplegable ofrece
   únicamente **alumnos de ese grupo**: designar delegado a alguien de otro grupo no tendría sentido.
2c. **Given** un grupo sin alumnos todavía, **When** se abre el desplegable de delegado, **Then** aparece vacío con una
   explicación, no una lista de todos los alumnos del centro.
3. **Given** un grupo recién creado, **When** no se le asigna tutor, **Then** se guarda igualmente y se muestra como
   **sin tutor asignado**.
4. **Given** un nombre de grupo ya usado en el mismo curso académico, **When** se intenta crear otro igual, **Then** el
   error aparece sobre el campo del nombre.
5. **Given** el mismo nombre en un curso académico distinto, **When** se crea, **Then** se acepta: «4º ESO - A» del
   2025-2026 y del 2026-2027 son grupos distintos.

---

### User Story 2 - Adscribir un alumno a su grupo (Priority: P1)

El administrador indica a qué grupo tutorial pertenece cada alumno, desde la ficha del alumno.

**Why this priority**: es lo que conecta el alumno con su grupo y su tutor. Sin ello la entidad está vacía.

**Independent Test**: asignar grupo a un alumno y comprobar que aparece bajo ese grupo en el listado.

**Acceptance Scenarios**:

1. **Given** la ficha de un alumno, **When** se abre el desplegable de grupo, **Then** ofrece solo grupos del propio
   centro.
2. **Given** un alumno sin grupo, **When** se guarda, **Then** se acepta: un alumno puede no estar adscrito todavía.
3. **Given** un identificador de grupo de otra organización, **When** se envía, **Then** se rechaza con el mismo error
   que si el grupo no existiera, sin revelar que existe.
4. **Given** un alumno ya adscrito, **When** se cambia de grupo, **Then** deja de aparecer bajo el anterior y pasa al
   nuevo.

---

### User Story 3 - Ver los alumnos organizados por grupo (Priority: P1)

El administrador abre alumnos y los ve repartidos en bloques, uno por grupo, con el nombre del grupo a la izquierda y su
profesor tutor a la derecha.

**Why this priority**: es el objetivo visible de la feature y lo que la hace útil el primer día.

**Independent Test**: con alumnos en varios grupos, comprobar que cada bloque contiene exactamente los suyos y muestra
el tutor correcto.

**Acceptance Scenarios**:

1. **Given** alumnos en tres grupos, **When** se abre el listado, **Then** se muestran tres bloques, cada uno con el
   nombre del grupo y su tutor en la cabecera.
2. **Given** un grupo sin tutor asignado, **When** se muestra su bloque, **Then** la cabecera indica **sin asignar**, sin
   provocar ningún error.
3. **Given** un grupo sin alumnos, **When** se abre el listado, **Then** ese grupo **no aparece**.
4. **Given** alumnos sin grupo adscrito, **When** se abre el listado, **Then** aparecen agrupados aparte, de forma que
   quede claro que falta asignarles grupo. No deben quedar ocultos.
5. **Given** la tabla de un bloque, **When** se examina, **Then** **no** contiene una columna con el grupo: ya lo dice
   la cabecera.
6. **Given** varios grupos, **When** se listan, **Then** aparecen en el **orden académico del centro**, no alfabético.
7. **Given** los alumnos de un bloque, **When** se listan, **Then** van ordenados por apellidos y nombre.

---

### User Story 4 - Seguir buscando y editando como hasta ahora (Priority: P2)

Todo lo que hoy funciona en el listado de alumnos sigue funcionando cuando están agrupados.

**Why this priority**: una reorganización que rompe lo que ya servía es una regresión, por bonita que quede.

**Acceptance Scenarios**:

1. **Given** una búsqueda, **When** se escribe un término, **Then** acota sobre todos los alumnos, con independencia de
   su grupo, y los bloques se recomponen con lo encontrado.
2. **Given** una búsqueda sin resultados, **When** se resuelve, **Then** se muestra el estado vacío de búsqueda y ningún
   bloque.
3. **Given** un bloque, **When** se usan editar o eliminar, **Then** se comportan como hoy, con su confirmación.
4. **Given** el botón de nuevo alumno, **When** se pulsa, **Then** abre el formulario como hoy.
5. **Given** un ancho de 360 px, **When** se abre el listado, **Then** las tablas de cada bloque se presentan como
   tarjetas y no hay desplazamiento horizontal.

---

### User Story 5 - Consultar mis grupos como profesor (Priority: P3)

El profesor tutor ve los grupos de los que es responsable.

**Why this priority**: útil, pero el trabajo diario del profesor pasa por sesiones y asistencia, no por aquí.

**Acceptance Scenarios**:

1. **Given** un profesor tutor, **When** abre grupos tutoriales, **Then** los ve en modo lectura, sin crear ni editar.
2. **Given** un profesor, **When** abre un grupo del que no es tutor, **Then** obtiene «no encontrado», no un mensaje
   que revele que existe.

---

### Edge Cases

- **Alumnos sin grupo.** Es el estado inicial de los 8 alumnos ya existentes. Deben verse, agrupados aparte (US3.4), no
  desaparecer del listado.
- **Grupo eliminado con alumnos dentro.** Debe decidirse y quedar escrito: los alumnos **no se borran**; quedan sin
  grupo. La baja de un grupo nunca puede arrastrar alumnos.
- **Tutor eliminado.** La ficha de profesor se da de baja mientras es tutor: el grupo queda **sin tutor asignado**, no
  colgando de un identificador que ya no existe.
- **Grupo de otro centro.** Responde 404, nunca 403, para no revelar su existencia.
- **Alumno adscrito a un grupo de un curso académico pasado.** Se muestra igual: el histórico queda fuera de alcance,
  pero el dato no debe romper la vista.
- **Muchos grupos y muchos alumnos.** La paginación actual del listado —20 por página, tope de 50— parte un grupo entre
  páginas. Ver *Requisitos de listado*.
- **Nombres largos** de grupo o de tutor: deben partirse o truncarse sin desbordar.

---

## Requirements *(mandatory)*

### Modelo de datos

- **FR-001**: DEBE existir una entidad **grupo tutorial** que represente el aula o grupo de alumnos, distinta de
  `class_groups`.
- **FR-002**: Todo grupo tutorial DEBE pertenecer exactamente a una organización, con su columna, su índice y su clave
  foránea, como exige el Principio IX.
- **FR-003**: Un grupo tutorial DEBE tener nombre y curso académico.
- **FR-003a**: Un grupo tutorial DEBE tener **turno** —mañana o tarde—. Es lo que distingue «1º ESO mañana» de «1º ESO
  tarde», que son grupos distintos con alumnos y tutor distintos.
- **FR-003b**: Un grupo tutorial DEBE poder designar un **alumno delegado**, y ese vínculo DEBE ser **opcional**: un
  grupo recién creado no tiene alumnos todavía, así que tampoco puede tener delegado.
- **FR-003c**: El alumno delegado DEBE pertenecer **a ese mismo grupo**. Aceptar un alumno de otro grupo produciría un
  dato sin sentido que ninguna pantalla podría presentar de forma coherente.
- **FR-004**: La combinación de nombre, turno y curso académico DEBE ser única **por organización**, no globalmente: dos
  centros pueden tener su «1º ESO», el mismo centro puede repetirlo en cursos distintos, y «1º ESO mañana» y «1º ESO
  tarde» conviven en el mismo curso.
- **FR-005**: Un grupo tutorial DEBE poder referenciar **un** profesor tutor, y ese vínculo DEBE ser **opcional**: un
  grupo existe antes de que se le asigne tutor, y es lo que hace posible mostrar «sin asignar».
- **FR-006**: El profesor tutor DEBE pertenecer a la misma organización que el grupo.
- **FR-007**: Un alumno DEBE poder referenciar **un** grupo tutorial, y ese vínculo DEBE ser **opcional**. Hacerlo
  obligatorio rompería la migración sobre los alumnos que ya existen, que es exactamente el defecto que obligó a partir
  en dos la migración M4 de la feature 001.
- **FR-008**: El grupo de un alumno DEBE pertenecer a la misma organización que el alumno.
- **FR-009**: Los grupos DEBEN llevar un **criterio de orden explícito y almacenado**. El orden académico NO DEBE
  escribirse en el código: el Principio XII prohíbe acoplar la lógica a un país, y el sistema educativo de Guinea
  Ecuatorial no tiene por qué coincidir con el español. Ordenar por el texto del nivel además da resultado incorrecto
  —alfabéticamente «1º Bachiller» precede a «1º ESO»—.
- **FR-010**: Dar de baja un grupo NO DEBE borrar ni desactivar a sus alumnos; estos quedan sin grupo.
- **FR-011**: Dar de baja una ficha de profesor NO DEBE dejar grupos apuntando a un tutor inexistente; el grupo queda
  sin tutor.
- **FR-012**: `students.school_level` NO DEBE eliminarse ni sustituirse. Es el nivel académico del alumno, un dato
  distinto del grupo al que se le adscribe.

### API

- **FR-013**: DEBE existir un recurso de grupos tutoriales con listado, detalle, alta, edición y baja.
- **FR-014**: El listado de grupos DEBE admitir búsqueda por nombre.
- **FR-015**: El listado de grupos DEBE incluir su profesor tutor **cargado de antemano**, sin una consulta por grupo.
- **FR-016**: El listado de alumnos DEBE incluir su grupo tutorial y el tutor de ese grupo **cargados de antemano**.
  NO DEBE producirse una consulta por alumno ni por grupo (sin N+1).
- **FR-017**: El alta y la edición de alumno DEBEN aceptar el grupo tutorial.
- **FR-018**: El servidor NO DEBE aceptar un grupo de otra organización; el rechazo DEBE ser indistinguible de que el
  grupo no exista.
- **FR-019**: Toda consulta a grupos tutoriales DEBE filtrarse por organización a nivel de modelo, con el mismo
  mecanismo que el resto de entidades, y no solo en el controlador.
- **FR-020**: El acceso DEBE regirse por una política propia: escritura para `org_admin`, lectura para `teacher`,
  ningún acceso para `super_admin`.
- **FR-021**: El listado de alumnos DEBE poder acotarse por grupo tutorial. Es lo que permitirá paginar por bloque
  cuando el volumen lo pida.

### Interfaz

- **FR-022**: DEBE existir una sección de grupos tutoriales con su listado y su formulario, con el patrón de las demás
  entidades.
- **FR-022a**: DEBE resolverse la **colisión de nombres** de la interfaz. Hoy la sección «Grupos» (`/grupos`) muestra
  `class-groups`, que son grupos **de asignatura**. Tener dos secciones llamadas «Grupos» sería incomprensible para el
  personal del centro. La entidad nueva se queda con **«Grupos»**, por ser la unidad organizativa principal, y la
  existente pasa a llamarse **«Grupos de asignatura»** en `/grupos-asignatura`. Es un cambio de rótulo y de ruta, no de
  funcionalidad, y toca código entregado en la feature 002.
- **FR-023**: El formulario de grupo DEBE ofrecer el profesor tutor como desplegable acotado al propio centro, con la
  opción de dejarlo sin asignar.
- **FR-023a**: El formulario de grupo DEBE ofrecer el turno.
- **FR-023b**: El formulario de grupo DEBE ofrecer el alumno delegado como desplegable acotado **a los alumnos de ese
  grupo**, con la opción de dejarlo sin designar. Al crear un grupo, que aún no tiene alumnos, el campo DEBE aparecer
  deshabilitado y explicado, no vacío y en silencio.
- **FR-023c**: El formulario de grupo NO DEBE pedir más datos que estos. El alcance acordado es «un profesor
  responsable, turno, estudiante responsable del grupo, y poco más»: cualquier campo adicional necesita justificarse.
- **FR-024**: El formulario de alumno DEBE ofrecer el grupo tutorial como desplegable acotado al propio centro.
- **FR-025** *(revisado el 2026-08-18)*: La sección de alumnos DEBE presentarse como **índice de aulas**: una entrada
  por grupo, y el listado de alumnos al entrar en una.

  **Por qué cambió.** La versión entregada mostraba todos los alumnos en bloques por grupo. Con los 8 alumnos sembrados
  se veía bien; con los ~500 de un centro real es inservible, y no por longitud sino por algo peor: **la paginación es
  global**. La página trae 20 alumnos, así que cada bloque era un FRAGMENTO de su grupo y el recuento mentía —«1º ESO,
  2 alumnos» cuando el grupo tiene 30—. Plegar los bloques no lo arreglaba: seguirían siendo fragmentos con cifras
  falsas.

  La estructura nueva invierte la jerarquía: primero las aulas con su recuento **real**, y los alumnos paginados dentro
  de su grupo. El coste de la pantalla principal pasa a depender del número de grupos —decenas— y no del de alumnos.
- **FR-026**: La cabecera de cada bloque DEBE mostrar el nombre del grupo **con su turno** —«1º ESO — Mañana»— y,
  alineado a la derecha, su profesor tutor.
- **FR-027**: Un grupo sin tutor DEBE mostrar un texto explícito de **sin asignar**, nunca un hueco vacío.
- **FR-028** *(revisado)*: Un grupo sin alumnos **SÍ** aparece en el índice de aulas, con su recuento a cero. En la
  estructura anterior se ocultaba porque un bloque vacío en un listado de alumnos era ruido; en un índice de aulas es
  información útil —dice que ese grupo existe y está pendiente de recibir alumnos—.
- **FR-029**: Los alumnos sin grupo DEBEN aparecer en un bloque propio, claramente identificado como pendiente de
  asignar. NO DEBEN ocultarse.
- **FR-030**: La tabla de cada bloque NO DEBE incluir una columna con el grupo.
- **FR-031**: Los bloques DEBEN ordenarse por el criterio almacenado (FR-009), y los alumnos dentro de cada bloque por
  apellidos y nombre.
- **FR-032**: La búsqueda DEBE seguir operando sobre todos los alumnos, con independencia del grupo, y los bloques DEBEN
  recomponerse con lo encontrado.
- **FR-033**: Crear, editar y eliminar alumnos DEBEN seguir funcionando exactamente como hoy.
- **FR-034**: Los bloques DEBEN mantener la representación por tarjetas cuando el ancho no dé para una tabla, sin
  desplazamiento horizontal.
- **FR-035**: El lenguaje visual existente NO DEBE cambiar: tipografía, espaciado, colores, bordes y botones se
  mantienen. Esta feature reorganiza y añade, no rediseña.

### Requisitos de listado y volumen

- **FR-036**: La agrupación DEBE construirse a partir del grupo que trae cada alumno, no infiriéndola de textos.
- **FR-037** *(resuelto por el rediseño)*: Ya no hace falta advertencia alguna. Cada pantalla de alumnos está acotada a
  un grupo **en el servidor**, así que su paginación es la de ese grupo y ninguna cifra es un fragmento. El aviso que
  contemplaba este requisito se retiró junto con los bloques.

- **FR-038**: El índice DEBE mostrar el recuento **real** de alumnos de cada grupo, obtenido del servidor. NO DEBE
  deducirse de los alumnos cargados en la página.
- **FR-039**: DEBE existir un acceso al listado completo de alumnos del centro, sin agrupar, para buscar a alguien de
  quien no se recuerda el grupo.
- **FR-040**: Al crear un alumno desde el detalle de un aula, el grupo DEBE venir preseleccionado.

### Key Entities

- **TutorGroup** *(nuevo)*: el aula o grupo de alumnos. Pertenece a una organización. Tiene nombre, turno, curso
  académico, criterio de orden y estado; y opcionalmente un profesor tutor y un alumno delegado.

  **Nota sobre la referencia circular**: el grupo apunta a su delegado y el alumno apunta a su grupo. Es admisible
  porque **ambas referencias son opcionales**, de modo que el orden de alta no se bloquea: primero el grupo, después los
  alumnos, después el delegado. Al dar de baja un alumno que era delegado, el grupo debe quedar **sin delegado**, nunca
  apuntando a un registro inexistente.
- **Student** *(modificado)*: gana una referencia opcional a su grupo tutorial. Conserva `school_level`.
- **Teacher** *(sin cambios de esquema)*: pasa a ser referenciable como tutor de un grupo.
- **ClassGroup** *(sin cambios)*: sigue siendo el grupo **de una asignatura**. No se toca ni se reinterpreta.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrador crea un grupo, le asigna tutor y adscribe un alumno en menos de 90 segundos.
- **SC-002**: El listado de alumnos agrupado se resuelve con **una sola consulta de listado**, sin ninguna consulta
  adicional por alumno ni por grupo. Verificable contando las consultas del servidor.
- **SC-003**: Un usuario de la organización A no puede leer, modificar ni referenciar ningún grupo tutorial de la
  organización B, y el intento es indistinguible de que no exista. Cubierto por prueba automatizada, como exige el
  Principio V.
- **SC-004**: Con grupos sin tutor, sin alumnos, y con alumnos sin grupo presentes a la vez, el listado se muestra sin
  ningún error.
- **SC-005**: Los bloques aparecen en el orden académico configurado por el centro, verificable con un orden no
  alfabético.
- **SC-006**: Ninguna pantalla de la feature produce desplazamiento horizontal entre 360 px y 1920 px.
- **SC-007**: La suite del backend sigue en verde, con las pruebas nuevas incluidas.
- **SC-008**: Eliminar un grupo con alumnos no cambia el número de alumnos del centro.
- **SC-009**: Dar de baja al alumno que era delegado deja el grupo **sin delegado**, y el listado sigue mostrándose sin
  error.
- **SC-010**: «1º ESO mañana» y «1º ESO tarde» coexisten en el mismo curso académico como dos bloques separados, cada
  uno con su tutor y sus alumnos.

---

## Assumptions

- Un alumno pertenece **a un solo grupo tutorial a la vez**. Es lo que hace la agrupación no ambigua; si un centro
  necesitara varios, la vista dejaría de tener sentido y sería otra feature.
- Un grupo tiene **un solo tutor**. Los centros con cotutor quedan fuera del MVP.
- El curso académico se escribe como texto, igual que en `class_groups.academic_year`, para no introducir un calendario
  académico que hoy no existe.
- El turno se limita a **mañana y tarde**. Es lo que el centro usa hoy. Si apareciera un turno de noche, se añade un
  valor: el campo se diseña como conjunto cerrado y validado en servidor, igual que los demás estados del producto.
- El alumno delegado se designa **desde la ficha del grupo**, no desde la del alumno: es un atributo del grupo —solo hay
  uno— y ponerlo en el alumno permitiría marcar a dos delegados del mismo grupo sin que nada lo impidiera.
- El criterio de orden lo fija el centro al crear cada grupo. No se propone una escala predefinida, precisamente para no
  acoplarse a un país.
- Los alumnos existentes quedan sin grupo tras la migración y se adscriben a mano. No hay forma automática de deducir su
  grupo a partir de `school_level`, que es texto libre.
- Se reutilizan el patrón de entidad de la feature 002 —`ResourcePage`, `useResourceList`, `RelationSelect`— y el
  mecanismo de aislamiento de la 001 —trait, global scope y regla de validación propia—. Esta feature no introduce
  ninguna capa nueva.

---

## Future Features

- **Histórico de grupo**: saber en qué grupo estuvo un alumno cada curso, y promocionar de un curso al siguiente.
- **Aula física** como entidad, hoy texto libre en `class_sessions.room`.
- **Cotutores**.
- **Paginación por bloque**: cuando un centro tenga cientos de alumnos, lo natural es listar grupos y desplegar los
  alumnos de cada uno bajo demanda, apoyándose en el filtro de FR-021.
- **Adscripción masiva**: asignar grupo a muchos alumnos de una vez, en lugar de ficha a ficha.
