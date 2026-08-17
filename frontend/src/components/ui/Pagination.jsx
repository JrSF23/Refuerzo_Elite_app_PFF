import { t } from '../../i18n/index.js'
import { Button } from './Button.jsx'

/**
 * Paginación contra servidor.
 *
 * No se renderiza con una sola página (FR-041): unos controles siempre
 * deshabilitados solo añaden ruido.
 *
 * El rango se anuncia en una región activa porque, al cambiar de página, el
 * contenido de la tabla se sustituye sin que nada avise a quien usa lector de
 * pantalla de que la navegación surtió efecto.
 */
export function Pagination({ page, lastPage, from, to, total, onChange, isLoading = false }) {
  if (!lastPage || lastPage <= 1) return null

  return (
    <nav aria-label={t('common.pagePosition', { current: page, total: lastPage })} className="pagination">
      <Button
        disabled={page <= 1 || isLoading}
        onClick={() => onChange(page - 1)}
        size="sm"
      >
        {t('common.previous')}
      </Button>

      <p aria-live="polite" className="pagination__status">
        <span className="pagination__position">
          {t('common.pagePosition', { current: page, total: lastPage })}
        </span>

        {total !== undefined && from !== undefined && to !== undefined ? (
          <span className="pagination__range">
            {t('common.showingRange', { from, to, total })}
          </span>
        ) : null}
      </p>

      <Button
        disabled={page >= lastPage || isLoading}
        onClick={() => onChange(page + 1)}
        size="sm"
      >
        {t('common.next')}
      </Button>
    </nav>
  )
}
