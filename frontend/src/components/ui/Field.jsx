import { useId } from 'react'

import { t } from '../../i18n/index.js'

/**
 * Envoltorio de campo: etiqueta, control, ayuda y error, enlazados entre sí.
 *
 * Todo control pasa por aquí (FR-032). Lo que resuelve, y que es fácil olvidar
 * campo a campo:
 *
 *   · `htmlFor` real, generado con `useId`, no un identificador inventado que
 *     puede repetirse si el formulario se muestra dos veces.
 *   · `aria-describedby` apuntando a la ayuda Y al error, para que el lector de
 *     pantalla los lea al enfocar.
 *   · `aria-invalid` y `aria-required`, porque el borde rojo y el asterisco son
 *     convenciones visuales que no llegan a quien no ve la pantalla (FR-033).
 *
 * Se usa con función hija para que el control reciba los identificadores ya
 * resueltos sin que la pantalla tenga que cablearlos.
 */
export function Field({ label, error, hint, required = false, children }) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  const describedBy = [hint ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(' ') || undefined

  return (
    <div className={error ? 'field field--invalid' : 'field'}>
      <label className="field__label" htmlFor={id}>
        {label}
        {required ? (
          <span className="field__required">
            <span aria-hidden="true"> *</span>
            <span className="visually-hidden"> ({t('common.required')})</span>
          </span>
        ) : null}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
        required,
      })}

      {hint ? <p className="field__hint" id={hintId}>{hint}</p> : null}

      {/* `role="alert"` para que el error se anuncie al aparecer, no solo al
          volver a enfocar el campo. */}
      {error ? <p className="field__error" id={errorId} role="alert">{error}</p> : null}
    </div>
  )
}

export function Input({ className = '', ...rest }) {
  return <input className={`control ${className}`.trim()} {...rest} />
}

export function Textarea({ className = '', rows = 3, ...rest }) {
  return <textarea className={`control control--area ${className}`.trim()} rows={rows} {...rest} />
}

/**
 * Desplegable.
 *
 * `placeholder` se renderiza como opción vacía deshabilitada tras la selección
 * inicial, para que no pueda volverse a elegir en un campo obligatorio.
 */
export function Select({ className = '', options = [], placeholder, children, ...rest }) {
  return (
    <select className={`control control--select ${className}`.trim()} {...rest}>
      {placeholder !== undefined ? (
        <option value="">{placeholder || t('common.select')}</option>
      ) : null}

      {children ?? options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  )
}
