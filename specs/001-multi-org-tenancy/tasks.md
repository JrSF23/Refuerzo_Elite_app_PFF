# Tasks: Soporte Multi-Organización (Multi-Tenancy)

**Input**: Documentos de diseño de `/specs/001-multi-org-tenancy/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/organizations-api.md](./contracts/organizations-api.md)

**Tests**: **SÍ se incluyen tareas de test.** La spec los exige explícitamente (FR-024, FR-025, SC-008) y el
Principio V de la constitución los declara no negociables ("batería de tests de aislamiento obligatoria por
entidad"). No son opcionales en esta feature.

**Organization**: las tareas se agrupan por historia de usuario para poder implementarlas y validarlas de
forma independiente.

## Format: `[ID] [P?] [Story] Descripción`

- **[P]**: paralelizable (ficheros distintos, sin dependencias pendientes)
- **[Story]**: historia a la que pertenece (US1–US5)
- Toda descripción lleva la ruta exacta del fichero

## Path Conventions

Aplicación web con dos árboles en el mismo repositorio, conforme a plan.md:

- Backend Laravel: `backend/app/`, `backend/database/`, `backend/routes/`, `backend/tests/`
- Frontend React: `frontend/src/`

---

## Nota sobre el reparto de las migraciones

Las migraciones M1–M4 de [data-model.md](./data-model.md) van en la Fase 2 (Foundational), no repartidas
entre historias: forman una cadena lineal y ninguna historia puede probarse contra un esquema a medias.
La historia US2 no consiste en escribir el backfill, sino en **demostrar que la migración es segura y
reversible**: recuentos antes/después, credenciales intactas y runbook de ejecución.

> **Corrección aplicada durante la Fase 2 — el `NOT NULL` sale de M4.**
> Imponerlo en la Fase 2 rompe toda escritura por API: quien rellena `organization_id` es el trait
> `BelongsToOrganization` (T031), que no llega hasta la Fase 3. Entre ambas, cualquier `POST` falla con
> violación de integridad y el sistema deja de ser desplegable, en contra del Principio X. Verificado en
> ejecución: `POST /api/v1/students` devolvía 500 (`NOT NULL constraint failed: students.organization_id`).
> M4 conserva únicamente índices únicos por organización, índices de rendimiento y claves foráneas. El
> `NOT NULL` pasa a una migración M5 aplicada en la Fase 3, justo después del trait.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: preparar rama y estructura de directorios. Sin dependencias nuevas (Principio VII).

- [X] T001 Crear la rama `001-multi-org-tenancy` desde `main` en la raíz del repositorio `refuerzo-elite-v2/` y confirmar que el árbol de trabajo queda limpio salvo `.gitignore` y `frontend/vite.config.js` ya modificados
- [X] T002 [P] Crear los directorios nuevos con `.gitkeep`: `backend/app/Models/Concerns/`, `backend/app/Models/Scopes/`, `backend/app/Support/`, `backend/app/Policies/`, `backend/app/Rules/`
- [X] T003 [P] Escribir `specs/001-multi-org-tenancy/quickstart.md` con el guion de validación punta a punta (dos organizaciones pobladas, comprobación cruzada de las 10 entidades de negocio, alta de organización nueva, acceso de profesor) — el fichero está referenciado por plan.md y data-model.md pero aún no existe
- [X] T004 [P] Verificar en `backend/phpunit.xml` que la suite corre sobre SQLite en memoria y que `RefreshDatabase` ejecutará M1–M4 en cada test

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: esquema completo, contexto de organización y resolución por petición. Es la base sobre la que
se apoyan las cinco historias.

**⚠️ CRITICAL**: ninguna historia puede empezar hasta que esta fase esté completa y la suite existente pase.

### Esquema (M1–M4, orden estricto)

- [X] T005 Crear la migración M1 en `backend/database/migrations/2026_08_14_000001_create_organizations_table.php` con las columnas de data-model.md (`name`, `slug` único, `status` por defecto `active`, `contact_email`, `contact_phone`, timestamps, `deleted_at`), índice en `status`, e inserción de la organización del centro actual
- [X] T006 Crear el modelo `backend/app/Models/Organization.php` con `SoftDeletes`, casts, `$fillable` sin `status`, scope `active()` y relación `users()`. **No** usa el trait de tenancy (es la tabla raíz)
- [X] T007 [P] Crear `backend/database/factories/OrganizationFactory.php` con `slug` único y `status = active`
- [X] T008 Crear la migración M2 en `backend/database/migrations/2026_08_14_000002_add_organization_id_to_tables.php` que añade `organization_id` **nullable sin FK** a `users`, `guardians`, `teachers`, `subjects`, `students`, `class_groups`, `class_sessions`, `enrollments`, `attendances`, `payments` y `audit_events`, más `teachers.user_id` nullable único
- [X] T009 Crear la migración M3 en `backend/database/migrations/2026_08_14_000003_backfill_organization_data.php`: dentro de una transacción asigna la organización de M1 a las diez tablas de negocio y a todos los usuarios, renombra el rol `admin` → `org_admin`, vincula `teachers.user_id` emparejando `teachers.email` con `users.email` una sola vez, y **aborta** si queda alguna fila de negocio con `organization_id` nulo
- [X] T010 Crear la migración M4 en `backend/database/migrations/2026_08_14_000004_enforce_organization_constraints.php`: claves foráneas `restrictOnDelete` hacia `organizations` en las once tablas, FK `nullOnDelete` de `teachers.user_id`, sustitución de los únicos globales (`subjects.code`, `class_groups.code`, `students.email`, `teachers.email`, `guardians.email`) por compuestos con `organization_id`, e índices de rendimiento de data-model.md. **El `NOT NULL` NO va aquí** (ver la nota de reparto: pasa a M5, Fase 3). **No retirar los índices que respaldan una clave foránea** —`students.guardian_id` y `class_sessions.class_group_id` no tienen índice `_foreign` propio— o MySQL/MariaDB falla con el error 1553. **Validado en SQLite, en MariaDB 10.4 y en el MySQL 8.0.46 del contenedor (2026-08-15), este último migrando una instalación mono-centro poblada: 104 filas asignadas, 2 fichas vinculadas, rol renombrado, 0 huérfanas, 11 FK, 5 únicos compuestos, 20 índices**

### Contexto y middleware

- [X] T011 [P] Crear `backend/app/Support/OrganizationContext.php` con `set()`, `id()`, `organization()`, `hasContext()` y `clear()`, sin estado estático
- [X] T012 Crear `backend/app/Http/Middleware/EnsureTenantContext.php` que resuelve la organización desde `$request->user()->organization_id`. **`deleted_at` y `status` son condiciones independientes: el contexto solo se establece cuando se cumplen las tres a la vez — la organización existe, `deleted_at IS NULL` y `status = active`.** Ninguna suple a la otra: una organización borrada lógicamente con `status = active` **no** da acceso, y una organización suspendida sin borrar tampoco. Rechaza con 403 en todos los demás casos: usuario sin organización que no sea `super_admin` (FR-010), organización suspendida (FR-011) y organización borrada lógicamente (FR-021). **La resolución del tenant nunca usa `withTrashed()`** (depende de T006, T011)
- [X] T013 Registrar `OrganizationContext` como singleton en `backend/app/Providers/AppServiceProvider.php`
- [X] T014 Registrar el alias `tenant` → `EnsureTenantContext` en `backend/bootstrap/app.php`, junto al `role.any` existente
- [X] T015 Actualizar `backend/routes/api.php`: aplicar el middleware `tenant` a los dos grupos de negocio, renombrar `role.any:admin,teacher` → `role.any:org_admin,teacher` y `role.any:admin` → `role.any:org_admin`, y dejar preparado un grupo de plataforma sin `tenant` para las rutas de US3. **Segundo punto de contacto del renombrado, no previsto en research D7**: `AuthController::login()` lleva la lista de roles con acceso fijada en código (`hasAnyRole(['admin','teacher'])`); pasa a `['super_admin','org_admin','teacher']` o ningún administrador puede iniciar sesión

### Roles, seeders y andamiaje de tests

- [X] T016 [P] Actualizar `backend/database/seeders/AdminSeeder.php`: crear los roles `super_admin`, `org_admin` y `teacher`, crear la organización por defecto y el usuario `super_admin` sin `organization_id`
- [X] T017 [P] Actualizar `backend/database/seeders/DemoSeeder.php` para poblar **dos** organizaciones distintas con datos completos, de modo que el aislamiento sea comprobable a mano desde la interfaz
- [X] T018 [P] Crear el helper de tests `backend/tests/Concerns/CreatesOrganizations.php` con métodos para crear una organización con su `org_admin`, su `teacher` (con ficha vinculada) y un juego mínimo de datos de negocio. **Debe exponer `actingWithToken()`, no `withToken()` a secas**: dentro de un mismo test, `RequestGuard` cachea el usuario ya resuelto, de modo que la segunda petición sigue autenticada como el primer usuario. En producción no ocurre —cada petición reconstruye el contenedor— pero en los tests hace que una comprobación cruzada pase en verde sin comprobar nada. `actingWithToken()` llama a `forgetGuards()` y limpia `OrganizationContext` antes de fijar el token
- [X] T019 Actualizar `backend/database/factories/UserFactory.php` y `backend/database/factories/StudentFactory.php` para aceptar y rellenar `organization_id`
- [X] T020 [P] Actualizar `backend/tests/Feature/AuthTest.php` para crear organización y usar el rol `org_admin` en lugar de `admin`
- [X] T021 [P] Actualizar `backend/tests/Feature/StudentTest.php` para crear organización y usar `org_admin`
- [X] T022 [P] Actualizar `backend/tests/Feature/PaymentTest.php` para crear organización y usar `org_admin`

**Checkpoint**: `php artisan migrate:fresh --seed` funciona, los 34 tests existentes pasan en verde y ningún
registro queda sin organización. La aplicación sigue comportándose exactamente igual que antes.

---

## Phase 3: User Story 1 - Aislamiento total de datos entre organizaciones (Priority: P1) 🎯 MVP

**Goal**: que un usuario del Centro A no pueda leer, crear, modificar ni borrar nada del Centro B, ni
siquiera conociendo los identificadores exactos, y que las referencias cruzadas en escritura se rechacen.

**Independent Test**: crear dos organizaciones pobladas y comprobar, con un usuario de cada una, que las
cuatro operaciones sobre las diez entidades de negocio de la otra organización resultan inaccesibles y responden 404,
nunca 403.

### Tests for User Story 1 ⚠️

> Escribir estos tests ANTES de la implementación y comprobar que fallan.

- [X] T023 [P] [US1] Crear la batería A/B en `backend/tests/Feature/TenantIsolationTest.php` para las **diez entidades de negocio**: las nueve con endpoint (`guardians`, `teachers`, `subjects`, `students`, `class-groups`, `class-sessions`, `enrollments`, `attendances`, `payments`) verificando índice, detalle, actualización y borrado cruzados, más `audit_events`, que **al no tener API se verifica a nivel de modelo** — FR-024, FR-025, SC-001
- [X] T024 [P] [US1] Crear `backend/tests/Feature/SuperAdminBusinessDataTest.php` demostrando que un `super_admin` recibe 403 en las rutas de negocio de cualquier organización — FR-013a, FR-013b
- [X] T025 [P] [US1] Crear `backend/tests/Feature/CrossReferenceValidationTest.php`: matricular un alumno propio en un grupo ajeno, asignar un tutor ajeno a un alumno propio, registrar asistencia sobre una sesión ajena y crear un pago con matrícula ajena deben devolver 422 sin crear nada — FR-009, escenario 4 de P1
- [X] T026 [P] [US1] Crear `backend/tests/Feature/UniquePerOrganizationTest.php`: dos organizaciones pueden usar el mismo `code` de asignatura y de grupo y el mismo email de alumno, profesor y tutor; el mensaje de duplicado dentro de una organización no revela datos de la otra — FR-019, FR-020, SC-006
- [X] T027 [P] [US1] Crear `backend/tests/Feature/SoftDeleteIsolationTest.php`: un registro con borrado lógico conserva su organización y no aparece desde otra ni con `withTrashed` — FR-021
- [X] T028 [P] [US1] Crear `backend/tests/Feature/RouteTenantCoverageTest.php` que recorre las rutas registradas bajo `/api/v1` y afirma que toda ruta que no sea de plataforma lleva el middleware `tenant` — mitigación del riesgo residual de D2
- [X] T029 [P] [US1] Crear `backend/tests/Feature/ClientOrganizationIdIgnoredTest.php`: enviar `organization_id` de otra organización en el cuerpo de una creación produce un registro en la organización propia — FR-006, escenario 5 de P1

### Implementación de User Story 1

- [X] T030 [US1] Crear `backend/app/Models/Scopes/OrganizationScope.php` con el comportamiento de D2: filtra si hay contexto; si no hay contexto y la ejecución es HTTP añade condición imposible; si no hay contexto y `App::runningInConsole()` no filtra
- [X] T031 [US1] Crear el trait `backend/app/Models/Concerns/BelongsToOrganization.php` que registra `OrganizationScope` en `booted()`, rellena `organization_id` en el evento `creating` y expone la relación `organization()` (depende de T030). **Crear a continuación la migración M5 `2026_08_14_000005_enforce_organization_not_null.php`, que impone `NOT NULL` en las diez tablas de negocio** (`users` queda nullable por FR-004): solo es aplicable una vez que el trait rellena la columna, y sale de M4 por eso (ver la nota de reparto de migraciones)
- [X] T032 [P] [US1] Aplicar el trait en `backend/app/Models/Guardian.php`
- [X] T033 [P] [US1] Aplicar el trait en `backend/app/Models/Subject.php`
- [X] T034 [P] [US1] Aplicar el trait en `backend/app/Models/Student.php`
- [X] T035 [P] [US1] Aplicar el trait en `backend/app/Models/ClassGroup.php`
- [X] T036 [P] [US1] Aplicar el trait en `backend/app/Models/ClassSession.php`
- [X] T037 [P] [US1] Aplicar el trait en `backend/app/Models/Enrollment.php`
- [X] T038 [P] [US1] Aplicar el trait en `backend/app/Models/Attendance.php`
- [X] T039 [P] [US1] Aplicar el trait en `backend/app/Models/Payment.php`
- [X] T040 [P] [US1] Aplicar el trait en `backend/app/Models/AuditEvent.php`
- [X] T041 [P] [US1] Aplicar el trait en `backend/app/Models/Teacher.php` y añadir la relación `user()` uno a uno opcional (FR-015a)
- [X] T042 [P] [US1] Modificar `backend/app/Models/User.php`: relación `organization()`, helper `isSuperAdmin()` y relación `teacher()`. **Sin** global scope: el login debe encontrar al usuario antes de que exista contexto
- [X] T043 [US1] Crear la regla `backend/app/Rules/BelongsToCurrentOrganization.php`, que valida contra Eloquent (no contra el query builder) para que sí respete el global scope — D4
- [X] T044 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/GuardianController.php`: `unique` de `email` acotado por organización
- [X] T045 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/TeacherController.php`: `unique` de `email` por organización y validación de que `user_id` apunte a un usuario de la misma organización (FR-015b)
- [X] T046 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/SubjectController.php`: `unique` de `code` por organización
- [X] T047 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/StudentController.php`: `guardian_id` con la regla nueva y `unique` de `email` por organización
- [X] T048 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/ClassGroupController.php`: `subject_id` y `teacher_id` con la regla nueva, `unique` de `code` por organización
- [X] T049 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/ClassSessionController.php`: `class_group_id` con la regla nueva
- [X] T050 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/EnrollmentController.php`: `student_id` y `class_group_id` con la regla nueva
- [X] T051 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/AttendanceController.php`: `class_session_id` y `student_id` con la regla nueva
- [X] T052 [P] [US1] Actualizar `rules()` en `backend/app/Http/Controllers/Api/PaymentController.php`: `student_id`, `guardian_id` y `enrollment_id` con la regla nueva, conservando la comprobación cruzada matrícula–alumno ya existente
- [X] T053 [US1] Modificar `backend/app/Http/Controllers/Api/DashboardController.php`: sustituir `Teacher::where('email', $user->email)` por el vínculo `teachers.user_id`, y devolver dashboard vacío si no hay ficha vinculada (FR-015c, D6)
- [X] T054 [US1] Modificar `backend/app/Http/Controllers/Api/AuthController.php`: `GET /me` incluye el bloque `organization` (`id`, `name`, `slug`, `status`) o `null` para el super administrador — contrato de organizations-api.md. **Además, corregir los eventos de auditoría de `login` y `logout`**: ambos se crean fuera de `EnsureTenantContext`, así que no hay contexto y el trait no puede rellenar `organization_id`; hay que tomarlo del usuario con `forceCreate`. **Efecto colateral pendiente para US3**: el super administrador no pertenece a ninguna organización y `audit_events.organization_id` es obligatorio, así que su acceso no deja traza. La auditoría de plataforma necesita resolverse en US3
- [X] T055 [US1] Auditar los nueve controladores CRUD en `backend/app/Http/Controllers/Api/` y confirmar que `organization_id` no aparece en ningún `rules()` ni en ningún `$fillable` expuesto a la petición (FR-006, FR-018)

**Checkpoint**: US1 completa. Las nueve pruebas de aislamiento pasan y el sistema es seguro para dos
organizaciones. **Este es el MVP desplegable.**

---

## Phase 4: User Story 2 - Migración del centro actual a su propia organización (Priority: P2)

**Goal**: demostrar que la cadena M1–M4 traslada el centro actual a su organización sin perder ni duplicar
un solo registro, y que su personal sigue entrando con las mismas credenciales.

**Independent Test**: partir de un volcado con los datos actuales, ejecutar la migración y verificar que los
recuentos por entidad coinciden, que no queda ninguna fila sin organización y que un usuario preexistente ve
lo mismo que antes.

### Tests for User Story 2 ⚠️

- [X] T056 [P] [US2] Crear `backend/tests/Feature/MigrationBackfillTest.php`: retroceder las cinco migraciones de tenancy, sembrar datos con el esquema previo mediante el query builder, volver a aplicarlas, y afirmar que los recuentos por entidad coinciden antes y después y que no queda ningún `organization_id` nulo — FR-022, SC-004. **Debe usar `DatabaseMigrations`, no `RefreshDatabase`**: este último envuelve el test en una transacción, y dentro de una transacción `PRAGMA foreign_keys` es un no-op en SQLite. Como SQLite añade claves foráneas reconstruyendo la tabla (crear, copiar, **borrar** la antigua, renombrar), ese `DROP` dispara los `ON DELETE CASCADE` y vacía grupos, sesiones, matrículas, asistencias y pagos. Fuera de transacción la protección que Laravel ya aplica funciona y no se pierde nada — verificado en SQLite y en MariaDB con datos preexistentes
- [X] T057 [P] [US2] Crear `backend/tests/Feature/LegacyCredentialsTest.php`: un usuario preexistente inicia sesión con sus credenciales de siempre tras la migración y obtiene el mismo conjunto de datos, con el rol renombrado a `org_admin` — FR-023, SC-005
- [X] T058 [P] [US2] Añadir a `backend/tests/Feature/MigrationBackfillTest.php` el caso de vinculación de fichas: los profesores cuyo `email` coincide con el de un usuario quedan vinculados, y los que no coinciden quedan con `user_id` nulo sin abortar la migración

### Implementación de User Story 2

- [X] T059 [US2] Crear el comando `backend/app/Console/Commands/VerifyTenancyBackfill.php` (`php artisan tenancy:verify`) que imprime el recuento por entidad y por organización y devuelve código de salida distinto de cero si encuentra filas huérfanas
- [X] T060 [US2] Reforzar la aserción de M3 en `backend/database/migrations/2026_08_14_000003_backfill_organization_data.php` para que el aborto revierta la transacción completa y emita el recuento de filas afectadas por tabla
- [X] T061 [US2] Escribir el runbook `docs/migration-multi-org.md`: copia de seguridad verificada y restaurable, recuentos previos, ejecución paso a paso de M1–M4, verificación con `tenancy:verify` y procedimiento de vuelta atrás (Principio VIII)
- [X] T062 [US2] Añadir al `Makefile` en la raíz un objetivo `verify-tenancy` que ejecute `php artisan tenancy:verify` dentro del contenedor

**Checkpoint**: la migración es reproducible, verificable y reversible. US1 + US2 pueden desplegarse sobre el
centro actual.

---

## Phase 5: User Story 3 - El super administrador gestiona las organizaciones (Priority: P3)

**Goal**: dar de alta un centro piloto completo —organización, administrador y primer acceso— sin tocar la
base de datos a mano.

**Independent Test**: con una cuenta `super_admin`, crear una organización y su `org_admin`, y comprobar que
ese administrador entra y ve su organización vacía, sin rastro de otras.

### Tests for User Story 3 ⚠️

- [X] T063 [P] [US3] Crear `backend/tests/Feature/OrganizationManagementTest.php` cubriendo el CRUD de `/api/v1/organizations`, el rechazo con 403 para roles no `super_admin` y el 409 al borrar una organización con usuarios activos — FR-013, escenario 4 de P3
- [X] T064 [P] [US3] Crear `backend/tests/Feature/OrganizationSuspensionTest.php` cubriendo los dos cortes de acceso por separado y su independencia: **(a) suspendida** — `status = suspended` corta el acceso en la siguiente petición sin revocar tokens, es idempotente, y reactivar lo restaura; **(b) borrada lógicamente** — `deleted_at` no nulo corta el acceso **aunque `status` siga siendo `active`**, y restaurarla lo devuelve; **(c) integridad** — en ambos casos los recuentos de las diez entidades de negocio permanecen intactos y los datos siguen siendo recuperables, sin borrado en cascada — FR-011, FR-021, D11
- [X] T065 [P] [US3] Crear `backend/tests/Feature/PlatformUserManagementTest.php`: el `super_admin` crea el `org_admin` inicial de una organización indicando `organization_id`, y ese usuario inicia sesión y ve su organización vacía — SC-003

### Implementación de User Story 3

- [X] T066 [P] [US3] Crear `backend/app/Policies/OrganizationPolicy.php` restringiendo todas las capacidades a `super_admin`
- [X] T067 [US3] Crear `backend/app/Http/Controllers/Api/OrganizationController.php` con `index` (paginado, `search` sobre `name` y `slug`, `users_count` y **ningún** recuento de negocio), `store` (deriva `slug` si se omite, nace `active`), `show`, `update`, `destroy` (borrado lógico, 409 con usuarios activos), `suspend` y `activate` idempotentes con evento de auditoría
- [X] T068 [US3] Crear `backend/app/Http/Controllers/Api/UserController.php` con el alcance de `super_admin`: cuentas de cualquier organización, `organization_id` aceptado en el alta y asignación de rol `super_admin` solo por otro `super_admin`. **Las consultas de fichas de profesor necesitan `withoutGlobalScope(OrganizationScope::class)`**: la ruta es de plataforma y no tiene contexto de tenant, así que en HTTP el scope devolvería cero filas y `teacher_id` nunca validaría. La pertenencia a la organización correcta la impone la validación, no el scope
- [X] T069 [US3] Registrar en `backend/routes/api.php` el grupo de plataforma `/api/v1/organizations` con `role.any:super_admin` y `/api/v1/users` con `role.any:super_admin,org_admin`, **fuera** del middleware `tenant` (D8)
- [X] T070 [US3] Registrar `OrganizationPolicy` en `backend/app/Providers/AppServiceProvider.php`. **Requisito no previsto**: Laravel 12 ya no incluye `AuthorizesRequests` en el controlador base, así que `authorize()` no existe; hay que añadir el trait en `backend/app/Http/Controllers/Controller.php` o toda llamada a policy falla con 500
- [X] T071 [P] [US3] Crear `frontend/src/pages/Organizations/OrganizationsPage.jsx` con el listado, el alta y las acciones de suspender y activar
- [X] T072 [P] [US3] Crear `frontend/src/pages/Organizations/OrganizationUsersPage.jsx` para el alta del administrador inicial de una organización
- [X] T073 [US3] Añadir el módulo `organizations` y el rol `super_admin` en `frontend/src/config/modules.js`
- [X] T074 [US3] Añadir las rutas de plataforma con `allowedRoles={['super_admin']}` en `frontend/src/App.jsx`
- [X] T075 [US3] Exponer la organización de la sesión en `frontend/src/context/SessionContext.jsx` a partir del bloque `organization` de `/me`

**Checkpoint**: un centro piloto queda operativo en menos de 10 minutos sin intervención manual (SC-003).

---

## Phase 6: User Story 4 - El administrador de organización gestiona su centro (Priority: P4)

**Goal**: que el `org_admin` gestione todo su centro, incluidos sus usuarios, y nada de la plataforma.

**Independent Test**: con una cuenta `org_admin` recorrer el ciclo completo de gestión dentro de su centro y
comprobar que no aparece ninguna opción ni recurso de plataforma.

### Tests for User Story 4 ⚠️

- [X] T076 [P] [US4] Crear `backend/tests/Feature/OrgAdminScopeTest.php`: el `org_admin` gestiona las nueve entidades con endpoint de su organización y recibe 403 en `/api/v1/organizations` — FR-014, escenario 3 de P4
- [X] T077 [P] [US4] Crear `backend/tests/Feature/OrgAdminUserCreationTest.php`: al dar de alta un usuario enviando `organization_id` de otra organización, la cuenta se crea en la **suya** y devuelve 201, no un error de permisos — FR-018 y la regla no negociable de organizations-api.md

### Implementación de User Story 4

- [X] T078 [US4] Ampliar `backend/app/Http/Controllers/Api/UserController.php` con el alcance de `org_admin`: solo cuentas de su organización, `organization_id` **ignorado** si viene en la petición, roles asignables limitados a `org_admin` y `teacher`, y `teacher_id` opcional validado contra la misma organización. **La organización NO se toma de `OrganizationContext`**: `/users` es ruta de plataforma y no pasa por el middleware `tenant` —la comparte el super administrador, que no tiene organización—, así que se resuelve del usuario autenticado dentro del controlador (FR-005). Las cuentas de otra organización responden **404**, no 403, por coherencia con FR-008
- [X] T079 [US4] Renombrar `admin` → `org_admin` y añadir `super_admin` en `frontend/src/config/modules.js` (`adminOnlyPermissions`, `adminWriteTeacherReadPermissions`, `roleLabels`, `staffRoles`)
- [X] T080 [US4] Actualizar `allowedRoles={['admin','teacher']}` → `['org_admin','teacher']` en `frontend/src/App.jsx`
- [X] T081 [US4] Actualizar `roleNames.includes('admin')` → `'org_admin'` y la lógica de branding por rol en `frontend/src/components/AppShell.jsx`
- [X] T082 [P] [US4] Crear `frontend/src/pages/UsersPage.jsx` para que el `org_admin` gestione las cuentas de su centro, sin selector de organización. Requiere además su ruta en `App.jsx` y una entrada en `platformModules` de `modules.js`, o la página existe pero es inalcanzable

**Checkpoint**: el uso cotidiano del producto funciona íntegro dentro de cada organización.

---

## Phase 7: User Story 5 - El profesor accede solo a lo suyo (Priority: P5)

**Goal**: que el profesor vea únicamente sus grupos, los alumnos matriculados en ellos y la asistencia de sus
sesiones, y que los pagos le sean inaccesibles en cualquier forma.

**Independent Test**: con una cuenta de profesor comprobar que el número de alumnos visibles coincide con la
suma de matriculados en sus grupos y que los pagos devuelven 403.

### Tests for User Story 5 ⚠️

- [X] T083 [P] [US5] Crear `backend/tests/Feature/TeacherScopeTest.php`: el profesor ve solo sus grupos y solo los alumnos matriculados en ellos, y el recuento coincide con la suma de matriculados — FR-015, SC-007
- [X] T084 [P] [US5] Crear `backend/tests/Feature/TeacherAttendanceScopeTest.php`: registrar asistencia en una sesión propia funciona, en una sesión de un grupo ajeno se rechaza — escenarios 3 y 4 de P5
- [X] T085 [P] [US5] Crear `backend/tests/Feature/TeacherPaymentDenialTest.php`: el profesor recibe 403 en todas las operaciones de `/api/v1/payments` — FR-016
- [X] T086 [P] [US5] Crear `backend/tests/Feature/TeacherWithoutProfileTest.php`: un usuario con rol `teacher` sin ficha vinculada obtiene cero grupos, cero alumnos y cero sesiones, no todos los del centro — FR-015c, caso límite "el fallo debe cerrar el acceso"
- [X] T087 [P] [US5] Añadir a `backend/tests/Feature/TeacherScopeTest.php` el caso de ficha reasignada: al mover `teachers.user_id` a otra cuenta, la anterior pierde el acceso de forma inmediata

### Implementación de User Story 5

- [X] T088 [US5] Crear `backend/app/Policies/ClassGroupPolicy.php`: `org_admin` sin restricción dentro de su organización, `teacher` solo sus grupos, `super_admin` denegado
- [X] T089 [P] [US5] Crear `backend/app/Policies/StudentPolicy.php` limitando al profesor a los alumnos matriculados en sus grupos
- [X] T090 [P] [US5] Crear `backend/app/Policies/ClassSessionPolicy.php` limitando al profesor a las sesiones de sus grupos
- [X] T091 [P] [US5] Crear `backend/app/Policies/AttendancePolicy.php` limitando al profesor a la asistencia de sus sesiones
- [X] T092 [P] [US5] Crear `backend/app/Policies/PaymentPolicy.php` denegando toda capacidad al `teacher` y al `super_admin`
- [X] T093 [P] [US5] Crear `backend/app/Policies/GuardianPolicy.php`: `org_admin` con acceso completo dentro de su organización, `teacher` y `super_admin` denegados
- [X] T094 [P] [US5] Crear `backend/app/Policies/SubjectPolicy.php`: `org_admin` con acceso completo dentro de su organización, `teacher` y `super_admin` denegados
- [X] T095 [P] [US5] Crear `backend/app/Policies/TeacherPolicy.php`: `org_admin` con acceso completo dentro de su organización, `teacher` y `super_admin` denegados
- [X] T096 [P] [US5] Crear `backend/app/Policies/EnrollmentPolicy.php`: `org_admin` con acceso completo dentro de su organización, `teacher` y `super_admin` denegados
- [X] T097 [US5] Modificar `backend/app/Http/Controllers/Api/BaseApiController.php` para autorizar mediante policy en `index`, `show`, `store`, `update` y `destroy`, y para permitir a los controladores acotar la consulta del profesor sin duplicar lógica. **Precondición: las nueve entidades con endpoint deben tener policy registrada (T088–T096) antes de activar el gancho; sin policy, `authorize()` deniega y devuelve 403**. **Códigos resultantes**: `findOrFail` se ejecuta antes de `authorize`, así que lo que queda fuera del alcance del profesor **dentro de su centro** responde 404 —el recorte de consulta lo elimina antes— y lo que está fuera de su rol por completo responde 403. Ambos son correctos: el 404 protege más
- [X] T098 [P] [US5] Acotar la consulta del profesor en `backend/app/Http/Controllers/Api/ClassGroupController.php` a los grupos de su ficha
- [X] T099 [P] [US5] Acotar la consulta del profesor en `backend/app/Http/Controllers/Api/StudentController.php` a los alumnos matriculados en sus grupos
- [X] T100 [P] [US5] Acotar la consulta del profesor en `backend/app/Http/Controllers/Api/ClassSessionController.php` y `backend/app/Http/Controllers/Api/AttendanceController.php` a sus sesiones
- [X] T101 [US5] Registrar las **nueve** policies en `backend/app/Providers/AppServiceProvider.php`
- [X] T102 [US5] Ocultar en `frontend/src/config/modules.js` los módulos y campos económicos para el rol `teacher`, de modo que la interfaz refleje lo que la API ya deniega. **No requirió cambio funcional**: tras el renombrado de T079 los tres módulos con campos monetarios (`subjects`, `enrollments`, `payments`) ya son `org_admin` únicamente, y los cuatro que el profesor ve no llevan ninguno — auditado módulo a módulo. Se documenta el invariante en el fichero para que un campo nuevo no lo rompa en silencio

**Checkpoint**: las cinco historias funcionan de forma independiente.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T103 [P] Actualizar `README.md` con el modelo multi-organización, los tres roles y las credenciales iniciales del `super_admin`
- [X] T104 [P] Actualizar `docs/IMPLEMENTATION.md` con la arquitectura de tenancy (trait, scope, contexto, middleware, policies)
- [X] T105 [P] Extraer a ficheros de traducción en `backend/lang/` **todos los textos de usuario nuevos** introducidos por esta feature (Principio XII, regla adoptada en Complexity Tracking de plan.md). Los textos preexistentes en francés no entran en el alcance
- [X] T106 Verificar con `EXPLAIN` sobre los listados principales que los índices compuestos de M4 se están usando y que ningún listado degrada respecto al comportamiento previo
- [ ] T107 Verificar a 360 px de ancho las pantallas nuevas `frontend/src/pages/Organizations/OrganizationsPage.jsx`, `frontend/src/pages/Organizations/OrganizationUsersPage.jsx` y `frontend/src/pages/UsersPage.jsx` (Principio VI). **Verificación estática del CSS hecha; resultado NO CONFORME, por eso queda sin marcar.** Bien: los formularios usan `.module-grid`, que no fija columnas y cae a una sola en móvil; el cuerpo de la página no desborda. Mal: `.table-wrap` resuelve las tablas con `overflow-x: auto`, y el Principio VI dice literalmente que «el desplazamiento horizontal no es una solución aceptable» y exige representación móvil propia. Agrava el caso que `.row-actions` no lleva `flex-wrap`, y el listado de organizaciones tiene cinco controles por fila. **Corresponde al hallazgo C1 del análisis, que se decidió no abordar en esta feature.** Falta además la comprobación visual real en navegador a 360 px
- [X] T108 Ejecutar la suite completa y confirmar que los tests previos siguen en verde junto a los nuevos (SC-008). **241 tests, 606 aserciones, todo en verde**; los 36 de la línea base incluidos. Ejecutado con `php artisan test` en local y no con `make test`, que requiere el contenedor
- [X] T109 Ejecutar el guion de `specs/001-multi-org-tenancy/quickstart.md` de punta a punta sobre una instalación con dos organizaciones pobladas. **Ejecutado el 2026-08-15 contra el stack Docker con dos organizaciones pobladas: 53/53 comprobaciones sin fallos.** SC-003 medido en **2 segundos** (objetivo < 10 min). El escenario 4.7 confirma en real que `status = active` con `deleted_at` puesto sigue devolviendo 403. Correcciones al propio guion descubiertas al ejecutarlo: la tabla de cuentas no coincidía con los seeders, y faltaba `Accept: application/json` en los ejemplos `curl`
- [X] T110 Revisar `specs/001-multi-org-tenancy/checklists/requirements.md` y marcar los puntos cubiertos

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Fase 1)**: sin dependencias
- **Foundational (Fase 2)**: depende de Setup — **bloquea todas las historias**
- **US1 (Fase 3)**: depende de Foundational. Sin dependencias con otras historias
- **US2 (Fase 4)**: depende de Foundational. Independiente de US1, aunque en la práctica se despliegan juntas
- **US3 (Fase 5)**: depende de Foundational. Sus rutas quedan fuera de `tenant`, así que no depende de US1
- **US4 (Fase 6)**: depende de Foundational y de T068 (`UserController`, creado en US3), que amplía
- **US5 (Fase 7)**: depende de Foundational y de T041/T042 (vínculo `teachers.user_id` ↔ `users`), hechos en US1
- **Polish (Fase 8)**: depende de las historias que se decidan entregar

### Cadenas estrictas dentro de Foundational

- T005 → T006 → T008 → T009 → T010 (las migraciones son una cadena lineal, sin paralelismo posible)
- T011 → T012 → T013 → T014 → T015
- T010 → T019 → T020/T021/T022 (los tests existentes rompen en cuanto M4 impone `NOT NULL`)

### Dentro de cada historia

- Los tests se escriben primero y deben fallar antes de implementar
- Scope y trait (T030, T031) antes de aplicarlos a los modelos (T032–T042)
- La regla `BelongsToCurrentOrganization` (T043) antes de tocar los `rules()` de los controladores (T044–T052)
- Las nueve policies (T088–T096) antes del gancho de autorización en `BaseApiController` (T097). Sin policy registrada, `authorize()` deniega: activar el gancho antes rompería el CRUD del `org_admin` en `guardians`, `subjects`, `teachers` y `enrollments`

### Parallel Opportunities

- **Fase 1**: T002, T003, T004 en paralelo
- **Fase 2**: T007, T011, T016, T017, T018 en paralelo; T020, T021, T022 en paralelo tras T019
- **US1**: los siete tests T023–T029 en paralelo; los once modelos T032–T042 en paralelo; los nueve controladores T044–T052 en paralelo
- **US2**: T056, T057, T058 en paralelo
- **US3**: T063, T064, T065 en paralelo; T071, T072 en paralelo
- **US5**: T083–T087 en paralelo; T089–T096 en paralelo; T098, T099, T100 en paralelo
- **Fase 8**: T103, T104, T105 en paralelo

---

## Parallel Example: User Story 1

```bash
# 1) Los siete tests de aislamiento, a la vez:
Task: "Batería A/B en backend/tests/Feature/TenantIsolationTest.php"
Task: "Denegación al super_admin en backend/tests/Feature/SuperAdminBusinessDataTest.php"
Task: "Referencias cruzadas en backend/tests/Feature/CrossReferenceValidationTest.php"
Task: "Unicidad por organización en backend/tests/Feature/UniquePerOrganizationTest.php"
Task: "Borrado lógico en backend/tests/Feature/SoftDeleteIsolationTest.php"
Task: "Cobertura de rutas en backend/tests/Feature/RouteTenantCoverageTest.php"
Task: "organization_id del cliente ignorado en backend/tests/Feature/ClientOrganizationIdIgnoredTest.php"

