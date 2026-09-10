import { useState } from 'react'

import { formatDate, formatNumber, t } from '../../i18n/index.js'
import { useResourceList } from '../../hooks/useResourceList.js'
import { useDeferredLoading } from '../../hooks/useDeferredLoading.js'
import { Breadcrumbs } from '../../components/layout/Breadcrumbs.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/data/states.jsx'
import { RollCall } from './RollCall.jsx'

/**
 * Listas guardadas: el histórico de asistencia, por sesión.
 *
 * Es la mitad de LECTURA de la asistencia. La otra —el índice por grupos— sirve
 * para pasar lista de lo de hoy; esta sirve para revisar lo ya registrado, que
 * es otra pregunta y llega desde otro sitio: «¿pasé lista del martes?», «¿cuántos
 * faltaron la semana pasada?».
 *
 * ── Por qué no es una sección del menú ──────────────────────────────────────
 *
 * «Asistencia» y «Listas» como dos entradas hermanas repetirían el error que ya
 * costó caro con los dos «Grupos»: dos nombres parecidos para cosas que el
 * usuario no sabe distinguir hasta que entra. Se llega desde el índice de
 * asistencia, igual que a «todos los alumnos» se llega desde el índice de aulas.
 *
 * ── Solo sesiones CON lista ─────────────────────────────────────────────────
 *
 * Una sesión sin asistencia registrada no es una lista, y mezclarlas convertiría
 * el histórico en el listado de sesiones que ya existe. Lo que se revisa aquí es
 * lo que se hizo.
 *
 * El reparto por estado viene contado por el servidor, así que se ve «22
 * presentes · 2 faltas» sin abrir nada.
 */
export function RollHistoryPage() {
  const [reviewing, setReviewing] = useState(null)

  const rolls = useResourceList('attendance-rolls', { perPage: 20 })

  const showLoader = useDeferredLoading(rolls.status === 'loading')

  return (
    <>
      <Breadcrumbs
        items={[
          { label: t('attendance.title'), to: '/asistencia' },
          { label: t('attendance.history.title') },
        ]}
      />

      <div className="page-head">
        <h1 className="page-title">{t('attendance.history.title')}</h1>
      </div>

      <p className="page-intro">{t('attendance.history.intro')}</p>

      <div className="table-card">
        {showLoader ? <LoadingState rows={4} variant="table" /> : null}

        {!showLoader && rolls.status === 'error' ? (
          <ErrorState message={rolls.error?.message} onRetry={rolls.refresh} />
        ) : null}

        {!showLoader && rolls.status === 'ready' && rolls.records.length === 0 ? (
          <EmptyState
            body={t('attendance.history.emptyBody')}
            title={t('attendance.history.emptyTitle')}
          />
        ) : null}

        {!showLoader && rolls.status === 'ready' && rolls.records.length > 0 ? (
          <ul className="roll-sessions">
            {rolls.records.map((session) => (
              <li className="roll-sessions__row" key={session.id}>
                <div className="roll-sessions__main">
                  <span className="roll-sessions__title">{session.title}</span>
                  <span className="roll-sessions__date">
                    {[
                      session.class_group?.tutor_group
                        ? `${session.class_group.tutor_group.name} — ${session.class_group.subject?.name ?? ''}`.trim()
                        : session.class_group?.name,
                      formatDate(session.session_date),
                    ].filter(Boolean).join(' · ')}
                  </span>
                </div>

                <Breakdown session={session} />

                <Button onClick={() => setReviewing(session)} size="sm">
                  {t('attendance.history.review')}
                </Button>
              </li>
            ))}
          </ul>
        ) : null}

        {!showLoader && rolls.status === 'ready' ? (
          <Pagination
            from={rolls.pagination?.from}
            lastPage={rolls.pagination?.lastPage}
            onChange={rolls.setPage}
            page={rolls.pagination?.page}
            to={rolls.pagination?.to}
            total={rolls.pagination?.total}
          />
        ) : null}
      </div>

      {/* La misma lista con la que se pasó, para revisar y corregir si hace
          falta. No hay una versión de «solo lectura»: quien puede pasar lista
          puede enmendarla, y mantener dos pantallas casi iguales solo añade
          sitios donde equivocarse. */}
      <RollCall
        isOpen={reviewing !== null}
        onClose={() => setReviewing(null)}
        onSaved={rolls.refresh}
        sessionId={reviewing?.id}
        sessionTitle={reviewing?.title}
      />
    </>
  )
}

/**
 * El reparto de la lista, en texto.
 *
 * Los cuatro estados con su cifra, y solo los que tienen alguno: «22 presentes ·
 * 2 faltas» se lee de un vistazo, mientras que «22 · 2 · 0 · 0» obliga a
 * recordar el orden. Los ceros se omiten por eso, no por ahorrar espacio.
 */
function Breakdown({ session }) {
  const partes = [
    ['present', session.present_count],
    ['absent', session.absent_count],
    ['late', session.late_count],
    ['excused', session.excused_count],
  ].filter(([, count]) => (count ?? 0) > 0)

  return (
    <span className="roll-sessions__progress">
      {partes.map(([estado, count]) => (
        <span className="roll-sessions__slice" key={estado}>
          <span className="tabular">{formatNumber(count)}</span>
          {' '}
          {t(`attendanceStatus.${estado}`).toLowerCase()}
        </span>
      ))}
    </span>
  )
}
