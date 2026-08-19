import { EMPTY_VALUE, t } from '../../i18n/index.js'
import { useContainerWidth } from '../../hooks/useContainerWidth.js'
import { Pagination } from '../ui/Pagination.jsx'
import { SearchInput } from '../ui/SearchInput.jsx'
import { EmptyState, ErrorState, LoadingState, NoResultsState } from './states.jsx'

/**
 * Ancho mínimo por columna para que una celda siga siendo legible.
 *
 * De aquí sale el umbral de cambio a tarjetas: una tabla de 4 columnas necesita
 * ~576 px y una de 8 necesita ~1.152. No es un ancho de dispositivo, es lo que
 * la tabla concreta necesita (FR-060, research.md D8).
 */
const MIN_COLUMN_WIDTH = 144
const ACTIONS_WIDTH = 120

/**
 * Tabla de datos con búsqueda, paginación, estados y representación móvil.
 *
 * @param {object[]} columns  { key, label, render?, align? }
 * @param {boolean}  searchable  Si el endpoint admite búsqueda. En matrículas,
 *   sesiones, asistencia y pagos la API IGNORA el parámetro, así que la caja no
 *   debe mostrarse: ofrecerla sería mentir sobre lo que hace (FR-024).
 */
export function DataTable({
  columns,
  records,
  status,
  error,
  pagination,
  search,
  onSearchChange,
  onPageChange,
  onRetry,
  searchable = false,
  rowActions,
  toolbarAction,
  emptyTitle,
  emptyBody,
  emptyAction,
  getRowKey = (record) => record.id,
}) {
  const [containerRef, containerWidth] = useContainerWidth()

  const needed = columns.length * MIN_COLUMN_WIDTH + (rowActions ? ACTIONS_WIDTH : 0)
  // Hasta la primera medición se asume tabla: en escritorio es lo habitual y
  // evita un parpadeo de tarjetas a tabla en cada carga.
  const asCards = containerWidth !== null && containerWidth < needed

  const hasSearch = Boolean(search)

  return (
    <div className="table-card" ref={containerRef}>
      {(searchable || toolbarAction) ? (
        <div className="toolbar">
          {searchable ? (
            <SearchInput onChange={onSearchChange} value={search} />
          ) : <span />}

          {toolbarAction}
        </div>
      ) : null}

      {status === 'loading' ? <LoadingState rows={5} /> : null}

      {status === 'error' ? (
        <ErrorState message={error?.message} onRetry={onRetry} />
      ) : null}

      {status === 'ready' && records.length === 0 ? (
        hasSearch
          ? <NoResultsState onClear={() => onSearchChange('')} term={search} />
          : <EmptyState action={emptyAction} body={emptyBody} title={emptyTitle} />
      ) : null}

      {status === 'ready' && records.length > 0 ? (
        <Rows
          asCards={asCards}
          columns={columns}
          getRowKey={getRowKey}
          records={records}
          rowActions={rowActions}
        />
      ) : null}

      {status === 'ready' && pagination ? (
        <Pagination
          from={pagination.from}
          lastPage={pagination.lastPage}
          onChange={onPageChange}
          page={pagination.page}
          to={pagination.to}
          total={pagination.total}
        />
      ) : null}
    </div>
  )
}

/** Elige entre tabla y tarjetas. Extraído para que bloques y listado plano
 *  compartan exactamente la misma decisión. */
function Rows({ asCards, ...props }) {
  return asCards ? <CardList {...props} /> : <TableView {...props} />
}

function cellValue(record, column) {
  if (column.render) return column.render(record)

  // Acceso por ruta: 'guardian.full_name' llega hasta el valor sin que la
  // pantalla tenga que escribir el encadenamiento a mano.
  const raw = column.key.split('.').reduce((node, part) => node?.[part], record)

  return raw === null || raw === undefined || raw === '' ? EMPTY_VALUE : raw
}

function TableView({ columns, records, rowActions, getRowKey }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">{column.label}</th>
            ))}
            {rowActions ? <th scope="col">{t('common.actions')}</th> : null}
          </tr>
        </thead>

        <tbody>
          {records.map((record) => (
            <tr key={getRowKey(record)}>
              {columns.map((column) => (
                <td key={column.key}>{cellValue(record, column)}</td>
              ))}

              {rowActions ? (
                <td className="cell-actions">
                  <div className="row-actions">{rowActions(record)}</div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Representación por tarjetas, con rótulo sobre valor.
 *
 * Sustituye a la tabla cuando el ancho no da (FR-028). El desplazamiento
 * horizontal NO es una alternativa aceptable: lo prohíbe el Principio VI.
 *
 * La primera columna hace de título de la tarjeta y no repite su rótulo: en una
 * ficha de alumno, poner «NOMBRE» encima del nombre es ruido.
 */
function CardList({ columns, records, rowActions, getRowKey }) {
  const [titleColumn, ...restColumns] = columns

  return (
    <ul className="record-cards">
      {records.map((record) => (
        <li className="record-card" key={getRowKey(record)}>
          <p className="record-card__title">{cellValue(record, titleColumn)}</p>

          <dl className="record-card__fields">
            {restColumns.map((column) => (
              <div className="record-card__field" key={column.key}>
                <dt>{column.label}</dt>
                <dd>{cellValue(record, column)}</dd>
              </div>
            ))}
          </dl>

          {rowActions ? (
            <div className="row-actions record-card__actions">{rowActions(record)}</div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
