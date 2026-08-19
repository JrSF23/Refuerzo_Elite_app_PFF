# Quickstart: verificación de grupos tutoriales

**Feature**: `003-tutor-groups` | **Fecha**: 2026-08-17

Guion de verificación. Cada fase cierra con los escenarios que le corresponden.

**Esta feature toca backend**, así que a la verificación manual se le suman dos cosas que en la 002 no hacían falta:
validar la migración **contra MySQL real** y las **pruebas de aislamiento**, que son obligatorias y bloqueantes.

---

## 0. Preparación

```bash
docker compose --env-file .env.docker up -d
docker compose --env-file .env.docker exec laravel php artisan migrate:fresh --seed

cd frontend && npm run dev     # http://localhost:5173
```

### Cuentas sembradas

Verificadas contra `AdminSeeder` y `DemoSeeder`. El sufijo `.a` es **Refuerzo Elite**; Centro Piloto Malabo es el `.b`.

| Rol | Usuario | Contraseña | Centro |
|---|---|---|---|
| `super_admin` | `superadmin` | `SUPER_ADMIN_PASSWORD` del entorno | ninguno |
| `org_admin` | `admin.a` | `Admin12345!` | Refuerzo Elite (id 1) |
| `teacher` | `mgarcia.a` | `Teacher12345!` | Refuerzo Elite (id 1) |
| `org_admin` (centro B) | `admin.b` | `Admin12345!` | Centro Piloto Malabo (id 2) |

---

## Escenario 1 — Migración *(Fase 1)*

| # | Acción | Resultado esperado |
|---|---|---|
| 1.1 | `migrate:fresh --seed` sobre **SQLite** | En verde |
| 1.2 | `migrate:fresh --seed` sobre **MySQL** en el contenedor | En verde. **No basta con SQLite**: en la feature 001, dos defectos de migración solo aparecieron fuera de él |
| 1.3 | Revisar `tutor_groups` | Tiene `organization_id` NOT NULL con índice y clave foránea |
| 1.4 | Revisar la clave única | Es `(organization_id, name, shift, academic_year)` |
| 1.5 | Revisar `students.tutor_group_id` | Existe, es **nullable** y tiene índice |
| 1.6 | `php artisan test` | Las 246 pruebas existentes siguen pasando |
| 1.7 | Revisar los datos sembrados | Hay un grupo con tutor y delegado, uno sin tutor, uno sin alumnos, dos con el mismo nombre y distinto turno, y alumnos sin grupo |

## Escenario 2 — Aislamiento entre organizaciones *(Fase 2 — BLOQUEANTE)*

Puerta 5 de la constitución. **Su incumplimiento bloquea la integración sin excepción.**

> **Aviso**: usar `actingWithToken()` del concern `CreatesOrganizations`. Con `withToken()` a secas, el guard de Sanctum
> cachea el usuario resuelto dentro de la misma prueba y **toda esta batería puede pasar sin comprobar nada**. Ya pasó.

| # | Acción | Resultado esperado |
|---|---|---|
| 2.1 | `admin.a` lista grupos | Solo los de Refuerzo Elite |
| 2.2 | `admin.a` abre por id un grupo del centro B | **404**, nunca 403 |
| 2.3 | `admin.a` edita por id un grupo del centro B | 404, y el grupo del centro B **queda intacto** |
| 2.4 | `admin.a` borra por id un grupo del centro B | 404, y el grupo sigue existiendo |
| 2.5 | `admin.a` crea un alumno con `tutor_group_id` del centro B | 422, con mensaje **indistinguible de «no existe»** |
| 2.6 | `admin.a` crea un grupo con `tutor_teacher_id` del centro B | 422, indistinguible de «no existe» |
| 2.7 | `admin.a` crea un grupo con `representative_student_id` del centro B | 422, indistinguible de «no existe» |
| 2.8 | `admin.a` filtra alumnos por un `tutor_group_id` del centro B | **Nunca** devuelve alumnos ajenos, ni el listado completo por haber ignorado el parámetro |
| 2.9 | Ambos centros crean «1º ESO» mañana 2025-2026 | Ambos lo consiguen: la unicidad está acotada por organización |
| 2.10 | Quitar el filtro de organización del scope y repetir 2.1 | **Las pruebas deben fallar.** Si pasan sin el filtro, no comprueban nada |

