# Implementacion del proyecto

## 1. Objetivo

Se inicio una nueva version de Refuerzo Elite con separacion clara entre frontend y backend, tomando como base el cahier des charges y el modelo funcional del proyecto anterior.

## 2. Decisiones tecnicas

### Frontend

- Se uso React con Vite para una interfaz mas rapida y modular.
- Se uso React Router para dividir login, dashboard y modulos.
- Se uso Axios para consumir la API REST.

### Backend

- Se uso Laravel 12 porque es compatible con PHP 8.2 del entorno actual.
- Se instalo Sanctum para autenticacion por token.
- Se instalo Spatie Permission para roles y permisos.

### Persistencia

- MySQL se uso como base principal y transaccional.
- MongoDB no se activo todavia porque en esta fase no habia servidor ni extension PHP-MongoDB garantizados en el entorno.
- Aun asi, la auditoria se dejo modelada como `audit_events`, preparada para migrarse despues a MongoDB si se desea una estrategia hibrida real de historico/eventos.

## 3. Que se hizo en backend

### Seguridad

- Login por correo o username
- Logout con invalidacion del token actual
- Endpoint `/api/v1/me`
- Seeder de roles: `admin`, `coordinator`, `staff`, `teacher`, `guardian`
- Usuario administrador inicial

### Modelo de datos

Se crearon las entidades:

- `guardians`
- `teachers`
- `subjects`
- `students`
- `class_groups`
- `enrollments`
- `class_sessions`
- `attendances`
- `payments`
- `audit_events`

Tambien quedaron activas:

- tablas de usuarios/sesiones/cache/jobs de Laravel
- tablas de `Sanctum`
- tablas de `Spatie Permission`

### API REST implementada

Rutas disponibles en `/api/v1`:

- `POST /login`
- `POST /logout`
- `GET /me`
- `GET /dashboard`
- CRUD completos para:
  - `guardians`
  - `teachers`
  - `subjects`
  - `students`
  - `class-groups`
  - `enrollments`
  - `class-sessions`
  - `attendances`
  - `payments`

## 4. Que se hizo en frontend

### Experiencia de uso

- Se sustituyo el template de Vite por una interfaz orientada al centro escolar.
- Se creo un login funcional conectado a la API.
- Se creo un `AppShell` con sidebar y navegacion de modulos.
- Se creo un dashboard inicial con metricas y tablas recientes.

### Patron de modulos

Se implemento una pantalla generica `ModulePage` que:

- carga registros del modulo
- soporta busqueda
- crea registros
- actualiza registros
- elimina registros
- carga datos auxiliares para selects relacionados

Esto permite crecer sin duplicar demasiadas pantallas.

## 5. Configuracion realizada

### MySQL

Se configuro el backend para usar:

- `DB_CONNECTION=mysql`
- `DB_DATABASE=refuerzo_elite_v2`

### Compilacion

Verificaciones realizadas:

- `php artisan migrate:fresh --seed` OK
- `php artisan route:list --path=api` OK
- `npm.cmd run build` OK

## 6. Credenciales iniciales

- Usuario: `admin`
- Correo: `admin@refuerzoelite.test`
- Contrasena: `Admin12345!`

Usuarios de demo (creados por DemoSeeder):

- Profesora de Matematicas: `mgarcia` / `Teacher12345!`
- Profesor de Lengua: `cmartinez` / `Teacher12345!`

## 7. Como inicializar la base de datos con datos de demo

```bash
php artisan migrate:fresh --seed
```

Esto ejecuta AdminSeeder + DemoSeeder y crea:
- 1 usuario admin
- 2 profesores con cuenta de acceso
- 3 materias (Matematicas, Lengua, Ingles)
- 4 grupos de clase
- 5 tutores / 8 alumnos
- 11 inscripciones
- 10 sesiones de clase
- ~30 registros de asistencia
- 21 pagos (pagados, pendientes, cancelados)

## 8. Ejecucion de tests

```bash
cd backend
php artisan test
```

Los tests cubren:

- **AuthTest**: login correcto, login con contrasena erronea, usuario inactivo,
  rol sin acceso, campos requeridos, endpoint /me, logout que invalida el token.
- **StudentTest**: listado por admin y teacher, busqueda, creacion, validacion de
  status invalido, email duplicado, actualizacion, borrado suave, control de acceso.
- **PaymentTest**: control de acceso, creacion valida, enrollment de otro alumno
  (cross-student), metodo de pago invalido, status invalido, campos requeridos,
  pago sin enrollment, borrado suave.

---

## 9. Auditoria tecnica — cambios realizados (2026-05-21)

A continuacion se documenta cada cambio aplicado tras la auditoria del proyecto.

---

### 9.1 Validaciones de campos enum con `Rule::in()`

