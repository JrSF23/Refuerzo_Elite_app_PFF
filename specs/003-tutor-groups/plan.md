# Implementation Plan: Grupos tutoriales

**Branch**: `003-tutor-groups` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-tutor-groups/spec.md`

---

## Summary

Se introduce el **grupo tutorial** —el aula, con su turno, su profesor responsable y su alumno delegado— como entidad
de primera clase, y el listado de alumnos pasa a mostrarse en bloques por grupo.

Es la primera feature de esta serie que **toca backend**. Eso cambia el listón: entra por las once puertas de la
constitución, incluida la de aislamiento entre organizaciones, que es NO NEGOCIABLE y exige prueba automatizada.

El trabajo es pequeño en superficie y exigente en rigor:

- **Una tabla nueva y una columna.** Nada existente se reestructura.
- **Un recurso de API** con el mismo esqueleto que los otros nueve.
- **Tres pantallas tocadas**: la nueva de grupos, el formulario de alumno y el listado de alumnos.

## Sobre la exigencia de la interfaz

El destinatario es la administración de un centro educativo, que maneja a diario decenas de grupos y cientos de
alumnos. Eso impone tres cosas que un CRUD genérico no da y que este plan trata como requisitos, no como adorno:

1. **La vista agrupada debe seguir siendo navegable con volumen.** Con 300 alumnos, un listado de bloques planos es
   inmanejable. Los bloques deben poder plegarse y recordar su estado, y el listado debe poder acotarse a un grupo
   —de ahí el filtro de FR-021, que no es un capricho sino lo que hace la pantalla utilizable en un centro real.
2. **La adscripción no puede ser ficha a ficha para un curso entero.** Asignar grupo a 300 alumnos de uno en uno son
   300 formularios. La adscripción masiva está declarada fuera del MVP en la spec, pero el diseño de esta feature
   **no debe cerrarle la puerta**: el filtro por grupo y la selección de alumnos son sus cimientos.
3. **Cada bloque debe informar sin obligar a contar.** Recuento de alumnos, tutor y delegado visibles en la cabecera:
   son las tres preguntas que la administración se hace sobre un grupo.

## Technical Context

**Language/Version**: PHP 8.2 / Laravel 12 en el backend; JavaScript ES2022 / React 19.2 en el frontend.

**Primary Dependencies**: ninguna nueva, en ninguno de los dos lados. Se reutilizan Eloquent, las Policies, el trait de
tenancy y, en el frontend, `ResourcePage`, `useResourceList` y `RelationSelect` de la feature 002.

**Storage**: MySQL 8 en producción, SQLite en memoria para la suite. Una tabla nueva y una columna.

**Testing**: PHPUnit para el backend, con **prueba de aislamiento obligatoria** (Principio V). `vitest` para la lógica
de agrupación del frontend. Render headless para anchos. Validación de la migración **contra MySQL real**, no solo
SQLite.

**Target Platform**: navegadores actuales. Referencia mínima de ancho, 360 px.

**Project Type**: aplicación web con frontend y backend separados. Esta feature toca **ambos**.

**Performance Goals**: el listado agrupado se resuelve con **una sola consulta de listado** y cero consultas por alumno
o por grupo (SC-002).

**Constraints**: paginación máxima de 50 registros por página, impuesta por `BaseApiController`. La tabla nueva debe
llevar su columna de organización desde el primer día (Principio IX).

**Scale/Scope**: 1 entidad nueva, 1 columna nueva, 1 recurso de API, 3 pantallas.

## Constitution Check

Constitución `.specify/memory/constitution.md`, v1.1.0. Once puertas.

| Puerta | Criterio | Estado | Justificación |
|---|---|---|---|
| 1 | Necesidad real y rol que la solicita | **PASS** | La solicita la administración del centro: identificar de un vistazo qué alumnos hay en cada aula y quién es su responsable. El concepto existe en la realidad del centro y no en el modelo. |
| 2 | Necesaria para el piloto | **PASS** | Un centro organiza a sus alumnos por aulas; sin ello la gestión diaria no se corresponde con cómo trabaja. El histórico, la promoción y la adscripción masiva quedan fuera, precisamente por aplicar este principio. |
| 3 | Reutilización documentada | **PASS** | Se reutiliza todo el andamiaje: trait de tenancy, global scope, `BaseApiController`, `OrganizationAdminOnlyPolicy`, la regla `BelongsToCurrentOrganization` y el patrón de pantalla de la 002. Ver *Reutilización*. |
| 4 | Sin capas no justificadas (**NO NEGOCIABLE**) | **PASS** | Cero dependencias nuevas y cero capas nuevas. La entidad sigue exactamente el molde de `Subject`. |
| 5 | Prueba de aislamiento (**NO NEGOCIABLE**) | **PENDIENTE HASTA LA FASE 2** | Esta feature **sí toca datos de organización**, así que la herencia de la 001 no basta: necesita pruebas propias. Sin ellas la feature no se puede dar por terminada. Ver *Pruebas obligatorias*. |
| 6 | Verificada a 360 px | **PASS por diseño** | La vista agrupada mantiene la representación por tarjetas de la 002. Se verifica por render headless, no por inspección visual. |
| 7 | Sin coste recurrente | **PASS** | Ninguna dependencia ni servicio. |
| 8 | Validación en servidor y transacciones | **PASS** | Las reglas van en el controlador; el delegado y el tutor se validan con reglas que consultan por Eloquent, de modo que el global scope aplique. |
| 9 | Columna de organización en tablas nuevas | **PASS** | `tutor_groups` la lleva desde su migración inicial, con índice y clave foránea. Es lo que esta puerta exige literalmente. |
| 10 | Sistema desplegable | **PASS** | Backend primero y frontend después; cada fase deja el sistema en pie. La columna nueva es opcional, así que el frontend anterior sigue funcionando sin conocerla. |
| 11 | Textos por traducción y sin valores de país | **PASS con una condición** | Los textos van al catálogo. La condición es el **orden académico**: se almacena como dato y NO se escribe en el código, porque el sistema educativo de Guinea Ecuatorial no tiene por qué coincidir con el español. |

**Veredicto**: se puede proceder, con la puerta 5 explícitamente abierta hasta que existan las pruebas de aislamiento.
No hay desviaciones nuevas que registrar.

## Reutilización

Puerta 3. Qué molde se copia para cada pieza.

| Pieza nueva | Molde existente | Qué se hereda |
|---|---|---|
| `TutorGroup` (modelo) | `app/Models/Subject.php` | Trait `BelongsToOrganization`, que añade el global scope y rellena `organization_id` desde el contexto. |
| `TutorGroupPolicy` | `app/Policies/SubjectPolicy.php` | Extiende `OrganizationAdminOnlyPolicy`. **Con una diferencia**: aquí el profesor SÍ tiene lectura (FR-020), así que no basta con heredar en vacío. |
| `TutorGroupController` | `app/Http/Controllers/Api/SubjectController.php` | `BaseApiController` completo: paginación, búsqueda, auditoría y autorización en los cinco métodos. |
| Validación de tutor y delegado | `app/Rules/BelongsToCurrentOrganization.php` | Consulta por Eloquent para que el scope aplique, y falla con `validation.exists` para no revelar registros ajenos. |
| Migración | `2026_08_14_000001_create_organizations_table.php` | Estructura, índices y claves foráneas con el mismo estilo. |
| Pruebas de aislamiento | `tests/Feature/TenantIsolationTest.php` y `CrossReferenceValidationTest.php` | El concern `CreatesOrganizations` y, sobre todo, `actingWithToken()`, sin el cual las pruebas pasarían **sin comprobar nada**. |
| Pantalla de grupos | `frontend/src/pages/subjects/SubjectsPage.jsx` | `ResourcePage` con sus columnas y campos. |
| Desplegables de tutor y delegado | `frontend/src/components/ui/RelationSelect.jsx` | Ya acota al centro por el scope del servidor. **Necesita ampliarse** para el delegado, que además filtra por grupo. |

**Lo que NO se toca**: `class_groups`, `enrollments`, `students.school_level`, `guardians`. Su significado actual es
correcto.

## Modelo de datos

```
tutor_groups
  id                        bigint PK
  organization_id           bigint NOT NULL, FK organizations, índice        ← Principio IX
  name                      varchar(100) NOT NULL                            "1º ESO"
  shift                     varchar(20)  NOT NULL                            morning | afternoon
  academic_year             varchar(20)  NOT NULL                            "2025-2026"
  tutor_teacher_id          bigint NULL, FK teachers ON DELETE SET NULL      ← FR-011
  representative_student_id bigint NULL, FK students ON DELETE SET NULL      ← SC-009
  sort_order                int NOT NULL DEFAULT 0                           ← orden académico, dato y no código
  status                    varchar(20) NOT NULL DEFAULT 'active'
  timestamps + softDeletes
  UNIQUE (organization_id, name, shift, academic_year)                       ← FR-004

