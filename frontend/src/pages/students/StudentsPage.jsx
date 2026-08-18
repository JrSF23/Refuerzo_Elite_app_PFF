import { Link } from 'react-router-dom'

import { formatNumber, t } from '../../i18n/index.js'
import { useResourceList } from '../../hooks/useResourceList.js'
import { Breadcrumbs } from '../../components/layout/Breadcrumbs.jsx'
import { SearchInput } from '../../components/ui/SearchInput.jsx'
import { Pagination } from '../../components/ui/Pagination.jsx'
import { EmptyState, ErrorState, LoadingState, NoResultsState } from '../../components/data/states.jsx'
import { useUnassignedCount } from './useUnassignedCount.js'

/**
 * Alumnos: índice de aulas.
 *
 * ── Por qué NO es un listado de alumnos ──────────────────────────────────────
 *
 * La primera versión mostraba todos los alumnos en bloques por grupo. Con los 8
 * alumnos sembrados se veía bien; con los ~500 de un centro real es inservible,
 * y no por longitud sino por algo peor: **la paginación es global**. La página
 * trae 20 alumnos, así que cada bloque era un FRAGMENTO de su grupo y el
 * recuento mentía —«1º ESO, 2 alumnos» cuando el grupo tiene 30—.
 *
 * Plegar los bloques no lo arregla: seguirían siendo fragmentos con cifras
 * falsas. Lo que lo arregla es invertir la jerarquía: primero las aulas, con su
 * recuento REAL —`students_count` del servidor—, y los alumnos de una en una al
 * entrar, paginados dentro de su grupo.
 *
 * Efecto colateral que importa: esta pantalla ya no depende del número de
 * alumnos del centro, solo del de grupos, que son decenas y no cientos.
 */
export function StudentsPage() {
  const groups = useResourceList('tutor-groups', { perPage: 50 })
  const unassigned = useUnassignedCount()

  return (
    <>
      <Breadcrumbs items={[{ label: t('students.title') }]} />

      <div className="page-head">
        <h1 className="page-title">{t('students.title')}</h1>

        <Link className="btn btn--secondary" to="/alumnos/todos">
          {t('students.viewAllStudents')}
        </Link>
      </div>

      <p className="page-intro">{t('students.groupsIntro')}</p>

      <div className="table-card">
        <div className="toolbar">
          <SearchInput
            label={t('students.searchGroups')}
            onChange={groups.setSearch}
            placeholder={t('students.searchGroups')}
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
                action={<Link className="btn btn--primary" to="/grupos">{t('tutorGroups.create')}</Link>}
                body={t('students.noGroupsBody')}
                title={t('students.noGroupsTitle')}
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

            {/*
              * Los alumnos sin grupo, siempre visibles y al final. Tras la
              * migración son todos, así que ocultarlos dejaría la pantalla
              * aparentemente vacía. Su recuento sale de una consulta propia,
              * porque no pertenecen a ningún grupo que pueda contarlos.
              */}
            {unassigned.count > 0 ? (
              <li>
                <UnassignedCard count={unassigned.count} />
              </li>
            ) : null}
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
  const count = group.students_count ?? 0

  return (
    <Link className="group-card" to={`/alumnos/grupo/${group.id}`}>
      <div className="group-card__main">
        <span className="group-card__name">
          {group.name}
          <span className="group-card__shift">{t(`tutorGroups.shifts.${group.shift}`)}</span>
        </span>

        <span className="group-card__tutor">
          {group.tutor?.full_name ?? (
            <span className="text-muted">{t('tutorGroups.unassigned')}</span>
          )}
        </span>
      </div>

      <div className="group-card__meta">
        <span className="group-card__count tabular">{formatNumber(count)}</span>
        <span className="group-card__count-label">
          {t(count === 1 ? 'students.countLabelOne' : 'students.countLabelMany')}
        </span>
      </div>

      <span aria-hidden="true" className="group-card__chevron" />
    </Link>
  )
}

function UnassignedCard({ count }) {
  return (
    <Link className="group-card group-card--unassigned" to="/alumnos/grupo/sin-asignar">
      <div className="group-card__main">
        <span className="group-card__name">{t('students.unassignedGroup')}</span>
        <span className="group-card__tutor text-muted">{t('students.unassignedHint')}</span>
      </div>

      <div className="group-card__meta">
        <span className="group-card__count tabular">{formatNumber(count)}</span>
        <span className="group-card__count-label">
          {t(count === 1 ? 'students.countLabelOne' : 'students.countLabelMany')}
        </span>
      </div>

      <span aria-hidden="true" className="group-card__chevron" />
    </Link>
  )
}
