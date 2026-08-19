# Contrato de uso de la API

**Feature**: `002-admin-frontend` | **Fecha**: 2026-08-16

Mapa pantalla → endpoint. **Es la lista cerrada** de lo que el frontend puede llamar (FR-061). Extraído de
`backend/routes/api.php` y de los controladores; ningún endpoint aquí es supuesto.

Base: `/api/v1`. Toda petición envía `Accept: application/json` (FR-062) y, salvo el acceso, `Authorization: Bearer`.

---

## 1. Sesión

| Pantalla | Método y ruta | Envía | Recibe |
|---|---|---|---|
| Acceso | `POST /login` | `login` (usuario **o** correo), `password` | `token`, `user` con `roles` |
| Arranque de la aplicación | `GET /me` | — | usuario, `roles` y `organization` (nula para `super_admin`) |
| Cierre de sesión | `POST /logout` | — | confirmación |

`POST /login` está limitado a 10 intentos por minuto; el resto de rutas, a 120. Un 429 debe mostrarse como aviso
comprensible, no como error genérico.

**La organización activa llega en `/me`, no en el login.** El shell no puede pintar el nombre del centro hasta que
`/me` responde.

## 2. Dashboard

| Pantalla | Método y ruta | Roles |
|---|---|---|
| Dashboard | `GET /dashboard` | `org_admin`, `teacher` |

Una sola petición (FR-014). El campo `role` de la respuesta —`admin` o `teacher`— decide la variante (FR-016); no se
deduce de los roles del usuario.

**`super_admin` no debe llamarlo nunca**: está bajo el middleware `tenant` y recibiría 403 (D6).

Respuesta para `admin`: `stats` con `students`, `teachers`, `groups`, `attendances`, `payments`; y
`recentStudents`, `recentSessions`, `recentPayments`, con 5 registros cada uno.

Respuesta para `teacher`: `teacher` (o `null` si la cuenta no tiene ficha vinculada), `stats` con `groups`, `students`,
`upcoming_sessions`; y `myGroups`, `upcomingSessions`, `recentAttendances`.

## 3. Entidades de negocio

Todas bajo el middleware `tenant`: sin organización activa, válida y no suspendida, responden **403**.

Los listados aceptan `search` y `per_page` (por defecto 10, **máximo 50**), ordenan por `latest()` y devuelven el
paginador de Laravel: `data`, `current_page`, `last_page`, `total`, `from`, `to`.

| Recurso | Ruta | Métodos y rol | ¿Búsqueda? | Relaciones incluidas |
|---|---|---|---|---|
| Alumnos | `/students` | lectura: `org_admin`+`teacher` · escritura: `org_admin` | **Sí**: nombre, apellidos, correo, teléfono, centro escolar | `guardian` |
| Tutores | `/guardians` | CRUD: `org_admin` | **Sí**: nombre, apellidos, correo, teléfono | — |
| Profesores | `/teachers` | CRUD: `org_admin` | **Sí**: nombre, apellidos, correo, especialidad | — |
| Asignaturas | `/subjects` | CRUD: `org_admin` | **Sí**: nombre, código, nivel | — |
| Grupos | `/class-groups` | lectura: `org_admin`+`teacher` · escritura: `org_admin` | **Sí**: nombre, código, curso académico, estado | `subject`, `teacher` |
| Matrículas | `/enrollments` | CRUD: `org_admin` | **No** | `student`, `classGroup.subject`, `classGroup.teacher` |
| Sesiones | `/class-sessions` | CRUD: `org_admin`+`teacher` | **No** | `classGroup.subject`, `classGroup.teacher` |
| Asistencia | `/attendances` | CRUD: `org_admin`+`teacher` | **No** | `classSession.classGroup`, `student` |
| Pagos | `/payments` | CRUD: `org_admin` | **No** | `student`, `guardian`, `enrollment.classGroup` |

**Las cuatro que no tienen búsqueda no deben mostrar la caja** (FR-024). Es la corrección del defecto actual, donde
aparece y no hace nada.

Las relaciones vienen ya cargadas: el listado de alumnos **no debe** pedir los tutores aparte para mostrar su nombre.

### Campos por recurso

Obligatorios en **negrita**. `nullable` en el resto.

- **Alumno**: `guardian_id`, **`first_name`**, **`last_name`**, `email` (único por centro), `phone`, `date_of_birth`,
  `school_name`, `school_level`, **`status`** (`active`|`inactive`), `address`, `notes`
- **Tutor**: **`first_name`**, **`last_name`**, `email` (único por centro), **`phone`**, **`relationship_label`**,
  `address`, `notes`
- **Profesor**: **`first_name`**, **`last_name`**, `email` (único por centro), `phone`, `specialty`, `bio`
- **Asignatura**: **`name`**, **`code`** (único por centro), `level`, **`monthly_fee`**, `description`
- **Grupo**: **`subject_id`**, `teacher_id`, **`name`**, **`code`** (único por centro), **`academic_year`**, `schedule`,
  **`capacity`** (≥1), `start_date`, `end_date`, **`status`**
- **Matrícula**: **`student_id`**, **`class_group_id`**, **`enrolled_at`**, **`monthly_fee`**, **`status`**, `notes`
- **Sesión**: **`class_group_id`**, **`title`**, **`session_date`**, `starts_at` y `ends_at` (formato `H:i`), `room`,
  `notes`
