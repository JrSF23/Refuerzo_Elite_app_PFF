import { useState } from 'react'

import { t } from '../../i18n/index.js'
import { Input } from './Field.jsx'

/**
 * Campo de contraseña con interruptor para verla.
 *
 * Escribir una contraseña a ciegas es donde más se equivoca la gente, y en el
 * acceso el error no da pistas: el servidor responde «credenciales incorrectas»
 * tanto si te equivocaste de cuenta como si se te coló una letra. Poder mirar lo
 * que se ha escrito ahorra justo ese callejón.
 *
 * ── Detalles que parecen menores y no lo son ────────────────────────────────
 *
 * - `type="button"`. Dentro de un formulario, un botón sin tipo es de ENVÍO por
 *   defecto: pulsar el ojo intentaría acceder con la contraseña a medio
 *   escribir. Es el fallo clásico de este control.
 * - `onMouseDown` con `preventDefault()`, igual que el botón de limpiar del
 *   buscador: sin él, pulsar el ojo saca el foco del campo y hay que volver a
 *   hacer clic para seguir escribiendo.
 * - El rótulo nombra la ACCIÓN, no el estado: con la contraseña oculta el botón
 *   dice «Mostrar». Un lector de pantalla anuncia lo que va a pasar al pulsar,
 *   que es lo que hace falta saber.
 * - `autoComplete` lo pone quien usa el componente y viaja intacto: perderlo
 *   dejaría al gestor de contraseñas sin saber qué guardar.
 *
 * El icono va en línea y con `currentColor`. El producto no tiene sistema de
 * iconos —solo el logotipo y la gráfica de asistencia llevan SVG— y montar uno
 * para esto sería desproporcionado.
 */
export function PasswordInput({ className = '', ...rest }) {
  const [isVisible, setIsVisible] = useState(false)

  const action = isVisible ? t('auth.hidePassword') : t('auth.showPassword')

  return (
    <div className="password-field">
      <Input
        {...rest}
        className={`password-field__input ${className}`.trim()}
        type={isVisible ? 'text' : 'password'}
      />

      <button
        className="password-field__toggle"
        onClick={() => setIsVisible((current) => !current)}
        onMouseDown={(event) => event.preventDefault()}
        title={action}
        type="button"
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          viewBox="0 0 18 18"
          width="18"
        >
          <path d="M1.5 9S4.2 3.8 9 3.8 16.5 9 16.5 9 13.8 14.2 9 14.2 1.5 9 1.5 9Z" />
          <circle cx="9" cy="9" r="2.4" />
          {/* La barra solo aparece cuando la contraseña SE VE: el icono anuncia
              lo que hace el botón, que entonces es ocultarla. */}
          {isVisible ? <path d="M3 3 15 15" /> : null}
        </svg>

        <span className="visually-hidden">{action}</span>
      </button>
    </div>
  )
}
