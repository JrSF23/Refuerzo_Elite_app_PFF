# Phase 0 — Research: Soporte Multi-Organización

**Feature**: `001-multi-org-tenancy` | **Date**: 2026-08-14

Decisiones técnicas tomadas antes del diseño. Cada una indica qué se eligió, por qué, y qué se descartó.

---

## D1. Dónde vive el filtro de organización

**Decision**: un trait `BelongsToOrganization` que registra un **global scope de Eloquent**
(`OrganizationScope`) en cada modelo tenant-aware, más un listener del evento `creating` que rellena
`organization_id` automáticamente.

**Rationale**: el Principio V exige que el filtro esté "a nivel de modelo, no únicamente en el
controlador". El global scope cubre a la vez `BaseApiController` y las consultas directas que hace
`DashboardController` (`Student::count()`, `ClassGroup::where(...)`), que no pasan por el controlador
base. Además, al aplicarse dentro de Eloquent, `findOrFail` sobre un recurso ajeno lanza
`ModelNotFoundException` → **404 automático**, que es literalmente lo que pide FR-008 sin escribir nada.

**Alternatives considered**:

- *Filtrar en `BaseApiController::query()`*: cubriría el 90% de los endpoints con una línea, pero deja
  fuera `DashboardController` y cualquier consulta futura fuera del controlador base. Incumple el
  Principio V explícitamente.
- *Paquete `stancl/tenancy` o `spatie/laravel-multitenancy`*: prohibido por la spec salvo necesidad
  estricta, y no la hay: aportan multi-base de datos y resolución por dominio, que no usamos.
- *Feature "teams" de Spatie Permission*: pensada para usuarios con roles distintos por equipo. Tras la
  decisión Q1 (pertenencia única, constitución v1.1.0) sobra por completo y añadiría estado global a
  Spatie sin beneficio.

---

## D2. Comportamiento del scope cuando no hay contexto de organización

**Decision**: **denegar por defecto en peticiones HTTP, no aplicar el scope en consola.**

Concretamente, `OrganizationScope`:

- Si hay organización en contexto → filtra por ella.
- Si **no** hay contexto y la ejecución es HTTP → añade una condición imposible (resultado vacío).
- Si no hay contexto y la ejecución es CLI (`App::runningInConsole()`) → no filtra, para que migraciones,
  seeders, comandos y tests de bajo nivel funcionen.

**Rationale**: es la única configuración en la que un olvido produce *cero resultados* en lugar de *todos
los resultados*. Si alguien añade una ruta nueva y olvida el middleware, el fallo es visible y molesto
(no ve nada) en vez de invisible y catastrófico (lo ve todo). Principio V: el fallo debe cerrar el
acceso, nunca abrirlo. Es la misma lógica que FR-015c aplica al profesor sin ficha.

**Alternatives considered**:

- *Sin contexto → no filtrar*: la opción cómoda y el error clásico de las implementaciones caseras de
  multi-tenancy. Un endpoint sin middleware expondría todos los centros. Rechazada sin discusión.
- *Sin contexto → excepción*: más ruidosa, pero rompe consola y tests, y convierte cualquier consulta en
  un punto de fallo. La denegación silenciosa en HTTP es igual de segura y menos frágil.

**Riesgo residual y mitigación**: una ruta autenticada sin `EnsureTenantContext` devolvería listados
vacíos para todos. Se mitiga con un test que recorre las rutas registradas bajo `/api/v1` y afirma que
todas las que no son de plataforma llevan el middleware.

---

## D3. Dónde se guarda la organización activa

**Decision**: un objeto `OrganizationContext` registrado como **singleton en el contenedor**, poblado por
`EnsureTenantContext` a partir de `$request->user()->organization_id`.

**Rationale**: el contenedor se reconstruye en cada petición, de modo que el contexto no puede filtrarse
entre peticiones. Es accesible desde el global scope sin pasar el `Request` por toda la aplicación. Es el
idioma habitual de Laravel para estado de petición.

**Alternatives considered**:

- *Propiedad estática*: simple, pero persiste entre peticiones en runtimes de proceso largo (Octane,
  colas) y es exactamente el tipo de fuga que esta feature debe impedir.
