# Implementation Plan: Soporte Multi-Organización (Multi-Tenancy)

**Branch**: `001-multi-org-tenancy` | **Date**: 2026-08-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-multi-org-tenancy/spec.md`

## Summary

Transformar Refuerzo Elite V2 de aplicación mono-centro a SaaS multi-organización con base de datos
compartida y discriminador `organization_id`, sin paquetes externos de tenancy.

El enfoque se apoya en dos puntos de estrangulamiento que ya existen en el código y que permiten cubrir
todo el dominio con muy poca superficie nueva:

1. **`BaseApiController::query()`** es el único punto por el que pasan `index`, `show`, `store`, `update`
   y `destroy` de las nueve entidades expuestas por API (`audit_events` no tiene controlador). Todos los
   controladores lo heredan.
2. **Los global scopes de Eloquent** se aplican al modelo, de modo que también cubren las consultas
   directas que hace `DashboardController` fuera de `BaseApiController`.

La pieza central es un trait `BelongsToOrganization` que añade un global scope de filtrado y el relleno
automático de `organization_id` al crear. Un middleware `EnsureTenantContext`, situado tras
`auth:sanctum`, resuelve la organización desde el usuario autenticado y la deposita en un contexto de
petición. Solo la establece cuando se cumplen tres condiciones **independientes entre sí**: la
organización existe, `deleted_at IS NULL` y `status = active`; la resolución del tenant nunca usa
`withTrashed()`. Como `BaseApiController` usa `findOrFail`, el acceso a un recurso ajeno produce **404 de forma
natural**, que es exactamente lo que exige FR-008, sin escribir código adicional.

Sobre esa base se añaden: políticas de autorización para el alcance del profesor y del super
administrador, reglas de validación conscientes de la organización (porque `exists` y `unique` de Laravel
**no** respetan los global scopes), unicidad compuesta por organización, y una migración de backfill que
asigna el centro actual a su propia organización.

## Technical Context

**Language/Version**: PHP 8.2+ (backend), JavaScript ES2022 (frontend)

**Primary Dependencies**: Laravel 12, Laravel Sanctum 4.3, Spatie Laravel-Permission 6.25, React 19 + Vite.
Sin dependencias nuevas — requisito de la spec y del Principio VII.

**Storage**: MySQL (producción y desarrollo). Base de datos compartida con discriminador
`organization_id`; una sola base para todas las organizaciones.

**Testing**: PHPUnit sobre SQLite en memoria (`phpunit.xml` ya lo configura). Tests de feature en
`backend/tests/Feature/`.

**Target Platform**: Aplicación web servida por Laravel + SPA React. Uso principal desde teléfono
(Principio VI).

**Project Type**: Aplicación web con backend y frontend separados en el mismo repositorio.

**Performance Goals**: Sin objetivos nuevos. El filtrado por `organization_id` debe apoyarse en índices
para no degradar los listados existentes; se añaden índices compuestos con `organization_id` como primera
columna.

**Constraints**: Se mantiene `/api/v1` sin cambio de versión (FR-026). No se introducen paquetes de
tenancy. No se usa la funcionalidad *teams* de Spatie Permission: la pertenencia única de usuario
(Principio IX, v1.1.0) la hace innecesaria.

**Scale/Scope**: Decenas de organizaciones y algunos miles de alumnos por organización durante el piloto.
Alcance del cambio: 10 entidades de negocio, 9 controladores CRUD de API, 4 migraciones, 3 roles y unas
pocas pantallas de frontend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Evaluado contra `.specify/memory/constitution.md` v1.1.0.

| Principio | Puerta | Estado | Evidencia |
|---|---|---|---|
| I. Producto antes que tecnología | Resuelve necesidad real | **PASS** | Sin aislamiento no puede entrar ningún centro piloto. |
| II. MVP primero | Nada fuera del piloto | **PASS** | Self-signup, billing, suscripciones y marketplace quedan fuera de alcance. |
| III. Reutilización | Extender, no reescribir | **PASS** | Se aprovechan `BaseApiController`, `EnsureAnyRole`, `RecordsAuditEvents` y el esquema existente. Ningún modelo se reescribe. |
| IV. Simplicidad (NO NEGOCIABLE) | Sin capas artificiales | **PASS** | Trait + global scope + middleware + policies: idioma nativo de Laravel. Sin repositorios, sin DDD, sin servicios de aplicación, sin paquetes de tenancy. |
| V. Seguridad por diseño (NO NEGOCIABLE) | Filtro en modelo, 404, tests A/B | **PASS** | Global scope a nivel de modelo (no en controlador); `findOrFail` produce 404; batería de tests de aislamiento obligatoria por entidad. |
| VI. Mobile-first | Verificado a 360 px | **PASS (verificado renderizando)** | Las tablas de las pantallas nuevas usan el patrón `.stacked-table`: por debajo de 768 px cada fila es una tarjeta, sin desplazamiento horizontal. Medido en Chrome headless a 360 px: `scrollWidth == clientWidth`, cero elementos desbordando. |
| VII. Bajo coste | Sin coste recurrente | **PASS** | Cero dependencias nuevas, cero servicios externos. |
| VIII. Producción real | Validación, transacciones, backup | **PASS** | Backfill dentro de transacción y con copia de seguridad verificada previa; validación de entrada ya existente se refuerza. |
| IX. Multi-tenancy desde el núcleo | FK explícita, org desde el usuario | **PASS** | `organization_id` en todas las tablas de negocio; contexto resuelto del usuario autenticado, nunca del cliente; relación directa `User → Organization` sin tabla intermedia. |
| X. Evolución incremental | Sistema siempre desplegable | **PASS** | Migraciones ordenadas: crear tabla → añadir columnas nullable → backfill → imponer NOT NULL. Cada paso deja el sistema operativo. |
| XI. Feedback real | Evidencia post-MVP | **N/A** | Feature previa al piloto. |
| XII.a Sin textos en código | Todo texto pasa por traducción, con español por defecto | **PARCIAL (idioma resuelto, sistema de traducción pendiente)** | El idioma ya cumple: la rama `002-ui-espanol` tradujo al español la interfaz completa —20 ficheros de `frontend/src`, incluidas las páginas públicas, el login, el panel y las etiquetas de los nueve módulos— más los cinco mensajes de usuario que quedaban en francés en el backend (`EnsureAnyRole`, `BaseApiController::destroy`, `AuthController` ×2, `PaymentController`). Lo que **sigue incumpliendo** la letra del principio es que esos textos están escritos directamente en el código, no extraídos a un sistema de traducción. Ver Complexity Tracking. |
| XII.b Importes con su moneda | Nunca número desnudo | **FAIL (preexistente)** | `payments.amount`, `subjects.monthly_fee` y `enrollments.monthly_fee` son `decimal(10,2)` sin divisa asociada. Ver Complexity Tracking. |
| XII.c Fechas en UTC | Almacenar UTC, formatear en presentación | **PASS** | `config/app.php` fija `'timezone' => 'UTC'`; las fechas de negocio son columnas `date` sin componente horario. |
| XII.d Sin acoplamiento a país | Moneda, calendario y formatos como configuración de la organización | **PASS con condición** | No hay valores de país fijos en la lógica de negocio. La condición —que `organizations` lleve configuración regional— queda diferida junto con XII.b. |

**Veredicto**: se puede proceder. Los principios NO NEGOCIABLES (IV Simplicidad y V Seguridad por diseño)
se cumplen, de modo que nada bloquea la integración. Las desviaciones que quedan —XII.a parcial y XII.b— son
**preexistentes** a la constitución y están aceptadas con justificación escrita en Complexity Tracking,
conforme al procedimiento de Gobernanza. La feature **no introduce ninguna desviación propia**: la de VI,
que sí introdujo, quedó resuelta en T107; la mitad de XII.a que trataba del idioma quedó saldada después,
en la rama `002-ui-espanol`.

## Project Structure

### Documentation (this feature)

```text
specs/001-multi-org-tenancy/
├── plan.md              # Este fichero
├── research.md          # Fase 0 — decisiones técnicas y alternativas
├── data-model.md        # Fase 1 — entidades, columnas, índices, migraciones
├── quickstart.md        # Fase 1 — cómo validar la feature de punta a punta
├── contracts/
│   ├── organizations-api.md      # Endpoints nuevos de gestión de organizaciones
│   └── tenancy-behavior.md       # Contrato transversal de aislamiento
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 — lo genera /speckit-tasks
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── Models/
│   │   ├── Concerns/
│   │   │   └── BelongsToOrganization.php     # NUEVO — trait de tenancy
│   │   ├── Scopes/
│   │   │   └── OrganizationScope.php         # NUEVO — global scope
│   │   ├── Organization.php                  # NUEVO
│   │   ├── User.php                          # MODIFICADO — organization_id, relación
│   │   ├── Teacher.php                       # MODIFICADO — user_id, relación
│   │   └── {Student,Guardian,Subject,ClassGroup,ClassSession,
│   │        Enrollment,Attendance,Payment,AuditEvent}.php   # MODIFICADOS — usan el trait
│   ├── Support/
│   │   └── OrganizationContext.php           # NUEVO — contexto de petición
│   ├── Http/
│   │   ├── Middleware/
│   │   │   ├── EnsureAnyRole.php             # SIN CAMBIOS
│   │   │   └── EnsureTenantContext.php       # NUEVO
│   │   └── Controllers/Api/
│   │       ├── BaseApiController.php         # MODIFICADO — autorización + reglas por org
│   │       ├── OrganizationController.php    # NUEVO — solo super_admin
│   │       ├── UserController.php            # NUEVO — alta de usuarios por org_admin
│   │       └── DashboardController.php       # MODIFICADO — vínculo por user_id, no por email
│   ├── Policies/                             # NUEVO — directorio completo
│   │   ├── OrganizationPolicy.php            # solo super_admin
│   │   ├── ClassGroupPolicy.php              # org_admin + alcance del profesor
│   │   ├── StudentPolicy.php                 # org_admin + alcance del profesor
│   │   ├── ClassSessionPolicy.php            # org_admin + alcance del profesor
│   │   ├── AttendancePolicy.php              # org_admin + alcance del profesor
│   │   ├── PaymentPolicy.php                 # solo org_admin
│   │   ├── GuardianPolicy.php                # solo org_admin
│   │   ├── SubjectPolicy.php                 # solo org_admin
│   │   ├── TeacherPolicy.php                 # solo org_admin
│   │   └── EnrollmentPolicy.php              # solo org_admin
│   ├── Rules/
│   │   └── BelongsToCurrentOrganization.php  # NUEVO — exists consciente de la organización
│   └── Providers/AppServiceProvider.php      # MODIFICADO — registro de contexto y policies
├── bootstrap/app.php                         # MODIFICADO — alias del middleware nuevo
├── database/
│   ├── migrations/                           # NUEVAS — ver data-model.md
│   └── seeders/                              # MODIFICADOS — roles y datos demo por organización
├── routes/api.php                            # MODIFICADO — grupo super_admin + tenant
└── tests/Feature/
    ├── TenantIsolationTest.php               # NUEVO — la batería A/B exigida por FR-024
    ├── OrganizationManagementTest.php        # NUEVO
    ├── TeacherScopeTest.php                  # NUEVO
    └── {Auth,Student,Payment}Test.php        # MODIFICADOS — deben crear organización

