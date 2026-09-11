import { Link } from 'react-router-dom'

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
 *
 * `value` llega ya FORMATEADO, no como número desnudo. Antes se formateaba aquí
 * con `formatNumber`, y eso impedía que un indicador mostrara «91,4 %»: el
 * componente decidía por su cuenta que todo valor era un entero contable. Quien
 * sabe si su dato es un recuento, un porcentaje o un importe es quien lo pide.
 */
export function StatCard({ label, value, to, hint, tone }) {
  const content = (
    <>
      <span className="stat__label">{label}</span>
      <span className="stat__value tabular">{value}</span>
      {/* Contexto opcional de una línea. Es lo que separa un número de un dato
          accionable: «18» no dice nada, «18 · Requieren atención» sí. Se queda
          en una línea corta a propósito; el sitio de la explicación larga es la
          sección de la que habla, no el indicador. */}
      {hint ? <span className={`stat__hint${tone ? ` stat__hint--${tone}` : ''}`}>{hint}</span> : null}
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