- **Asistencia**: **`class_session_id`**, **`student_id`**, **`status`** (`present`|`absent`|`late`), `comment`
- **Pago**: **`student_id`**, `guardian_id`, `enrollment_id` (debe pertenecer al alumno elegido), **`amount`**,
  **`period_label`**, **`paid_at`**, **`payment_method`** (`cash`|`card`|`transfer`), **`status`**
  (`paid`|`pending`|`cancelled`), `reference`, `notes`

`starts_at` y `ends_at` se envían como `H:i`, pero la API los devuelve como `HH:MM:SS`. El formulario debe normalizar en
ambos sentidos.

**`organization_id` no se envía nunca** (FR-063). Lo asigna el servidor desde el contexto, y no está en el `$fillable`
de ningún modelo.

## 4. Cuentas de usuario

| Ruta | Métodos | Roles |
|---|---|---|
| `/users` | CRUD completo | `super_admin`, `org_admin` |

**Fuera del middleware `tenant`.** El alcance lo decide el rol: el `org_admin` solo ve las de su centro; el
`super_admin`, las de cualquiera.

Búsqueda por `name`, `username`, `email`. Acepta además `organization_id` como filtro, **solo para `super_admin`** —el
único parámetro de filtrado de toda la API, y el único que el frontend usa como tal.

Campos: **`name`**, **`username`** (único global), **`email`** (único global), **`password`** (mínimo 8; opcional al
editar), **`role`**, `is_active`, `organization_id`, `teacher_id`.

Reglas que la interfaz debe respetar:

- Roles asignables por un `org_admin`: `org_admin`, `teacher`. Por un `super_admin`: además `super_admin`.
- `organization_id` lo exige la API **solo** al `super_admin` y **solo** cuando el rol no es `super_admin`. Un
  `org_admin` no debe enviarlo: se toma el suyo.
- Un usuario con rol `super_admin` **no puede** llevar organización; enviarla es un error de validación.
- `teacher_id` vincula la cuenta con una ficha de profesor. Al vincular, el vínculo anterior de esa cuenta se deshace.

## 5. Organizaciones

| Ruta | Métodos | Rol |
|---|---|---|
| `/organizations` | CRUD completo | `super_admin` |
| `POST /organizations/{id}/suspend` | POST | `super_admin` |
| `POST /organizations/{id}/activate` | POST | `super_admin` |

Búsqueda por `name` y `slug`. Campos: **`name`**, `slug` (se deriva del nombre si no se envía), `contact_email`,
`contact_phone`.

El listado devuelve `users_count` y **nada más de contenido**: por diseño, el administrador de plataforma no puede
conocer cuántos alumnos o pagos tiene un centro. **El frontend no debe intentar completar ese dato por otra vía.**

`DELETE` falla con un mensaje explicativo si la organización tiene cuentas activas; ese mensaje se muestra tal cual.

Estado y borrado lógico son **independientes**: una organización puede estar suspendida sin estar eliminada. La
interfaz no debe presentarlos como un mismo eje.

## 6. Errores

| Estado | Cuándo | Qué hace el frontend |
|---|---|---|
| 401 | Token caducado o ausente | Cierra sesión y va a `/login` conservando el destino |
| 403 | Rol insuficiente, u organización suspendida o eliminada | Pantalla explicativa con el mensaje del servidor |
| 404 | No existe **o es de otra organización** | Estado propio con vuelta al listado. **Nunca** decir «sin permiso» |
| 422 | Validación | `errors` repartido campo a campo |
| 429 | Límite de peticiones | Aviso comprensible, con espera |
| 5xx | Fallo del servidor | Estado de error con reintento |

Formato de 422 que hay que interpretar:

```json
{ "message": "…", "errors": { "email": ["El correo ya está en uso."] } }
```

## 7. Matriz de permisos del cliente

Reproducción de `routes/api.php` para poder contrastarla. Si divergen, **manda el servidor** (D7).

| Sección | `org_admin` | `teacher` | `super_admin` |
|---|---|---|---|
| Dashboard | Sí | Sí | **No** (403) |
| Alumnos | CRUD | Solo lectura, y solo los de sus grupos | No |
| Tutores | CRUD | No | No |
| Profesores | CRUD | No | No |
| Asignaturas | CRUD | **No** — contiene tarifa | No |
| Grupos | CRUD | Solo lectura, y solo los suyos | No |
| Matrículas | CRUD | **No** — contiene cuota | No |
| Sesiones | CRUD | CRUD, solo de sus grupos | No |
| Asistencia | CRUD | CRUD, solo de sus sesiones | No |
| Pagos | CRUD | **No** — contiene importes | No |
| Cuentas | CRUD, su centro | No | CRUD, cualquier centro |
| Organizaciones | No | No | CRUD + suspender/activar |

Las tres celdas marcadas para el profesor son **exactamente** las tres entidades con campos monetarios. No es
casualidad: es el invariante FR-016 de la feature anterior. Cualquier cambio en la navegación que se las acerque rompe
una garantía del producto.

Un profesor **sin ficha vinculada** recibe conjuntos vacíos en todo. Hay que distinguirlo de «no hay datos» (FR-041).
