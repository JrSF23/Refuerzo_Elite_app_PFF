import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { formatDate, formatNumber, t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { useResourceList } from '../../hooks/useResourceList.js'
import { Badge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Breadcrumbs } from '../../components/layout/Breadcrumbs.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/data/states.jsx'
import { RollCall } from './RollCall.jsx'

/**
 * Asistencia de un grupo: sus sesiones, y en cada una, pasar lista.
 *
 * ── Por qué sesiones y no registros sueltos ─────────────────────────────────
 *
 * La asistencia no existe por sí sola: existe DE UNA SESIÓN. Listar registros
 * —«Ana, presente»— obligaba a reconstruir mentalmente a qué clase pertenecía
 * cada uno, y para registrar había que elegir alumno y sesión en dos
 * desplegables, uno por uno. Con 25 alumnos eso son 25 altas y 50 selecciones.
 *
 * La unidad de trabajo real del profesor es la clase: entra en la sesión de hoy
 * y pasa lista de arriba abajo. Esta pantalla es esa jerarquía.
 *
 * El recuento de cada sesión —marcados sobre matriculados— es lo que permite ver
 * sin abrir nada cuáles quedan pendientes.
 */
export function GroupAttendancePage() {
  const { groupId } = useParams()

  const [group, setGroup] = useState(null)
  const [rollFor, setRollFor] = useState(null)

  const sessions = useResourceList('class-sessions', {
    perPage: 20,
    params: { class_group_id: groupId },
  })

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

  const enrolled = group?.enrollments_count ?? 0

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('attendance.title'), to: '/asistencia' },
          { label: title },
        ]}
      />

      <div className="page-head">
        <h1 className="page-title">{title}</h1>
      </div>

      <p className="page-intro">
        {t('attendance.sessionsIntro', { count: formatNumber(enrolled) })}
      </p>

      <div className="table-card">
        {sessions.status === 'loading' ? <LoadingState rows={4} /> : null}

        {sessions.status === 'error' ? (
          <ErrorState message={sessions.error?.message} onRetry={sessions.refresh} />
        ) : null}

        {sessions.status === 'ready' && sessions.records.length === 0 ? (
          <EmptyState
            body={t('attendance.noSessionsBody')}
            title={t('attendance.noSessionsTitle')}
          />
        ) : null}

        {sessions.status === 'ready' && sessions.records.length > 0 ? (
          <ul className="roll-sessions">
            {sessions.records.map((session) => (
              <li className="roll-sessions__row" key={session.id}>
                <div className="roll-sessions__main">
                  <span className="roll-sessions__title">{session.title}</span>
                  <span className="roll-sessions__date">{formatDate(session.session_date)}</span>
                </div>

                <RollProgress marked={session.attendances_count ?? 0} total={enrolled} />

                <Button onClick={() => setRollFor(session)} size="sm" variant="primary">
                  {t('attendance.roll.open')}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {sessions.status === 'ready' ? (
          <Pagination
            from={sessions.pagination?.from}
            lastPage={sessions.pagination?.lastPage}
            onChange={sessions.setPage}
            page={sessions.pagination?.page}
            to={sessions.pagination?.to}
            total={sessions.pagination?.total}
          />
        ) : null}
      </div>

      <RollCall
        isOpen={rollFor !== null}
        onClose={() => setRollFor(null)}
        onSaved={sessions.refresh}
        sessionId={rollFor?.id}
        sessionTitle={rollFor?.title}
      />
    </>
  )
}

/**
 * Cuántos llevan marca sobre el total de la clase.
 *
 * Con texto además de color: «Completa» y «X de Y» se leen igual en escala de
 * grises, y quien no distingue el verde no puede quedarse sin saber qué sesión
 * falta por pasar.
 */
function RollProgress({ marked, total }) {
  if (total === 0) {
    return <span className="text-muted">{t('attendance.roll.noStudents')}</span>
  }

  if (marked >= total) {
    return <Badge tone="success">{t('attendance.roll.complete')}</Badge>
  }

  return (
    <span className="roll-sessions__progress tabular">
      {t('attendance.roll.progress', {
        marked: formatNumber(marked),
        total: formatNumber(total),
      })}
    </span>
  )
}
