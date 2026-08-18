/**
 * Catálogo de textos en español.
 *
 * Organizado por dominio, con `common` para lo transversal (FR-067). Las claves
 * se leen como `students.create` o `common.cancel`.
 *
 * Convenciones para que el catálogo siga siendo legible cuando crezca:
 *   · `title`      encabezado de la pantalla
 *   · `fields.*`   etiquetas de formulario y de columna, que aquí coinciden
 *   · `actions.*`  lo que hace el usuario
 *   · `messages.*` resultado de una acción
 *   · `empty.*`    estados vacíos
 *
 * Las etiquetas de campo y los estados de dominio proceden del catálogo ya
 * validado contra la API en `config/modules.js`.
 */

export const es = {
  app: {
    name: 'SmartWork',
    tagline: 'Gestión de centros educativos',
  },

  common: {
    // Acciones
    save: 'Guardar',
    saveChanges: 'Guardar cambios',
    cancel: 'Cancelar',
    create: 'Crear',
    edit: 'Editar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    retry: 'Reintentar',
    back: 'Volver',
    search: 'Buscar',
    clear: 'Limpiar',
    select: 'Seleccione',
    noOptions: 'No hay opciones disponibles',
    actions: 'Acciones',
    viewAll: 'Ver todo',

    // Estados
    loading: 'Cargando…',
    saving: 'Guardando…',
    required: 'obligatorio',
    optional: 'opcional',
    emptyValue: '—',

    // Paginación
    previous: 'Anterior',
    next: 'Siguiente',
    pagePosition: 'Página {current} de {total}',
    showingRange: 'Mostrando {from}–{to} de {total}',
    totalRecords: {
      one: '{count} registro',
      many: '{count} registros',
    },

    // Errores transversales
    errorTitle: 'No se han podido cargar los datos',
    errorBody: 'Ha ocurrido un problema al contactar con el servidor.',
    networkError: 'No hay conexión con el servidor. Compruebe su red e inténtelo de nuevo.',
    unexpectedError: 'Ha ocurrido un error inesperado.',
    notFoundTitle: 'Registro no encontrado',
    notFoundBody: 'Puede que se haya eliminado. Vuelva al listado para continuar.',
    forbiddenTitle: 'Sin acceso',
    tooManyRequests: 'Demasiados intentos. Espere un momento antes de volver a probar.',

    // Resultado de las acciones de escritura
    created: 'Registro creado.',
    savedChanges: 'Cambios guardados.',
    deleted: 'Registro eliminado.',
    noRecordsTitle: 'Todavía no hay registros',

    // Confirmación de borrado
    deleteTitle: 'Eliminar {name}',
    deleteBody: '¿Confirma que desea eliminar «{name}»? Esta acción no se puede deshacer.',

    // Búsqueda sin resultados
    noResultsTitle: 'Sin resultados',
    noResultsBody: 'No hay ningún registro que coincida con «{term}».',

    // Límite de error: lo que se ve cuando algo falla durante el render.
    crashTitle: 'Algo ha fallado',
    crashBody: 'Se ha producido un error inesperado y la pantalla no ha podido mostrarse. Puede reintentar o volver al inicio.',
    backToStart: 'Volver al inicio',

    // Andamio de la fase 1: desaparece cuando cada sección tiene su pantalla.
    sectionPendingTitle: 'Sección en construcción',
    sectionPendingBody: 'Esta sección estará disponible en una próxima entrega.',
  },

  auth: {
    title: 'Acceder',
    subtitle: 'Introduzca sus credenciales para entrar.',
    login: 'Usuario o correo',
    loginHint: 'Puede usar su nombre de usuario o su dirección de correo.',
    password: 'Contraseña',
    submit: 'Acceder',
    submitting: 'Accediendo…',
    logout: 'Cerrar sesión',
    sessionExpired: 'Su sesión ha caducado. Vuelva a acceder.',
    genericError: 'No se ha podido acceder. Inténtelo de nuevo.',
  },

  nav: {
    label: 'Navegación principal',
    open: 'Abrir navegación',
    close: 'Cerrar navegación',
    skipToContent: 'Saltar al contenido',
    sectionManagement: 'Gestión',
    sectionAcademic: 'Actividad académica',
    sectionFinance: 'Cobros',
    sectionAdmin: 'Administración',
    sectionPlatform: 'Plataforma',
  },

  roles: {
    super_admin: 'Plataforma',
    org_admin: 'Administración',
    teacher: 'Profesor',
    none: 'Sin rol',
  },

  organization: {
    suspendedTitle: 'Centro suspendido',
    suspendedBody: 'El acceso a los datos de este centro está suspendido. Contacte con la administración de la plataforma.',
    unavailableTitle: 'Centro no disponible',
    missingTitle: 'Sin centro asignado',
    missingBody: 'Su cuenta no está asignada a ningún centro. Contacte con la administración.',
  },

  dashboard: {
    title: 'Panel',
    stats: {
      students: 'Alumnos',
      teachers: 'Profesores',
      groups: 'Grupos',
      attendances: 'Registros de asistencia',
      payments: 'Pagos',
      myGroups: 'Mis grupos',
      myStudents: 'Mis alumnos',
      upcomingSessions: 'Próximas sesiones',
    },
    recentStudents: 'Últimas altas',
    recentSessions: 'Últimas sesiones',
    recentPayments: 'Últimos pagos',
    myGroups: 'Mis grupos',
    upcomingSessions: 'Próximas sesiones',
    recentAttendances: 'Asistencia reciente',
    teacherUnlinkedTitle: 'Cuenta sin ficha de profesor',
    teacherUnlinkedBody: 'Su cuenta todavía no está vinculada a una ficha de profesor, así que no se muestran grupos ni sesiones. Pida a la administración del centro que complete la vinculación.',
    emptyStudents: 'Todavía no hay alumnos dados de alta.',
    emptySessions: 'Todavía no hay sesiones registradas.',
    emptyPayments: 'Todavía no hay pagos registrados.',
    emptyGroups: 'No tiene ningún grupo asignado.',
    emptyUpcoming: 'No tiene sesiones próximas.',
    emptyAttendances: 'Todavía no hay asistencia registrada.',
    noGuardian: 'Sin tutor asignado',
  },

  /* ── Secciones ───────────────────────────────────────────────────────────────
     Cada sección declarada en `lib/permissions.js` necesita su `title`: es lo
     que muestra la navegación y el encabezado de la pantalla. El resto de claves
     de cada dominio se añade en la fase que construye esa pantalla.
     ───────────────────────────────────────────────────────────────────────── */
  students: {
    title: 'Alumnos',
    create: 'Nuevo alumno',
    edit: 'Editar alumno',
    emptyTitle: 'Todavía no hay alumnos',
    emptyBody: 'Dé de alta el primer alumno para empezar a matricular y pasar lista.',
    groupsIntro: 'Elija un aula para ver y gestionar sus alumnos.',
    searchGroups: 'Buscar aula',
    viewAllStudents: 'Ver todos los alumnos',
    allStudents: 'Todos los alumnos',
    noGroupsTitle: 'Todavía no hay aulas',
    noGroupsBody: 'Cree los grupos del curso para poder organizar a los alumnos.',
    countLabelOne: 'alumno',
    countLabelMany: 'alumnos',
    emptyGroupTitle: 'Este grupo no tiene alumnos',
    emptyGroupBody: 'Dé de alta un alumno o cambie a otro desde su ficha.',
    emptyUnassignedBody: 'Todos los alumnos tienen ya su grupo asignado.',
    unassignedGroup: 'Sin grupo asignado',
    unassignedHint: 'Asigne un grupo a estos alumnos desde su ficha.',
    countOne: '{count} alumno',
    countMany: '{count} alumnos',
    pagedBlocksNotice: 'Los bloques corresponden a la página mostrada. Un grupo con muchos alumnos puede continuar en la siguiente.',
    fields: {
      fullName: 'Alumno',
      dateOfBirth: 'Fecha de nacimiento',
      schoolName: 'Centro escolar',
      schoolLevel: 'Curso',
      tutorGroup: 'Grupo',
      tutorGroupHint: 'El aula a la que pertenece. Distinto de los grupos de asignatura.',
    },
  },

  guardians: {
    title: 'Tutores',
    create: 'Nuevo tutor',
    edit: 'Editar tutor',
    emptyTitle: 'Todavía no hay tutores',
    emptyBody: 'Los tutores son los responsables de contacto de cada alumno.',
    fields: {
      fullName: 'Tutor',
      relationship: 'Parentesco',
      relationshipHint: 'Por ejemplo: madre, padre, abuela, tutor legal.',
    },
  },

  teachers: {
    title: 'Profesores',
    create: 'Nuevo profesor',
    edit: 'Editar profesor',
    emptyTitle: 'Todavía no hay profesores',
    emptyBody: 'Las fichas de profesor son necesarias para poder asignar grupos.',
    fields: {
      fullName: 'Profesor',
      specialty: 'Especialidad',
      bio: 'Presentación',
    },
  },

  subjects: {
    title: 'Asignaturas',
    create: 'Nueva asignatura',
    edit: 'Editar asignatura',
    emptyTitle: 'Todavía no hay asignaturas',
    emptyBody: 'Cada grupo se imparte sobre una asignatura, así que son el primer paso.',
    fields: {
      monthlyFee: 'Tarifa mensual',
      codeHint: 'Identificador corto y único dentro del centro.',
    },
  },

  tutorGroups: {
    title: 'Grupos',
    create: 'Nuevo grupo',
    edit: 'Editar grupo',
    emptyTitle: 'Todavía no hay grupos',
    emptyBody: 'Cree los grupos del curso para poder organizar a los alumnos por aula.',
    unassigned: 'Sin asignar',
    shifts: {
      morning: 'Mañana',
      afternoon: 'Tarde',
    },
    fields: {
      name: 'Grupo',
      nameHint: 'Como lo llame el centro: «1º ESO», «4º ESO - A».',
      shift: 'Turno',
      academicYear: 'Curso académico',
      tutor: 'Profesor tutor',
      tutorHint: 'Puede dejarse sin asignar y designarlo más adelante.',
      representative: 'Alumno delegado',
      representativeHint: 'Solo pueden designarse alumnos de este grupo.',
      representativeOnCreate: 'Disponible al editar, cuando el grupo tenga alumnos',
      sortOrder: 'Orden',
      sortOrderHint: 'Fija el orden en que aparecen los grupos. Menor número, más arriba.',
    },
  },

  // Grupos DE ASIGNATURA. Renombrada para no dejar dos secciones llamadas
  // «Grupos»: un alumno pertenece a un grupo tutorial y a varios de asignatura.
  classGroups:   { title: 'Grupos de asignatura' },
  enrollments:   { title: 'Matrículas' },
  sessions:      { title: 'Sesiones' },
  attendance:    { title: 'Asistencia' },
  payments:      { title: 'Pagos' },
  users:         { title: 'Cuentas' },
  organizations: { title: 'Organizaciones' },

  /* ── Estados de dominio ──────────────────────────────────────────────────────
     Las claves son los valores que devuelve la API y no se traducen: son
     contrato. Solo se traduce el texto que se muestra.
     ───────────────────────────────────────────────────────────────────────── */
  status: {
    active: 'Activo',
    inactive: 'Inactivo',
    suspended: 'Suspendido',
  },

  attendanceStatus: {
    present: 'Presente',
    absent: 'Ausente',
    late: 'Con retraso',
  },

  paymentStatus: {
    paid: 'Pagado',
    pending: 'Pendiente',
    cancelled: 'Anulado',
  },

  paymentMethod: {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transferencia',
  },

  /* ── Campos compartidos ─────────────────────────────────────────────────────
     Etiquetas que se repiten en varias entidades. Cada dominio puede
     sobrescribir la suya cuando su contexto pida otra palabra.
     ───────────────────────────────────────────────────────────────────────── */
  fields: {
    firstName: 'Nombre',
    lastName: 'Apellidos',
    email: 'Correo',
    phone: 'Teléfono',
    address: 'Dirección',
    notes: 'Observaciones',
    status: 'Estado',
    name: 'Nombre',
    code: 'Código',
    level: 'Nivel',
    description: 'Descripción',
    date: 'Fecha',
    student: 'Alumno',
    guardian: 'Tutor',
    teacher: 'Profesor',
    subject: 'Asignatura',
    group: 'Grupo',
    session: 'Sesión',
    enrollment: 'Matrícula',
    organization: 'Centro',
  },
}
