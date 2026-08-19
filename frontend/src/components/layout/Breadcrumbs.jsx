import { Link } from 'react-router-dom'

/**
 * Ruta de migas (FR-022).
 *
 * El último elemento NO es un enlace —ya se está en él— y lleva
 * `aria-current="page"`. Enlazar a la página actual es un patrón que confunde a
 * quien navega con lector de pantalla.
 *
 * @param {{label: string, to?: string}[]} items
 */
export function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null

  return (
    <nav className="breadcrumbs">
      <ol>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <li key={`${item.label}-${index}`}>
              {isLast || !item.to ? (
                <span aria-current={isLast ? 'page' : undefined}>{item.label}</span>
              ) : (
                <Link to={item.to}>{item.label}</Link>
              )}

              {!isLast ? <span aria-hidden="true" className="breadcrumbs__sep">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