**Archivos afectados:**
- `backend/app/Http/Controllers/Api/StudentController.php`
- `backend/app/Http/Controllers/Api/PaymentController.php`
- `backend/app/Http/Controllers/Api/EnrollmentController.php`
- `backend/app/Http/Controllers/Api/ClassGroupController.php`
- `backend/app/Http/Controllers/Api/AttendanceController.php`

**Problema:** Los campos de tipo enumerado (`status`, `payment_method`) aceptaban
cualquier cadena de texto. Era posible guardar `status = "whatever"` sin error.

**Solucion:** Se reemplazaron las reglas `'string', 'max:50'` por `Rule::in([...])`
con los valores validos exactos de cada campo:

| Campo | Valores permitidos |
|---|---|
| `students.status` | `active`, `inactive` |
| `enrollments.status` | `active`, `inactive` |
| `class_groups.status` | `active`, `inactive` |
| `attendances.status` | `present`, `absent`, `late` |
| `payments.payment_method` | `cash`, `card`, `transfer` |
| `payments.status` | `paid`, `pending`, `cancelled` |

---

### 9.2 Validacion de propiedad del enrollment en pagos

**Archivo:** `backend/app/Http/Controllers/Api/PaymentController.php`

**Problema:** Al crear un pago era posible indicar `student_id = 1` y
`enrollment_id = 5` aunque esa inscripcion perteneciera al alumno 3. Esto
producia datos incoherentes en la base de datos.

**Solucion:** Se añadio una regla de validacion con closure que comprueba que
el `enrollment_id`, cuando se proporciona, pertenezca al `student_id` enviado
en la misma peticion:

```php
function (string $attribute, mixed $value, Closure $fail): void {
    if ($value === null) return;
    $studentId = request()->integer('student_id');
    if ($studentId && !Enrollment::where('id', $value)
            ->where('student_id', $studentId)->exists()) {
        $fail("L'inscription sélectionnée n'appartient pas à cet élève.");
    }
},
```

---

### 9.3 AuthController extiende Controller

**Archivo:** `backend/app/Http/Controllers/Api/AuthController.php`

**Problema:** `AuthController` no extendia `App\Http\Controllers\Controller`,
lo que lo excluia de cualquier middleware o funcionalidad que se anyadiera
en el futuro al controlador base.

**Solucion:** Se añadio `extends Controller` y el import correspondiente.

---

### 9.4 Rate limiting en rutas autenticadas

**Archivo:** `backend/routes/api.php`

**Problema:** Solo el endpoint `/login` tenia rate limiting (10 por minuto).
El resto de la API no estaba limitada.

**Solucion:** Se añadio `throttle:120,1` al grupo de rutas autenticadas
(120 peticiones por minuto por usuario). El login mantiene su limite de 10/min.

---

### 9.5 Indices de rendimiento en base de datos

**Archivo nuevo:** `backend/database/migrations/2026_05_21_000001_add_performance_indexes.php`

**Problema:** Las tablas no tenian indices en campos usados frecuentemente en
filtros y ordenaciones. A medida que crezca el volumen de datos, las consultas
se vuelven lentas.

**Solucion:** Se creo una migracion que añade indices en:

| Tabla | Columnas indexadas |
|---|---|
| `students` | `status`, `guardian_id` |
| `enrollments` | `status` |
| `class_groups` | `status`, `academic_year` |
| `class_sessions` | `(class_group_id, session_date)` compuesto |
| `payments` | `status`, `paid_at` |
| `audit_events` | `(entity_type, entity_id)`, `user_id`, `created_at` |

Para aplicar: `php artisan migrate` (si la BD ya existe) o
`php artisan migrate:fresh --seed` (recrea todo con datos de demo).

---

### 9.6 DemoSeeder con datos realistas

**Archivos nuevos:**
- `backend/database/seeders/DemoSeeder.php`
- `backend/database/factories/StudentFactory.php`

**Problema:** Solo existia el `AdminSeeder`. No habia datos de demo para
mostrar el sistema funcionando durante la presentacion del proyecto.

**Solucion:** `DemoSeeder` crea un conjunto coherente de datos:

- 2 profesoras/es con cuenta de acceso al sistema
- 3 materias (Matematicas, Lengua, Ingles)
- 4 grupos de clase con horarios reales
- 5 tutores legales con contacto
- 8 alumnos (7 activos, 1 inactivo)
- 11 inscripciones vinculando alumnos y grupos
- 10 sesiones de clase en enero 2026
- ~30 registros de asistencia (mezcla de presentes, ausentes, tarde)
- 21 pagos de octubre 2025 a enero 2026 (pagados, pendientes, cancelados)

Tambien se añadio `StudentFactory` para su uso en tests automatizados.

