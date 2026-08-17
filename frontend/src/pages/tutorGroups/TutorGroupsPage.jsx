import { EMPTY_VALUE, t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Grupos tutoriales: las aulas del centro.
 *
 * NO confundir con «Grupos de asignatura» (`class-groups`). Un alumno pertenece
 * a UN grupo tutorial y a VARIOS grupos de asignatura; solo el primero tiene
 * profesor tutor y alumno delegado.
 *
 * El profesor llega aquí en solo lectura. Es la primera sección en la que puede
 * leer sin escribir, y puede hacerlo porque no hay ningún campo monetario.
 */
export function TutorGroupsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('tutorGroups.fields.name') },
        {
          key: 'shift',
          label: t('tutorGroups.fields.shift'),
          render: (record) => t(`tutorGroups.shifts.${record.shift}`),
        },
        { key: 'academic_year', label: t('tutorGroups.fields.academicYear') },
        {
          key: 'tutor',
          label: t('tutorGroups.fields.tutor'),
          // «Sin asignar» explícito, nunca un hueco vacío (FR-027): un grupo sin
          // tutor es información, no un dato que falte por error.
          render: (record) => record.tutor?.full_name ?? (
            <span className="text-muted">{t('tutorGroups.unassigned')}</span>
          ),
        },
        {
          key: 'representative',
          label: t('tutorGroups.fields.representative'),
          render: (record) => record.representative?.full_name ?? (
            <span className="text-muted">{EMPTY_VALUE}</span>
          ),
        },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <RecordStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('tutorGroups.emptyBody')}
      emptyTitle={t('tutorGroups.emptyTitle')}
      fields={[
        {
          name: 'name',
          label: t('tutorGroups.fields.name'),
          required: true,
          hint: t('tutorGroups.fields.nameHint'),
        },
        {
          name: 'shift',
          label: t('tutorGroups.fields.shift'),
          type: 'select',
          required: true,
          defaultValue: 'morning',
          options: [
            { value: 'morning', label: t('tutorGroups.shifts.morning') },
            { value: 'afternoon', label: t('tutorGroups.shifts.afternoon') },
          ],
        },
        {
          name: 'academic_year',
          label: t('tutorGroups.fields.academicYear'),
          required: true,
          defaultValue: '2025-2026',
        },
        {
          name: 'tutor_teacher_id',
          label: t('tutorGroups.fields.tutor'),
          type: 'relation',
          endpoint: 'teachers',
          optionLabel: (teacher) => teacher.full_name,
          hint: t('tutorGroups.fields.tutorHint'),
        },
        {
          name: 'representative_student_id',
          label: t('tutorGroups.fields.representative'),
          type: 'relation',
          endpoint: 'students',
          optionLabel: (student) => student.full_name,
          /*
           * Solo alumnos DE ESTE grupo (FR-023b). El filtro lo aplica el
           * servidor; la interfaz se limita a pedirlo.
           */
          params: (form) => ({ tutor_group_id: form.editingId }),
          /*
           * Al CREAR no hay grupo todavía, luego no hay alumnos que puedan ser
           * delegados. Se deshabilita CON EXPLICACIÓN: un control gris y mudo
           * deja al usuario sin saber si es un fallo o una regla (US1.2c).
           */
          isDisabled: (form) => !form.isEditing,
          disabledHint: t('tutorGroups.fields.representativeOnCreate'),
          hint: t('tutorGroups.fields.representativeHint'),
        },
        {
          name: 'sort_order',
          label: t('tutorGroups.fields.sortOrder'),
          type: 'number',
          step: '1',
          defaultValue: 0,
          hint: t('tutorGroups.fields.sortOrderHint'),
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
      getRecordName={(record) => `${record.name} — ${t(`tutorGroups.shifts.${record.shift}`)}`}
      section="tutorGroups"
    />
  )
}
