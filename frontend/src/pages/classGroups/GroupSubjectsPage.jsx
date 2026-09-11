import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Materias de un aula.
 *
 * Es lo que antes se llamaba «Grupos de asignatura» y se creaba a mano en su
 * propia sección del menú. La entidad es la misma —de ella cuelgan las sesiones
 * y las matrículas— pero deja de presentarse como algo aparte: aquí es
 * sencillamente lo que 1º ESBA imparte y con quién.
 *
 * El cambio no es cosmético. Dos centros que estaban evaluando la plataforma
 * crearon 23 aulas y ni un solo grupo de asignatura, y por eso no podían
 * registrar una sesión: se les pedía crear una entidad que en su cabeza no
 * existe. Desde el aula, la pregunta es otra —«¿qué se da en 1º ESBA?»— y esa sí
 * tiene respuesta.
 *
 * El listado se acota EN EL SERVIDOR con `tutor_group_id`, igual que los alumnos
 * de un aula: la pantalla nunca recibe las materias de los demás grupos, así que
 * su coste no crece con el tamaño del centro.
 */
export function GroupSubjectsPage() {
  const { groupId } = useParams()
  const [group, setGroup] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    api.get(`/tutor-groups/${groupId}`, { signal: controller.signal })
      .then(({ data }) => setGroup(data))
      .catch(() => {
        // Un aula inexistente o de otro centro responde 404. No se insiste: el
        // listado saldrá vacío y las migas devuelven al índice.
      })

    return () => controller.abort()
  }, [groupId])

  const title = group
    ? `${group.name} — ${t('classGroups.subjectsOf')}`
    : t('common.loading')

  return (
    <ResourcePage
      breadcrumbs={[
        { label: t('tutorGroups.title'), to: '/grupos' },
        { label: title },
      ]}
      columns={[
        { key: 'subject.name', label: t('fields.subject') },
        {
          key: 'teacher',
          label: t('fields.teacher'),
          // «Sin asignar» explícito y no un hueco: una materia sin profesor es
          // información —nadie puede darle clase— y no un dato que falte por
          // error (FR-027).
          render: (record) => record.teacher?.full_name ?? (
            <span className="text-muted">{t('tutorGroups.unassigned')}</span>
          ),
        },
        { key: 'schedule', label: t('classGroups.fields.schedule') },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      // Al crear desde aquí, la materia nace ya en este aula: es la acción que
      // se espera después de haber entrado en ella, y evita el desplegable de
      // aulas que sería siempre el mismo valor.
      createDefaults={{ tutor_group_id: groupId, academic_year: group?.academic_year }}
      emptyBody={t('classGroups.emptyGroupBody')}
      emptyTitle={t('classGroups.emptyGroupTitle')}
      fields={[
        {
          name: 'subject_id',
          label: t('fields.subject'),
          type: 'relation',
          endpoint: 'subjects',
          optionLabel: (subject) => subject.name,
          required: true,
        },
        {
          name: 'teacher_id',
          label: t('fields.teacher'),
          type: 'relation',
          endpoint: 'teachers',
          optionLabel: (teacher) => teacher.full_name,
          hint: t('classGroups.fields.teacherHint'),
        },
        {
          name: 'code',
          label: t('fields.code'),
          required: true,
          hint: t('classGroups.fields.codeHint'),
        },
        {
          name: 'name',
          label: t('classGroups.fields.name'),
          required: true,
          hint: t('classGroups.fields.nameInGroupHint'),
        },
        {
          name: 'academic_year',
          label: t('classGroups.fields.academicYear'),
          required: true,
        },
        { name: 'schedule', label: t('classGroups.fields.schedule') },
        {
          name: 'capacity',
          label: t('classGroups.fields.capacity'),
          type: 'number',
          step: '1',
          required: true,
          defaultValue: 20,
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
      ]}
      getRecordName={(record) => record.subject?.name ?? record.name}
      listParams={{ tutor_group_id: groupId }}
      pageTitle={title}
      section="classGroups"
    />
  )
}
