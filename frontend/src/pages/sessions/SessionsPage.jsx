import { useState } from 'react'

import { EMPTY_VALUE, formatDate, formatTime, t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ConfirmDialog } from '../../components/data/ConfirmDialog.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'
import { SessionStatusBadge } from '../../components/ui/Badge.jsx'

/**
 * Sesiones de clase.
 *
 * El profesor las crea y edita, pero solo de los grupos que imparte: el recorte
 * lo aplica el servidor, y el desplegable de grupo le ofrece únicamente los
 * suyos porque el listado de grupos ya viene recortado.
 *
 * **Impartida** no es un campo del formulario sino una acción propia, por el
 * mismo motivo que suspender una organización tampoco lo es: es un acto
 * deliberado y DEFINITIVO, y entre los siete campos de la sesión sería algo que
 * se cambia sin querer al corregir el aula. De ahí también el diálogo de
 * confirmación, que aquí no protege un borrado sino algo igual de irreversible.
 *
 * Con caja de búsqueda desde que el servidor declara campos buscables: título y
 * aula son suyos, y el nombre del grupo viene por relación, que es como se busca
 * de verdad —«mis sesiones de Tarde A»—.
 */
export function SessionsPage() {
  const toast = useToast()
  const [pendingMark, setPendingMark] = useState(null)
  const [isMarking, setIsMarking] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  async function markTaught() {
    setIsMarking(true)

    try {
      await api.post(`/class-sessions/${pendingMark.id}/taught`)
      toast.success(t('sessions.marked'))
      setPendingMark(null)
      setReloadKey((key) => key + 1)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <>
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
          {
            key: 'taught_at',
            label: t('sessions.fields.taught'),
            /*
             * El estado se DERIVA de `taught_at`: no hay columna de estado en la
             * API y no debe haberla. Nulo es pendiente, y eso es cierto sin que
             * nadie tenga que escribirlo en ninguna fila.
             *
             * Al pasar el ratón, quién y cuándo. `taught_by` puede venir nulo en
             * una sesión marcada si esa cuenta se dio de baja después: la clase
             * se dio igual, así que se muestra impartida sin autor.
             */
            render: (record) => (
              <span
                title={record.taught_at
                  ? [
                    formatDate(record.taught_at),
                    record.taught_by_user?.name
                      ? t('sessions.taughtBy', { name: record.taught_by_user.name })
                      : null,
                  ].filter(Boolean).join(' · ')
                  : undefined}
              >
                <SessionStatusBadge value={record.taught_at ? 'taught' : 'pending'} />
              </span>
            ),
          },
        ]}
        emptyBody={t('sessions.emptyBody')}
        emptyTitle={t('sessions.emptyTitle')}
        // Fuerza el remontado tras marcar, para que el listado refleje el estado
        // nuevo sin duplicar la lógica de recarga.
        key={reloadKey}
        extraRowActions={(record) => (
          record.taught_at ? null : (
            <Button onClick={() => setPendingMark(record)} size="sm">
              {t('sessions.markTaught')}
            </Button>
          )
        )}
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

      <ConfirmDialog
        body={t('sessions.markConfirm', { name: pendingMark?.title })}
        confirmLabel={t('sessions.markTaught')}
        isBusy={isMarking}
        isOpen={pendingMark !== null}
        onCancel={() => setPendingMark(null)}
        onConfirm={markTaught}
        title={t('sessions.markTitle', { name: pendingMark?.title })}
      />
    </>
  )
}
