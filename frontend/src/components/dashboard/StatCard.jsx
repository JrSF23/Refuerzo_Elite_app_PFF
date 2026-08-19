import { Link } from 'react-router-dom'

import { formatNumber } from '../../i18n/index.js'

/**
 * Indicador del panel.
 *
 * Enlaza con su sección cuando existe una equivalente y el rol puede verla
 * (FR-017). Cuando no, se renderiza como bloque estático en lugar de como
 * enlace muerto: un elemento que parece pulsable y no lleva a ninguna parte es
 * peor que uno que no lo parece.
 *
 * La cifra usa `tabular-nums` desde la hoja base, de modo que una columna de
 * indicadores queda alineada y comparable de un vistazo.
 */
export function StatCard({ label, value, to }) {
  const content = (
    <>
      <span className="stat__label">{label}</span>
      <span className="stat__value tabular">{formatNumber(value)}</span>
    </>
  )

  if (!to) {
    return <div className="stat">{content}</div>
  }

  return (
    <Link className="stat stat--link" to={to}>
      {content}
    </Link>
  )
}
