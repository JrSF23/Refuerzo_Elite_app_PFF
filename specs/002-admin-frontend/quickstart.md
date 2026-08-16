# Quickstart: verificación del frontend administrativo

**Feature**: `002-admin-frontend` | **Fecha**: 2026-08-16

Guion de verificación manual. Cada fase de implementación cierra con los escenarios que le corresponden. **Un escenario
no comprobado no es un escenario aprobado**: en la feature anterior, dos conclusiones sobre el diseño móvil resultaron
equivocadas hasta que se midió en un navegador real.

---

## 0. Preparación

```bash
# Backend (Docker Desktop debe estar arrancado)
docker compose --env-file .env.docker up -d
docker compose exec app php artisan migrate:fresh --seed

# Frontend
cd frontend && npm run dev     # http://localhost:5173
```

### Cuentas sembradas

Verificadas contra `AdminSeeder` y `DemoSeeder`. **No inventar otras**: en la feature 001, una tabla de cuentas que no
coincidía con los seeders provocó 33 fallos falsos.

| Rol | Usuario | Contraseña | Organización |
|---|---|---|---|
| `super_admin` | `superadmin` | `SUPER_ADMIN_PASSWORD` del entorno; por defecto `ChangeMe_Super123!` | ninguna |
| `org_admin` | `admin.a` | `Admin12345!` | Centro Piloto Malabo |
| `teacher` | `mgarcia.a` | `Teacher12345!` | Centro Piloto Malabo |
| `org_admin` (centro B) | `admin.b` | `Admin12345!` | segundo centro |
| `teacher` (centro B) | `lnvono.b` | `Teacher12345!` | segundo centro |

El campo de acceso admite usuario **o** correo. Los correos siguen el patrón `admin.a@refuerzoelite.test`.

### Arnés de anchos

Chrome impone una ventana mínima de 500 px, así que **medir a 360 px exige un iframe** servido desde el mismo origen.
El procedimiento está en el historial de la feature 001 y se reutiliza tal cual: página contenedora con un `<iframe>` de
la anchura buscada, `document.documentElement.scrollWidth - clientWidth` para el desbordamiento, y recorrido de todos
los elementos para localizar el más saliente.

---

## Escenario 1 — Acceso y enrutado por rol *(Fase 1)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 1.1 | Abrir `/` sin sesión | Redirige a `/login` | FR-001, FR-002 |
| 1.2 | Abrir `/alumnos` sin sesión | Redirige a `/login`; tras entrar, **llega a `/alumnos`**, no al dashboard | FR-002 |
| 1.3 | Entrar como `admin.a` | Aterriza en `/dashboard` | FR-003 |
| 1.4 | Entrar como `mgarcia.a` | Aterriza en `/dashboard` | FR-003 |
| 1.5 | Entrar como `superadmin` | Aterriza en **`/organizaciones`**. En la pestaña de red, **ninguna petición a `/dashboard`** | FR-003, D6 |
| 1.6 | Contraseña incorrecta | Mensaje del servidor junto al formulario; foco en el primer campo | FR-011 |
| 1.7 | Pulsar acceder dos veces seguidas | Una sola petición | FR-012 |
| 1.8 | Recargar con sesión abierta | Sigue identificado y en la misma ruta | FR-006 |
| 1.9 | Borrar el token del almacenamiento y navegar | Vuelve a `/login` | FR-007 |
| 1.10 | Cerrar sesión | Token invalidado en servidor; volver atrás no restaura la sesión | FR-008 |
| 1.11 | Buscar en la interfaz recuperación de contraseña o registro | **No existe** ninguna de las dos | FR-013 |
| 1.12 | Abrir `/centro`, `/servicios`, `/metodo`, `/contacto` | Ninguna sirve contenido; redirigen según haya sesión | FR-009 |

