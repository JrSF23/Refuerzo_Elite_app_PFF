const statusOptions = [
  { value: 'active', label: 'Actif' },
  { value: 'inactive', label: 'Inactif' },
]

const attendanceOptions = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Retard' },
]

const paymentStatusOptions = [
  { value: 'paid', label: 'Paye' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annule' },
]

const paymentMethodOptions = [
  { value: 'cash', label: 'Especes' },
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
  student: 'Etudiant',
}

export const staffRoles = ['admin', 'teacher']

export const moduleDefinitions = {
  students: {
    title: 'Eleves',
    endpoint: 'students',
    permissions: adminWriteTeacherReadPermissions,
    columns: [
      { key: 'full_name', label: 'Eleve' },
      { key: 'school_name', label: 'Etablissement' },
      { key: 'school_level', label: 'Niveau' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'guardian_id', label: 'Responsable', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'first_name', label: 'Prenom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Telephone', type: 'text' },
      { name: 'date_of_birth', label: 'Date de naissance', type: 'date' },
      { name: 'school_name', label: 'Etablissement', type: 'text' },
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
      { key: 'phone', label: 'Telephone' },
      { key: 'email', label: 'E-mail' },
    ],
    fields: [
      { name: 'first_name', label: 'Prenom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Telephone', type: 'text', required: true },
      { name: 'relationship_label', label: 'Lien avec l eleve', type: 'text', required: true },
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
      { key: 'specialty', label: 'Specialite' },
      { key: 'phone', label: 'Telephone' },
      { key: 'email', label: 'E-mail' },
    ],
    fields: [
      { name: 'first_name', label: 'Prenom', type: 'text', required: true },
      { name: 'last_name', label: 'Nom', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email' },
      { name: 'phone', label: 'Telephone', type: 'text' },
      { name: 'specialty', label: 'Specialite', type: 'text' },
      { name: 'bio', label: 'Presentation', type: 'textarea' },
    ],
  },
  subjects: {
    title: 'Matieres',
    endpoint: 'subjects',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'name', label: 'Matiere' },
      { key: 'code', label: 'Code' },
      { key: 'level', label: 'Niveau' },
      { key: 'monthly_fee', label: 'Tarif mensuel' },
    ],
    fields: [
      { name: 'name', label: 'Matiere', type: 'text', required: true },
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
      { key: 'academic_year', label: 'Annee' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'subject_id', label: 'Matiere', type: 'select', source: 'subjects', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'teacher_id', label: 'Enseignant', type: 'select', source: 'teachers', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'name', label: 'Nom du groupe', type: 'text', required: true },
      { name: 'code', label: 'Code', type: 'text', required: true },
      { name: 'academic_year', label: 'Annee academique', type: 'text', required: true },
      { name: 'schedule', label: 'Horaire', type: 'text' },
      { name: 'capacity', label: 'Capacite', type: 'number', required: true },
      { name: 'start_date', label: 'Debut', type: 'date' },
      { name: 'end_date', label: 'Fin', type: 'date' },
      { name: 'status', label: 'Statut', type: 'select', options: statusOptions },
    ],
  },
  enrollments: {
    title: 'Inscriptions',
    endpoint: 'enrollments',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Eleve' },
      { key: 'class_group.name', label: 'Groupe' },
      { key: 'status', label: 'Statut' },
      { key: 'monthly_fee', label: 'Tarif' },
    ],
    fields: [
      { name: 'student_id', label: 'Eleve', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'class_group_id', label: 'Groupe', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'enrolled_at', label: 'Date d inscription', type: 'date', required: true },
      { name: 'monthly_fee', label: 'Tarif mensuel', type: 'number', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: statusOptions, required: true },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  classSessions: {
    title: 'Seances',
    endpoint: 'class-sessions',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'title', label: 'Seance' },
      { key: 'class_group.name', label: 'Groupe' },
      { key: 'session_date', label: 'Date' },
      { key: 'room', label: 'Salle' },
    ],
    fields: [
      { name: 'class_group_id', label: 'Groupe', type: 'select', source: 'class-groups', optionLabel: 'name', optionValue: 'id', required: true },
      { name: 'title', label: 'Titre', type: 'text', required: true },
      { name: 'session_date', label: 'Date', type: 'date', required: true },
      { name: 'starts_at', label: 'Heure de debut', type: 'time' },
      { name: 'ends_at', label: 'Heure de fin', type: 'time' },
      { name: 'room', label: 'Salle', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  attendances: {
    title: 'Presences',
    endpoint: 'attendances',
    permissions: staffCrudPermissions,
    columns: [
      { key: 'student.full_name', label: 'Eleve' },
      { key: 'class_session.title', label: 'Seance' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'class_session_id', label: 'Seance', type: 'select', source: 'class-sessions', optionLabel: 'title', optionValue: 'id', required: true },
      { name: 'student_id', label: 'Eleve', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'status', label: 'Statut', type: 'select', options: attendanceOptions, required: true },
      { name: 'comment', label: 'Commentaire', type: 'textarea' },
    ],
  },
  payments: {
    title: 'Paiements',
    endpoint: 'payments',
    permissions: adminOnlyPermissions,
    columns: [
      { key: 'student.full_name', label: 'Eleve' },
      { key: 'period_label', label: 'Periode' },
      { key: 'amount', label: 'Montant' },
      { key: 'status', label: 'Statut' },
    ],
    fields: [
      { name: 'student_id', label: 'Eleve', type: 'select', source: 'students', optionLabel: 'full_name', optionValue: 'id', required: true },
      { name: 'guardian_id', label: 'Responsable', type: 'select', source: 'guardians', optionLabel: 'full_name', optionValue: 'id' },
      { name: 'enrollment_id', label: 'Inscription', type: 'select', source: 'enrollments', optionLabel: 'id', optionValue: 'id' },
      { name: 'amount', label: 'Montant', type: 'number', required: true },
      { name: 'period_label', label: 'Periode', type: 'text', required: true },
      { name: 'paid_at', label: 'Date de paiement', type: 'date', required: true },
      { name: 'payment_method', label: 'Mode de paiement', type: 'select', options: paymentMethodOptions, required: true },
      { name: 'status', label: 'Statut', type: 'select', options: paymentStatusOptions, required: true },
      { name: 'reference', label: 'Reference', type: 'text' },
      { name: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
}

export const sidebarModules = [
  { key: 'students', label: 'Eleves' },
  { key: 'guardians', label: 'Responsables' },
  { key: 'teachers', label: 'Enseignants' },
  { key: 'subjects', label: 'Matieres' },
  { key: 'classGroups', label: 'Groupes' },
  { key: 'enrollments', label: 'Inscriptions' },
  { key: 'classSessions', label: 'Seances' },
  { key: 'attendances', label: 'Presences' },
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