frontend/src/
├── config/modules.js                         # MODIFICADO — roles y módulo Organizaciones
├── App.jsx                                   # MODIFICADO — rutas y allowedRoles
├── components/AppShell.jsx                   # MODIFICADO — detección de rol
├── context/SessionContext.jsx                # MODIFICADO — organización en sesión
└── pages/Organizations/                      # NUEVO — pantallas de super_admin
```

**Structure Decision**: se conserva la estructura existente de aplicación web con `backend/` (Laravel) y
`frontend/` (React + Vite) en el mismo repositorio. No se crean proyectos ni paquetes nuevos: todo el
trabajo son adiciones y modificaciones dentro de los árboles ya establecidos, conforme al Principio III.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principio XII.a**: los textos de usuario están escritos directamente en el código, sin pasar por un sistema de traducción | **Saldada la mitad que importaba al negocio.** Esta desviación se registró cuando el producto estaba íntegramente en francés pese a dirigirse a un mercado hispanohablante; la rama `002-ui-espanol` tradujo la interfaz entera y los mensajes de usuario del backend, de modo que el idioma por defecto ya es el español que fija la constitución. Lo que queda es la ausencia de un sistema de traducción, que solo se justifica cuando exista un segundo idioma real y obliga a decidir si entra una dependencia de i18n (Principios IV y VII). | Se rechazó introducir i18n ahora: con un único idioma añadiría una capa de indirección sin ninguna funcionalidad a cambio, en contra del Principio IV. **Regla adoptada**: todo texto de usuario nuevo se escribe en español. **Deuda restante**: soportar un segundo idioma exigirá extraer los textos, y **corresponde a una feature propia**, con su spec. |
| **Principio XII.b**: los importes monetarios se almacenan sin divisa asociada (`payments.amount`, `subjects.monthly_fee`, `enrollments.monthly_fee`) | Deuda preexistente, anterior a la constitución. Añadir la divisa obliga a tocar el esquema de pagos, matrículas y asignaturas, sus controladores y la presentación: es una feature propia, no un efecto colateral de tenancy (Principio II). | Se rechazó ampliar el alcance. **Regla adoptada**: la moneda se resolverá como configuración de la organización, de modo que la feature de internacionalización solo tenga que propagarla. Esta feature no introduce ningún importe nuevo, así que no agrava la deuda. |
| Regla de validación propia `BelongsToCurrentOrganization` en lugar de `exists` de Laravel | `exists` y `unique` construyen la consulta sobre el *query builder*, no sobre Eloquent, por lo que **ignoran los global scopes**. Sin esta regla, FR-009 quedaría incumplido: un alumno propio podría matricularse en un grupo ajeno pasando la validación. | `Rule::exists(...)->where('organization_id', ...)` funciona pero obliga a repetir el `where` en cada regla de cada controlador, y cualquier olvido es una fuga silenciosa. Una regla única y reutilizable es más simple de auditar y de testear. |
