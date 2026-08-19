import { EMPTY_VALUE, formatDate, formatTime, t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Sesiones de clase.
 *
 * El profesor las crea y edita, pero solo de los grupos que imparte: el recorte
 * lo aplica el servidor, y el desplegable de grupo le ofrece únicamente los
 * suyos porque el listado de grupos ya viene recortado.
 *
 * Sin caja de búsqueda: el endpoint no declara campos buscables, así que el
 * parámetro se ignoraría.
 */
export function SessionsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'title', label: t('sessions.fields.title') },
        { key: 'class_group.name', label: t('fields.group') },
        {
          key: 'session_date',
          label: t('sessions.fields.date'),
          render: (record) => formatDate(record.session_date),
        },
        {
          key: 'starts_at',
          label: t('sessions.fields.time'),
          render: (record) => {
            const from = formatTime(record.starts_at)
            const to = formatTime(record.ends_at)

            // Con un solo extremo se muestra tal cual; con los dos, el intervalo.
            return to === EMPTY_VALUE ? from : `${from} – ${to}`
          },
        },
        { key: 'room', label: t('sessions.fields.room') },
      ]}
      emptyBody={t('sessions.emptyBody')}
      emptyTitle={t('sessions.emptyTitle')}
      fields={[
        { name: 'title', label: t('sessions.fields.title'), required: true },
        {
          name: 'class_group_id',
          label: t('fields.group'),
          type: 'relation',
          endpoint: 'class-groups',
          optionLabel: (group) => group.name,
          required: true,
        },
        {
          name: 'session_date',
          label: t('sessions.fields.date'),
          type: 'date',
          required: true,
        },
        // El control `time` produce HH:MM, que es justo lo que la API acepta.
        // Lo que devuelve trae segundos, y `useResourceForm` los recorta al editar.
        { name: 'starts_at', label: t('sessions.fields.startsAt'), type: 'time' },
        { name: 'ends_at', label: t('sessions.fields.endsAt'), type: 'time' },
        { name: 'room', label: t('sessions.fields.room') },
        { name: 'notes', label: t('fields.notes'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.title}
      section="sessions"
    />
  )
}
