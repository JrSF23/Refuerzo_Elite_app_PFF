# Data Model: Grupos tutoriales

**Feature**: `003-tutor-groups` | **Fecha**: 2026-08-17

Detalle del esquema, las reglas y las decisiones. Una tabla nueva y una columna; nada existente se reestructura.

---

## 1. Tabla `tutor_groups`

| Columna | Tipo | Nulo | Por qué |
|---|---|---|---|
| `id` | bigint unsigned, PK | no | |
| `organization_id` | bigint unsigned, FK `organizations` | **no** | Principio IX. Con índice y clave foránea desde la migración inicial. |
| `name` | varchar(100) | no | «1º ESO», «4º ESO - A». Lo que el centro use. |
| `shift` | varchar(20) | no | `morning` \| `afternoon`. Distingue «1º ESO mañana» de «1º ESO tarde». |
| `academic_year` | varchar(20) | no | «2025-2026». Mismo formato que `class_groups.academic_year`. |
| `tutor_teacher_id` | bigint unsigned, FK `teachers` | **sí** | FR-005. Un grupo existe antes de tener tutor; es lo que permite «sin asignar». |
| `representative_student_id` | bigint unsigned, FK `students` | **sí** | FR-003b. Un grupo recién creado no tiene alumnos, luego tampoco delegado. |
| `sort_order` | int | no, DEFAULT 0 | FR-009. Orden académico **como dato**. |
| `status` | varchar(20) | no, DEFAULT `active` | `active` \| `inactive`, igual que el resto del producto. |
| `created_at`, `updated_at` | timestamp | sí | |
| `deleted_at` | timestamp | sí | Borrado lógico, como `students` y `enrollments`. |

### Índices y restricciones

```sql
INDEX  (organization_id)
UNIQUE (organization_id, name, shift, academic_year)
FOREIGN KEY (organization_id)           REFERENCES organizations(id)
FOREIGN KEY (tutor_teacher_id)          REFERENCES teachers(id)  ON DELETE SET NULL
FOREIGN KEY (representative_student_id) REFERENCES students(id)  ON DELETE SET NULL
```

**Sobre la clave única.** Incluye `shift` porque «1º ESO mañana» y «1º ESO tarde» son grupos distintos y chocarían sin
él. Y va acotada por `organization_id` porque dos centros pueden tener ambos su «1º ESO»: una unicidad global sería a la
vez un fallo funcional y **una fuga de información**, ya que el error de duplicado revelaría la existencia de un registro
de otro centro. Es el mismo razonamiento que en `subjects.code` y `class_groups.code` (FR-020 de la feature 001).

## 2. Columna nueva en `students`

| Columna | Tipo | Nulo | Por qué |
|---|---|---|---|
| `tutor_group_id` | bigint unsigned, FK `tutor_groups` | **sí** | FR-007. Con índice. `ON DELETE SET NULL`. |

**Por qué nullable, y no es negociable.** Los alumnos ya existentes no tienen grupo. Una columna `NOT NULL` sin valor
por defecto hace fallar la migración sobre datos reales. Es exactamente el defecto que en la feature 001 obligó a
partir la migración M4 en dos (M4 sin `NOT NULL`, M5 con él, después de que el trait rellenara los valores). Aquí no hay
forma de rellenarlo automáticamente —`school_level` es texto libre y no se corresponde con ningún grupo—, así que la
columna se queda nullable de forma permanente y la adscripción es manual.

## 3. Comportamiento ante borrados

Las tres claves foráneas usan `ON DELETE SET NULL`, y cada una implementa un requisito:

| Se borra | Qué pasa | Requisito |
|---|---|---|
| Un **grupo** con alumnos | Los alumnos quedan con `tutor_group_id = NULL`. **No se borran ni se desactivan.** | FR-010, SC-008 |
| Un **profesor** que era tutor | El grupo queda con `tutor_teacher_id = NULL` y se muestra «sin asignar». | FR-011 |
| Un **alumno** que era delegado | El grupo queda con `representative_student_id = NULL`. | SC-009 |

**Por qué no `CASCADE`.** Es el comportamiento por reflejo, y aquí sería destructivo: borrar un grupo se llevaría por
delante a todos sus alumnos, con sus matrículas, su asistencia y sus pagos. La spec lo prohíbe explícitamente.

**Cuidado con el borrado lógico.** `students` y `tutor_groups` usan `SoftDeletes`, así que un borrado normal **no**
dispara la clave foránea: el registro sigue en la tabla con `deleted_at`. El `SET NULL` solo actúa en un borrado físico.
Por tanto, la limpieza de referencias a registros borrados lógicamente **hay que hacerla en el modelo**, en el evento de
borrado, y hay que probarla. Es una trampa fácil de pasar por alto: la clave foránea da falsa sensación de estar
cubierto.