## Escenario 2 — Navegación y permisos *(Fase 1)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 2.1 | Como `admin.a`, revisar la navegación | Alumnos, tutores, profesores, asignaturas, grupos, matrículas, sesiones, asistencia, pagos, cuentas | FR-004 |
| 2.2 | Como `mgarcia.a`, revisar la navegación | **Solo** alumnos, grupos, sesiones, asistencia | FR-004, FR-037 |
| 2.3 | Como `superadmin`, revisar la navegación | **Solo** organizaciones y cuentas | FR-039 |
| 2.4 | Como `mgarcia.a`, abrir `/pagos` por URL | Redirige a su dashboard. **No** una pantalla vacía ni un 403 sin tratar | FR-004 |
| 2.5 | Como `mgarcia.a`, abrir `/asignaturas` y `/matriculas` por URL | Redirige a su dashboard | FR-037 |
| 2.6 | Como `superadmin`, abrir `/alumnos` por URL | Redirige a `/organizaciones` | FR-039 |
| 2.7 | Recorrer el shell solo con teclado | Todo alcanzable, foco siempre visible, orden lógico | FR-047, FR-048 |
| 2.8 | A 360 px, abrir el panel de navegación | Se abre; se cierra al elegir destino, al pulsar fuera y con `Escape`; el foco vuelve al botón | FR-019 |
| 2.9 | Revisar la cabecera | Muestra organización activa, nombre y rol, y ofrece cerrar sesión | FR-021 |

## Escenario 3 — Dashboard *(Fase 2)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 3.1 | Como `admin.a`, abrir el dashboard | 5 indicadores y 3 bloques recientes. **Una sola petición** a `/dashboard` | FR-014, FR-015 |
| 3.2 | Como `mgarcia.a` | 3 indicadores, sus grupos, próximas sesiones y asistencia reciente | FR-016 |
| 3.3 | Crear una cuenta de profesor **sin** vincular ficha y entrar con ella | Contadores a cero **y aviso explicando que falta el vínculo** | US2.3 |
| 3.4 | Pulsar un bloque de actividad reciente | Lleva a su sección | FR-017 |
| 3.5 | Entrar en un centro sin datos | Cada bloque con su estado vacío y su acción | FR-043 |

## Escenario 4 — Listados y formularios *(Fases 3 a 5)*

Se repite por cada sección. La columna «búsqueda» indica si debe existir la caja.

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 4.1 | Abrir alumnos, tutores, profesores, asignaturas, grupos, cuentas, organizaciones | **Hay** caja de búsqueda | FR-024 |
| 4.2 | Abrir matrículas, sesiones, asistencia, pagos | **NO hay** caja de búsqueda | FR-024 |
| 4.3 | Buscar en alumnos estando en la página 3 | Vuelve a la página 1 | FR-025 |
| 4.4 | Teclear rápido y borrar en la búsqueda | El resultado corresponde a lo último escrito; ninguna respuesta tardía lo pisa | FR-065 |
| 4.5 | Revisar el pie del listado | Total de registros y rango mostrado | FR-027 |
| 4.6 | Listado con una sola página | Sin controles de paginación | FR-041 |
| 4.7 | Buscar algo inexistente | Vacío **de búsqueda**, con acción de limpiar — distinto del vacío inicial | FR-043 |
| 4.8 | Enviar un formulario con un obligatorio vacío | Error **junto al campo**; foco en el primero con error | FR-030, FR-031 |
| 4.9 | Crear una asignatura con código repetido | Error sobre el campo código | US4.1 |
| 4.10 | Pulsar guardar dos veces | Una sola petición | FR-036 |
| 4.11 | Eliminar un registro | Confirmación que nombra **qué** se elimina | FR-035 |
| 4.12 | Detener el backend y recargar un listado | Estado de error con reintento **sin recargar la página** | FR-044 |
| 4.13 | Completar una acción de escritura | Aviso visible y anunciado por lector de pantalla | FR-045, FR-046 |
| 4.14 | Revisar cualquier desplegable de relación | Solo registros del propio centro | FR-034 |

## Escenario 5 — Aislamiento y recorte por rol *(Fases 3 a 5)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 5.1 | Como `admin.a`, anotar el id de un alumno. Entrar como `admin.b` y abrir ese id por URL | Estado **«no encontrado»**. Nunca un mensaje que insinúe que existe | D5 |
| 5.2 | Como `mgarcia.a`, abrir alumnos | Solo los matriculados en sus grupos, **sin** acciones de crear, editar ni borrar | US3.4 |
| 5.3 | Como `mgarcia.a`, abrir grupos | Solo los que imparte, en lectura | US5.3 |
| 5.4 | Como `mgarcia.a`, recorrer **todas** sus pantallas | Ningún importe, tarifa ni cuota visible en ningún punto | FR-037 |
| 5.5 | Como `mgarcia.a`, crear una sesión | El desplegable de grupo ofrece solo los suyos | US6.1 |
| 5.6 | Como `superadmin`, abrir organizaciones | Se ve `users_count` y **ningún** recuento de alumnos ni de pagos | US9.3 |
| 5.7 | Suspender una organización y entrar con su `admin` | Pantalla explicativa con el motivo, no un error genérico repetido | Edge cases |
| 5.8 | Intentar eliminar una organización con cuentas activas | Mensaje del servidor; no se elimina | US9.2 |
| 5.9 | Revisar la pestaña de red durante todo el recorrido | Ninguna petición fuera del Apéndice A; ningún `organization_id` en escrituras de negocio | FR-061, FR-063, SC-011 |

