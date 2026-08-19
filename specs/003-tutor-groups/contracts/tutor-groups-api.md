# Contrato de API: Grupos tutoriales

**Feature**: `003-tutor-groups` | **Fecha**: 2026-08-17

Superficie que esta feature **añade o modifica**. Todo lo demás de `/api/v1` queda intacto.

Base `/api/v1`. Cabecera `Accept: application/json` obligatoria y `Authorization: Bearer` en todo salvo el acceso.

---

## 1. Recurso nuevo: `/tutor-groups`

Hereda de `BaseApiController`: `index` acepta `search` y `per_page` (por defecto 10, **máximo 50**), ordena por
`latest()` y devuelve el paginador de Laravel.

| Método | Ruta | Roles |
|---|---|---|
| GET | `/tutor-groups` | `org_admin` (escritura), `teacher` (lectura) |
| GET | `/tutor-groups/{id}` | ídem |
| POST | `/tutor-groups` | `org_admin` |
| PUT | `/tutor-groups/{id}` | `org_admin` |
| DELETE | `/tutor-groups/{id}` | `org_admin` |

Bajo el middleware `tenant`: sin organización activa, válida y no suspendida, responde **403**.

**Búsqueda**: por `name`. Es el primer campo que el administrador recuerda de un grupo.

**Relaciones incluidas** (`$with`): `tutor`, `representative`. Cargadas de antemano — la cabecera de cada bloque las
necesita y sin esto habría una consulta por grupo (FR-015).

### Campos

Obligatorios en **negrita**.

| Campo | Tipo | Valores | Nota |
|---|---|---|---|
| **`name`** | cadena, máx. 100 | | «1º ESO», «4º ESO - A» |
| **`shift`** | cadena | `morning` \| `afternoon` | Conjunto cerrado validado en servidor |
| **`academic_year`** | cadena, máx. 20 | | «2025-2026» |
| `tutor_teacher_id` | entero, nullable | | Debe ser profesor del propio centro |
| `representative_student_id` | entero, nullable | | Debe ser alumno del propio centro **y de este grupo** |
| `sort_order` | entero | por defecto 0 | Orden académico |
| **`status`** | cadena | `active` \| `inactive` | |

**`organization_id` no se envía nunca.** Lo asigna el servidor desde el contexto; aceptarlo del cliente reabriría una
vía de fuga entre organizaciones.

### Respuesta del listado

```json
{
  "data": [
    {
      "id": 3,
      "name": "1º ESO",
      "shift": "morning",
      "academic_year": "2025-2026",
      "sort_order": 10,
      "status": "active",
      "tutor_teacher_id": 1,
      "representative_student_id": 8,
      "tutor": { "id": 1, "full_name": "María García López" },
      "representative": { "id": 8, "full_name": "Javier Díaz Herrera" }
    }
  ],
  "current_page": 1, "last_page": 1, "total": 4, "from": 1, "to": 4
}
```

`tutor` y `representative` llegan **nulos** cuando no están asignados. La interfaz debe tratarlo, no asumir el objeto.

### Errores propios

| Situación | Estado | Qué devuelve |
|---|---|---|
| Nombre repetido con el mismo turno y curso en el centro | 422 | Error sobre `name` |
| Tutor de otra organización | 422 | Error sobre `tutor_teacher_id`, **indistinguible de «no existe»** |
| Delegado de otra organización | 422 | Error sobre `representative_student_id`, **indistinguible de «no existe»** |
| Delegado que es alumno del centro pero **de otro grupo** | 422 | Error explicativo sobre `representative_student_id`: aquí no hay nada que ocultar |
| Delegado al crear un grupo, que aún no tiene alumnos | 422 | Error explicativo, no críptico |
| Grupo de otra organización por id | **404** | Nunca 403: revelaría su existencia |

## 2. Modificado: `/students`

**Sin cambios de ruta ni de permisos.** Lo que cambia:

### `$with` ampliado

De `['guardian']` a `['guardian', 'tutorGroup.tutor']`.

Es lo que evita el N+1 al pintar el tutor en la cabecera de cada bloque (FR-016, SC-002). Con 300 alumnos y sin esto
serían unas 600 consultas por pantalla.

Cada alumno pasa a incluir:

```json
{
  "id": 12,
  "full_name": "Javier Díaz Herrera",
  "tutor_group_id": 3,
  "tutor_group": {
    "id": 3,
    "name": "1º ESO",
    "shift": "morning",
    "sort_order": 10,
    "tutor": { "id": 1, "full_name": "María García López" }
  }
}
```

`tutor_group` llega **nulo** para los alumnos sin adscribir, que tras la migración son todos. La interfaz debe
agruparlos aparte (FR-029), no ocultarlos.

### Campo nuevo en alta y edición

| Campo | Tipo | Nota |
|---|---|---|
| `tutor_group_id` | entero, nullable | Debe ser grupo del propio centro. Rechazo indistinguible de «no existe» (FR-018) |

El resto de campos del alumno **no cambia**.

### Filtro nuevo en el listado

| Parámetro | Efecto |
|---|---|
| `tutor_group_id` | Acota el listado a los alumnos de ese grupo |

Es lo que permitirá paginar por bloque cuando el volumen lo pida (FR-021), y el cimiento de la adscripción masiva.

**Se implementa solo en `StudentController`**, no de forma genérica en `BaseApiController`: un mecanismo de filtros sin
más consumidor que este sería una capa sin justificar (Principio IV). Cuando aparezca el segundo caso, se generaliza.

**Cuidado**: el filtro debe validarse. Un `tutor_group_id` de otra organización no debe devolver el listado completo por
haber ignorado el parámetro; debe devolver vacío o error, nunca datos ajenos.

## 3. Matriz de permisos

Se añade una fila a la del contrato de la feature 002.

| Sección | `org_admin` | `teacher` | `super_admin` |
|---|---|---|---|
| Grupos tutoriales | CRUD | **Solo lectura** | **No** |

Es la primera entidad en que el profesor tiene **lectura pero no escritura**. `SubjectPolicy` y compañía extienden
`OrganizationAdminOnlyPolicy` en vacío; `TutorGroupPolicy` **no puede** hacerlo: tiene que abrir `viewAny` y `view` al
profesor y dejar cerradas las tres de escritura.

El grupo tutorial **no contiene ningún campo monetario**, así que no entra en el invariante FR-037 de la 002 —las tres
entidades vedadas al profesor por llevar importes—. Abrirle la lectura no lo rompe.

## 4. Rutas, tal como quedan en `routes/api.php`

```php
// Lectura para ambos, escritura solo para la administración.
Route::middleware(['tenant', 'role.any:org_admin,teacher'])->group(function (): void {
    Route::apiResource('tutor-groups', TutorGroupController::class)->only(['index', 'show']);
    // … rutas existentes
});

Route::middleware(['tenant', 'role.any:org_admin'])->group(function (): void {
    Route::apiResource('tutor-groups', TutorGroupController::class)->except(['index', 'show']);
    // … rutas existentes
});
```

Es el mismo reparto en dos grupos que ya usan `students` y `class-groups`. No se inventa un mecanismo nuevo.

## 5. Lo que NO cambia

Ningún otro endpoint. En particular:

- `/class-groups` sigue siendo el grupo **de asignatura**, con su `subject_id` obligatorio y su profesor. No se toca ni
  se reinterpreta.
- `/enrollments`, `/class-sessions`, `/attendances`, `/payments`, `/guardians`, `/teachers`, `/subjects`: intactos.
- `/dashboard`: intacto. Añadir un recuento de grupos sería alcance nuevo y no está en la spec.