- *Sesión*: no aplica; la API es stateless con tokens Sanctum.
- *Atributo del `Request`*: obligaría al global scope a resolver el request actual desde el contenedor,
  que es un rodeo para llegar al mismo sitio.

---

## D4. `exists` y `unique` de Laravel ignoran los global scopes

**Decision**: introducir una regla de validación `BelongsToCurrentOrganization` y aplicar
`->where('organization_id', ...)` en las reglas `unique`.

**Rationale**: este es el agujero menos evidente de todo el diseño. `Rule::exists('class_groups','id')`
no usa Eloquent: usa el `DatabasePresenceVerifier` sobre el query builder, así que **no aplica el global
scope**. Sin corregirlo, `StudentController` con `'guardian_id' => ['exists:guardians,id']` aceptaría un
tutor de otra organización, y `EnrollmentController` permitiría matricular un alumno propio en un grupo
ajeno. Eso incumple FR-009 y el escenario 4 de la historia P1, con el global scope aparentemente
"funcionando".

**Alternatives considered**:

- *`Rule::exists(...)->where('organization_id', $orgId)` en cada regla*: correcto pero repetitivo; hay
  reglas `exists` repartidas por 9 controladores y cada omisión es una fuga silenciosa que ningún test
  genérico detecta. Se prefiere una regla única, auditable y con test propio.
- *Validar la pertenencia en el controlador tras validar*: dispersa la lógica de seguridad y produce
  mensajes de error inconsistentes.

**Aplicación**: `guardian_id`, `student_id`, `class_group_id`, `class_session_id`, `subject_id`,
`teacher_id`, `enrollment_id`. Se revisan los 9 controladores CRUD uno por uno.

---

## D5. Unicidad global → unicidad por organización

**Decision**: sustituir los índices únicos globales por índices compuestos con `organization_id`:
`subjects.code`, `class_groups.code`, `students.email`, `teachers.email`, `guardians.email`.
`users.email` **se mantiene único global**.

**Rationale**: FR-019 exige que dos centros puedan usar `MAT-1` a la vez. La asimetría con `users.email`
es consecuencia directa de Q1: al pertenecer cada cuenta a una sola organización, dos cuentas de la misma
persona necesitan correos distintos, y un correo único global es lo que mantiene el login inequívoco.

**Nota de seguridad (FR-020)**: la validación `unique` debe llevar el `where` de organización *antes* de
llegar a la base de datos. Si se dejara la restricción a la capa SQL, el error de clave duplicada
revelaría la existencia de un registro ajeno.

---

## D6. Vínculo entre usuario y ficha de profesor

**Decision**: columna `user_id` en `teachers`, nullable y única (relación uno a uno opcional). Se elimina
el emparejamiento por email.

**Rationale**: decisión Q3-A de la spec. El código actual
(`DashboardController::teacherDashboard`) hace `Teacher::where('email', $user->email)->first()`, que es
frágil: `teachers.email` es nullable, un cambio de correo rompe el vínculo en silencio, y dos personas
sin email harían `null == null`. Convertir eso en una regla de autorización sería un fallo de seguridad.

**Consecuencia**: FR-015c — un usuario `teacher` sin ficha vinculada obtiene cero grupos. El código actual
ya devuelve un dashboard vacío en ese caso, así que el comportamiento es coherente.

---

## D7. Migración de roles

**Decision**: `admin` → `org_admin` (renombrado del rol existente, conservando permisos y asignaciones),
`teacher` sin cambios, `super_admin` como rol nuevo sin organización.

**Rationale**: hoy solo existen `admin` y `teacher` (`routes/api.php` usa `role.any:admin,teacher`).
Renombrar la fila de `roles` conserva las asignaciones de `model_has_roles` sin tocar ningún usuario, que
es más seguro que crear un rol nuevo y reasignar.

