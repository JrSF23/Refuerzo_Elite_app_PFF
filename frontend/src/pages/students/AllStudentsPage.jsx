import { formatNumber, t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { useUrlFilter } from '../../hooks/useUrlFilter.js'
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
 *
 * ── También es el destino del aviso de baja asistencia ──────────────────────
 *
 * Con `?asistencia=baja` la pantalla enseña exactamente los alumnos que el panel
 * ha contado, y añade tres columnas que solo tienen sentido ahí: la asistencia
 * medida, la etapa y el teléfono de quien hay que llamar. Sin ellas el
 * administrador tendría que abrir ficha por ficha, que es lo que este arreglo
 * viene a evitar.
 */
export function AllStudentsPage() {
  const { listParams, activeFilter } = useUrlFilter([
    {
      param: 'asistencia',
      values: {
        baja: {
          params: { attendance: 'low' },
          label: () => t('students.filters.lowAttendance'),
        },
      },
    },
  ])

  const isLowAttendance = listParams?.attendance === 'low'

  const groupColumn = {
    key: 'tutor_group',
    label: t('students.fields.tutorGroup'),
    render: (record) => (record.tutor_group
      ? `${record.tutor_group.name} — ${t(`tutorGroups.shifts.${record.tutor_group.shift}`)}`
      : <span className="text-muted">{t('students.unassignedGroup')}</span>),
  }

  /**
   * La fracción ADEMÁS del porcentaje, y no el porcentaje solo.
   *
   * «50 %» sobre 4 registros y «72,7 %» sobre 22 son situaciones muy distintas y
   * la segunda es la accionable: la primera puede ser un alumno recién
   * matriculado o una semana de gripe. Un porcentaje desnudo pondría delante al
   * caso con menos evidencia justo cuando hay que decidir a quién llamar.
   */
  const attendanceColumn = {
    key: 'attendance',
    label: t('students.fields.attendance'),
    render: (record) => {
      const records = record.attendance_records

      if (!records) return <span className="text-muted">—</span>

      const present = records - (record.attendance_absences ?? 0)
      const rate = (present / records) * 100

      return (
        <span className="tabular">
          {`${present}/${records} · ${formatNumber(rate, { maximumFractionDigits: 1 })} %`}
        </span>
      )
    },
  }

  const stageColumn = {
    key: 'stage',
    label: t('stages.title'),
    render: (record) => record.tutor_group?.stage?.name
      ?? <span className="text-muted">—</span>,
  }

  const guardianPhoneColumn = {
    key: 'guardian.phone',
    label: t('fields.phone'),
  }

  return (
    <ResourcePage
      activeFilter={activeFilter}
      breadcrumbs={[
        { label: t('students.title'), to: '/alumnos' },
        { label: t('students.allStudents') },
      ]}
      columns={isLowAttendance
        ? [
          { key: 'full_name', label: t('students.fields.fullName') },
          attendanceColumn,
          groupColumn,
          stageColumn,
          { key: 'guardian.full_name', label: t('fields.guardian') },
          guardianPhoneColumn,
        ]
        : [
          { key: 'full_name', label: t('students.fields.fullName') },
          groupColumn,
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
      listParams={listParams}
      pageTitle={t('students.allStudents')}
      section="students"
    />
  )
}