`DemoSeeder` se registra en `DatabaseSeeder` y se ejecuta automaticamente
con `php artisan migrate:fresh --seed`.

---

### 9.7 Tests de feature

**Archivos nuevos:**
- `backend/tests/Feature/AuthTest.php` — 10 tests
- `backend/tests/Feature/StudentTest.php` — 12 tests
- `backend/tests/Feature/PaymentTest.php` — 10 tests

**Problema:** Solo existian los tests de plantilla de Laravel (sin contenido real).
Sin tests no es posible demostrar que el codigo funciona bajo regresion.

**Solucion:** Se escribieron 32 tests de integracion con `RefreshDatabase`
que verifican los comportamientos criticos del sistema:

```
AuthTest (10 tests)
  ✓ admin puede hacer login con email
  ✓ admin puede hacer login con username
  ✓ teacher puede hacer login
  ✓ login falla con contrasena incorrecta
  ✓ login falla para usuario inactivo
  ✓ login denegado para rol student
  ✓ login requiere los campos login y password
  ✓ /me devuelve el usuario autenticado
  ✓ /me requiere autenticacion
  ✓ logout invalida el token

StudentTest (12 tests)
  ✓ admin puede listar alumnos
  ✓ teacher puede listar alumnos
  ✓ no autenticado no puede listar
  ✓ busqueda por nombre funciona
  ✓ admin puede crear alumno
  ✓ teacher no puede crear alumno
  ✓ creacion falla sin campos requeridos
  ✓ creacion rechaza status invalido
  ✓ creacion rechaza email duplicado
  ✓ admin puede ver un alumno
  ✓ show devuelve 404 para id inexistente
  ✓ admin puede actualizar alumno
  ✓ admin puede borrar alumno (soft delete)
  ✓ teacher no puede borrar alumno

PaymentTest (10 tests)
  ✓ admin puede listar pagos
  ✓ teacher no puede acceder a pagos
  ✓ no autenticado no puede acceder
  ✓ admin puede crear pago
  ✓ falla si enrollment pertenece a otro alumno
  ✓ rechaza metodo de pago invalido
  ✓ rechaza status invalido
  ✓ requiere campos obligatorios
  ✓ permite pago sin enrollment
  ✓ admin puede borrar pago (soft delete)
```

Para ejecutar: `cd backend && php artisan test`

---

### 9.8 Fix frontend: isAuthenticated durante el boot

**Archivo:** `frontend/src/context/SessionContext.jsx`

**Problema:** `isAuthenticated: Boolean(token)` devuelve `true` durante el
arranque de la app aunque el token este expirado o haya sido revocado. El
componente `RequireAuth` ya esperaba a `isBooting`, pero la prop
`isAuthenticated` era accesible como `true` antes de confirmar con `/me`.

**Solucion:** Se cambio a `isAuthenticated: Boolean(token) && !isBooting`.
Ahora `isAuthenticated` es `false` mientras la app verifica el token con
el servidor, y pasa a `true` solo una vez confirmada la sesion.

---

### 9.9 Fix frontend: borrado de campos nullable al editar

**Archivo:** `frontend/src/pages/ModulePage.jsx`

**Problema:** El payload de envio filtraba todos los campos con valor vacio
(`value !== ''`). Esto impedia que al editar un registro se pudiera borrar
un campo opcional como el telefono o la direccion, ya que el campo vacio
simplemente no se enviaba y el backend mantenia el valor anterior.

**Solucion:** Se diferencian los dos casos:

- **Al crear:** los campos vacios no se envian (el backend aplica sus defaults).
- **Al editar:** los campos vacios opcionales se envian como `null` para que
  el backend los limpie explicitamente.

---

### 9.10 Confirmacion: dist/ en .gitignore

**Archivo:** `frontend/.gitignore`

`dist/` ya estaba listado en el `.gitignore` del frontend desde el inicio
del proyecto. No fue necesario ningun cambio adicional.

---

## 10. Estado del proyecto tras la auditoria

**Resuelto:**
- Validaciones de enum en todos los controladores
- Validacion cruzada enrollment-alumno en pagos
- AuthController hereda correctamente de Controller
- Rate limiting en rutas autenticadas
- Indices de rendimiento en base de datos
- Datos de demo para presentaciones
- 32 tests automatizados
- Fix de `isAuthenticated` durante boot
- Fix de campos nullable en edicion

**Pendiente (mejoras futuras):**
- Exportacion CSV / PDF
- Panel especifico para el rol teacher
- Visor de log de auditoria en frontend
- Pagina de perfil del usuario
- Filtros avanzados en listados (por estado, fecha, grupo)
- Indicadores de alumnos con pagos pendientes
- Recordatorios de pago por email
- Vista del tutor/responsable
