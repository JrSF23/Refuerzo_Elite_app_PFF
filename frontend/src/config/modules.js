const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
]

const attendanceOptions = [
  { value: 'present', label: 'Presente' },
  { value: 'absent', label: 'Ausente' },
  { value: 'late', label: 'Con retraso' },
]

const paymentStatusOptions = [
  { value: 'paid', label: 'Pagado' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'cancelled', label: 'Anulado' },
]

const paymentMethodOptions = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
]

const orgAdminOnlyPermissions = {
  access: ['org_admin'],
  create: ['org_admin'],
  edit: ['org_admin'],
  delete: ['org_admin'],
}

const orgAdminWriteTeacherReadPermissions = {
  access: ['org_admin', 'teacher'],
  create: ['org_admin'],
  edit: ['org_admin'],
  delete: ['org_admin'],
}

const staffCrudPermissions = {
  access: ['org_admin', 'teacher'],
  create: ['org_admin', 'teacher'],
  edit: ['org_admin', 'teacher'],
  delete: ['org_admin', 'teacher'],
}

// INVARIANTE — el profesor no accede a ninguna información económica (FR-016).
//
// Los cuatro módulos que ve (alumnos, grupos, sesiones, asistencia) no llevan
// ningún campo monetario, y los tres que sí (asignaturas, matrículas, pagos) le
// están cerrados. La API ya lo deniega; estos permisos hacen que la interfaz ni
// siquiera se lo ofrezca.
//
// Antes de añadir un campo `monthly_fee`, `amount` o equivalente a un módulo con
// `staffCrudPermissions` u `orgAdminWriteTeacherReadPermissions`, hay que cambiar
// primero lo que autoriza el servidor.

export const roleLabels = {
  super_admin: 'Plataforma',
  org_admin: 'Administración',
  teacher: 'Profesor',
  student: 'Alumno',
}

export const staffRoles = ['super_admin', 'org_admin', 'teacher']

// El super administrador no gestiona ni alumnos ni pagos: su alcance se limita a
// las organizaciones y las cuentas. Estas entradas no pasan por ModulePage, tienen
// sus propias páginas.
export const platformModules = [
  { key: 'organizations', label: 'Organizaciones', path: '/espacio/organizaciones', roles: ['super_admin'] },
  { key: 'users', label: 'Cuentas', path: '/espacio/cuentas', roles: ['org_admin'] },
]

