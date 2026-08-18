import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { studentFields } from './studentFields.js'

/**
 * Alumnos de un grupo concreto.
 *
 * Segunda mitad del índice de aulas: aquí sí se listan alumnos, pero **acotados
 * al grupo y paginados dentro de él**. Es lo que hace que la sección funcione
 * con 500 alumnos: ninguna pantalla carga más de una página de un solo grupo.
 *
 * La ruta acepta `sin-asignar` además de un identificador, porque los alumnos
 * pendientes de adscribir son un destino real del índice aunque no sean un grupo.
 */
export function GroupStudentsPage() {
  const { groupId } = useParams()
  const isUnassigned = groupId === 'sin-asignar'

  const [group, setGroup] = useState(null)

  useEffect(() => {
    if (isUnassigned) return undefined

    const controller = new AbortController()

    api.get(`/tutor-groups/${groupId}`, { signal: controller.signal })
      .then(({ data }) => setGroup(data))
      .catch(() => {
        // Un grupo inexistente o de otro centro responde 404. No se insiste: el
        // listado de abajo saldrá vacío y las migas devuelven al índice.
      })

    return () => controller.abort()
  }, [groupId, isUnassigned])

  const title = isUnassigned
    ? t('students.unassignedGroup')
    : group
      ? `${group.name} — ${t(`tutorGroups.shifts.${group.shift}`)}`
      : t('common.loading')

  const tutorLine = isUnassigned
    ? t('students.unassignedHint')
    : group
      ? `${t('tutorGroups.fields.tutor')}: ${group.tutor?.full_name ?? t('tutorGroups.unassigned')}`
      : null

  return (
    <ResourcePage
      breadcrumbs={[
        { label: t('students.title'), to: '/alumnos' },
        { label: title },
      ]}
      columns={[
        { key: 'full_name', label: t('students.fields.fullName') },
        { key: 'guardian.full_name', label: t('fields.guardian') },
        { key: 'phone', label: t('fields.phone') },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={isUnassigned ? t('students.emptyUnassignedBody') : t('students.emptyGroupBody')}
      emptyTitle={t('students.emptyGroupTitle')}
      fields={studentFields()}
      getRecordName={(record) => record.full_name}
      // Acota el listado en el SERVIDOR. La pantalla nunca recibe alumnos de
      // otros grupos, así que su coste no crece con el tamaño del centro.
      listParams={{ tutor_group_id: isUnassigned ? 'none' : groupId }}
      pageTitle={title}
      section="students"
      subtitle={tutorLine}
      // Al crear desde aquí, el alumno nace ya en este grupo: es la acción que
      // el usuario espera después de haber entrado en él.
      createDefaults={isUnassigned ? undefined : { tutor_group_id: groupId }}
    />
  )
}