## 4. Referencia circular

```
tutor_groups.representative_student_id  ──►  students.id
students.tutor_group_id                 ──►  tutor_groups.id
```

Es admisible y no bloquea nada **porque ambas son nullable**. El orden de alta funciona:

1. Se crea el grupo, sin delegado.
2. Se adscriben alumnos al grupo.
3. Se designa delegado entre ellos.

Con cualquiera de las dos obligatoria, la secuencia sería imposible: no se podría crear el primer grupo sin alumnos ni
el primer alumno sin grupo.

## 5. Reglas de validación

### Al crear o editar un grupo

| Campo | Regla | Nota |
|---|---|---|
| `name` | requerido, cadena, máx. 100, único con `shift` + `academic_year` **dentro de la organización** | La unicidad se acota en el servidor, no en la capa SQL: si se dejara al índice, el error de clave duplicada revelaría un registro ajeno. |
| `shift` | requerido, uno de `morning`, `afternoon` | Conjunto cerrado validado en servidor, no `ENUM` de base de datos: añadir un turno no debe exigir migración. |
| `academic_year` | requerido, cadena, máx. 20 | |
| `tutor_teacher_id` | opcional, **debe pertenecer a la organización activa** | Con `BelongsToCurrentOrganization`, que consulta por Eloquent para que el global scope aplique. |
| `representative_student_id` | opcional, debe pertenecer a la organización activa **y a este grupo** | Dos comprobaciones. La segunda es FR-003c. |
| `sort_order` | opcional, entero | Por defecto 0. |
| `status` | requerido, `active` o `inactive` | |

**La regla del delegado es la única no trivial.** Debe fallar en dos casos distintos:

- El alumno es de otra organización → el mensaje debe ser **indistinguible** de «no existe», igual que el resto de
  referencias cruzadas (FR-018).
- El alumno existe en este centro pero está en **otro grupo** → aquí sí procede un mensaje explicativo, porque no hay
  nada que ocultar: el usuario ve a ese alumno en la aplicación.

Al **crear** un grupo no puede haber delegado, porque todavía no tiene alumnos. La regla debe rechazarlo con esa
explicación en lugar de con un error críptico.

### Al crear o editar un alumno

| Campo | Regla |
|---|---|
| `tutor_group_id` | opcional, debe pertenecer a la organización activa, con `BelongsToCurrentOrganization` |

Todo lo demás del alumno queda **sin cambios**.

**`organization_id` no se acepta jamás** del cliente, ni en grupos ni en alumnos: lo asigna el trait desde el contexto
de petición. Ponerlo en `$fillable` o en `rules()` reabriría FR-006 de la feature 001.

## 6. Relaciones Eloquent

```php
// TutorGroup
organization()   BelongsTo Organization
tutor()          BelongsTo Teacher, 'tutor_teacher_id'
representative() BelongsTo Student, 'representative_student_id'
students()       HasMany   Student,  'tutor_group_id'

// Student  (añadido)
tutorGroup()     BelongsTo TutorGroup, 'tutor_group_id'
```

**Carga ansiosa obligatoria** (SC-002):

- `TutorGroupController::$with = ['tutor', 'representative']`
- `StudentController::$with` pasa de `['guardian']` a `['guardian', 'tutorGroup.tutor']`

Sin lo segundo, pintar el tutor en la cabecera de cada bloque dispararía una consulta por alumno. Con 300 alumnos, 600
consultas por pantalla.

## 7. Qué NO cambia

| Elemento | Sigue significando lo mismo |
|---|---|
| `class_groups` | Grupo **de una asignatura**, con su profesor y sus matrículas. No se reinterpreta ni se sustituye. |
| `enrollments` | Matrícula de un alumno en un grupo de asignatura. |
| `students.school_level` | Nivel académico del alumno, texto libre. Distinto del grupo al que se le adscribe. |
| `students.guardian_id` | Tutor **legal** del alumno. Nada que ver con el tutor del grupo. |
| `class_sessions.room` | Aula **física** de una sesión concreta, texto libre. |

## 8. Datos de demostración

El seeder debe crear grupos que ejerciten los casos límite, no solo el feliz:

- Un grupo **con tutor y con delegado** — el caso completo.
- Un grupo **sin tutor** — para ver «sin asignar» (US1.3).
- Un grupo **sin alumnos** — para comprobar que no aparece en el listado (US3.3).
- **Dos grupos con el mismo nombre y distinto turno** — «1º ESO mañana» y «1º ESO tarde» (SC-010).
- **Alumnos sin grupo** — es el estado de los 8 existentes, y deben verse en su bloque propio (US3.4).

Los grupos deben sembrarse **en las dos organizaciones**, con nombres repetidos entre ellas, porque es lo que permite
que las pruebas de aislamiento comprueben algo real.