## Escenario 6 — Responsive *(cada fase, y auditoría en Fase 6)*

Anchos a medir: **360, 375, 414, 480, 640, 768, 1024, 1280, 1440, 1920**.

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 6.1 | Cada pantalla en los diez anchos | Desbordamiento horizontal **= 0** en todos | FR-028, SC-003 |
| 6.2 | Tablas a 360 px | Representación por tarjetas con rótulo sobre valor; sin desplazamiento horizontal | FR-028 |
| 6.3 | Acciones de fila a 360 px | Alcanzables, sin quedar fuera del área visible | FR-029 |
| 6.4 | Registrar asistencia de un grupo completo desde 360 px | Flujo completable sin desplazamiento horizontal en ningún paso | SC-002 |
| 6.5 | Reducir el ancho de la ventana lentamente | Las tablas cambian de forma **según su propio contenido**, no todas al mismo ancho | FR-060, D8 |
| 6.6 | Enfocar un campo en un móvil real o emulado con iOS | Sin zoom automático | Design system §2 |

## Escenario 7 — Accesibilidad *(Fase 6)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 7.1 | Recorrer la aplicación entera solo con teclado | Sin trampas de foco; orden de foco = orden visual | FR-047 |
| 7.2 | Abrir un diálogo | Foco atrapado; `Escape` cierra; el foco vuelve al disparador | FR-049 |
| 7.3 | Pasar un analizador de contraste | 100 % conforme a WCAG 2.1 AA | FR-050, SC-006 |
| 7.4 | Revisar todos los distintivos de estado | Siempre con texto, nunca solo color | FR-051 |
| 7.5 | Recorrer con lector de pantalla | Campos con etiqueta; avisos anunciados; imágenes decorativas ignoradas | FR-032, FR-046, FR-052 |
| 7.6 | Inspeccionar el elemento raíz | `lang="es"` | FR-053 |
| 7.7 | Activar «reducir movimiento» en el sistema | Sin transiciones | Design system §7 |

## Escenario 8 — Textos y formato *(Fase 6)*

| # | Acción | Resultado esperado | FR |
|---|---|---|---|
| 8.1 | Barrer `src/` buscando literales en posición de contenido fuera de `src/i18n/` | **Cero resultados** | FR-066, SC-012 |
| 8.2 | Pedir una clave inexistente | No rompe ni deja hueco: avisa en desarrollo, degrada visible en producción | FR-071 |
| 8.3 | Añadir un catálogo de prueba y seleccionarlo | La interfaz cambia de idioma **sin tocar ningún componente** | FR-070, SC-013 |
| 8.4 | Revisar todos los importes | Formato monetario con separador de millar; ninguno como número desnudo | FR-073, SC-010 |
| 8.5 | Revisar fechas y horas | Formato regional; horas sin segundos | FR-073 |
| 8.6 | Revisar campos vacíos | Guion largo `—`, nunca `null` ni cadena vacía | Design system §6 |
| 8.7 | Revisar la pestaña de red al cargar | **Ninguna** petición a un dominio externo, tipografía incluida | FR-058, SC-009 |

---

## Comprobación final antes de cerrar la feature

1. `npm run build` sin errores ni avisos nuevos.
2. `php artisan test` — las 246 pruebas del backend siguen en verde. Esta feature no toca backend; **cualquier fallo
   aquí significa que algo se tocó sin querer.**
3. Escenarios 1 a 8 completos, con los tres roles.
4. Barrido de los diez anchos sin desbordamiento.
5. Actualizar `specs/001-multi-org-tenancy/plan.md`: la desviación XII.a queda saldada en su parte de frontend.
