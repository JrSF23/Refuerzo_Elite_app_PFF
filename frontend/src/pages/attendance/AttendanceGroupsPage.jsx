import { Link } from 'react-router-dom'

import { formatNumber, t } from '../../i18n/index.js'
import { useResourceList } from '../../hooks/useResourceList.js'
import { Breadcrumbs } from '../../components/layout/Breadcrumbs.jsx'
import { SearchInput } from '../../components/ui/SearchInput.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState, ErrorState, LoadingState, NoResultsState } from '../../components/data/states.jsx'

/**
 * Asistencia: índice de grupos.
 *
 * ── Por qué NO es un listado de registros ────────────────────────────────────
 *
 * Es el mismo razonamiento que invirtió la jerarquía en alumnos, y por el mismo
 * motivo de fondo: **la paginación es global**. Una lista única de asistencia
 * trae 20 registros del centro entero, mezclando grupos, sesiones y días; el
 * profesor que quiere pasar lista de 1º ESBA tenía que buscarlos entre los
 * demás, y cualquier agrupación hecha en el cliente habría enseñado FRAGMENTOS
 * de cada grupo con recuentos falsos.
 *
 * Primero los grupos, con sus recuentos reales del servidor, y la asistencia de
 * uno al entrar, paginada dentro de él. Así la pantalla no depende del volumen
 * de registros del centro sino del número de grupos, que son decenas.
 *
 * ── Qué grupos se ven ────────────────────────────────────────────────────────
 *
 * El recorte lo hace el servidor: al profesor solo le llegan los que imparte, y
 * a la administración todos. Esta pantalla no decide nada de eso, ni debe.
 */
export function AttendanceGroupsPage() {
  const groups = useResourceList('class-groups', { perPage: 50 })

  return (
    <>
      <Breadcrumbs items={[{ label: t('attendance.title') }]} />

      <div className="page-head">
        <h1 className="page-title">{t('attendance.title')}</h1>
      </div>

      <p className="page-intro">{t('attendance.groupsIntro')}</p>

      <div className="table-card">
        <div className="toolbar">
          <SearchInput
            label={t('attendance.searchGroups')}
            onChange={groups.setSearch}
            placeholder={t('attendance.searchGroups')}
            value={groups.search}
          />
        </div>

        {groups.status === 'loading' ? <LoadingState rows={4} /> : null}

        {groups.status === 'error' ? (
          <ErrorState message={groups.error?.message} onRetry={groups.refresh} />
        ) : null}

        {groups.status === 'ready' && groups.records.length === 0 ? (
          groups.search
            ? <NoResultsState onClear={() => groups.setSearch('')} term={groups.search} />
            : (
              <EmptyState
                body={t('attendance.noGroupsBody')}
                title={t('attendance.noGroupsTitle')}
              />
            )
        ) : null}

        {groups.status === 'ready' && groups.records.length > 0 ? (
          <ul className="group-index">
            {groups.records.map((group) => (
              <li key={group.id}>
                <GroupCard group={group} />
              </li>
            ))}
          </ul>
        ) : null}

        {groups.status === 'ready' ? (
          <Pagination
            from={groups.pagination?.from}
            lastPage={groups.pagination?.lastPage}
            onChange={groups.setPage}
            page={groups.pagination?.page}
            to={groups.pagination?.to}
            total={groups.pagination?.total}
          />
        ) : null}
      </div>
    </>
  )
}

function GroupCard({ group }) {
  const sessions = group.class_sessions_count ?? 0

  return (
    <Link className="group-card" to={`/asistencia/grupo/${group.id}`}>
      <div className="group-card__main">
        <span className="group-card__name">
          {/* «1º ESBA — Matemáticas» cuando el grupo cuelga de un aula. Los
              creados con el modelo anterior no tienen aula y caen a su nombre
              suelto, que es lo único cierto que se puede decir de ellos. */}
          {group.tutor_group
            ? `${group.tutor_group.name} — ${group.subject?.name ?? group.name}`
            : group.name}
        </span>

        <span className="group-card__tutor">
          {group.teacher?.full_name ?? (
            <span className="text-muted">{t('tutorGroups.unassigned')}</span>
          )}
        </span>
      </div>

      <div className="group-card__meta">
        <span className="group-card__count tabular">{formatNumber(sessions)}</span>
        <span className="group-card__count-label">
          {t(sessions === 1 ? 'attendance.sessionCountOne' : 'attendance.sessionCountMany')}
        </span>
      </div>

      <span aria-hidden="true" className="group-card__chevron" />
    </Link>
  )
}