## Escenario 3 — Reglas de negocio *(Fase 2)*

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 3.1 | Crear un grupo sin tutor | Se acepta; el tutor queda nulo | FR-005 |
| 3.2 | Crear un grupo con nombre, turno y curso ya usados | 422 sobre `name` | FR-004 |
| 3.3 | Crear «1º ESO» mañana y «1º ESO» tarde en el mismo curso | Ambos se aceptan | SC-010 |
| 3.4 | Crear «1º ESO» mañana en el curso 2026-2027 | Se acepta | US1.5 |
| 3.5 | Designar delegado a un alumno de **otro grupo del mismo centro** | 422 con mensaje **explicativo**: aquí no hay nada que ocultar | FR-003c |
| 3.6 | Designar delegado al crear un grupo, que aún no tiene alumnos | 422 explicando el motivo, no un error críptico | US1.2c |
| 3.7 | Enviar `shift` con un valor que no sea `morning` ni `afternoon` | 422 | FR-003a |
| 3.8 | Enviar `organization_id` en el cuerpo | Se **ignora**; el grupo queda en el centro de quien llama | FR-002 |

## Escenario 4 — Borrados *(Fase 2)*

Los tres casos que implementan `ON DELETE SET NULL`. Hay que probar **borrado lógico y físico**: `SoftDeletes` no
dispara la clave foránea, así que la limpieza de referencias hay que hacerla en el modelo.

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 4.1 | Borrar un grupo con 3 alumnos | Los 3 alumnos **siguen existiendo**, con `tutor_group_id` nulo | FR-010, SC-008 |
| 4.2 | Contar alumnos del centro antes y después de 4.1 | El número **no cambia** | SC-008 |
| 4.3 | Borrar la ficha del profesor que era tutor | El grupo queda sin tutor y se muestra «sin asignar» | FR-011 |
| 4.4 | Borrar al alumno que era delegado | El grupo queda sin delegado y el listado se muestra sin error | SC-009 |
| 4.5 | Repetir 4.3 y 4.4 con **borrado lógico** | Mismo resultado: el grupo no queda apuntando a un registro borrado | data-model §3 |

## Escenario 5 — Consultas y rendimiento *(Fase 2)*

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 5.1 | Listar alumnos contando consultas con `DB::listen` | **Ninguna consulta por alumno ni por grupo.** Solo el listado y sus cargas ansiosas | SC-002 |
| 5.2 | Listar grupos contando consultas | Ninguna consulta por grupo para resolver tutor o delegado | FR-015 |
| 5.3 | Repetir 5.1 con 100 alumnos sembrados | El número de consultas **no crece** con el número de alumnos | SC-002 |

El 5.3 es el que de verdad detecta un N+1: con 8 alumnos, 8 consultas de más pasan desapercibidas.

## Escenario 6 — Permisos *(Fase 2 y 3)*

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 6.1 | `mgarcia.a` lista grupos | Los ve | FR-020 |
| 6.2 | `mgarcia.a` crea, edita o borra un grupo | **403** en los tres | FR-020 |
| 6.3 | `superadmin` accede a `/tutor-groups` | **403**: está bajo el middleware `tenant` | FR-020 |
| 6.4 | `mgarcia.a` en la interfaz | Ve la sección sin botón de crear ni acciones de fila | FR-022 |
| 6.5 | `superadmin` en la interfaz | La sección **no aparece**, y por URL directa redirige a `/organizaciones` | FR-020 |

