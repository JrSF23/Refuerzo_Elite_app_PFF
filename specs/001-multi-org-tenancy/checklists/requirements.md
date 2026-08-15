# Specification Quality Checklist: Soporte Multi-Organización (Multi-Tenancy)

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-08-13
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- **Iteración 1**: la redacción inicial incorporaba nombres de mecanismos técnicos (global scope,
  middleware, políticas) dentro de los requisitos funcionales. Se reescribieron en términos de
  comportamiento observable (FR-005 a FR-011) y los mandatos técnicos del usuario se aislaron en la
  sección "Restricciones impuestas", marcada explícitamente como heredada y no analizable en
  planificación. Con ello los FR quedan verificables sin conocer la implementación.

- **Iteración 2**: los criterios de éxito iniciales mencionaban tiempos de respuesta y cobertura de
  código. Se reformularon como resultados observables de negocio y seguridad (SC-001 a SC-009).

- **Excepción aceptada**: la sección "Restricciones impuestas" contiene decisiones técnicas
  (base de datos compartida, sin paquetes de tenancy, `/api/v1`). Se conserva deliberadamente porque son
  restricciones dadas por el responsable del producto y por la constitución, no decisiones a tomar en
  planificación. Eliminarlas perdería requisitos reales del usuario.

- **Iteración 3**: resueltas las 3 clarificaciones (sesión 2026-08-13, opción A en las tres). Se
  incorporaron a la spec como FR-004a, FR-013a/b y FR-015a/b/c, con escenarios de aceptación y casos
  límite asociados. La sección `## Clarifications` documenta cada respuesta y su consecuencia. Checklist
  completo: 16/16.

- **Acción externa — RESUELTA (2026-08-14)**: la respuesta a Q1 contradecía el Principio IX de
  `.specify/memory/constitution.md`. La enmienda se aplicó en la **v1.1.0** de la constitución: se eliminó
  la regla de roles distintos por organización y se fijó la pertenencia única vía `User → Organization`.
  Spec y constitución están alineadas; no queda discrepancia.

## Verificación tras la implementación (2026-08-14)

Estado de las puertas de calidad de la constitución para esta feature, comprobado sobre el código:

- [x] **I. Producto antes que tecnología** — sin aislamiento no puede entrar ningún centro piloto
- [x] **II. MVP primero** — self-signup, facturación y marketplace quedaron fuera; nada de eso se construyó
- [x] **III. Reutilización** — se extendieron `BaseApiController`, `EnsureAnyRole` y `RecordsAuditEvents`; ningún modelo se reescribió
- [x] **IV. Simplicidad (NO NEGOCIABLE)** — trait, global scope, middleware y policies: idioma nativo de Laravel. Sin repositorios, sin DDD, sin paquetes de tenancy
- [x] **V. Seguridad por diseño (NO NEGOCIABLE)** — filtro a nivel de modelo, 404 en acceso cruzado, batería A/B sobre las 10 entidades. **241 tests en verde**
- [ ] **VI. Mobile-first** — ver T107: las tablas de las pantallas nuevas se apoyan en desplazamiento horizontal, que el principio declara inaceptable. Pendiente de una representación móvil propia
- [x] **VII. Bajo coste** — cero dependencias nuevas, cero servicios externos
- [x] **VIII. Producción real** — backfill en transacción con aborto y reversión, runbook con copia verificada, comando `tenancy:verify`, auditoría de las operaciones de plataforma
- [x] **IX. Multi-tenancy desde el núcleo** — FK explícita en las 10 entidades, organización resuelta del usuario autenticado, pertenencia única sin tabla intermedia
- [x] **X. Evolución incremental** — cinco migraciones, cada una desplegable. El `NOT NULL` se separó precisamente para no romper este principio
- [ ] **XI. Feedback real** — N/A, feature previa al piloto
- [ ] **XII. Internacionalización** — parcial: los textos **nuevos** pasan por `lang/es/tenancy.php` y el idioma por defecto es el español, pero persisten dos deudas anteriores a la constitución — mensajes en francés incrustados en el código, e importes monetarios sin divisa asociada (`payments.amount`, `subjects.monthly_fee`, `enrollments.monthly_fee`)

### Verificaciones de entorno — completadas (2026-08-15)

- **T010** — migraciones validadas contra el **MySQL 8.0.46 del contenedor**, migrando una instalación
  mono-centro **poblada**: 104 filas asignadas, 2 fichas de profesor vinculadas, rol renombrado, 0
  huérfanas, 11 claves foráneas, 5 únicos compuestos y 20 índices. Coincide con lo obtenido en SQLite y
  en MariaDB 10.4, donde el índice que respalda una FK ya había capturado un fallo real (error 1553).
- **T109** — guion de punta a punta ejecutado contra el stack levantado con dos organizaciones pobladas:
  **53/53 comprobaciones sin fallos**. SC-003 medido en **2 segundos** frente a los 10 minutos de
  objetivo.
- **SC-008** — cubierto por `.github/workflows/tests.yml`: la suite y la batería de aislamiento se
  ejecutan en cada `push` y cada `pull_request`, de forma desatendida. El workflow incluye una guarda
  explícita sobre los siete ficheros de aislamiento, para que renombrarlos o borrarlos no deje el
  criterio incumplido en silencio.

### Pendiente

- **Principio VI** — las tablas de las tres pantallas nuevas necesitan representación móvil propia
  (T107). Desviación aceptada por escrito en el Complexity Tracking de plan.md.
