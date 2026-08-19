import { t } from '../../i18n/index.js'

/**
 * Indicador de progreso.
 *
 * `role="status"` con texto oculto: quien usa lector de pantalla necesita
 * enterarse de que algo está en curso, y un elemento puramente visual no se
 * anuncia. Cuando el indicador vive dentro de un texto que ya lo explica
 * —«Guardando…»—, se pasa `label={null}` para no anunciarlo dos veces.
 */
export function Spinner({ size = 'md', label }) {
  const text = label === undefined ? t('common.loading') : label

  return (
    <span className={`spinner spinner--${size}`} role={text ? 'status' : undefined}>
      <span aria-hidden="true" className="spinner__circle" />
      {text ? <span className="visually-hidden">{text}</span> : null}
    </span>
  )
}
