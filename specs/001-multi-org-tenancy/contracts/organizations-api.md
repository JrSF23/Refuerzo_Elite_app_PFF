# Contrato — API de plataforma (organizaciones y usuarios)

**Feature**: `001-multi-org-tenancy` | **Base**: `/api/v1` (sin cambio de versión, FR-026)

Endpoints nuevos. Todos requieren `auth:sanctum`. Los de este documento **no** pasan por
`EnsureTenantContext`: son rutas de plataforma, no de organización (D8).

---

## Autorización

| Grupo | Middleware | Rol |
|---|---|---|
| `/api/v1/organizations` | `auth:sanctum`, `role.any:super_admin` | Solo `super_admin` |
| `/api/v1/users` | `auth:sanctum`, `role.any:super_admin,org_admin` | Alcance según rol (ver abajo) |

Cualquier otro rol recibe **403** con el formato de error ya existente
(`{"message": "..."}`), coherente con `EnsureAnyRole`.

---

## `GET /api/v1/organizations`

Lista paginada de organizaciones. Paginación idéntica al resto de la API (`per_page`, máx. 50) y
búsqueda por `search` sobre `name` y `slug`.

**200**

```json
{
  "data": [
    {
      "id": 1,
      "name": "Refuerzo Elite",
      "slug": "refuerzo-elite",
      "status": "active",
      "contact_email": "contacto@ejemplo.gq",
      "contact_phone": "+240 000 000",
      "users_count": 4,
      "created_at": "2026-08-14T10:00:00.000000Z"
    }
  ],
  "current_page": 1,
  "per_page": 10,
  "total": 1
}
```

`users_count` es un recuento agregado. **No** se exponen recuentos de alumnos, pagos ni ninguna otra
entidad de negocio: FR-013a impide al super administrador conocer el contenido de una organización.

---

## `POST /api/v1/organizations`

| Campo | Reglas |
|---|---|
| `name` | requerido, string, máx. 255 |
| `slug` | opcional, string, máx. 120, único en `organizations`, minúsculas y guiones. Si se omite, se deriva de `name` |
| `contact_email` | opcional, email, máx. 255 |
| `contact_phone` | opcional, string, máx. 30 |

`status` no es aceptado en la creación: toda organización nace `active`.

**201** → el objeto creado. **422** → errores de validación.

---

## `GET /api/v1/organizations/{id}` · `PUT /api/v1/organizations/{id}`

Detalle y actualización. En `PUT` son modificables `name`, `slug`, `contact_email`, `contact_phone`.
`status` **no** se cambia aquí; tiene endpoints propios para que la suspensión sea un acto deliberado y
auditable.

---

## `POST /api/v1/organizations/{id}/suspend` · `POST /api/v1/organizations/{id}/activate`

Cambian `status` a `suspended` / `active`. Idempotentes: suspender una organización ya suspendida
devuelve 200 sin efecto. Ambas registran evento de auditoría.

**200**

```json
{ "id": 1, "slug": "refuerzo-elite", "status": "suspended" }
```

Efecto (FR-011): los usuarios de esa organización pierden el acceso en su **siguiente** petición. No se
revocan tokens; la comprobación es por petición (D11).

---

## `DELETE /api/v1/organizations/{id}`

Borrado lógico. Los datos permanecen y son recuperables (FR-021, caso límite "organización eliminada").
Se rechaza con **409** si la organización tiene usuarios activos: primero se suspende.

Efecto sobre el acceso: los usuarios de una organización borrada lógicamente pierden el acceso en su
siguiente petición, igual que en una suspensión y **con independencia de su `status`**. `deleted_at` y
`status` son condiciones independientes en `EnsureTenantContext`: hace falta organización existente,
`deleted_at IS NULL` y `status = active` para operar. Los datos de negocio permanecen íntegros y
recuperables; el borrado lógico de la organización no se propaga a sus entidades.

---

## `GET` · `POST` · `PUT` · `DELETE /api/v1/users`

Gestión de cuentas, con alcance dependiente del rol:

| Rol | Alcance |
|---|---|
| `super_admin` | Cuentas de cualquier organización, y creación del `org_admin` inicial de una organización. Puede indicar `organization_id` en el alta. |
| `org_admin` | **Solo** cuentas de su propia organización. `organization_id` se asigna automáticamente desde su contexto y **se ignora si viene en la petición** (FR-018). |

Campos de alta: `name`, `username`, `email` (único global), `password`, `role`
(`org_admin` \| `teacher`; `super_admin` solo lo puede asignar otro `super_admin`), `is_active`.
Opcionalmente `teacher_id` para vincular la cuenta a una ficha de profesor existente de la misma
organización (FR-015a).

**Regla no negociable**: un `org_admin` que envíe `organization_id` de otra organización obtiene una
cuenta creada en la **suya**, no un error de permisos. El valor del cliente jamás se usa (FR-006).

---

## Cambios en endpoints existentes

Ninguno cambia de ruta, método ni forma de respuesta (FR-026). El único cambio observable:

- Las respuestas de las entidades de negocio incluyen ahora `organization_id`.
- `GET /api/v1/me` incluye un bloque `organization` (`id`, `name`, `slug`, `status`) o `null` para el
  super administrador.
