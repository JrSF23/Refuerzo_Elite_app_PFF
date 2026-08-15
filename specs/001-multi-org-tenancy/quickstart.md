# Phase 1 — Quickstart: validación de Soporte Multi-Organización

**Feature**: `001-multi-org-tenancy` | **Base**: `http://localhost:8080/api/v1`

Guion de validación manual de punta a punta. Complementa a la suite automatizada: los tests demuestran que
el aislamiento se cumple, este documento demuestra que **el producto funciona** para las cinco historias.

Se ejecuta entero antes de dar la feature por terminada (tarea T109) y sirve de referencia para la
verificación de la puerta de calidad 5 de la constitución.

---

## Requisitos previos

> **Toda petición debe llevar `Accept: application/json`.** Sin esa cabecera Laravel trata la llamada como
> navegación web: los errores de validación devuelven **302** en lugar de 422, y una petición sin
> autenticar devuelve **500** en vez de 401, porque intenta redirigir a una ruta `login` que esta API no
> tiene. Se descubrió ejecutando este mismo guion (T109).

```bash
make setup          # build + up + migrate + seed
make verify-tenancy # ningún registro sin organización
```

La aplicación queda en `http://localhost:8080`. El seeder (T017) crea **dos organizaciones pobladas**, que
es lo que hace comprobable el aislamiento a mano.

### Cuentas de partida

Las que crean los seeders. El sufijo `.a` es Refuerzo Elite (Centro A) y `.b` es Centro Piloto Malabo
(Centro B).

| Cuenta | Contraseña | Rol | Organización |
|---|---|---|---|
| `superadmin` | `SUPER_ADMIN_PASSWORD` | `super_admin` | ninguna |
| `admin` | `ADMIN_PASSWORD` | `org_admin` | Centro A |
| `admin.a` | `Admin12345!` | `org_admin` | Centro A |
| `mgarcia.a` / `cmartinez.a` | `Teacher12345!` | `teacher` | Centro A (con ficha vinculada) |
| `admin.b` | `Admin12345!` | `org_admin` | Centro B |
| `lnvono.b` / `tela.b` | `Teacher12345!` | `teacher` | Centro B (con ficha vinculada) |

**Ninguna cuenta de profesor sin ficha viene sembrada**: el escenario 6.7 la crea sobre la marcha desde la
propia interfaz, que es además la forma de comprobar que el alta de cuentas funciona.

### Obtener un token

```bash
TOKEN_A=$(curl -s -X POST http://localhost:8080/api/v1/login \
  -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"username":"admin.a","password":"..."}' | jq -r .token)
```

Repetir para `TOKEN_B`, `TOKEN_PROF`, `TOKEN_SUPER` y `TOKEN_SINFICHA`.

Comprobación previa: `GET /me` con `TOKEN_A` devuelve el bloque `organization` con el Centro A;
con `TOKEN_SUPER` devuelve `organization: null`.

---

## Escenario 1 — Aislamiento total (US1, P1)

**Cubre**: FR-006 a FR-009, FR-019 a FR-021, SC-001, SC-002, SC-006

Es el escenario crítico. Se recorren las **diez entidades de negocio**.

### 1.1 Listados acotados

Con `TOKEN_A`, para cada recurso de la lista:

```
guardians · teachers · subjects · students · class-groups
class-sessions · enrollments · attendances · payments
```

```bash
curl -s -H "Authorization: Bearer $TOKEN_A" -H 'Accept: application/json' \
  http://localhost:8080/api/v1/students | jq '.data[].organization_id' | sort -u
```

**Esperado**: un único valor, el del Centro A. Ningún identificador del Centro B en ningún listado.

### 1.2 Detalle cruzado → 404, nunca 403

Tomar un `id` real del Centro B (con `TOKEN_B`) y pedirlo con `TOKEN_A`:

```bash
curl -s -o /dev/null -w '%{http_code}\n' -H "Authorization: Bearer $TOKEN_A" -H 'Accept: application/json' \
  http://localhost:8080/api/v1/students/$ID_DE_B
```

**Esperado**: `404` en las nueve entidades con endpoint. Un `403` sería un fallo: revelaría que el recurso
existe. La respuesta debe ser indistinguible de la de un `id` inexistente (`999999`).

### 1.3 Escritura y borrado cruzados

Con `TOKEN_A`, sobre recursos del Centro B: `PUT` y `DELETE`.

**Esperado**: `404` en ambos. Verificar después con `TOKEN_B` que **ningún dato del Centro B cambió**.

### 1.4 Referencias cruzadas en escritura

