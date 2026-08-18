import { t } from '../../i18n/index.js'

/**
 * Campos del formulario de alumno.
 *
 * Compartidos por las dos pantallas que lo abren —el listado de un grupo y el de
 * todos—, para que no puedan divergir. Es una función y no una constante porque
 * los rótulos se resuelven con `t()` en el momento de usarse.
 */
export function studentFields() {
  return [
    { name: 'first_name', label: t('fields.firstName'), required: true },
    { name: 'last_name', label: t('fields.lastName'), required: true },
    {
      name: 'tutor_group_id',
      label: t('students.fields.tutorGroup'),
      type: 'relation',
      endpoint: 'tutor-groups',
      optionLabel: (group) => `${group.name} — ${t(`tutorGroups.shifts.${group.shift}`)}`,
      hint: t('students.fields.tutorGroupHint'),
    },
    { name: 'email', label: t('fields.email'), type: 'email' },
    { name: 'phone', label: t('fields.phone'), type: 'tel' },
    { name: 'date_of_birth', label: t('students.fields.dateOfBirth'), type: 'date' },
    { name: 'school_name', label: t('students.fields.schoolName') },
    { name: 'school_level', label: t('students.fields.schoolLevel') },
    {
      name: 'status',
      label: t('fields.status'),
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { value: 'active', label: t('status.active') },
        { value: 'inactive', label: t('status.inactive') },
      ],
    },
    {
      name: 'guardian_id',
      label: t('fields.guardian'),
      type: 'relation',
      endpoint: 'guardians',
      optionLabel: (guardian) => guardian.full_name,
    },
    { name: 'address', label: t('fields.address') },
    { name: 'notes', label: t('fields.notes'), type: 'textarea' },
  ]
}