## Escenario 7 — Pantalla de grupos *(Fase 3)*

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 7.1 | Abrir la navegación | Hay **«Grupos»** (tutoriales) y **«Grupos de asignatura»**, sin ambigüedad | FR-022a |
| 7.2 | Abrir la sección antigua por su ruta nueva | Muestra los grupos de asignatura, con su funcionalidad intacta | FR-022a |
| 7.3 | Crear un grupo | Pide nombre, turno, curso académico, tutor, delegado y orden. **Nada más** | FR-023c |
| 7.4 | Abrir el desplegable de tutor | Solo profesores del propio centro | FR-023 |
| 7.5 | Abrir el desplegable de delegado en un grupo con alumnos | Solo alumnos **de ese grupo** | FR-023b |
| 7.6 | Abrir el desplegable de delegado al **crear** | Deshabilitado y con explicación, no vacío y en silencio | FR-023b |
| 7.7 | Listar grupos | Se ve el turno, el tutor y el delegado; «sin asignar» donde falte | FR-027 |

## Escenario 8 — Listado de alumnos agrupado *(Fase 4)*

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 8.1 | Abrir alumnos con alumnos en tres grupos | Tres bloques, cada uno con nombre, turno y tutor en la cabecera | FR-025, FR-026 |
| 8.2 | Revisar un bloque cuyo grupo no tiene tutor | Cabecera con «sin asignar», sin error | FR-027 |
| 8.3 | Revisar el listado con un grupo vacío sembrado | Ese grupo **no aparece** | FR-028 |
| 8.4 | Revisar los alumnos sin grupo | Aparecen en un bloque propio, marcado como pendientes. **No desaparecen** | FR-029 |
| 8.5 | Revisar las columnas de la tabla | **No** hay columna de grupo | FR-030 |
| 8.6 | Revisar el orden de los bloques | Sigue `sort_order`, **no** el alfabético | FR-031 |
| 8.7 | Revisar el orden dentro de un bloque | Por apellidos y nombre | FR-031 |
| 8.8 | Buscar un término | Acota sobre **todos** los alumnos y los bloques se recomponen | FR-032 |
| 8.9 | Buscar algo inexistente | Estado vacío de búsqueda; ningún bloque | US4.2 |
| 8.10 | Crear, editar y eliminar un alumno | Como hoy, con su confirmación | FR-033 |
| 8.11 | Plegar y desplegar un bloque | Recuerda su estado | plan.md §Exigencia |
| 8.12 | Revisar la cabecera de un bloque | Muestra el recuento de alumnos | plan.md §Exigencia |
| 8.13 | Cambiar de grupo a un alumno | Deja el bloque anterior y aparece en el nuevo | US2.4 |

## Escenario 9 — Responsive y cierre *(Fase 5)*

Anchos: **360, 375, 414, 480, 640, 768, 1024, 1280, 1440, 1920**.

| # | Acción | Resultado esperado | Requisito |
|---|---|---|---|
| 9.1 | Las dos pantallas nuevas en los diez anchos | Desbordamiento **0** en todos | SC-006 |
| 9.2 | El listado agrupado a 360 px | Cada bloque en tarjetas, sin desplazamiento horizontal | FR-034 |
| 9.3 | Barrer literales fuera de `src/i18n/` | Cero resultados | Principio XII |
| 9.4 | Revisar el lenguaje visual | Tipografía, espaciado, colores y botones **sin cambios** | FR-035 |
| 9.5 | Revisar la pestaña de red | Ninguna petición fuera de este contrato | — |

---

## Comprobación final

1. `php artisan test` — las 246 anteriores **más** las nuevas de aislamiento, borrados y consultas, todas en verde.
2. Migración validada contra MySQL real, no solo SQLite.
3. `npm run build` limpio y `npm test` en verde.
4. Escenarios 1 a 9 completos con los cuatro roles.
5. Barrido de los diez anchos sin desbordamiento.
6. **La comprobación 2.10**: quitar el filtro del scope debe hacer fallar las pruebas. Si no fallan, no prueban nada.
