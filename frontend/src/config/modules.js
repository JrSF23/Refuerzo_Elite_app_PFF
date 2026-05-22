const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
]

const attendanceOptions = [
  { value: 'present', label: 'Présent' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'En retard' },
]

const paymentStatusOptions = [
  { value: 'paid', label: 'Payé' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annulé' },
]

const paymentMethodOptions = [
  { value: 'cash', label: 'Espèces' },
  { value: 'card', label: 'Carte' },
  { value: 'transfer', label: 'Virement' },
]

const adminOnlyPermissions = {
  access: ['admin'],
  create: ['admin'],
  edit: ['admin'],
  delete: ['admin'],
}

const adminWriteTeacherReadPermissions = {
  access: ['admin', 'teacher'],
  create: ['admin'],
  edit: ['admin'],
  delete: ['admin'],
}

const staffCrudPermissions = {
  access: ['admin', 'teacher'],
  create: ['admin', 'teacher'],
  edit: ['admin', 'teacher'],
  delete: ['admin', 'teacher'],
}

export const roleLabels = {
  admin: 'Administration',
  teacher: 'Enseignant',
  student: 'Élève',
}

export const staffRoles = ['admin', 'teacher']

export const moduleDefinitions = {
  students: {
    title: 'Élèves',
    endpoint: 'students',
    permissions: adminWriteTeacherReadPermissions,
    columns: [
      { key: 'full_name', label: 'Élève' },
      { key: 'school_name', label: 'Établissement' },
      { key: 'school_level', label: 'Niveau' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'guardian_id', label: 'Responsable', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'first_name', label: 'Prénom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'date_of_birth', label: 'Date de naissance', type: 'date' },
      { name: 'school_name', label: 'Établissement', type: 'text' },
      { name: 'school_level', label: 'Niveau scolaire', type: 'text' },
      { name: 'status', label: 'Statut', type: 'select', options: statusOptions },
      { name: 'address', label: 'Adresse', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  guardians: {
    title: 'Responsables',
    endpoint: 'guardians',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'full_name', label: 'Responsable' },
      { key: 'relationship_label', label: 'Lien' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'email', label: 'E-mail' },
    ],
    fields: [
      { name: 'first_name', label: 'Prénom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Téléphone', type: 'text', required: true },
      { name: 'relationship_label', label: "Lien avec l'élève", type: 'text', required: true },
      { name: 'address', label: 'Adresse', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  teachers: {
    title: 'Enseignants',
    endpoint: 'teachers',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'full_name', label: 'Enseignant' },
      { key: 'specialty', label: 'Spécialité' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'email', label: 'E-mail' },
    ],
    fields: [
      { name: 'first_name', label: 'Prénom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Téléphone', type: 'text' },
      { name: 'specialty', label: 'Spécialité', type: 'text' },
      { name: 'bio', label: 'Présentation', type: 'textarea' },
    ],
  },
  subjects: {
    title: 'Matières',
    endpoint: 'subjects',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'name', label: 'Matière' },
      { key: 'code', label: 'Code' },
      { key: 'level', label: 'Niveau' },
      { key: 'monthly_fee', label: 'Tarif mensuel' },
    ],
    fields: [
      { name: 'name', label: 'Matière', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'level', label: 'Niveau', type: 'text' },
      { name: 'monthly_fee', label: 'Tarif mensuel', type: 'number', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
    ],
  },
  classGroups: {
    title: 'Groupes',
    endpoint: 'class-groups',
    permissions: adminWriteTeacherReadPermissions,
    columns: [
      { key: 'name', label: 'Groupe' },
      { key: 'code', label: 'Code' },
      { key: 'academic_year', label: 'Année' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'subject_id', label: 'Matière', type: 'select', source: 'subjects', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'teacher_id', label: 'Enseignant', type: 'select', source: 'teachers', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'name', label: 'Nom du groupe', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'academic_year', label: 'Année académique', type: 'text', required: true },
      { name: 'schedule', label: 'Horaire', type: 'text' },
      { name: 'capacity', label: 'Capacité', type: 'number', required: true },
      { name: 'start_date', label: 'Début', type: 'date' },
      { name: 'end_date', label: 'Fin', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: statusOptions },
    ],
  },
  enrollments: {
    title: 'Inscriptions',
    endpoint: 'enrollments',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Élève' },
      { key: 'class_group.name', label: 'Groupe' },
      { key: 'status', label: 'Statut' },
      { key: 'monthly_fee', label: 'Tarif' },
    ],
    fields: [
      { name: 'student_id', label: 'Élève', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'class_group_id', label: 'Groupe', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'enrolled_at', label: "Date d'inscription", type: 'date', required: true },
      { name: 'monthly_fee', label: 'Tarif mensuel', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: statusOptions, required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  classSessions: {
    title: 'Séances',
    endpoint: 'class-sessions',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'title', label: 'Séance' },
      { key: 'class_group.name', label: 'Groupe' },
      { key: 'session_date', label: 'Date' },
      { key: 'room', label: 'Salle' },
    ],
    fields: [
      { name: 'class_group_id', label: 'Groupe', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'session_date', label: 'Date', type: 'date', required: true },
      { name: 'starts_at', label: 'Heure de début', type: 'time' },
      { name: 'ends_at', label: 'Heure de fin', type: 'time' },
      { name: 'room', label: 'Salle', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  attendances: {
    title: 'Présences',
    endpoint: 'attendances',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'student.full_name', label: 'Élève' },
      { key: 'class_session.title', label: 'Séance' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'class_session_id', label: 'Séance', type: 'select', source: 'class-sessions', optionLabel: 'title', optionValue: 'id', required: true },
      { name: 'student_id', label: 'Élève', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: attendanceOptions, required: true },
      { name: 'comment', label: 'Commentaire', type: 'textarea' },
    ],
  },
  payments: {
    title: 'Paiements',
    endpoint: 'payments',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Élève' },
      { key: 'period_label', label: 'Période' },
      { key: 'amount', label: 'Montant' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'student_id', label: 'Élève', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'guardian_id', label: 'Responsable', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'enrollment_id', label: 'Inscription', type: 'select', source: 'enrollments', optionLabel: 'display_label', optionValue: 'id' },
      { name: 'amount', label: 'Montant', type: 'number', required: true },
      { name: 'period_label', label: 'Période', type: 'text', required: true },
      { name: 'paid_at', label: 'Date de paiement', type: 'date', required: true },
      { name: 'payment_method', label: 'Mode de paiement', type: 'select', options: paymentMethodOptions, required: true },
      { name: 'status', label: 'Statut', type: 'select', options: paymentStatusOptions, required: true },
      { name: 'reference', label: 'Référence', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
}

export const sidebarModules = [
  { key: 'students', label: 'Élèves' },
  { key: 'guardians', label: 'Responsables' },
  { key: 'teachers', label: 'Enseignants' },
  { key: 'subjects', label: 'Matières' },
  { key: 'classGroups', label: 'Groupes' },
  { key: 'enrollments', label: 'Inscriptions' },
  { key: 'classSessions', label: 'Séances' },
  { key: 'attendances', label: 'Présences' },
  { key: 'payments', label: 'Paiements' },
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
