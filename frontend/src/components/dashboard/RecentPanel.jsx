import { Link } from 'react-router-dom'

import { t } from '../../i18n/index.js'
import { Card, CardHeader } from '../ui/Card.jsx'
import { EmptyState } from '../data/states.jsx'

/**
 * Bloque de actividad reciente.
 *
 * Los cinco registros que devuelve `/dashboard` no son una tabla: son un vistazo.
 * Por eso se presentan como lista de filas y no con `DataTable`, que arrastra
 * paginación, búsqueda y cambio a tarjetas —maquinaria que aquí no tiene nada
 * que hacer— y que además cambiaría de forma en móvil sin ninguna necesidad,
 * porque estas filas ya son legibles a 360 px.
 *
 * @param {{primary: string, secondary?: string, trailing?: React.ReactNode}[]} items
 */
export function RecentPanel({ title, items, emptyText, to, emptyAction }) {
  return (
    <Card as="section">
      <CardHeader
        actions={to ? (
          <Link className="btn btn--ghost btn--sm" to={to}>{t('common.viewAll')}</Link>
        ) : null}
        title={title}
      />

      {items.length === 0 ? (
        <EmptyState action={emptyAction} title={emptyText} />
      ) : (
        <ul className="recent">
          {items.map((item) => (
            <li className="recent__row" key={item.key}>
              <div className="recent__text">
                <span className="recent__primary">{item.primary}</span>
                {item.secondary ? (
                  <span className="recent__secondary">{item.secondary}</span>
                ) : null}
              </div>

              {item.trailing ? (
                <div className="recent__trailing">{item.trailing}</div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
