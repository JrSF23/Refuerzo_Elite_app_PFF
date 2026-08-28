import { t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Asignaturas.
 *
 * Ya NO lleva importe: la asignatura es contenido y el cobro va por curso
 * académico, así que `monthly_fee` se eliminó de la tabla. La cuota vive en la
 * matrícula, que es donde se pacta con cada alumno.
 *
 * SIGUE CERRADA AL PROFESOR, pero conviene saber que el motivo original ya no
 * aplica: se le vedaba por ser una de las tres entidades con campos monetarios
 * (FR-037). Abrirla ahora sería defendible, y exigiría cambiar primero lo que
 * autoriza el servidor —que responde 403 por su cuenta— y no solo la navegación.
 */
export function SubjectsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('fields.name') },
        { key: 'code', label: t('fields.code') },
        { key: 'level', label: t('fields.level') },
      ]}
      emptyBody={t('subjects.emptyBody')}
      emptyTitle={t('subjects.emptyTitle')}
      fields={[
        { name: 'name', label: t('fields.name'), required: true },
        {
          name: 'code',
          label: t('fields.code'),
          required: true,
          hint: t('subjects.fields.codeHint'),
        },
        { name: 'level', label: t('fields.level') },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.name}
      section="subjects"
    />
  )
}
