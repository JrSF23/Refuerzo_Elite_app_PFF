# Runbook — Migración a multi-organización

Procedimiento para llevar el centro que hoy usa Refuerzo Elite V2 a su propia organización, sin pérdida
ni duplicación de registros (FR-022, FR-023, SC-004).

**No ejecutar ninguno de estos pasos en producción sin copia de seguridad verificada y restaurable.**
El Principio VIII de la constitución lo exige, y el paso 3 modifica todas las tablas de negocio a la vez.

---

## Qué hace la migración

Cinco migraciones encadenadas. Cada una deja el sistema arrancando y sirviendo, de modo que la ventana de
riesgo es tan corta como se quiera (Principio X).

| Paso | Migración | Efecto | ¿Reversible? |
|---|---|---|---|
| M1 | `create_organizations_table` | Crea la tabla y la organización del centro actual | Sí, `down()` borra la tabla |
| M2 | `add_organization_id_to_tables` | Añade `organization_id` **nullable, sin FK** a las 10 tablas de negocio y a `users`; añade `teachers.user_id` | Sí |
| M3 | `backfill_organization_data` | Asigna la organización a todo lo existente, renombra el rol `admin` → `org_admin`, vincula fichas de profesor por correo | Sí, `down()` deja las columnas a nulo |
| M4 | `enforce_organization_constraints` | Claves foráneas, únicos por organización, índices compuestos | Sí |
| M5 | `enforce_organization_not_null` | `organization_id` pasa a obligatorio en las 10 tablas de negocio | Sí |

Tras M2 el sistema sigue comportándose igual que antes. El comportamiento cambia con M4 y M5.

---

## Antes de migrar

### 1. Copia de seguridad verificada

```bash
docker compose exec mysql mysqldump -u root -p refuerzo_elite_v2 > backup-pre-tenancy.sql
```

**Verificar que restaura**, no basta con que el fichero exista:

```bash
docker compose exec mysql mysql -u root -p -e "CREATE DATABASE restore_test"
docker compose exec -T mysql mysql -u root -p restore_test < backup-pre-tenancy.sql
docker compose exec mysql mysql -u root -p -e "SELECT COUNT(*) FROM restore_test.students"
```

Si el recuento no coincide con producción, **parar aquí**.

### 2. Recuentos previos

```bash
make shell-db
```

```sql
SELECT 'guardians' t, COUNT(*) n FROM guardians
UNION ALL SELECT 'teachers',      COUNT(*) FROM teachers
UNION ALL SELECT 'subjects',      COUNT(*) FROM subjects
UNION ALL SELECT 'students',      COUNT(*) FROM students
UNION ALL SELECT 'class_groups',  COUNT(*) FROM class_groups
UNION ALL SELECT 'class_sessions',COUNT(*) FROM class_sessions
UNION ALL SELECT 'enrollments',   COUNT(*) FROM enrollments
UNION ALL SELECT 'attendances',   COUNT(*) FROM attendances
UNION ALL SELECT 'payments',      COUNT(*) FROM payments
UNION ALL SELECT 'audit_events',  COUNT(*) FROM audit_events
UNION ALL SELECT 'users',         COUNT(*) FROM users;
```

Guardar la salida. Es la referencia contra la que se compara después (SC-004).

### 3. Revisar el emparejamiento de profesores

M3 vincula cada ficha de profesor con la cuenta de usuario que tenga **el mismo correo**. Es una migración
de datos puntual y revisable, nunca una regla de acceso. Conviene ver de antemano qué va a emparejar:

```sql
SELECT t.id, t.email, u.id AS user_id, u.username
FROM teachers t
LEFT JOIN users u ON u.email = t.email;
```

Las fichas cuya cuenta no aparezca quedarán con `user_id` nulo, y ese profesor **no verá ningún grupo** al
entrar (FR-015c). Si alguna debería estar vinculada, corregir el correo antes de migrar o vincularla a mano
después.

---

## Ejecutar

```bash
make migrate
```

M3 imprime por consola el recuento de filas asignadas por tabla, las fichas vinculadas y si renombró el
rol. El mismo resumen queda en el log de la aplicación. **Guardar esa salida.**

Si M3 encuentra una sola fila de negocio sin organización tras el backfill, lanza una excepción y la
transacción **revierte por completo**: no queda nada aplicado a medias.

---

## Después de migrar

### 1. Verificación automática

```bash
make verify-tenancy
```

Devuelve código de salida distinto de cero si queda cualquier fila huérfana, así que sirve como puerta en
un script de despliegue. Muestra el recuento por entidad y por organización.

Los usuarios sin organización que reporte son los super administradores de plataforma: es lo esperado
(FR-004), no son huérfanos.

### 2. Comparar recuentos

Los totales por entidad deben coincidir **exactamente** con los del paso 2 previo. Cualquier diferencia es
motivo de vuelta atrás.

### 3. Comprobación funcional

- Iniciar sesión con una credencial preexistente: debe entrar con la contraseña de siempre.
- Su rol aparece ahora como `org_admin` (antes `admin`); no requiere ninguna acción del usuario.
- El listado de alumnos muestra el mismo total que antes.
- `GET /api/v1/me` incluye el bloque `organization` con el centro.

---

## Vuelta atrás

### Opción A — revertir las migraciones

```bash
docker compose exec laravel php artisan migrate:rollback --step=5
```

Deshace M5 → M1 en orden inverso. Los datos de negocio permanecen; solo desaparecen las columnas de
organización y el rol vuelve a llamarse `admin`.

### Opción B — restaurar la copia

Si el rollback falla o los recuentos no cuadran, restaurar el volcado del paso 1. Es la opción segura
cuando hay dudas: la migración es repetible, la pérdida de datos no.

---

## Riesgos conocidos

**SQLite y transacciones envolventes.** Solo afecta a desarrollo y tests, no a producción con MySQL, pero
conviene conocerlo. SQLite implementa el añadido de claves foráneas reconstruyendo la tabla: crea una
nueva, copia, **borra la antigua** y renombra. Ese `DROP` dispara los `ON DELETE CASCADE` de las tablas
hijas. Laravel lo protege desactivando `PRAGMA foreign_keys` alrededor de la reconstrucción, pero **ese
pragma es un no-op dentro de una transacción**. Si se envuelven estas migraciones en una transacción
explícita sobre SQLite, se vacían grupos, sesiones, matrículas, asistencias y pagos.

Por eso `MigrationBackfillTest` y `LegacyCredentialsTest` usan `DatabaseMigrations` y no
`RefreshDatabase`. **No ejecutar `migrate` dentro de una transacción sobre SQLite.**

**Índices que respaldan claves foráneas.** `students.guardian_id` y `class_sessions.class_group_id` no
tienen índice `_foreign` propio: el índice de rendimiento es el único que respalda su FK. Retirarlo hace
fallar la migración con el error 1553 de MySQL/MariaDB. M4 los conserva a propósito.

**Correos duplicados entre centros.** A partir de M4 los correos de alumno, profesor y tutor son únicos
**por organización**, no globales. El correo de las cuentas de usuario sigue siendo único global: una
persona que trabaje en dos centros necesita dos cuentas con correos distintos (FR-004a).
