import { formatDate, t } from '../../i18n/index.js'
import { AttendanceStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Asistencia.
 *
 * Es la pantalla de uso DIARIO del profesor y casi siempre desde el móvil, así
 * que es la que más exige de la representación por tarjetas: con cinco columnas
 * cambia de forma pronto, y aquí eso es lo correcto.
 *
 * El estado va con color Y texto: el color por sí solo no transmite nada a quien
 * no lo distingue.
 */
export function AttendancePage() {
  return (
    <ResourcePage
      columns={[
        { key: 'student.full_name', label: t('fields.student') },
        { key: 'class_session.title', label: t('fields.session') },
        { key: 'class_session.class_group.name', label: t('fields.group') },
        {
          key: 'created_at',
          label: t('fields.date'),
          render: (record) => formatDate(record.created_at),
        },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <AttendanceStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('attendance.emptyBody')}
      emptyTitle={t('attendance.emptyTitle')}
      fields={[
        {
          name: 'class_session_id',
          label: t('fields.session'),
          type: 'relation',
          endpoint: 'class-sessions',
          optionLabel: (session) => session.title,
          required: true,
        },
        {
          name: 'student_id',
          label: t('fields.student'),
          type: 'relation',
          endpoint: 'students',
          optionLabel: (student) => student.full_name,
          required: true,
        },
        {
          name: 'status',
          label: t('fields.status'),
          type: 'select',
          required: true,
          defaultValue: 'present',
          options: [
            { value: 'present', label: t('attendanceStatus.present') },
            { value: 'absent', label: t('attendanceStatus.absent') },
            { value: 'late', label: t('attendanceStatus.late') },
          ],
        },
        { name: 'comment', label: t('attendance.fields.comment'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.student?.full_name ?? ''}
      section="attendance"
    />
  )
}
