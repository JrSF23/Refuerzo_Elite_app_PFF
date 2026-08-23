import { Spinner } from './Spinner.jsx'

/**
 * Botón.
 *
 * Variantes: primary, secondary, ghost, danger, danger-quiet. Tamaños: sm, md.
 *
 * Los dos rojos NO son intercambiables. `danger` va relleno y es para el botón
 * que CONSUMA la acción destructiva —el de confirmar—. `danger-quiet` va en
 * contorno y es para la acción que solo la PROPONE, típicamente en una fila que
 * se repite muchas veces. Usar el relleno en una lista deja la pantalla en rojo
 * y el aviso deja de avisar.
 *
 * En estado de carga conserva su ancho y queda deshabilitado (FR-036): si el
 * texto se sustituyera por un indicador más estrecho, el botón se encogería y la
 * maquetación saltaría justo cuando el usuario acaba de pulsar.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || isLoading}
      type={type}
      {...rest}
    >
      {/* El texto se mantiene en el flujo y solo se atenúa, de modo que el ancho
          no cambie; el indicador se superpone. */}
      <span className={isLoading ? 'btn__label btn__label--busy' : 'btn__label'}>
        {children}
      </span>

      {isLoading ? (
        <span className="btn__spinner">
          <Spinner size="sm" />
        </span>
      ) : null}
    </button>
  )
}
