import { useCallback, useState } from 'react'

import { t } from '../../i18n/index.js'
import { RecordStatusBadge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { groupStudents } from './groupStudents.js'

/**
 * Alumnos, organizados por grupo tutorial.
 *
 * El profesor llega aquí en SOLO LECTURA y ve únicamente los alumnos de sus
 * grupos. Ese recorte lo aplica el servidor, no esta pantalla.
 */
export function StudentsPage() {
  /*
   * Bloques plegados. Se guarda qué está PLEGADO, no qué está desplegado, para
   * que un grupo nuevo aparezca abierto sin tener que registrarlo antes.
   *
   * Con cientos de alumnos, una lista de bloques abiertos es inmanejable; poder
   * cerrar los que no interesan es lo que hace la pantalla usable en un centro
   * real.
   */
  const [collapsed, setCollapsed] = useState(() => new Set())

  const toggle = useCallback((key) => {
    setCollapsed((current) => {
      const next = new Set(current)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }, [])

  const buildBlocks = useCallback((records) => groupStudents(records).map((block) => ({
    key: block.key,
    group: block.group,
    records: block.students,
    isCollapsed: collapsed.has(block.key),
  })), [collapsed])

  const renderBlockHeader = useCallback((block) => (
    <BlockHeader block={block} onToggle={() => toggle(block.key)} />
  ), [toggle])

  return (
    <ResourcePage
      buildBlocks={buildBlocks}
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
      emptyBody={t('students.emptyBody')}
      emptyTitle={t('students.emptyTitle')}
      fields={[
        { name: 'first_name', label: t('fields.firstName'), required: true },
        { name: 'last_name', label: t('fields.lastName'), required: true },
        {
          name: 'tutor_group_id',
          label: t('students.fields.tutorGroup'),
          type: 'relation',
          endpoint: 'tutor-groups',
          optionLabel: (group) => `${group.name} — ${t(`tutorGroups.shifts.${group.shift}`)}`,
          hint: t('students.fields.tutorGroupHint'),
        },
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
      renderBlockHeader={renderBlockHeader}
      section="students"
    />
  )
}

/**
 * Cabecera de bloque: grupo y turno a la izquierda, tutor a la derecha.
 *
 * Muestra además el recuento, que es una de las tres preguntas que la
 * administración se hace sobre un grupo —cuántos, quién lo lleva, quién es el
 * delegado— y que no debería exigir contar filas.
 */
function BlockHeader({ block, onToggle }) {
  const { group, records, isCollapsed } = block

  const title = group
    ? `${group.name} — ${t(`tutorGroups.shifts.${group.shift}`)}`
    : t('students.unassignedGroup')

  return (
    <div className={group ? 'block__header' : 'block__header block__header--unassigned'}>
      <button
        aria-expanded={!isCollapsed}
        className="block__toggle"
        onClick={onToggle}
        type="button"
      >
        <span aria-hidden="true" className={isCollapsed ? 'chevron' : 'chevron chevron--open'} />
        <span className="block__title">{title}</span>
        <span className="block__count">
          {t(records.length === 1 ? 'students.countOne' : 'students.countMany', {
            count: records.length,
          })}
        </span>
      </button>

      <p className="block__tutor">
        {group ? (
          <>
            <span className="block__tutor-label">{t('tutorGroups.fields.tutor')}:</span>{' '}
            {group.tutor?.full_name ?? (
              // «Sin asignar» explícito: un hueco vacío no distingue «no tiene»
              // de «no se ha cargado» (FR-027).
              <span className="text-muted">{t('tutorGroups.unassigned')}</span>
            )}
          </>
        ) : (
          <span className="text-muted">{t('students.unassignedHint')}</span>
        )}
      </p>
    </div>
  )
}
