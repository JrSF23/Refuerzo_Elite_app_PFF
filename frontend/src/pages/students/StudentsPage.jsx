import { t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Alumnos.
 *
 * El profesor llega aquí en SOLO LECTURA y ve únicamente los alumnos
 * matriculados en sus grupos. Ese recorte lo aplica el servidor, no esta
 * pantalla; `ResourcePage` solo deja de ofrecer las acciones de escritura
 * porque el rol no las tiene (US3.4).
 */
export function StudentsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'full_name', label: t('students.fields.fullName') },
        { key: 'guardian.full_name', label: t('fields.guardian') },
        { key: 'school_level', label: t('students.fields.schoolLevel') },
        { key: 'phone', label: t('fields.phone') },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('students.emptyBody')}
      emptyTitle={t('students.emptyTitle')}
      fields={[
        { name: 'first_name', label: t('fields.firstName'), required: true },
        { name: 'last_name', label: t('fields.lastName'), required: true },
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
          // Obligatorio en la API: sin valor por defecto, crear un alumno
          // fallaría con un error de validación evitable.
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
      ]}
      getRecordName={(record) => record.full_name}
      section="students"
    />
  )
}