# 2) Tras T030 y T031, los once modelos a la vez:
Task: "Aplicar el trait en backend/app/Models/Guardian.php"
Task: "Aplicar el trait en backend/app/Models/Subject.php"
Task: "Aplicar el trait en backend/app/Models/Student.php"
Task: "Aplicar el trait en backend/app/Models/ClassGroup.php"
Task: "Aplicar el trait en backend/app/Models/ClassSession.php"
Task: "Aplicar el trait en backend/app/Models/Enrollment.php"
Task: "Aplicar el trait en backend/app/Models/Attendance.php"
Task: "Aplicar el trait en backend/app/Models/Payment.php"
Task: "Aplicar el trait en backend/app/Models/AuditEvent.php"
Task: "Aplicar el trait y la relación user() en backend/app/Models/Teacher.php"
Task: "Relación organization() y isSuperAdmin() en backend/app/Models/User.php"

# 3) Tras T043, los nueve controladores a la vez:
Task: "rules() en backend/app/Http/Controllers/Api/GuardianController.php"
Task: "rules() en backend/app/Http/Controllers/Api/TeacherController.php"
Task: "rules() en backend/app/Http/Controllers/Api/SubjectController.php"
Task: "rules() en backend/app/Http/Controllers/Api/StudentController.php"
Task: "rules() en backend/app/Http/Controllers/Api/ClassGroupController.php"
Task: "rules() en backend/app/Http/Controllers/Api/ClassSessionController.php"
Task: "rules() en backend/app/Http/Controllers/Api/EnrollmentController.php"
Task: "rules() en backend/app/Http/Controllers/Api/AttendanceController.php"
Task: "rules() en backend/app/Http/Controllers/Api/PaymentController.php"
```

---

## Implementation Strategy

### MVP primero (US1)

1. Fase 1: Setup
2. Fase 2: Foundational — **crítica, bloquea todo**
3. Fase 3: US1
4. **PARAR Y VALIDAR**: dos organizaciones pobladas, las nueve pruebas de aislamiento en verde
5. En este punto el sistema es seguro para meter un segundo centro. Es el mínimo desplegable.

### Entrega incremental

1. Setup + Foundational → esquema y contexto listos, comportamiento sin cambios visibles
2. + US1 → aislamiento verificado (**MVP**)
3. + US2 → migración del centro actual con runbook y verificación de recuentos → **desplegable en producción**
4. + US3 → alta de centros piloto sin tocar la base de datos
5. + US4 → gestión completa por el administrador de cada centro
6. + US5 → acceso del profesorado acotado

### Estrategia con varias personas

Tras Foundational, US1 y US3 pueden avanzar en paralelo (US3 vive fuera del middleware `tenant`). US4
espera a que exista `UserController` (T068) y US5 a que exista el vínculo `teachers.user_id` (T041, T042).

---

## Notes

- Las tareas [P] tocan ficheros distintos y no tienen dependencias pendientes
- Ningún `rules()` acepta jamás `organization_id`: lo rellena el trait (FR-006, FR-018)
- El acceso cruzado responde **404**, no 403: es `findOrFail` sobre un modelo con global scope, sin código
  adicional (FR-008)
- M3 y M4 no se ejecutan en producción sin copia de seguridad verificada y restaurable (Principio VIII)
- Cero dependencias nuevas de Composer o npm en toda la feature (Principio VII)
- Confirmar el fallo de cada test antes de implementar la parte que lo resuelve
