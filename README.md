# Refuerzo Elite V2

Sistema de gestión para un centro de apoyo escolar. Cubre el ciclo completo: alumnos, tutores, profesores, grupos, sesiones, asistencias y pagos. Hay dos perfiles de acceso: administración y profesor, con vistas distintas según el rol.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 12 (PHP 8.2), Sanctum, Spatie Permission |
| Frontend | React 19, Vite, React Router v7, Axios |
| Base de datos | MySQL 8.0 |
| Servidor web | Nginx 1.27 (producción) |
| Contenedores | Docker + Docker Compose |

## Arranque con Docker (recomendado)

El proyecto viene listo para correr con un solo comando. No hace falta tener PHP, Node ni MySQL instalados localmente.

**Requisitos:** Docker Desktop y Make.

```bash
# 1. Copia y rellena las credenciales
cp .env.docker.example .env.docker

# 2. Build + migraciones + seed en un paso
make setup
```

La app queda en `http://localhost`. El frontend (React compilado) y la API (`/api/v1`) los sirve el mismo Nginx.

### Comandos útiles

```bash
make up            # arrancar contenedores
make down          # parar
make logs          # ver logs en vivo
make shell         # bash dentro del contenedor Laravel
make migrate       # correr migraciones
make seed          # poblar la base de datos
make test          # pasar la suite de tests
make build         # reconstruir imágenes desde cero
```

## Arquitectura Docker

Tres servicios en una red interna `app`:

- **nginx** — sirve el build de React en `/` y hace proxy de `/api` a PHP-FPM
- **laravel** — PHP 8.2 FPM con el backend Laravel
- **mysql** — MySQL 8.0 con volumen persistente

En desarrollo, `docker-compose.override.yml` se carga automáticamente: monta el código fuente como volumen (cambios PHP sin rebuild) y expone el puerto 3306 para conectar con un cliente de base de datos.

## Credenciales iniciales

Creadas por el seeder. **Cámbilas antes de subir a producción.**

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `Admin12345!` | Administrador |
| `mgarcia` | `Teacher12345!` | Profesor |
| `cmartinez` | `Teacher12345!` | Profesor |

## API

Base: `/api/v1`

Autenticación por token Bearer (Sanctum). Todos los endpoints protegidos requieren `Authorization: Bearer <token>`.

| Módulo | Endpoint | Notas |
|---|---|---|
| Auth | `POST /login`, `GET /me`, `POST /logout` | Login por username o email |
| Dashboard | `GET /dashboard` | Respuesta distinta según rol |
| Alumnos | `GET/POST /students`, `GET/PUT/DELETE /students/{id}` | Soft delete |
| Tutores | `GET/POST /guardians`, `GET/PUT/DELETE /guardians/{id}` | |
| Profesores | `GET/POST /teachers`, `GET/PUT/DELETE /teachers/{id}` | |
| Materias | `GET/POST /subjects`, `GET/PUT/DELETE /subjects/{id}` | |
| Grupos | `GET/POST /class-groups`, `GET/PUT/DELETE /class-groups/{id}` | |
| Sesiones | `GET/POST /class-sessions`, `GET/PUT/DELETE /class-sessions/{id}` | |
| Inscripciones | `GET/POST /enrollments`, `GET/PUT/DELETE /enrollments/{id}` | |
| Asistencias | `GET/POST /attendances`, `GET/PUT/DELETE /attendances/{id}` | |
| Pagos | `GET/POST /payments`, `GET/PUT/DELETE /payments/{id}` | |

### Validaciones destacadas

- Campos de tipo enumerado validados con `Rule::in()` en todos los controladores (`status`, `payment_method`, `attendance_status`)
- Al crear un pago, si se indica `enrollment_id`, se verifica que la inscripción pertenezca al mismo alumno
- Rate limit: 120 peticiones/minuto por usuario autenticado

## Dashboard por rol

El endpoint `/api/v1/dashboard` devuelve datos distintos según el rol del usuario autenticado.

**Admin:** métricas globales (alumnos activos, grupos, ingresos del mes, próximas sesiones) y acceso a todos los módulos.

**Profesor:** sus grupos asignados, próximas sesiones propias, asistencias recientes de sus alumnos y estadísticas de su aula. El perfil se enlaza por email entre el usuario y el registro de profesor.

## Frontend

SPA en React 19. La autenticación usa `SessionContext` con tokens guardados en `localStorage`. El enrutado es con React Router v7.

- `DashboardPage` — muestra la vista de admin o la de profesor según `data.role`
- `ModulePage` — componente genérico que genera formularios y tablas CRUD a partir de una definición de módulo
- `AppShell` — barra lateral y topbar que cambia su texto y branding según el rol
- Badges de estado coloreados (ok / warn / danger / muted) en tablas y listas

## Tests

```bash
make test
# o dentro del contenedor:
php artisan test
```

34 tests en total:

- `AuthTest` (10 tests) — login por email y username, roles, tokens, `/me`, logout
- `StudentTest` (14 tests) — CRUD completo, permisos por rol, validaciones, soft delete
- `PaymentTest` (10 tests) — creación, validación de enrollment cruzado, métodos de pago, soft delete

Todos usan `RefreshDatabase` para trabajar sobre una base de datos limpia.

## Migraciones y seeders

```bash
make migrate        # migraciones incrementales
make migrate-fresh  # borrar y reconstruir desde cero
make seed           # datos de demostración
```

El seeder crea 2 profesores con cuentas de acceso, 3 materias, 4 grupos, 5 tutores, 8 alumnos, 11 inscripciones, 10 sesiones, ~30 asistencias y 21 pagos.

Hay una migración de índices de rendimiento sobre las columnas más consultadas: `status`, `paid_at`, `session_date`, `academic_year` y claves foráneas de auditoría.

## Estructura del proyecto

```
refuerzo-elite-v2/
├── backend/                  # Laravel 12
│   ├── app/Http/Controllers/Api/
│   ├── database/migrations/
│   ├── database/seeders/
│   └── tests/Feature/
├── frontend/                 # React 19 + Vite
│   └── src/
│       ├── context/
│       ├── pages/
│       └── components/
├── docker/
│   ├── nginx/default.conf
│   └── php/Dockerfile
├── docker-compose.yml
├── docker-compose.override.yml
├── Makefile
└── .env.docker.example
```

## Variables de entorno

Copia `.env.docker.example` a `.env.docker` y rellena los valores. Ese fichero está en `.gitignore` y nunca debe subirse al repositorio.

Las variables que necesitas cambiar son `APP_KEY`, las credenciales de MySQL y `ADMIN_PASSWORD`.