Con `TOKEN_A`, crear una matrícula con `student_id` propio y `class_group_id` del Centro B:

```bash
curl -s -X POST http://localhost:8080/api/v1/enrollments \
  -H "Authorization: Bearer $TOKEN_A" -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d "{\"student_id\":$ALUMNO_A,\"class_group_id\":$GRUPO_B,\"enrolled_at\":\"2026-09-01\",\"monthly_fee\":0}"
```

**Esperado**: `422` por referencia inválida, sin crear nada. Repetir la idea con `guardian_id` ajeno en un
alumno, `class_session_id` ajeno en una asistencia y `enrollment_id` ajeno en un pago.

### 1.5 El `organization_id` del cliente se ignora

Crear un alumno con `TOKEN_A` incluyendo `"organization_id": <ID_CENTRO_B>` en el cuerpo.

**Esperado**: `201` y el alumno queda en el **Centro A**. El valor del cliente jamás se usa.

### 1.6 Búsqueda

`GET /students?search=<nombre exacto de un alumno del Centro B>` con `TOKEN_A`.

**Esperado**: cero resultados.

### 1.7 Borrado lógico

Borrar un alumno del Centro A, y comprobar con `TOKEN_B` que no aparece por ninguna vía.

**Esperado**: invisible desde el Centro B, conservando su organización.

### 1.8 Auditoría

`audit_events` no tiene endpoint. Se verifica en base de datos:

```bash
make shell-db
SELECT organization_id, COUNT(*) FROM audit_events GROUP BY organization_id;
```

**Esperado**: ninguna fila sin organización; cada evento atribuido a la organización donde ocurrió.

### 1.9 El super administrador no alcanza los datos de negocio

Con `TOKEN_SUPER`, pedir `students`, `class-groups` y `payments`.

**Esperado**: `403` en todos. No listas vacías: denegación explícita (FR-013a).

---

## Escenario 2 — Migración del centro actual (US2, P2)

**Cubre**: FR-022, FR-023, SC-004, SC-005

Se ejecuta sobre una copia de la base de datos real, **nunca sobre producción sin copia de seguridad
verificada y restaurable** (Principio VIII). El procedimiento completo está en `docs/migration-multi-org.md`.

1. Anotar los recuentos por entidad **antes** de migrar.
2. Ejecutar `make migrate`.
3. `make verify-tenancy` → sin filas huérfanas, código de salida `0`.
4. Comparar los recuentos: deben coincidir **exactamente**.
5. Iniciar sesión con una credencial preexistente y comprobar que ve el mismo conjunto de datos y que su
   rol figura ahora como `org_admin`.

---

## Escenario 3 — Alta de un centro piloto (US3, P3)

**Cubre**: FR-013, SC-003 — **objetivo: menos de 10 minutos, sin tocar la base de datos**

Con `TOKEN_SUPER`:

1. `POST /organizations` con `{"name":"Centro Piloto C"}` → `201`, `slug` derivado, `status: active`.
2. `POST /users` con `role: org_admin` y el `organization_id` de la organización nueva → `201`.
3. Iniciar sesión con esa cuenta nueva.
4. `GET /students` → lista **vacía**, sin rastro de los Centros A ni B.

**Cronometrar el escenario completo.** Si supera 10 minutos, SC-003 no se cumple.

Comprobar además que `GET /organizations` **no** expone recuentos de alumnos, pagos ni ninguna otra
entidad de negocio: solo `users_count` (FR-013a).

---

## Escenario 4 — Suspensión y borrado lógico

**Cubre**: FR-011, FR-021 — `deleted_at` y `status` son **condiciones independientes**

| Paso | Acción | Esperado |
|---|---|---|
| 4.1 | `POST /organizations/{C}/suspend` con `TOKEN_SUPER` | `200` |
| 4.2 | Reutilizar el token del `org_admin` de C, ya emitido | `403` en la **siguiente** petición, sin haber revocado el token |
| 4.3 | Repetir `suspend` | `200`, idempotente, sin efecto |
| 4.4 | `POST /organizations/{C}/activate` | `200`, y el acceso se restaura |
| 4.5 | `DELETE /organizations/{C}` con usuarios activos | `409` — primero hay que suspender |
| 4.6 | Suspender, luego `DELETE` | `200`, borrado lógico |
| 4.7 | Poner `status = active` en base de datos dejando `deleted_at` no nulo | El acceso **sigue denegado**: las dos condiciones son independientes |
| 4.8 | Restaurar la organización | El acceso vuelve y **los datos siguen completos**: los recuentos de las diez entidades no han cambiado en ningún momento |

