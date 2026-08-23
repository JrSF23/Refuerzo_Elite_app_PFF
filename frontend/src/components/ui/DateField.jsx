import { useRef, useState } from 'react'

import { t } from '../../i18n/index.js'
import { displayToIso, isoToDisplay, maskDate, toIsoDate } from '../../lib/dates.js'

/**
 * Campo de fecha en dd/mm/aaaa.
 *
 * ── Por qué no basta con `<input type="date">` ───────────────────────────────
 *
 * Su formato VISIBLE no lo decide la página: lo decide el idioma del navegador.
 * El mismo `value="2026-01-13"` se ve «13/01/2026» en un Chrome en español y
 * «1/13/2026» en uno en inglés, y el atributo `lang="es"` del documento no lo
 * cambia. En un centro donde cada equipo tiene el navegador que tiene, la fecha
 * se lee de una forma distinta en cada puesto, y 01/02 significa dos días
 * diferentes según quién mire. Por eso el control visible es de texto: es la
 * única manera de garantizar dd/mm/aaaa en todos.
 *
 * No se pierde el calendario. El botón abre el selector NATIVO del navegador
 * —accesible, táctil y traducido por el sistema—, que escribe en el campo de
 * texto. Se conserva lo que el control nativo hacía bien y se corrige lo único
 * que hacía mal.
 *
 * Hacia fuera el valor es SIEMPRE ISO; la conversión vive en `lib/dates.js`.
 */
export function DateField({ value, onChange, name, id, ...props }) {
  const [text, setText] = useState(() => isoToDisplay(value))

  /*
   * Última fecha que este campo emitió.
   *
   * Sirve para distinguir un cambio PROPIO de uno de fuera. Con la fecha a
   * medias el campo emite cadena vacía —«13/01/202» todavía no es una fecha—, y
   * sin esta marca el valor vacío que vuelve del formulario se confundiría con
   * un borrado externo: se reescribiría el texto y cada dígito desaparecería al
   * teclearlo.
   */
  const [emitted, setEmitted] = useState(() => toIsoDate(value))

  const nativeRef = useRef(null)

  // Ajuste durante el render, no en un efecto: es el patrón que React recomienda
  // para reaccionar a un cambio de prop, y evita el repintado de más que deja
  // ver la fecha antigua durante un fotograma.
  const incoming = toIsoDate(value)
  if (incoming !== emitted) {
    setEmitted(incoming)
    setText(isoToDisplay(incoming))
  }

  function emit(nextText) {
    const iso = displayToIso(nextText)

    setText(nextText)
    setEmitted(iso)
    onChange({ target: { name, value: iso } })
  }

  // Fecha escrita pero imposible. Se avisa aquí y no se espera al servidor: el
  // usuario acaba de teclearla y es cuando puede corregirla sin buscarla.
  const isMalformed = text.length === 10 && displayToIso(text) === ''

  return (
    <div className="datefield">
      <input
        {...props}
        aria-invalid={isMalformed ? true : props['aria-invalid']}
        autoComplete="off"
        className="control datefield__input"
        id={id}
        // Teclado numérico en el móvil del profesor, sin forzar `type=number`,
        // que no admite las barras.
        inputMode="numeric"
        onChange={(event) => emit(maskDate(event.target.value))}
        placeholder={t('common.datePlaceholder')}
        type="text"
        value={text}
      />

      {/* El valor que viaja a la API es este, siempre ISO. */}
      <input name={name} type="hidden" value={displayToIso(text)} />

      <button
        aria-label={t('common.openCalendar')}
        className="datefield__picker"
        onClick={() => {
          // `showPicker` necesita un gesto del usuario, y este clic lo es.
          // Donde no exista, queda el campo de texto, que es el principal.
          const native = nativeRef.current
          if (typeof native?.showPicker === 'function') native.showPicker()
        }}
        tabIndex={-1}
        title={t('common.openCalendar')}
        type="button"
      >
        <span aria-hidden="true">📅</span>
      </button>

      {/*
        El control nativo, solo como calendario. Va oculto a la vista Y al lector
        de pantalla: duplicaría el campo anunciándolo dos veces, y su formato es
        justo el que este componente viene a evitar.
      */}
      <input
        aria-hidden="true"
        className="datefield__native"
        onChange={(event) => emit(isoToDisplay(event.target.value))}
        ref={nativeRef}
        tabIndex={-1}
        type="date"
        value={displayToIso(text)}
      />

      {isMalformed ? (
        <p className="field__error" role="alert">{t('common.invalidDate')}</p>
      ) : null}
    </div>
  )
}