**Impacto en frontend**: `frontend/src/config/modules.js` centraliza los nombres de rol
(`access`, `create`, `edit`, `delete`, `staffRoles`, `roleLabels`), y hay dos usos sueltos en `App.jsx`
(`allowedRoles={['admin','teacher']}`) y `AppShell.jsx` (`roleNames.includes('admin')`). Son los tres
únicos puntos a tocar.

---

## D8. Alcance del super administrador

**Decision**: `super_admin` **no** pasa por `EnsureTenantContext` para datos de negocio; sus rutas viven
en un grupo aparte (`/api/v1/organizations`, `/api/v1/users`). Las rutas de negocio le son denegadas en
dos capas: primero el middleware `role.any` de cada grupo de rutas, que solo admite `org_admin` y
`teacher`; y después las policies de cada entidad, que niegan explícitamente al `super_admin`. La primera
capa es la que actúa en la práctica; la segunda garantiza que el fallo siga cerrado si alguna ruta futura
se registra sin el middleware de rol.

**Rationale**: decisión Q2-A. Si el super administrador tuviera `organization_id` nulo y accediera a las
rutas de negocio, el global scope en modo "denegar por defecto" le devolvería listas vacías — un
comportamiento confuso que parece un error. Es preferible denegar explícitamente en la policy con un 403
claro. FR-013b exige un test que lo demuestre.

---

## D9. Orden de migración y backfill

**Decision**: cuatro pasos separados, cada uno desplegable:

1. Crear `organizations`; crear la organización del centro actual.
2. Añadir `organization_id` **nullable** a todas las tablas de negocio y a `users`; añadir
   `teachers.user_id`.
3. Backfill dentro de una transacción: asignar toda la fila existente a la organización creada; renombrar
   el rol `admin`; vincular fichas de profesor a usuarios por email **una única vez** (migración de datos,
   no regla de acceso).
4. Imponer `NOT NULL` en las tablas de negocio (no en `users`, donde queda nullable por FR-004), añadir
   claves foráneas, sustituir índices únicos y añadir índices compuestos.

**Rationale**: Principio X (evolución incremental): tras cada paso el sistema sigue arrancando y
sirviendo. Separar el backfill de la imposición de `NOT NULL` permite verificar los recuentos (SC-004)
antes de que el esquema se vuelva rígido.

**Nota (Principio VIII)**: el paso 3 exige copia de seguridad verificada y restaurable antes de
ejecutarse en producción. El emparejamiento por email del paso 3 es aceptable **solo** como migración
puntual de datos, revisable a mano; nunca como regla de autorización (ver D6).

---

## D10. Auditoría

**Decision**: `audit_events` recibe `organization_id` y usa el trait como cualquier otra entidad.

**Rationale**: FR-003 la incluye entre las entidades de negocio y el Principio VIII exige traza auditable
de las operaciones sobre pagos. Un registro de auditoría visible desde otra organización filtraría
nombres de entidad e identificadores. `RecordsAuditEvents` crea los eventos vía Eloquent, así que el
relleno automático del trait basta: no hay que tocar el concern.

---

## D11. Sanctum y organización

**Decision**: ningún cambio en Sanctum ni en la emisión de tokens.

**Rationale**: el token pertenece a un usuario, y el usuario pertenece a exactamente una organización
(Q1). La organización se deriva del usuario en cada petición, así que no hace falta embeberla en el token
ni añadir habilidades. Esto también evita que un token quede "congelado" con una organización obsoleta.

**Consecuencia para FR-011 y FR-021**: como la organización se resuelve en cada petición,
`EnsureTenantContext` comprueba su situación cada vez. `deleted_at` y `status` son **condiciones
independientes**: el contexto solo se establece si la organización existe, `deleted_at IS NULL` y
`status = active`. Una organización suspendida y una borrada lógicamente cortan el acceso en la siguiente
petición, cada una por su cuenta y sin necesidad de revocar tokens. La resolución del tenant nunca usa
`withTrashed()`, de modo que una organización borrada no puede reaparecer como contexto válido.

---

## Unknowns resueltos

Ningún `NEEDS CLARIFICATION` queda abierto. Las tres ambigüedades de producto se resolvieron en la spec
(sesión 2026-08-13) y las técnicas quedan cerradas en D1–D11.
