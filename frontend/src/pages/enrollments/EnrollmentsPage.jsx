import { formatAmount, formatDate, t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Matrículas: qué alumno cursa qué grupo de asignatura, y con qué cuota.
 *
 * CERRADA AL PROFESOR: lleva `monthly_fee`, y es una de las tres entidades con
 * campos monetarios que el servidor le veda.
 *
 * Sin caja de búsqueda: el endpoint no declara campos buscables, así que el
 * parámetro se ignoraría. Ofrecerla sería mentir sobre lo que hace.
 */
export function EnrollmentsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'student.full_name', label: t('fields.student') },
        { key: 'class_group.name', label: t('fields.group') },
        {
          key: 'enrolled_at',
          label: t('enrollments.fields.enrolledAt'),
          render: (record) => formatDate(record.enrolled_at),
        },
        {
          key: 'monthly_fee',
          label: t('enrollments.fields.amount'),
          render: (record) => <span className="tabular">{formatAmount(record.monthly_fee)}</span>,
        },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('enrollments.emptyBody')}
      emptyTitle={t('enrollments.emptyTitle')}
      fields={[
        {
          name: 'student_id',
          label: t('fields.student'),
          type: 'relation',
          endpoint: 'students',
          optionLabel: (student) => student.full_name,
          required: true,
        },
        {
          name: 'class_group_id',
          label: t('fields.group'),
          type: 'relation',
          endpoint: 'class-groups',
          optionLabel: (group) => group.name,
          required: true,
        },
        {
          name: 'enrolled_at',
          label: t('enrollments.fields.enrolledAt'),
          type: 'date',
          required: true,
        },
        {
          name: 'monthly_fee',
          label: t('enrollments.fields.amount'),
          type: 'number',
          required: true,
          hint: t('enrollments.fields.amountHint'),
        },
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
        { name: 'notes', label: t('fields.notes'), type: 'textarea' },
      ]}
      getRecordName={(record) => `${record.student?.full_name ?? ''} — ${record.class_group?.name ?? ''}`}
      section="enrollments"
    />
  )
}