students
  + tutor_group_id          bigint NULL, FK tutor_groups ON DELETE SET NULL, índice   ← FR-007, FR-010
```

Cuatro decisiones de esquema y su razón:

- **`ON DELETE SET NULL` en las tres claves foráneas.** Es lo que implementa FR-010, FR-011 y SC-009: dar de baja un
  grupo no borra alumnos, dar de baja un profesor no deja el grupo apuntando al vacío, y dar de baja al delegado no
  rompe el grupo. Con `CASCADE` —el otro comportamiento habitual— borrar un grupo se llevaría por delante a sus
  alumnos, que es exactamente lo que la spec prohíbe.
- **Todas las columnas nuevas de `students` son NULL.** Los 8 alumnos existentes no tienen grupo. Ponerla `NOT NULL`
  haría fallar la migración sobre datos reales: es el defecto que en la feature 001 obligó a partir la migración M4 en
  dos, y no se repite.
- **`shift` como cadena validada, no enum de base de datos.** Un `ENUM` de MySQL obliga a una migración para añadir un
  turno de noche; una cadena con validación en servidor, no. Es además el patrón que ya usan `status`,
  `payment_method` y los estados de asistencia.
- **Unicidad con `shift` dentro.** Sin él, «1º ESO mañana» y «1º ESO tarde» chocarían, y son grupos distintos.

**Orden de la migración**: crear `tutor_groups` primero y añadir `students.tutor_group_id` después, en la misma
migración pero en ese orden. La clave foránea no puede apuntar a una tabla que aún no existe.

## Superficie de API

Sobre la existente, sin romper nada.

| Endpoint | Métodos | Roles | Notas |
|---|---|---|---|
| `/api/v1/tutor-groups` | index, show, store, update, destroy | escritura `org_admin`, **lectura `teacher`** | Búsqueda por `name`. `with` = tutor y delegado, cargados de antemano (FR-015). |
| `/api/v1/students` | index | sin cambios de ruta | `with` gana `tutorGroup.tutor`; acepta filtro `tutor_group_id` (FR-021). |
| `/api/v1/students` | store, update | sin cambios de ruta | Aceptan `tutor_group_id`, validado con `BelongsToCurrentOrganization` (FR-017, FR-018). |

**Sobre el filtro `tutor_group_id`**: es el primer filtro de listado del proyecto junto al de `/users`. Se implementa
**solo en `StudentController`** y no de forma genérica en `BaseApiController`: un mecanismo genérico de filtros sin más
consumidor que este sería una capa sin justificar (Principio IV). Cuando haya un segundo caso, se generaliza.

**Sobre el N+1**: el listado de alumnos añade `tutorGroup.tutor` a `$with`, que es carga ansiosa. La comprobación no es
opinable: se cuentan las consultas con `DB::listen` en una prueba y se afirma el número (SC-002).

## Fases de implementación

Backend primero y entero. El frontend no puede probarse contra un endpoint que no existe, y la mitad del rigor de esta
feature está en el servidor.

### Fase 1 — Esquema y modelo

Migración, modelo con el trait, factory y seeder de demostración. Validación de la migración **contra MySQL real** en el
contenedor, no solo contra SQLite: es la lección de la feature 001, donde dos defectos de migración solo aparecieron
fuera de SQLite.

*Verificación*: `migrate:fresh --seed` en verde sobre MySQL y sobre SQLite; las 246 pruebas existentes siguen pasando.

### Fase 2 — API, autorización y pruebas de aislamiento

Controlador, política, reglas de validación, el filtro de alumnos y las relaciones cargadas de antemano.

**Es la fase que cierra la puerta 5.** Las pruebas de aislamiento no son un extra al final: se escriben aquí.

*Verificación*: ver *Pruebas obligatorias*. Sin ellas en verde la feature está bloqueada.

### Fase 3 — Pantalla de grupos

Sección nueva con listado y formulario: nombre, turno, curso académico, tutor, delegado y orden. Incluye el
**renombrado** de la sección «Grupos» actual a «Grupos de asignatura» (FR-022a), que toca código de la feature 002.

*Verificación*: crear grupos con y sin tutor; comprobar que el delegado solo ofrece alumnos de ese grupo; comprobar que
«1º ESO mañana» y «1º ESO tarde» conviven.

### Fase 4 — Listado de alumnos agrupado

Campo de grupo en la ficha del alumno, y el listado en bloques con cabecera, recuento, tutor y delegado. Bloques
plegables. Bloque propio para los alumnos sin grupo.

*Verificación*: escenarios de US3 y US4 completos, incluido el ancho de 360 px y que buscar, crear, editar y eliminar
siguen funcionando.

### Fase 5 — Cierre

Auditoría de anchos, comprobación del recuento de consultas, barrido de literales fuera del catálogo y revisión de que
el `super_admin` no alcanza la sección nueva.

## Pruebas obligatorias

La puerta 5 es NO NEGOCIABLE y su incumplimiento **bloquea la integración sin excepción**. Lo que hay que demostrar,
como mínimo:

| Qué | Por qué |
|---|---|
| Un `org_admin` de A no lista, ve, edita ni borra grupos de B | Aislamiento básico. La respuesta debe ser **404**, no 403. |
| Un alumno de A no puede adscribirse a un grupo de B | Es la vía de fuga por referencia cruzada, la misma que en la 001 obligó a escribir `BelongsToCurrentOrganization`. |
| Un grupo de A no puede tomar como tutor a un profesor de B | Ídem, en la otra dirección. |
| Un grupo de A no puede tomar como delegado a un alumno de B | Ídem. |
| Un grupo no puede tomar como delegado a un alumno de **otro grupo del mismo centro** | FR-003c. No es aislamiento, es coherencia del dato. |
| El nombre puede repetirse entre centros y entre turnos, y no dentro del mismo | FR-004. La unicidad mal acotada es a la vez un fallo funcional y una fuga: el error de duplicado revelaría un registro ajeno. |
| Borrar un grupo con alumnos no borra ni desactiva alumnos | FR-010, SC-008. |
| Borrar al profesor tutor deja el grupo sin tutor | FR-011. |
| Borrar al alumno delegado deja el grupo sin delegado | SC-009. |
| El listado agrupado no dispara consultas por alumno ni por grupo | SC-002, contando consultas. |
| El `teacher` lee pero no escribe; el `super_admin` no accede | FR-020. |

**Aviso heredado**: usar `actingWithToken()` del concern `CreatesOrganizations` para cambiar de usuario. Con
`withToken()` a secas, el guard de Sanctum **cachea el usuario resuelto** dentro de la misma prueba, y una batería de
aislamiento entera puede pasar sin comprobar absolutamente nada. Ya ocurrió en la feature 001.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La migración se valida solo en SQLite y falla en MySQL | Se valida en ambos antes de cerrar la Fase 1. Es exactamente lo que en la 001 destapó el error 1553 de índices que respaldan claves foráneas. |
| Las pruebas de aislamiento pasan sin comprobar nada | `actingWithToken()` obligatorio. Además, cada prueba debe fallar si se elimina el filtro: se comprueba invirtiendo el scope una vez. |
| El listado agrupado dispara N+1 al añadir el tutor | Carga ansiosa desde el principio, y el recuento de consultas es un criterio de éxito, no una impresión. |
| La agrupación se rompe con volumen por la paginación | Bloques plegables y filtro por grupo desde esta feature. La paginación por bloque queda para después, pero sin cerrarle la puerta. |
| Renombrar «Grupos» confunde a quien ya usa la aplicación | El renombrado es explícito, con su ruta propia, y se hace en la misma entrega que introduce la sección nueva: no hay ventana en que convivan dos «Grupos». |
| La referencia circular grupo↔alumno bloquea altas o borrados | Ambas son opcionales y ambas claves foráneas usan `SET NULL`. Cubierto por tres pruebas de borrado. |

## Complexity Tracking

Sin entradas nuevas. La feature no introduce dependencias, capas ni patrones que no estuvieran ya en el proyecto.

Se hereda la desviación **XII.b** —importes sin divisa asociada—, ajena a esta feature, que no introduce ningún importe.

## Próximo paso

`data-model.md` con el detalle de columnas y reglas, `contracts/tutor-groups-api.md`, `quickstart.md` con los escenarios
de verificación, y después `tasks.md`. La implementación no empieza hasta que `tasks.md` esté aprobado.
