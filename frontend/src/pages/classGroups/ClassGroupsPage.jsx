import { t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { useUrlFilter } from '../../hooks/useUrlFilter.js'

/**
 * Grupos de asignatura.
 *
 * NO son las aulas. Un alumno pertenece a UN grupo tutorial y a VARIOS de
 * asignatura, cada uno con su profesor; se llega a ellos por matrícula.
 *
 * El profesor los consulta en solo lectura, y solo ve los que imparte: ese
 * recorte lo aplica el servidor.
 */
export function ClassGroupsPage() {
  // `?profesor=sin-asignar` es a donde apunta el aviso del panel. El convenio
  // `sin-asignar` → `none` es el mismo que usan los alumnos sin aula.
  const { listParams, activeFilter } = useUrlFilter([
    {
      param: 'profesor',
      values: {
        'sin-asignar': {
          params: { teacher_id: 'none' },
          label: () => t('classGroups.filters.withoutTeacher'),
        },
        descuadrado: {
          params: { teacher_id: 'mismatch' },
          label: () => t('classGroups.filters.subjectMismatch'),
        },
      },
    },
  ])

  return (
    <ResourcePage
      activeFilter={activeFilter}
      listParams={listParams}
      columns={[
        { key: 'name', label: t('classGroups.fields.name') },
        { key: 'subject.name', label: t('fields.subject') },
        { key: 'teacher.full_name', label: t('fields.teacher') },
        { key: 'academic_year', label: t('classGroups.fields.academicYear') },
        { key: 'schedule', label: t('classGroups.fields.schedule') },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('classGroups.emptyBody')}
      emptyTitle={t('classGroups.emptyTitle')}
      fields={[
        { name: 'name', label: t('classGroups.fields.name'), required: true },
        {
          name: 'code',
          label: t('fields.code'),
          required: true,
          hint: t('classGroups.fields.codeHint'),
        },
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
        },
        {
          name: 'academic_year',
          label: t('classGroups.fields.academicYear'),
          required: true,
          defaultValue: '2025-2026',
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
        { name: 'start_date', label: t('classGroups.fields.startDate'), type: 'date' },
        { name: 'end_date', label: t('classGroups.fields.endDate'), type: 'date' },
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
      getRecordName={(record) => record.name}
      section="classGroups"
    />
  )
}
