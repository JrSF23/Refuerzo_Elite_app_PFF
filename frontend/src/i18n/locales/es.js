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
    view: 'Ver',
    select: 'Seleccione',
    noOptions: 'No hay opciones disponibles',

    // Selector con búsqueda
    typeToSearch: 'Escriba para buscar…',
    clearSelection: 'Quitar la selección',
    noResultsFor: 'Sin resultados para «{term}».',
    // Salida de un listado vacío: la búsqueda puede haber sido por algo que el
    // servidor no indexa, y sin esto no habría manera de volver al catálogo.
    showAll: 'Ver todas las opciones',
    unresolvedOption: 'Registro no disponible',
    // Se avisa del recorte en lugar de callarlo: un listado truncado en silencio
    // hace concluir que el registro no existe.
    moreResults: 'Se muestran {shown} de {total}. Afine la búsqueda.',
    truncatedOptions: 'Se muestran las primeras {shown} de {total} opciones.',
    optionsAvailable: {
      one: '{count} opción disponible',
      many: '{count} opciones disponibles',
    },

    actions: 'Acciones',
    viewAll: 'Ver todo',

    // Fechas. dd/mm/aaaa en todas partes, sin depender del idioma del navegador.
    datePlaceholder: 'dd/mm/aaaa',
    openCalendar: 'Abrir el calendario',
    invalidDate: 'La fecha no es válida. Use el formato dd/mm/aaaa.',

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
    unreachableTitle: 'No se puede contactar con el servidor',
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

  theme: {
    // «Modo oscuro» y no «Apariencia»: el control es una casilla, y
    // `aria-checked` tiene que responder a una pregunta de sí o no. «Apariencia:
    // activada» no significa nada.
    darkMode: 'Modo oscuro',
  },

  dashboard: {
    title: 'Panel',

    // El saludo cambia con la hora. Un «Buenos días» fijo a las nueve de la
    // noche delata que nadie mira la pantalla, y es lo primero que se lee.
    greetingMorning: '¡Buenos días, {name}!',
    greetingAfternoon: '¡Buenas tardes, {name}!',
    greetingEvening: '¡Buenas noches, {name}!',

    stats: {
      students: 'Alumnos',
      teachers: 'Profesores',
      groups: 'Grupos',
      attendances: 'Registros de asistencia',
      attendanceRate: 'Asistencia',
      payments: 'Pagos',
      pendingPayments: 'Pagos pendientes',
      needsAttention: 'Requieren atención',
      myGroups: 'Mis grupos',
      myStudents: 'Mis alumnos',
      upcomingSessions: 'Próximas sesiones',
    },

    attendance: {
    groupsIntro: 'Elija un grupo para ver y registrar su asistencia. Cada grupo lleva su propio recuento y su propia lista.',
    searchGroups: 'Buscar grupo',
    noGroupsTitle: 'Todavía no hay grupos',
    noGroupsBody: 'La asistencia se registra dentro de un grupo. Añada las materias de un aula desde Grupos para poder pasar lista.',
    sessionCountOne: 'sesión',
    sessionCountMany: 'sesiones',
    emptyGroupTitle: 'Este grupo no tiene asistencia registrada',
    emptyGroupBody: 'Registre la asistencia de una de sus sesiones. Solo se ofrecen las sesiones de este grupo.',
      title: 'Asistencia',
      noTrend: 'Todavía no hay asistencia registrada esta semana.',
      // Iniciales del día en castellano: el miércoles es X para no chocar con
      // el martes.
      days: {
        mon: 'L',
        tue: 'M',
        wed: 'X',
        thu: 'J',
        fri: 'V',
      },
      // La dirección se dice con palabras y no solo con la flecha: un lector de
      // pantalla que anuncia «flecha arriba 3,2» no comunica nada.
      delta: {
        up: '{value} puntos más que la semana anterior',
        down: '{value} puntos menos que la semana anterior',
        flat: 'Igual que la semana anterior',
      },
    },

    attention: {
      title: 'Requiere atención',
      pendingPayments: '{count} pagos pendientes de cobro',
      lowAttendance: '{count} alumnos con asistencia inferior al 75%',
      groupsWithoutTeacher: '{count} grupos sin profesor asignado',
      // El caso invisible: la ficha del grupo se ve rellena, pero su profesor
      // imparte otra materia —o ninguna— y por tanto no alcanza el grupo.
      groupsSubjectMismatch: '{count} grupos cuyo profesor no imparte esa materia',
    },

    recentStudents: 'Últimas altas',
    recentSessions: 'Últimas sesiones',
    recentPayments: 'Últimos pagos',
    myGroups: 'Mis grupos',
    upcomingSessions: 'Próximas sesiones',
    // El panel del profesor ya no lista asistencia suelta: sus grupos son el
    // panel, y cada uno entra directo a pasar lista.
    groupStudents: '{count} alumnos',
    teacherUnlinkedTitle: 'Cuenta sin ficha de profesor',
    teacherUnlinkedBody: 'Su cuenta todavía no está vinculada a una ficha de profesor, así que no se muestran grupos ni sesiones. Pida a la administración del centro que complete la vinculación.',
    emptyStudents: 'Todavía no hay alumnos dados de alta.',
    emptySessions: 'Todavía no hay sesiones registradas.',
    emptyPayments: 'Todavía no hay pagos registrados.',
    emptyGroups: 'No tiene ningún grupo asignado.',
    emptyUpcoming: 'No tiene sesiones próximas.',
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
      subjectHint: 'Decide a qué grupos y sesiones llega su cuenta. Sin materia, el profesor entra pero no ve ningún grupo.',
      bio: 'Presentación',
    },
  },

  stages: {
    title: 'Etapas',
    create: 'Nueva etapa',
    edit: 'Editar etapa',
    emptyTitle: 'Todavía no hay etapas',
    emptyBody: 'La etapa fija lo que paga un alumno. Créelas antes de asignar aulas: Pre-escolar, Primaria, ESBA y Bachillerato son las del sistema educativo de Guinea Ecuatorial.',
    fields: {
      name: 'Etapa',
      fee: 'Cuota del curso',
      // Lo que evita la pregunta que llega siempre: si es al año o al mes, y si
      // el importe lo pone el sistema o el centro.
      feeHint: 'Importe del curso académico completo. Lo fija su centro; se puede cobrar a plazos.',
      groups: 'Aulas',
      order: 'Orden',
      orderHint: 'Orden en que aparecen. Menor primero, para listarlas por nivel y no por alfabeto.',
    },
  },

  subjects: {
    title: 'Asignaturas',
    create: 'Nueva asignatura',
    edit: 'Editar asignatura',
    emptyTitle: 'Todavía no hay asignaturas',
    emptyBody: 'Cada grupo se imparte sobre una asignatura, así que son el primer paso.',
    fields: {
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
      stage: 'Etapa',
      stageHint: 'Determina la cuota que pagan sus alumnos. Sin etapa, el aula funciona pero sus alumnos no tienen cuota asignada.',
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
  classGroups: {
    subjectsOf: 'Materias',
    emptyGroupTitle: 'Este grupo todavía no imparte ninguna materia',
    emptyGroupBody: 'Añada las materias que se dan en este grupo y quién las imparte. Sin al menos una, no se pueden registrar sesiones ni pasar lista.',
    title: 'Grupos de asignatura',
    create: 'Nuevo grupo de asignatura',
    edit: 'Editar grupo de asignatura',
    emptyTitle: 'Todavía no hay grupos de asignatura',
    emptyBody: 'Cada grupo imparte una asignatura. Cree primero las asignaturas y los profesores.',
    fields: {
      teacherHint: 'Quien imparte esta materia en este grupo. Puede dejarse sin asignar.',
      nameInGroupHint: 'Como lo llame el centro. Si lo deja en blanco no pasa nada: lo que se ve en las listas es «grupo — materia».',
      name: 'Grupo',
      codeHint: 'Identificador corto y único dentro del centro.',
      academicYear: 'Curso académico',
      schedule: 'Horario',
      capacity: 'Capacidad',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de fin',
    },
  },
  enrollments: {
    title: 'Matrículas',
    create: 'Nueva matrícula',
    edit: 'Editar matrícula',
    emptyTitle: 'Todavía no hay matrículas',
    emptyBody: 'La matrícula conecta a un alumno con un grupo de asignatura y fija su cuota.',
    fields: {
      enrolledAt: 'Fecha de matrícula',
      // «Monto», sin periodicidad. La columna de la base de datos se llama
      // `monthly_fee` y no se toca —es contrato de API—, pero el rótulo no puede
      // afirmar que el cobro es mensual: no todos los centros facturan así.
      amount: 'Monto',
      // Ya no se compara con «la tarifa de la asignatura»: esa columna se
      // eliminó porque el cobro va por curso, no por materia. Aquí es donde se
      // fija el importe, así que la pista tiene que decir eso.
      amountHint: 'Importe acordado para este alumno en este grupo.',
    },
  },

  sessions: {
    title: 'Sesiones',
    create: 'Nueva sesión',
    edit: 'Editar sesión',
    emptyTitle: 'Todavía no hay sesiones',
    emptyBody: 'Cree las sesiones de un grupo para poder registrar su asistencia.',
    fields: {
      title: 'Sesión',
      date: 'Fecha',
      time: 'Horario',
      startsAt: 'Hora de inicio',
      endsAt: 'Hora de fin',
      room: 'Aula',
      taught: 'Impartida',
    },
    markTaught: 'Marcar impartida',
    markTitle: 'Marcar «{name}» como impartida',
    marked: 'Sesión marcada como impartida.',
    markConfirm: 'Marcar «{name}» como impartida? Esta marca no se puede deshacer.',
    taughtBy: 'Marcada por {name}',
  },

  attendance: {
    title: 'Asistencia',
    create: 'Registrar asistencia',
    edit: 'Editar asistencia',
    emptyTitle: 'Todavía no hay asistencia registrada',
    emptyBody: 'Registre la asistencia de una sesión para llevar su seguimiento.',
    fields: {
      comment: 'Comentario',
    },
  },

  payments: {
    title: 'Pagos',
    create: 'Registrar pago',
    edit: 'Editar pago',
    emptyTitle: 'Todavía no hay pagos',
    emptyBody: 'Registre los cobros del centro para llevar su seguimiento.',
    fields: {
      amount: 'Importe',
      period: 'Periodo',
      periodHint: 'Por ejemplo: «Octubre 2025» o «1er trimestre».',
      paidAt: 'Fecha de pago',
      method: 'Forma de pago',
      reference: 'Referencia',
      enrollmentHint: 'Debe ser una matrícula del alumno seleccionado.',
    },
  },

  users: {
    // «Usuarios» rotula la sección; dentro se sigue hablando de CUENTA, que es
    // el objeto que se crea. No son sinónimos aquí: una persona puede tener
    // ficha de profesor sin tener cuenta de acceso, y esa distinción sostiene
    // todo el vínculo `teachers.user_id`.
    title: 'Usuarios',
    create: 'Nueva cuenta',
    edit: 'Editar cuenta',
    emptyTitle: 'Todavía no hay cuentas',
    emptyBody: 'Cree las cuentas del personal para que pueda acceder a la aplicación.',
    fields: {
      name: 'Nombre',
      username: 'Usuario',
      usernameHint: 'Con él o con el correo se accede a la aplicación.',
      password: 'Contraseña',
      passwordHint: 'Al editar, déjela vacía para no cambiarla. Mínimo 8 caracteres.',
      role: 'Rol',
      organizationHint: 'Un administrador de plataforma no pertenece a ningún centro.',
      teacherProfile: 'Ficha de profesor',
      teacherProfileHint: 'Vincula la cuenta con su ficha. Sin ella, el profesor no ve grupos ni sesiones.',
    },
  },

  organizations: {
    title: 'Organizaciones',
    create: 'Nueva organización',
    edit: 'Editar organización',
    emptyTitle: 'Todavía no hay organizaciones',
    emptyBody: 'Cada organización es un centro educativo con sus propios datos.',
    suspend: 'Suspender',
    activate: 'Activar',
    suspended: 'Organización suspendida. Su personal deja de tener acceso.',
    activated: 'Organización activada.',
    fields: {
      name: 'Centro',
      slug: 'Identificador',
      slugHint: 'Se deriva del nombre si se deja vacío.',
      contactEmail: 'Correo de contacto',
      contactPhone: 'Teléfono de contacto',
      users: 'Usuarios',
    },
  },

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
    excused: 'Justificado',
  },

  sessionStatus: {
    taught: 'Impartida',
    pending: 'Pendiente',
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
