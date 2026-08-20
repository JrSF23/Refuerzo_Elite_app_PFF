/**
 * Qué ve y qué puede hacer cada rol.
 *
 * ESTO NO ES UNA BARRERA DE SEGURIDAD (FR-040). El servidor autoriza con
 * Policies y middleware, y esa comprobación es la que cuenta. Este módulo evita
 * ofrecer acciones que van a fallar, y evita mostrar información que el rol no
 * debe ver —los importes al profesor—, pero nunca sustituye al servidor.
 *
 * Es una réplica de `backend/routes/api.php`. Si divergen, manda el servidor;
 * la tabla contrastable está en specs/002-admin-frontend/contracts/api-usage.md.
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ORG_ADMIN: 'org_admin',
  TEACHER: 'teacher',
}

/** Permisos por sección: qué puede hacer cada rol. */
const READ = 'read'
const WRITE = 'write'

/**
 * Secciones de la aplicación.
 *
 * `path` es la ruta; `endpoint`, el recurso de la API; `searchable` indica si el
 * endpoint admite búsqueda, y de ahí depende que se muestre la caja (FR-024):
 * en matrículas, sesiones, asistencia y pagos la API ignora el parámetro porque
 * esos controladores no declaran campos buscables, así que ofrecerla sería
 * mentir al usuario.
 */
export const SECTIONS = {
  dashboard: {
    // `/login` y `/dashboard` se mantienen en inglés por indicación expresa;
    // el resto de rutas van en español (FR-005).
    path: '/dashboard',
    group: null,
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: WRITE },
  },

  students: {
    path: '/alumnos',
    endpoint: 'students',
    searchable: true,
    group: 'sectionManagement',
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: READ },
  },
  guardians: {
    path: '/tutores',
    endpoint: 'guardians',
    searchable: true,
    group: 'sectionManagement',
    access: { [ROLES.ORG_ADMIN]: WRITE },
  },
  teachers: {
    path: '/profesores',
    endpoint: 'teachers',
    searchable: true,
    group: 'sectionManagement',
    access: { [ROLES.ORG_ADMIN]: WRITE },
  },
  subjects: {
    path: '/asignaturas',
    endpoint: 'subjects',
    searchable: true,
    group: 'sectionManagement',
    // Cerrada al profesor: lleva `monthly_fee` (FR-037).
    access: { [ROLES.ORG_ADMIN]: WRITE },
  },

  /*
   * OJO con los dos «grupos». Son entidades distintas y confundirlas es el error
   * más fácil de cometer aquí:
   *
   *   tutorGroups  → el AULA. Un alumno pertenece a UNO. Tiene profesor tutor y
   *                  alumno delegado. Es la unidad organizativa del centro.
   *   classGroups  → el grupo DE UNA ASIGNATURA. Un alumno pertenece a VARIOS,
   *                  cada uno con su profesor. Se llega por matrícula.
   *
   * Por eso el rótulo de la segunda pasa a «Grupos de asignatura»: dos secciones
   * llamadas «Grupos» serían incomprensibles para el personal del centro.
   */
  tutorGroups: {
    path: '/grupos',
    endpoint: 'tutor-groups',
    searchable: true,
    group: 'sectionAcademic',
    // Primera sección con lectura para el profesor y escritura solo para la
    // administración. Puede tenerla porque no lleva ningún campo monetario.
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: READ },
  },
  classGroups: {
    path: '/grupos-asignatura',
    endpoint: 'class-groups',
    searchable: true,
    group: 'sectionAcademic',
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: READ },
  },
  enrollments: {
    path: '/matriculas',
    endpoint: 'enrollments',
    searchable: false,
    group: 'sectionAcademic',
    // Cerrada al profesor: lleva `monthly_fee` (FR-037).
    access: { [ROLES.ORG_ADMIN]: WRITE },
  },
  sessions: {
    path: '/sesiones',
    endpoint: 'class-sessions',
    searchable: false,
    group: 'sectionAcademic',
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: WRITE },
  },
  attendance: {
    path: '/asistencia',
    endpoint: 'attendances',
    searchable: false,
    group: 'sectionAcademic',
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.TEACHER]: WRITE },
  },

  payments: {
    path: '/pagos',
    endpoint: 'payments',
    searchable: false,
    group: 'sectionFinance',
    // Cerrada al profesor: lleva `amount` (FR-037).
    access: { [ROLES.ORG_ADMIN]: WRITE },
  },

  users: {
    path: '/cuentas',
    endpoint: 'users',
    searchable: true,
    group: 'sectionAdmin',
    access: { [ROLES.ORG_ADMIN]: WRITE, [ROLES.SUPER_ADMIN]: WRITE },
  },
  organizations: {
    path: '/organizaciones',
    endpoint: 'organizations',
    searchable: true,
    group: 'sectionPlatform',
    access: { [ROLES.SUPER_ADMIN]: WRITE },
  },
}