export const moduleDefinitions = {
  students: {
    title: 'Alumnos',
    endpoint: 'students',
    permissions: orgAdminWriteTeacherReadPermissions,
    columns: [
      { key: 'full_name', label: 'Alumno' },
      { key: 'school_name', label: 'Centro escolar' },
      { key: 'school_level', label: 'Nivel' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { name: 'guardian_id', label: 'Tutor', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'first_name', label: 'Nombre', type: 'text', required: true },
      { name: 'last_name', label: 'Apellidos', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'date_of_birth', label: 'Fecha de nacimiento', type: 'date' },
      { name: 'school_name', label: 'Centro escolar', type: 'text' },
      { name: 'school_level', label: 'Curso', type: 'text' },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
      { name: 'address', label: 'Dirección', type: 'text' },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
  guardians: {
    title: 'Tutores',
    endpoint: 'guardians',
    permissions: orgAdminOnlyPermissions,
    columns: [
      { key: 'full_name', label: 'Tutor' },
      { key: 'relationship_label', label: 'Parentesco' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Correo' },
    ],
    fields: [
      { name: 'first_name', label: 'Nombre', type: 'text', required: true },
      { name: 'last_name', label: 'Apellidos', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'phone', label: 'Teléfono', type: 'text', required: true },
      { name: 'relationship_label', label: 'Parentesco con el alumno', type: 'text', required: true },
      { name: 'address', label: 'Dirección', type: 'text' },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
  teachers: {
    title: 'Profesores',
    endpoint: 'teachers',
    permissions: orgAdminOnlyPermissions,
    columns: [
      { key: 'full_name', label: 'Profesor' },
      { key: 'specialty', label: 'Especialidad' },
      { key: 'phone', label: 'Teléfono' },
      { key: 'email', label: 'Correo' },
    ],
    fields: [
      { name: 'first_name', label: 'Nombre', type: 'text', required: true },
      { name: 'last_name', label: 'Apellidos', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'specialty', label: 'Especialidad', type: 'text' },
      { name: 'bio', label: 'Presentación', type: 'textarea' },
    ],
  },
  subjects: {
    title: 'Asignaturas',
    endpoint: 'subjects',
    permissions: orgAdminOnlyPermissions,
    columns: [
      { key: 'name', label: 'Asignatura' },
      { key: 'code', label: 'Código' },
      { key: 'level', label: 'Nivel' },
    ],
    fields: [
      { name: 'name', label: 'Asignatura', type: 'text', required: true },
      { name: 'code', label: 'Código', type: 'text', required: true },
      { name: 'level', label: 'Nivel', type: 'text' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
    ],
  },
  classGroups: {
    title: 'Grupos',
    endpoint: 'class-groups',
    permissions: orgAdminWriteTeacherReadPermissions,
    columns: [
      { key: 'name', label: 'Grupo' },
      { key: 'code', label: 'Código' },
      { key: 'academic_year', label: 'Curso' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { name: 'subject_id', label: 'Asignatura', type: 'select', source: 'subjects', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'teacher_id', label: 'Profesor', type: 'select', source: 'teachers', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'name', label: 'Nombre del grupo', type: 'text', required: true },
      { name: 'code', label: 'Código', type: 'text', required: true },
      { name: 'academic_year', label: 'Curso académico', type: 'text', required: true },
      { name: 'schedule', label: 'Horario', type: 'text' },
      { name: 'capacity', label: 'Capacidad', type: 'number', required: true },
      { name: 'start_date', label: 'Inicio', type: 'date' },
      { name: 'end_date', label: 'Fin', type: 'date' },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions },
    ],
  },
  enrollments: {
    title: 'Matrículas',
    endpoint: 'enrollments',
    permissions: orgAdminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Alumno' },
      { key: 'class_group.name', label: 'Grupo' },
      { key: 'status', label: 'Estado' },
      { key: 'monthly_fee', label: 'Tarifa' },
    ],
    fields: [
      { name: 'student_id', label: 'Alumno', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'class_group_id', label: 'Grupo', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'enrolled_at', label: 'Fecha de matrícula', type: 'date', required: true },
      { name: 'monthly_fee', label: 'Tarifa mensual', type: 'number', required: true },
      { name: 'status', label: 'Estado', type: 'select', options: statusOptions, required: true },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
  classSessions: {
    title: 'Sesiones',
    endpoint: 'class-sessions',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'title', label: 'Sesión' },
      { key: 'class_group.name', label: 'Grupo' },
      { key: 'session_date', label: 'Fecha' },
      { key: 'room', label: 'Aula' },
    ],
    fields: [
      { name: 'class_group_id', label: 'Grupo', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'session_date', label: 'Fecha', type: 'date', required: true },
      { name: 'starts_at', label: 'Hora de inicio', type: 'time' },
      { name: 'ends_at', label: 'Hora de fin', type: 'time' },
      { name: 'room', label: 'Aula', type: 'text' },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
  attendances: {
    title: 'Asistencia',
    endpoint: 'attendances',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'student.full_name', label: 'Alumno' },
      { key: 'class_session.title', label: 'Sesión' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { name: 'class_session_id', label: 'Sesión', type: 'select', source: 'class-sessions', optionLabel: 'title', optionValue: 'id', required: true },
      { name: 'student_id', label: 'Alumno', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'status', label: 'Estado', type: 'select', options: attendanceOptions, required: true },
      { name: 'comment', label: 'Comentario', type: 'textarea' },
    ],
  },
  payments: {
    title: 'Pagos',
    endpoint: 'payments',
    permissions: orgAdminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Alumno' },
      { key: 'period_label', label: 'Periodo' },
      { key: 'amount', label: 'Importe' },
      { key: 'status', label: 'Estado' },
    ],
    fields: [
      { name: 'student_id', label: 'Alumno', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'guardian_id', label: 'Tutor', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'enrollment_id', label: 'Matrícula', type: 'select', source: 'enrollments', optionLabel: 'display_label', optionValue: 'id' },
      { name: 'amount', label: 'Importe', type: 'number', required: true },
      { name: 'period_label', label: 'Periodo', type: 'text', required: true },
      { name: 'paid_at', label: 'Fecha de pago', type: 'date', required: true },
      { name: 'payment_method', label: 'Forma de pago', type: 'select', options: paymentMethodOptions, required: true },
      { name: 'status', label: 'Estado', type: 'select', options: paymentStatusOptions, required: true },
      { name: 'reference', label: 'Referencia', type: 'text' },
      { name: 'notes', label: 'Observaciones', type: 'textarea' },
    ],
  },
}

export const sidebarModules = [
  { key: 'students', label: 'Alumnos' },
  { key: 'guardians', label: 'Tutores' },
  { key: 'teachers', label: 'Profesores' },
  { key: 'subjects', label: 'Asignaturas' },
  { key: 'classGroups', label: 'Grupos' },
  { key: 'enrollments', label: 'Matrículas' },
  { key: 'classSessions', label: 'Sesiones' },
  { key: 'attendances', label: 'Asistencia' },
  { key: 'payments', label: 'Pagos' },
]

export function getRoleNames(user) {
  return user?.roles?.map((role) => role.name) ?? []
}

export function hasAnyRole(roleNames, allowedRoles = []) {
  return allowedRoles.some((role) => roleNames.includes(role))
}

export function canAccessModule(definition, roleNames) {
  return hasAnyRole(roleNames, definition?.permissions?.access ?? [])
}

export function canCreateModule(definition, roleNames) {
  return hasAnyRole(roleNames, definition?.permissions?.create ?? [])
}

export function canEditModule(definition, roleNames) {
  return hasAnyRole(roleNames, definition?.permissions?.edit ?? [])
}

export function canDeleteModule(definition, roleNames) {
  return hasAnyRole(roleNames, definition?.permissions?.delete ?? [])
}
