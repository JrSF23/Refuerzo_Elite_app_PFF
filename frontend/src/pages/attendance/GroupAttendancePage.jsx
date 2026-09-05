import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { formatDate, t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { AttendanceStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Asistencia de un grupo.
 *
 * Segunda mitad del índice: aquí sí se listan registros, pero **acotados al
 * grupo y paginados dentro de él**. El recorte lo hace el servidor con
 * `class_group_id`, así que la pantalla nunca recibe la asistencia de los demás
 * grupos y su coste no crece con el tamaño del centro.
 *
 * ── Lo que cambia respecto a la lista general ────────────────────────────────
 *
 * Desaparece la columna de grupo —es la misma en todas las filas— y el
 * desplegable de sesión se acota a las de ESTE grupo. Antes ofrecía todas las
 * sesiones del centro, que es donde se cometía el error: pasar lista de 1º ESBA
 * sobre una sesión de 3º porque los títulos se parecen.
 *
 * Es la pantalla de uso DIARIO del profesor y casi siempre desde el móvil, así
 * que es la que más exige de la representación por tarjetas. El estado va con
 * color Y texto: el color por sí solo no transmite nada a quien no lo distingue.
 */
export function GroupAttendancePage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    api.get(`/class-groups/${groupId}`, { signal: controller.signal })
      .then(({ data }) => setGroup(data))
      .catch(() => {
        // Un grupo que no se alcanza responde 404. No se insiste: el listado
        // saldrá vacío y las migas devuelven al índice.
      })

    return () => controller.abort()
  }, [groupId])

  const title = group
    ? (group.tutor_group
      ? `${group.tutor_group.name} — ${group.subject?.name ?? group.name}`
      : group.name)
    : t('common.loading')

  const teacherLine = group
    ? `${t('fields.teacher')}: ${group.teacher?.full_name ?? t('tutorGroups.unassigned')}`
    : null

  return (
    <ResourcePage
      breadcrumbs={[
        { label: t('attendance.title'), to: '/asistencia' },
        { label: title },
      ]}
      columns={[
        { key: 'student.full_name', label: t('fields.student') },
        { key: 'class_session.title', label: t('fields.session') },
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
      emptyBody={t('attendance.emptyGroupBody')}
      emptyTitle={t('attendance.emptyGroupTitle')}
      fields={[
        {
          name: 'class_session_id',
          label: t('fields.session'),
          type: 'relation',
          endpoint: 'class-sessions',
          // Solo las sesiones de este grupo. Es lo que impide pasar lista sobre
          // la sesión de otro grupo por parecido de título.
          params: { class_group_id: groupId },
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
            { value: 'excused', label: t('attendanceStatus.excused') },
          ],
        },
        { name: 'comment', label: t('attendance.fields.comment'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.student?.full_name ?? ''}
      listParams={{ class_group_id: groupId }}
      pageTitle={title}
      section="attendance"
      subtitle={teacherLine}
    />
  )
}
