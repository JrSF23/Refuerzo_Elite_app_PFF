# Tasks: Grupos tutoriales

**Input**: Design documents from `/specs/003-tutor-groups/`

**Prerequisites**: spec.md, plan.md, data-model.md, contracts/tutor-groups-api.md, quickstart.md

**Tests**: **obligatorios en el backend, y no negociables.** Esta feature manipula datos de organización, así que la
puerta 5 de la constitución exige prueba automatizada de aislamiento y su incumplimiento bloquea la integración sin
excepción. En el frontend se prueba la lógica de agrupación con el runner ya introducido en la feature 002.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: paralelizable — ficheros distintos, sin dependencia pendiente
- **[US#]**: historia que cierra, según spec.md

## Path Conventions

`backend/` y `frontend/`. Es la primera feature de la serie que toca ambos.

---

## Fase 1: Esquema y modelo

**Objetivo**: la entidad existe, se puede sembrar y la migración es correcta en los dos motores.

**Independent Test**: escenario 1 de `quickstart.md`.

- [X] T001 Crear la migración `create_tutor_groups_table` en `backend/database/migrations/`: columnas, `organization_id` NOT NULL con índice y FK, y clave única `(organization_id, name, shift, academic_year)` (data-model §1)
- [X] T002 En la **misma** migración y **después** de crear la tabla, añadir `students.tutor_group_id` nullable con índice y FK `ON DELETE SET NULL`. El orden importa: la FK no puede apuntar a una tabla que aún no existe (data-model §2)
- [X] T003 Declarar las tres FK con `ON DELETE SET NULL` — tutor, delegado y grupo del alumno. Con `CASCADE`, borrar un grupo se llevaría por delante a sus alumnos (FR-010, FR-011, SC-009)
- [X] T004 Crear `backend/app/Models/TutorGroup.php` con el trait `BelongsToOrganization`, `SoftDeletes`, `$fillable` **sin** `organization_id`, y las relaciones `tutor`, `representative`, `students` (data-model §6)
- [X] T005 Añadir a `backend/app/Models/Student.php` la relación `tutorGroup()` y `tutor_group_id` al `$fillable`
- [X] T006 Limpiar en el modelo las referencias al borrar **lógicamente** un profesor o un alumno delegado: `SoftDeletes` no dispara la FK, así que el `SET NULL` no basta (data-model §3)
- [X] T007 [P] Crear `backend/database/factories/TutorGroupFactory.php`
- [X] T008 Ampliar `DemoSeeder` con los cinco casos límite —con tutor y delegado, sin tutor, sin alumnos, mismo nombre en dos turnos, alumnos sin grupo— **en las dos organizaciones**, con nombres repetidos entre ellas (data-model §8)
- [X] T009 Validar la migración contra **MySQL real** en el contenedor, no solo contra SQLite. Es la lección de la feature 001: dos defectos de migración solo aparecieron fuera de SQLite
- [X] T010 Confirmar que las 246 pruebas existentes siguen en verde

**Checkpoint 1**: migración en verde en ambos motores · datos sembrados con los casos límite · suite anterior intacta.

### Resultado y desviaciones de la Fase 1

Cerrada el 2026-08-17.

**Comprobado**

- Migración y siembra en verde contra **MySQL real** en el contenedor y contra **SQLite** (vía la suite).
- Esquema verificado en MySQL: `organization_id` NOT NULL con índice y FK; clave única
  `(organization_id, name, shift, academic_year)`; tutor, delegado y `students.tutor_group_id` **nullable**.
- Los cinco casos límite sembrados: grupo con tutor y delegado; grupo sin tutor; grupo sin alumnos; «1º ESO mañana» y
  «1º ESO tarde» conviviendo; y 3 alumnos sin grupo. Nombres repetidos entre las dos organizaciones.
- Los cuatro casos de borrado, ejercitados contra la base real: borrar un grupo con alumnos no cambia el recuento del
  centro y los deja sin grupo; borrar al profesor tutor deja el grupo sin tutor; borrar al delegado lo deja sin
  delegado, con el grupo vivo **y con el grupo borrado**.
- 246 pruebas existentes en verde.

**Defecto encontrado y corregido durante la fase**

`SoftDeletes` no dispara la clave foránea —eso ya estaba previsto en data-model §3—, pero el gancho que lo suplía
**tampoco alcanzaba**: `TutorGroup::query()` aplica el filtro de borrado lógico, así que no veía los grupos ya borrados.
Resultado: borrar al delegado de un grupo borrado dejaba el puntero intacto, y restaurar ese grupo lo habría devuelto
apuntando a un alumno inexistente.

Detectado ejercitando los borrados contra la base de datos, no leyendo el código: con el grupo vivo el gancho funcionaba
y el defecto no se veía. Corregido con `withTrashed()` en los dos ganchos —el de alumno y el de grupo— y verificado con
el caso que fallaba.

Es la segunda vez en el proyecto que el borrado lógico esconde un problema que la clave foránea aparentaba cubrir; la
primera fue en `MigrationBackfillTest` de la feature 001.

---

## Fase 2: API, autorización y aislamiento

**Objetivo**: la superficie de API completa y **la puerta 5 cerrada**.

**Independent Test**: escenarios 2 a 6 de `quickstart.md`. Sin el 2 en verde, la feature está bloqueada.

### 2a. Controlador y reglas

- [X] T011 Crear `backend/app/Http/Controllers/Api/TutorGroupController.php` sobre `BaseApiController`: `$searchable = ['name']`, `$with = ['tutor','representative']`, `$entityLabel = 'tutor_group'`
- [X] T012 Reglas de validación del grupo: nombre, turno, curso académico, orden y estado (contracts §1)
- [X] T013 Acotar la unicidad de `name` a la organización activa **en el servidor**, con `shift` y `academic_year`. Si se dejara al índice SQL, el error de clave duplicada revelaría un registro de otro centro (FR-004)
- [X] T014 Validar `tutor_teacher_id` con `BelongsToCurrentOrganization`, que consulta por Eloquent para que el global scope aplique
- [X] T015 Crear la regla del delegado: debe ser alumno de la organización **y de este grupo**. Dos fallos distintos — el ajeno, indistinguible de «no existe»; el de otro grupo, con mensaje explicativo, porque ahí no hay nada que ocultar (FR-003c, data-model §5)
- [X] T016 Rechazar con explicación el delegado al **crear** un grupo, que aún no tiene alumnos (US1.2c)
- [X] T017 Crear `backend/app/Policies/TutorGroupPolicy.php`. **No puede extender `OrganizationAdminOnlyPolicy` en vacío** como las demás: el profesor tiene lectura y no escritura (FR-020, contracts §3)
- [X] T018 Registrar la policy en `AppServiceProvider`
- [X] T019 Añadir las rutas a `backend/routes/api.php` en los dos grupos de middleware —lectura para `org_admin` y `teacher`, escritura solo para `org_admin`— siguiendo el reparto que ya usan `students` y `class-groups`
- [X] T020 Añadir `tutor_group_id` a las reglas de `StudentController`, validado con `BelongsToCurrentOrganization` (FR-017)
- [X] T021 Ampliar `StudentController::$with` a `['guardian','tutorGroup.tutor']` (FR-016)
- [X] T022 Añadir el filtro `tutor_group_id` **solo** en `StudentController`, no genérico en `BaseApiController`: sin un segundo consumidor sería una capa sin justificar (Principio IV, FR-021)
- [X] T023 Validar el filtro: un grupo de otra organización NO debe devolver el listado completo por haberse ignorado el parámetro (contracts §2)
- [X] T024 [P] Añadir a `backend/lang/es/tenancy.php` los mensajes propios de la feature

### 2b. Pruebas obligatorias

- [X] T025 `TutorGroupIsolationTest`: listar, ver, editar y borrar grupos de otra organización responde **404**, y el registro ajeno queda intacto (quickstart 2.1–2.4)
- [X] T026 `TutorGroupCrossReferenceTest`: las tres vías de fuga por referencia —alumno→grupo, grupo→tutor, grupo→delegado— rechazan lo ajeno de forma indistinguible de «no existe» (quickstart 2.5–2.7)
- [X] T027 Prueba del filtro: `tutor_group_id` de otra organización nunca devuelve alumnos ajenos ni el listado completo (quickstart 2.8)
- [X] T028 Prueba de unicidad: el mismo nombre se acepta entre centros y entre turnos, y se rechaza dentro del mismo centro, turno y curso (quickstart 2.9, 3.2, 3.3, 3.4)
- [X] T029 Prueba de la regla del delegado: alumno de otro grupo del mismo centro rechazado con mensaje explicativo (quickstart 3.5)
- [X] T030 `TutorGroupDeletionTest`: borrar un grupo con alumnos no borra ni desactiva alumnos, y el recuento del centro no cambia (quickstart 4.1, 4.2)
- [X] T031 Borrar al profesor tutor deja el grupo sin tutor; borrar al alumno delegado lo deja sin delegado. **En borrado lógico y físico** (quickstart 4.3–4.5)
- [X] T032 `TutorGroupQueryCountTest`: contar consultas con `DB::listen` al listar alumnos y al listar grupos; ninguna por alumno ni por grupo (quickstart 5.1, 5.2)
- [X] T033 Sembrar 100 alumnos y comprobar que el número de consultas **no crece**. Con 8, un N+1 pasa desapercibido (quickstart 5.3, SC-002)
- [X] T034 Prueba de permisos: el profesor lee pero no escribe; el `super_admin` recibe 403 (quickstart 6.1–6.3)
- [X] T035 **Comprobar que las pruebas prueban algo**: quitar el filtro del global scope y confirmar que T025 falla. Si pasa sin el filtro, no comprueba nada (quickstart 2.10)
- [X] T036 Usar `actingWithToken()` en todas las pruebas que cambien de usuario. Con `withToken()` a secas, el guard de Sanctum cachea el usuario y toda la batería puede pasar en falso. Ya ocurrió en la feature 001

**Checkpoint 2**: escenarios 2 a 6 completos · **puerta 5 cerrada** · suite completa en verde.

### Resultado y desviaciones de la Fase 2

Cerrada el 2026-08-17. **Puerta 5 cerrada.**

**Comprobado**

- **273 pruebas en verde**: las 246 anteriores más 27 nuevas, con 687 aserciones.
- Permisos contra la API viva: el `org_admin` obtiene 200/201/200 en listar, crear y editar; el `teacher` obtiene 200
  al leer y **403 en las tres escrituras**; el `super_admin`, 403.
- Tutor y delegado llegan cargados de antemano en el listado, sin consulta por grupo.
- **T035, la comprobación que da valor al resto**: desactivado el filtro de organización del global scope,
  **7 pruebas fallan**. Si hubieran seguido pasando, no estarían comprobando nada. El filtro se restauró desde git y se
  verificó que no quedaban restos.

**Defectos y correcciones durante la fase**

- **Caché de rutas.** El endpoint devolvía 404 pese a estar bien registrado: el contenedor servía rutas cacheadas de
  antes del cambio. Resuelto con `route:clear`. Conviene recordarlo al añadir rutas en Docker.
- **El contador de consultas se contaba a sí mismo.** `DB::listen` no se puede desregistrar, así que registrarlo antes
  de cada medición dejaba dos escuchas activas y la segunda cuenta salía al doble. Se registra una sola vez.
- **La primera petición del proceso mide de más.** Sin calentamiento, las consultas bajaban de 10 a 8 entre medición y
  medición —la tabla de permisos de Spatie se cachea—, y la comparación no decía nada sobre el N+1. Se añade una
  petición de calentamiento antes de medir.

**Desviación**

- **`RepresentativeBelongsToGroup` es una regla propia**, no prevista como fichero separado en el plan. Hacía falta
  porque debe fallar de **dos formas distintas**: indistinguible de «no existe» para un alumno ajeno, y con mensaje
  explicativo para un alumno del centro que está en otro grupo. Ninguna regla existente cubre esa doble semántica.

---

## Fase 3: Pantalla de grupos

**Objetivo**: la administración puede crear y mantener sus grupos.

**Independent Test**: escenario 7 de `quickstart.md`.

- [X] T037 [US1] Añadir la sección `tutorGroups` a `frontend/src/lib/permissions.js` con su ruta, endpoint, `searchable: true` y acceso —escritura `org_admin`, lectura `teacher`—
- [X] T038 [US1] **Resolver la colisión de nombres**: la sección existente pasa a «Grupos de asignatura» en `/grupos-asignatura`; la nueva se queda con «Grupos» en `/grupos`. Toca código de la feature 002 (FR-022a)
- [X] T039 [US1] Añadir redirección de la ruta antigua `/grupos` a `/grupos-asignatura` para no romper marcadores del centro
- [X] T040 [US1] Crear `frontend/src/pages/tutorGroups/TutorGroupsPage.jsx` sobre `ResourcePage`: columnas nombre, turno, curso académico, tutor, delegado y alumnos
- [X] T041 [US1] Campos del formulario: nombre, turno, curso académico, tutor, delegado y orden. **Nada más** (FR-023c)
- [X] T042 [US1] Ampliar `RelationSelect` para acotar por otro campo del formulario: el delegado solo ofrece alumnos del grupo que se está editando (FR-023b)
- [X] T043 [US1] Deshabilitar el delegado al crear un grupo, con explicación visible: no hay alumnos todavía (FR-023b, US1.2c)
- [X] T044 [P] [US1] Añadir el espacio `tutorGroups` a `frontend/src/i18n/locales/es.js`, y renombrar el de la sección de asignatura
- [X] T045 [US5] Comprobar el modo lectura del profesor y que el `super_admin` no alcanza la sección

**Checkpoint 3**: escenario 7 completo · sin dos secciones llamadas «Grupos» · «1º ESO mañana» y «1º ESO tarde» conviven.

### Resultado y desviaciones de la Fase 3

Cerrada el 2026-08-17.

**Comprobado en navegador con datos reales**

- Navegación con las dos secciones distinguibles: **«Grupos»** (aulas) y **«Grupos de asignatura»**.
- Listado con las seis columnas, «Sin asignar» atenuado en los grupos sin tutor, y «1º ESO mañana» y «1º ESO tarde»
  conviviendo como filas distintas.
- Formulario de creación: el **delegado sale deshabilitado con su explicación** —«Disponible al editar, cuando el grupo
  tenga alumnos»—, no gris y mudo.
- Formulario de edición sobre 4º ESO: el delegado ofrece **solo los 2 alumnos de ese grupo**, de los 8 del centro.
  Confirmado también contra la API.
- El profesor ve la sección en solo lectura: sin botón de crear, sin acciones de fila y sin columna de acciones.
- 273 pruebas de backend y 9 de frontend en verde; build limpio.

**Desviaciones**

- **`RelationSelect` admite ahora `params`, `isDisabled` y `disabledHint`**, y `ResourcePage` los resuelve como
  funciones del estado del formulario. Era la única forma de que el delegado se acote al grupo que se está editando sin
  duplicar el componente.
- **La clave de sección `groups` pasa a `classGroups`.** Arrastró tres enlaces del panel que apuntaban a `linkTo('groups')`
  y habrían dejado de enlazar en silencio, porque `linkTo` devuelve `undefined` cuando la sección no existe y la tarjeta
  simplemente deja de ser pulsable. Detectado buscando referencias a la clave antigua, no al ejecutar.
- **`/grupos` cambia de significado y NO se añade redirección.** No hay adónde redirigir: la ruta sigue existiendo con
  otro contenido. Es admisible porque la aplicación no está en producción y nadie tiene esa dirección guardada; si lo
  estuviera, el reparto correcto sería dejar `/grupos` a los de asignatura. Escrito en `App.jsx` para que la decisión no
  se pierda.
- `/grupos-asignatura` muestra el marcador de sección en construcción. **No es una regresión**: esa pantalla nunca se
  llegó a construir y sigue pendiente en la feature 002.

---

## Fase 4: Listado de alumnos agrupado

**Objetivo**: el objetivo visible de la feature.

**Independent Test**: escenario 8 de `quickstart.md`.

- [ ] T046 [US2] Añadir el campo de grupo tutorial al formulario de alumno, como `RelationSelect` acotado al centro (FR-024)
- [ ] T047 [US3] Crear `frontend/src/pages/students/groupStudents.js`: función pura que reparte los alumnos en bloques por su grupo, ordena los bloques por `sort_order` y los alumnos por apellidos y nombre (FR-031, FR-036)
- [ ] T048 [US3] Prueba de `groupStudents`: agrupación, orden no alfabético, grupo sin alumnos ausente, alumnos sin grupo en su bloque propio. Es lógica pura y se prueba sin navegador
- [ ] T049 [US3] Crear `frontend/src/components/data/GroupedList.jsx`: bloques con cabecera y la tabla existente dentro. **Reutiliza `DataTable`**, no lo duplica
- [ ] T050 [US3] Cabecera del bloque: nombre y turno a la izquierda; tutor a la derecha; recuento de alumnos. «Sin asignar» cuando falte el tutor (FR-026, FR-027)
- [ ] T051 [US3] Bloques plegables con estado recordado: con cientos de alumnos, una lista plana es inmanejable (plan.md §Exigencia)
- [ ] T052 [US3] Bloque propio para los alumnos sin grupo, marcado como pendientes de asignar. **No deben ocultarse** (FR-029)
- [ ] T053 [US3] Omitir del listado los grupos sin alumnos (FR-028)
- [ ] T054 [US3] Quitar la columna de grupo de las tablas: ya lo dice la cabecera (FR-030)
- [ ] T055 [US4] Comprobar que la búsqueda sigue operando sobre todos los alumnos y que los bloques se recomponen (FR-032)
- [ ] T056 [US4] Comprobar que crear, editar y eliminar siguen funcionando igual (FR-033)
- [ ] T057 [US3] Advertir de que los bloques corresponden a la página mostrada mientras la paginación sea global (FR-037)
- [ ] T058 [P] [US3] Añadir al catálogo los textos de la vista agrupada

**Checkpoint 4**: escenario 8 completo · los alumnos sin grupo visibles · buscar, crear, editar y eliminar intactos.

---

## Fase 5: Cierre

**Objetivo**: cerrar los criterios que solo se comprueban sobre el conjunto.

- [ ] T059 Barrido de los diez anchos sobre las dos pantallas nuevas: desbordamiento 0 (SC-006)
- [ ] T060 Listado agrupado a 360 px: cada bloque en tarjetas, sin desplazamiento horizontal (FR-034)
- [ ] T061 Barrido de literales fuera de `src/i18n/`: cero resultados
- [ ] T062 Revisión visual: tipografía, espaciado, colores y botones **sin cambios** respecto a la feature 002 (FR-035)
- [ ] T063 Revisar la pestaña de red: ninguna petición fuera del contrato
- [ ] T064 `php artisan test` completo, `npm run build` y `npm test` en verde
- [ ] T065 Recorrer el quickstart entero con los cuatro roles

**Checkpoint final**: quickstart completo · suites en verde · migración validada en MySQL.

---

## Dependencias

```
Fase 1 ──> Fase 2 ──> Fase 3 ──> Fase 4 ──> Fase 5
```

Estrictamente secuencial, y no por comodidad:

- La **Fase 2 exige la 1**: no hay endpoint sin tabla.
- La **Fase 3 exige la 2**: una pantalla no se puede probar contra un endpoint que no existe.
- La **Fase 4 exige la 3**: sin grupos creados no hay nada por lo que agrupar.

Dentro de la Fase 2, T011–T024 preceden a T025–T036: primero el comportamiento, después las pruebas que lo fijan. **La
fase no se cierra hasta que las pruebas estén en verde**, no hasta que el código esté escrito.

## Paralelismo

Poco, y es correcto que así sea: casi todo se encadena. **T007** con T004–T006; **T024**, **T044** y **T058** con las
tareas de su fase.

## Resumen

| Fase | Tareas | Historias | Nota |
|---|---|---|---|
| 1 — Esquema y modelo | T001–T010 (10) | — | Migración validada en dos motores |
| 2 — API y aislamiento | T011–T036 (26) | US1, US2 | **Cierra la puerta 5. Bloqueante** |
| 3 — Pantalla de grupos | T037–T045 (9) | US1, US5 | Incluye el renombrado de la sección existente |
| 4 — Alumnos agrupados | T046–T058 (13) | US2, US3, US4 | El objetivo visible |
| 5 — Cierre | T059–T065 (7) | todas | |
| **Total** | **65** | **5** | |

**Doce de las 65 tareas son pruebas de backend.** No es desproporcionado: es la primera feature que toca datos de
organización, y la constitución declara ese aislamiento no negociable.

**Alcance mínimo demostrable**: fases 1 a 3. Con ellas el centro ya puede crear sus grupos con tutor y delegado, aunque
el listado de alumnos siga plano.
