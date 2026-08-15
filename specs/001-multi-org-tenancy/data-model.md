# Phase 1 — Data Model: Soporte Multi-Organización

**Feature**: `001-multi-org-tenancy` | **Date**: 2026-08-14

Modelo de datos resultante. Las decisiones que lo sustentan están en [research.md](./research.md).

---

## Entidad nueva: `organizations`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `id` | bigint unsigned, PK | no | |
| `name` | string(255) | no | Nombre visible del centro |
| `slug` | string(120), **unique** | no | Identificador legible, estable, generado del nombre |
| `status` | string(20) | no | `active` \| `suspended`. Por defecto `active` |
| `contact_email` | string(255) | sí | Contacto administrativo del centro |
| `contact_phone` | string(30) | sí | |
| `created_at` / `updated_at` | timestamp | sí | |
| `deleted_at` | timestamp | sí | Borrado lógico: FR-021 y "no desaparecer de forma irrecuperable" |

**Transiciones de estado**: `active → suspended` (el super administrador la suspende) y
`suspended → active` (la reactiva). No hay más estados en el MVP. La transición a `suspended` **no**
altera ningún dato de negocio; solo corta el acceso (FR-011).

`deleted_at` y `status` son **condiciones independientes** para conceder acceso, y ninguna suple a la
otra. `EnsureTenantContext` solo establece contexto cuando se cumplen las tres a la vez: la organización
existe, `deleted_at IS NULL` y `status = active`. Una organización con `deleted_at` puesto y
`status = active` **no** da acceso a sus usuarios; una suspendida sin borrar, tampoco. La resolución del
tenant nunca usa `withTrashed()`. En ambos casos los datos de negocio permanecen íntegros y recuperables:
ni la suspensión ni el borrado lógico de la organización propagan borrado a sus entidades.

**Índices**: `slug` único; índice en `status`.

`Organization` **no** usa el trait de tenancy: es la tabla raíz, y solo el super administrador la
consulta.

---

## Columna `organization_id` en las tablas existentes

Se añade `organization_id` (bigint unsigned, FK → `organizations.id`, `restrictOnDelete`) a:

| Tabla | Nulo final | Trait | Observaciones |
|---|---|---|---|
| `users` | **sí** | no | Nulo solo para `super_admin` (FR-004). El modelo `User` no lleva global scope: el login debe encontrar al usuario antes de que exista contexto. |
| `guardians` | no | sí | |
| `teachers` | no | sí | |
| `subjects` | no | sí | |
| `students` | no | sí | |
| `class_groups` | no | sí | |
| `class_sessions` | no | sí | Redundante vía `class_group_id`, pero necesaria: hay consultas que no pasan por el grupo (`DashboardController`). |
| `enrollments` | no | sí | |
| `attendances` | no | sí | Ídem `class_sessions`: se consulta por `whereHas('classSession')`, que sin columna propia no filtraría. |
| `payments` | no | sí | |
| `audit_events` | no | sí | D10 |

**Por qué `class_sessions` y `attendances` llevan columna propia** aunque su pertenencia se deduzca del
grupo: sin ella, el aislamiento dependería de que toda consulta pase por la relación. Es exactamente el
tipo de dependencia implícita que el Principio V prohíbe.

---

## Columna `user_id` en `teachers`

| Columna | Tipo | Nulo | Notas |
|---|---|---|---|
| `user_id` | bigint unsigned, FK → `users.id`, **unique**, `nullOnDelete` | sí | Relación uno a uno opcional (FR-015a, FR-015b) |

- Nulo = ficha de profesor sin acceso al sistema (personal que no entra a la aplicación).
- Único = una cuenta no puede vincularse a dos fichas ni una ficha a dos cuentas.
- `nullOnDelete` = al borrar la cuenta, la ficha y su historial docente sobreviven.

**Invariante que la base de datos no puede imponer y debe validarse en aplicación**: `teachers.user_id`
debe apuntar a un usuario de la **misma** organización que la ficha.

---

## Cambios en índices únicos

FR-019: la unicidad pasa de global a por organización.

| Tabla | Índice actual | Índice nuevo |
|---|---|---|
| `subjects` | `code` único | `(organization_id, code)` único |
| `class_groups` | `code` único | `(organization_id, code)` único |
| `students` | `email` único | `(organization_id, email)` único |
| `teachers` | `email` único | `(organization_id, email)` único |
| `guardians` | `email` único | `(organization_id, email)` único |
| `users` | `email` único | **sin cambios** — sigue siendo único global (D5) |
| `enrollments` | `(student_id, class_group_id)` único | sin cambios: ambas FK ya son tenant-scoped |
| `attendances` | `(class_session_id, student_id)` único | sin cambios, mismo motivo |

**Borrado lógico y unicidad**: `students`, `enrollments`, `attendances` y `payments` tienen
`deleted_at`. Un alumno eliminado lógicamente sigue ocupando su hueco en el índice único. Es el
comportamiento actual y no se cambia; se documenta para que no sorprenda al reutilizar un correo.

---

## Índices de rendimiento

