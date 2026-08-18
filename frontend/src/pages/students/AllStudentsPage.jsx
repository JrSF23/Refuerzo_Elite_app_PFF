import { t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { studentFields } from './studentFields.js'

/**
 * Todos los alumnos del centro, sin agrupar.
 *
 * El índice por aulas es la vista principal, pero buscar a alguien de quien no
 * se recuerda el grupo es una necesidad real de la administración. Aquí la
 * búsqueda opera sobre el centro entero.
 *
 * Se muestra el grupo como columna —al revés que en el detalle de un aula, donde
 * sobra— porque es el dato que falta para ubicar al alumno.
 */
export function AllStudentsPage() {
  return (
    <ResourcePage
      breadcrumbs={[
        { label: t('students.title'), to: '/alumnos' },
        { label: t('students.allStudents') },
      ]}
      columns={[
        { key: 'full_name', label: t('students.fields.fullName') },
        {
          key: 'tutor_group',
          label: t('students.fields.tutorGroup'),
          render: (record) => (record.tutor_group
            ? `${record.tutor_group.name} — ${t(`tutorGroups.shifts.${record.tutor_group.shift}`)}`
            : <span className="text-muted">{t('students.unassignedGroup')}</span>),
        },
        { key: 'guardian.full_name', label: t('fields.guardian') },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('students.emptyBody')}
      emptyTitle={t('students.emptyTitle')}
      fields={studentFields()}
      getRecordName={(record) => record.full_name}
      pageTitle={t('students.allStudents')}
      section="students"
    />
  )
}