/**
 * INVARIANTE — las tres secciones cerradas al profesor son EXACTAMENTE las tres
 * que contienen campos monetarios: asignaturas (`monthly_fee`), matrículas
 * (`monthly_fee`) y pagos (`amount`).
 *
 * No es casualidad: es el invariante FR-016 de la feature de tenancy, que el
 * servidor ya impone. Antes de abrir cualquiera de las tres al profesor, o de
 * añadir un campo monetario a una sección que sí ve, hay que cambiar primero lo
 * que autoriza el servidor.
 */
const MONETARY_SECTIONS = ['subjects', 'enrollments', 'payments']

export function isMonetarySection(key) {
  return MONETARY_SECTIONS.includes(key)
}

/**
 * ¿Sabe el servidor buscar en este recurso?
 *
 * Se pregunta por endpoint, no por sección, porque quien lo necesita son los
 * campos de relación de los formularios: el campo declara `endpoint: 'students'`
 * y de ahí sale si puede ofrecer un buscador o tiene que conformarse con un
 * desplegable. La respuesta sale de la MISMA tabla que decide si se pinta la
 * caja de búsqueda del listado, para que no puedan contradecirse.
 */
export function endpointIsSearchable(endpoint) {
  return Object.values(SECTIONS).some(
    (section) => section.endpoint === endpoint && section.searchable === true,
  )
}

function levelFor(sectionKey, roleNames) {
  const section = SECTIONS[sectionKey]
  if (!section) return null

  // El rol más permisivo gana: una cuenta con org_admin y teacher opera como
  // administradora.
  if (roleNames.includes(ROLES.ORG_ADMIN) && section.access[ROLES.ORG_ADMIN]) {
    return section.access[ROLES.ORG_ADMIN]
  }

  for (const role of roleNames) {
    if (section.access[role]) return section.access[role]
  }

  return null
}

export function canAccess(sectionKey, roleNames) {
  return levelFor(sectionKey, roleNames) !== null
}

export function canWrite(sectionKey, roleNames) {
  return levelFor(sectionKey, roleNames) === WRITE
}

/**
 * Secciones visibles en la navegación, en el orden de declaración.
 *
 * Se incluyen TODAS las accesibles, el panel entre ellas: es la pantalla de
 * aterrizaje y el centro operativo de la aplicación, así que tiene que haber una
 * forma de volver a él. Su `group` es `null`, lo que significa «sin encabezado
 * de grupo», no «fuera de la navegación».
 */
export function visibleSections(roleNames) {
  return Object.entries(SECTIONS)
    .filter(([key]) => canAccess(key, roleNames))
    .map(([key, section]) => ({ key, ...section }))
}

/**
 * Ruta de inicio del rol.
 *
 * El super administrador NO va al panel: `GET /dashboard` está bajo el
 * middleware de tenant y él no pertenece a ninguna organización, así que
 * recibiría 403 en cada inicio de sesión (FR-003, research.md D6).
 */
export function homePathFor(roleNames) {
  if (roleNames.includes(ROLES.SUPER_ADMIN) && !roleNames.includes(ROLES.ORG_ADMIN)) {
    return SECTIONS.organizations.path
  }

  return SECTIONS.dashboard.path
}