Todo listado filtra ahora por `organization_id`, así que los índices existentes de una sola columna
dejan de ser selectivos. Se añaden compuestos con `organization_id` **como primera columna**:

| Tabla | Índice a añadir |
|---|---|
| `students` | `(organization_id, status)`, `(organization_id, guardian_id)` |
| `enrollments` | `(organization_id, status)` |
| `class_groups` | `(organization_id, status)`, `(organization_id, academic_year)` |
| `class_sessions` | `(organization_id, class_group_id, session_date)` |
| `payments` | `(organization_id, status)`, `(organization_id, paid_at)` |
| `audit_events` | `(organization_id, entity_type, entity_id)`, `(organization_id, created_at)` |
| resto de tablas tenant | `(organization_id)` simple |

Los índices de una sola columna equivalentes se retiran cuando el compuesto los cubre por prefijo.

---

## Roles y permisos

| Rol | Organización | Alcance |
|---|---|---|
| `super_admin` | ninguna (`organization_id` nulo) | Organizaciones y cuentas de usuario. **Sin acceso a datos de negocio** (FR-013a). |
| `org_admin` | obligatoria | Todo el dominio de su organización, incluidos usuarios y pagos. |
| `teacher` | obligatoria | Solo sus grupos, los alumnos matriculados en ellos y la asistencia de sus sesiones. **Sin acceso a pagos** (FR-016). |

Renombrado: el rol `admin` existente pasa a llamarse `org_admin`, conservando fila y asignaciones (D7).
`teacher` no cambia. `student` **no** se crea todavía.

No se usa la funcionalidad *teams* de Spatie Permission (D1).

---

## Migraciones

Cuatro migraciones, en este orden, cada una desplegable por separado (D9, Principio X):

**M1 — `create_organizations_table`**
Crea la tabla e inserta la organización del centro actual (nombre real, `slug` derivado,
`status = active`).

**M2 — `add_organization_id_to_tables`**
Añade `organization_id` **nullable** a las diez tablas de negocio y a `users` — once tablas en total;
añade `teachers.user_id` nullable único. Sin claves foráneas todavía. El sistema sigue funcionando
exactamente igual.

**M3 — `backfill_organization_data`**
Dentro de una transacción:
1. Asigna la organización de M1 a todas las filas de las diez tablas de negocio y a todos los usuarios
   existentes.
2. Renombra el rol `admin` → `org_admin`.
3. Vincula `teachers.user_id` emparejando `teachers.email` con `users.email` **una sola vez**, como
   migración de datos revisable a mano — nunca como regla de acceso (D6).
4. Verifica que no queda ninguna fila con `organization_id` nulo en las tablas de negocio; aborta si la
   hay.

**M4 — `enforce_organization_constraints`**
Impone `NOT NULL` en las diez tablas de negocio (`users` queda nullable por FR-004), añade las claves
foráneas en las once tablas, sustituye los índices únicos globales por los compuestos y crea los índices
de rendimiento.

**Requisito de operación (Principio VIII)**: M3 y M4 no se ejecutan en producción sin copia de seguridad
verificada y restaurable. Los recuentos por entidad se comparan antes y después (SC-004).

---

## Reglas de validación derivadas

| Regla | Dónde | Requisito |
|---|---|---|
| Toda FK de negocio (`guardian_id`, `student_id`, `class_group_id`, `class_session_id`, `subject_id`, `teacher_id`, `enrollment_id`) debe pertenecer a la organización activa | Regla `BelongsToCurrentOrganization`, sustituyendo `exists:` en los 9 controladores CRUD | FR-009 |
| `unique` de `code` y `email` acotado con `->where('organization_id', ...)` | Reglas de `SubjectController`, `ClassGroupController`, `StudentController`, `TeacherController`, `GuardianController` | FR-019, FR-020 |
| `teachers.user_id` debe apuntar a un usuario de la misma organización | `TeacherController::rules()` | FR-015b |
| `organization_id` **nunca** es campo aceptado en ninguna petición | Ausente de todos los `rules()`; lo rellena el trait | FR-006, FR-018 |

---

## Trazabilidad requisito → modelo

| Requisito | Elemento del modelo |
|---|---|
| FR-001, FR-002 | Tabla `organizations` con `status` |
| FR-003 | `organization_id` en las diez tablas de negocio |
| FR-004, FR-004a | `users.organization_id` nullable; `users.email` único global |
| FR-005, FR-006 | Contexto resuelto del usuario; `organization_id` fuera de todo `rules()` |
| FR-007, FR-008 | Global scope + `findOrFail` |
| FR-009 | Regla `BelongsToCurrentOrganization` |
| FR-010, FR-011 | Middleware `EnsureTenantContext` + `organizations.status` |
| FR-012 a FR-018 | Tabla de roles y policies |
| FR-015a/b/c | `teachers.user_id` nullable único |
| FR-019, FR-020 | Índices únicos compuestos + `where` en la validación |
| FR-021 | `deleted_at` conservando `organization_id` |
| FR-022, FR-023 | Migraciones M1–M4 |
| FR-024, FR-025 | Ver [quickstart.md](./quickstart.md) |
| FR-026 | Sin cambios de prefijo en `routes/api.php` |