El paso 4.7 es el que demuestra que ninguna condición suple a la otra. Es el caso que el diseño resuelve
prohibiendo `withTrashed()` en la resolución del tenant.

---

## Escenario 5 — El administrador de organización (US4, P4)

**Cubre**: FR-014, FR-018

Con `TOKEN_A`:

1. Ciclo CRUD completo sobre las nueve entidades con endpoint → todo dentro del Centro A.
2. `GET /organizations` → `403`.
3. `POST /users` **enviando `organization_id` del Centro B** → `201`, y la cuenta queda creada en el
   **Centro A**. No es un error de permisos: el valor del cliente sencillamente se ignora (FR-018).
4. La interfaz no muestra ninguna opción de plataforma.

---

## Escenario 6 — El profesor (US5, P5)

**Cubre**: FR-015, FR-015c, FR-016, SC-007

Con `TOKEN_PROF`:

| Paso | Acción | Esperado |
|---|---|---|
| 6.1 | `GET /class-groups` | Solo los grupos de su ficha |
| 6.2 | `GET /students` | Solo los matriculados en esos grupos. **El total debe coincidir con la suma de matriculados** (SC-007) |
| 6.3 | `POST /attendances` en una sesión de un grupo suyo | `201` |
| 6.4 | `POST /attendances` en una sesión de un grupo ajeno | Rechazado |
| 6.5 | Cualquier operación sobre `/payments` | `403` (FR-016) |
| 6.6 | Reasignar `teachers.user_id` a otra cuenta y reintentar 6.1 | El usuario anterior pierde el acceso **de inmediato** |

Crear primero la cuenta sin ficha, con `TOKEN_A` (el `org_admin` del Centro A):

```bash
curl -s -X POST http://localhost:8080/api/v1/users \
  -H "Authorization: Bearer $TOKEN_A" -H 'Accept: application/json' -H 'Content-Type: application/json' \
  -d '{"name":"Profesor Sin Ficha","username":"prof.sinficha","email":"sinficha@centroa.test",
       "password":"Teacher12345!","role":"teacher"}'
```

Y obtener su token con `prof.sinficha` / `Teacher12345!`. Con `TOKEN_SINFICHA`:

| Paso | Acción | Esperado |
|---|---|---|
| 6.7 | `GET /class-groups`, `GET /students`, `GET /class-sessions` | **Cero** resultados en los tres |
| 6.8 | `GET /dashboard` | Dashboard vacío, no un error |

El paso 6.7 es el que verifica que el fallo **cierra** el acceso en vez de abrirlo (FR-015c).

---

## Escenario 7 — Compatibilidad y unicidad

**Cubre**: FR-019, FR-020, FR-026, SC-006, SC-009

1. Crear en el Centro B una asignatura con el mismo `code` que una del Centro A → `201`, sin conflicto.
2. Repetir con un `code` de grupo y con el email de un alumno, un profesor y un tutor → `201` en todos.
3. Repetir un `code` ya usado **dentro del mismo centro** → `422`, con un mensaje que **no** menciona ni
   deja deducir el registro del otro centro (FR-020).
4. Las rutas siguen bajo `/api/v1`, con la misma forma de respuesta. El único cambio observable es el
   campo `organization_id` en las entidades y el bloque `organization` en `/me`.

---

## Trazabilidad

| Escenario | Historia | Requisitos | Criterios |
|---|---|---|---|
| 1 | US1 (P1) | FR-006–FR-009, FR-013a, FR-019–FR-021 | SC-001, SC-002 |
| 2 | US2 (P2) | FR-022, FR-023 | SC-004, SC-005 |
| 3 | US3 (P3) | FR-013 | SC-003 |
| 4 | US3 (P3) | FR-011, FR-021 | — |
| 5 | US4 (P4) | FR-014, FR-018 | — |
| 6 | US5 (P5) | FR-015, FR-015c, FR-016 | SC-007 |
| 7 | — | FR-019, FR-020, FR-026 | SC-006, SC-009 |

---

## Criterio de aceptación global

La feature **no** se da por terminada hasta que:

- [ ] Los siete escenarios pasan completos
- [ ] `make test` está en verde, incluida la batería de aislamiento (SC-008)
- [ ] `make verify-tenancy` devuelve código de salida `0`
- [ ] Ninguna respuesta a un acceso cruzado devuelve `403`: todas devuelven `404` (FR-008)
- [ ] Las pantallas nuevas se han verificado a 360 px de ancho (Principio VI)
