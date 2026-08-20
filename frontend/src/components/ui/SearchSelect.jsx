import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { t, tPlural } from '../../i18n/index.js'
import { api } from '../../lib/api.js'

/** Resultados por consulta. Suficientes para elegir sin obligar a desplazarse. */
const PAGE_SIZE = 20

/** Espera antes de consultar al servidor, en milisegundos. */
const DEBOUNCE_MS = 250

/**
 * Selector de relación CON BÚSQUEDA EN SERVIDOR.
 *
 * Sustituye a `RelationSelect` en los recursos que el servidor sabe buscar. El
 * motivo no es la comodidad, es la corrección:
 *
 *   `BaseApiController::index` limita `per_page` a 50 —`min($request->integer(
 *   'per_page'), 50)`—, así que un desplegable que pide una página y la pinta
 *   entera nunca puede ofrecer más de 50 registros. En un centro con 1.000
 *   alumnos, 950 no estaban «al final de la lista»: NO ESTABAN. Matricularlos
 *   era imposible desde el formulario, y nada lo indicaba.
 *
 * Con búsqueda en servidor el catálogo deja de tener que caber en el navegador:
 * se consulta lo que el usuario escribe y se traen 20 coincidencias.
 *
 * Cuando aun así hay más coincidencias que las mostradas, SE DICE. Es la lección
 * del defecto anterior: truncar en silencio es lo que hacía que el usuario
 * concluyera que el alumno no existe.
 *
 * @param {string}   endpoint      Recurso de la API. Debe declarar `$searchable`.
 * @param {Function} optionLabel   Cómo se rotula cada registro.
 * @param {object}   [params]      Acotación extra enviada en cada consulta.
 * @param {boolean}  [isDisabled]  Deshabilitado por una razón de dominio.
 * @param {string}   [disabledHint] Por qué. Un control gris y mudo no explica nada.
 */
export function SearchSelect({
  endpoint,
  optionLabel,
  placeholder,
  value,
  onChange,
  name,
  params,
  isDisabled = false,
  disabledHint,
  id,
  ...props
}) {
  const generatedId = useId()
  const listboxId = `${id ?? generatedId}-listbox`

  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState([])
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedLabel, setSelectedLabel] = useState(null)

  const inputRef = useRef(null)
  const listRef = useRef(null)

  // Contra las carreras: solo la respuesta de la última petición emitida puede
  // escribir en el estado. Sin esto, una consulta lenta de «a» puede aterrizar
  // después de la de «ana» y repintar los resultados equivocados.
  const requestIdRef = useRef(0)

  const paramsKey = JSON.stringify(params ?? null)

  /*
   * Rótulo del valor ya seleccionado.
   *
   * IMPRESCINDIBLE AL EDITAR. El registro guardado puede ser el alumno 873, que
   * no aparece en ninguna primera página; sin resolverlo aparte, el formulario
   * de edición mostraría el campo vacío y guardar lo borraría. Se pide por id,
   * que el servidor acota igual a la organización activa: un id ajeno responde
   * 404, nunca el registro.
   */
  useEffect(() => {
    if (value === '' || value === null || value === undefined) {
      setSelectedLabel(null)
      return undefined
    }

    const known = options.find((option) => String(option.id) === String(value))

    if (known) {
      setSelectedLabel(optionLabel(known))
      return undefined
    }

    if (selectedLabel !== null) return undefined

    const controller = new AbortController()

    api.get(`/${endpoint}/${value}`, { signal: controller.signal })
      .then(({ data }) => setSelectedLabel(optionLabel(data)))
      .catch((error) => {
        if (error.isCanceled) return
        // El registro ya no existe o no es de este centro. Se muestra el aviso
        // en lugar de un campo en blanco que parecería «sin asignar».
        setSelectedLabel(t('common.unresolvedOption'))
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, endpoint, options])

  /** Consulta al servidor. Se llama ya con el retardo aplicado. */
  const search = useCallback((term) => {
    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    setStatus('loading')

    api.get(`/${endpoint}`, {
      params: { search: term || undefined, per_page: PAGE_SIZE, ...(params ?? {}) },
    })
      .then(({ data }) => {
        if (requestIdRef.current !== requestId) return

        setOptions(data.data ?? [])
        setTotal(data.total ?? 0)
        setStatus('ready')
        setActiveIndex(data.data?.length ? 0 : -1)
      })
      .catch((error) => {
        if (error.isCanceled || requestIdRef.current !== requestId) return
        setStatus('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey])

  // Búsqueda con retardo: sin él, «González» son ocho peticiones y las últimas
  // llegan desordenadas.
  useEffect(() => {
    if (!isOpen || isDisabled) return undefined

    const timer = setTimeout(() => search(query.trim()), query === '' ? 0 : DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [isOpen, isDisabled, query, search])

  // La opción activa tiene que verse: navegar con el teclado hasta un elemento
  // fuera del recuadro visible deja al usuario sin saber dónde está.
  useEffect(() => {
    if (!isOpen || activeIndex < 0) return

    const option = listRef.current?.querySelector(`[data-index="${activeIndex}"]`)

    // Comprobado antes de llamar: `scrollIntoView` no existe en jsdom, y sin
    // esto una comodidad visual tumbaría la suite entera.
    if (typeof option?.scrollIntoView === 'function') {
      option.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex, isOpen])

  function open() {
    if (isDisabled || isOpen) return

    setQuery('')
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setQuery('')
    setActiveIndex(-1)
  }

  function select(option) {
    setSelectedLabel(optionLabel(option))
    // Se emite con la forma de un evento de control para que el formulario lo
    // trate como a cualquier otro campo y no necesite un caso especial.
    onChange({ target: { name, value: String(option.id) } })
    close()
    inputRef.current?.focus()
  }

  function clear() {
    setSelectedLabel(null)
    onChange({ target: { name, value: '' } })
    close()
    inputRef.current?.focus()
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()

      if (!isOpen) {
        open()
        return
      }

      const delta = event.key === 'ArrowDown' ? 1 : -1
      const next = activeIndex + delta

      // Sin envolver por los extremos: llegar al final y saltar al principio
      // desorienta cuando no se ve la lista entera.
      if (next >= 0 && next < options.length) setActiveIndex(next)
      return
    }

    if (event.key === 'Enter' && isOpen) {
      // El desplegable se come el Enter: con el formulario abierto, elegir una
      // opción NO puede enviarlo.
      event.preventDefault()

      if (activeIndex >= 0 && options[activeIndex]) select(options[activeIndex])
      return
    }

    if (event.key === 'Escape' && isOpen) {
      /*
       * `stopPropagation` es obligatorio aquí. `useFocusTrap` escucha Escape en
       * `document` para cerrar el cajón; sin detenerlo, cerrar el desplegable
       * cerraría también el formulario entero y se perdería lo escrito.
       */
      event.stopPropagation()
      event.preventDefault()
      close()
      return
    }

    if (event.key === 'Tab' && isOpen) close()
  }

  const hasSelection = value !== '' && value !== null && value !== undefined

  return (
    <div
      className="combo"
      // Contrato con `useFocusTrap`: mientras la lista está abierta, Escape es
      // de este control. Sin esto, cerrar la lista cerraría el cajón entero,
      // porque la trampa escucha en captura y gana siempre.
      data-escape-handled={isOpen ? 'true' : undefined}
      onBlur={(event) => {
        // Solo se cierra si el foco sale del conjunto, no al pasar del campo a
        // la lista.
        if (!event.currentTarget.contains(event.relatedTarget)) close()
      }}
    >
      <div className="combo__control">
        <input
          {...props}
          aria-autocomplete="list"
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          className="control combo__input"
          disabled={isDisabled}
          id={id}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!isOpen) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          onMouseDown={open}
          placeholder={
            isDisabled
              ? (disabledHint ?? t('common.select'))
              : (selectedLabel ?? placeholder ?? t('common.typeToSearch'))
          }
          ref={inputRef}
          role="combobox"
          type="text"
          value={isOpen ? query : (selectedLabel ?? '')}
        />

        {/* El campo de texto no guarda el valor: lo guarda este campo oculto,
            que es un id. Así el formulario lee siempre el identificador y nunca
            el rótulo que se ve. */}
        <input name={name} type="hidden" value={value ?? ''} />

        {hasSelection && !isDisabled ? (
          <button
            className="combo__clear"
            onClick={clear}
            // `onMouseDown` del contenedor no debe robar el foco antes del clic.
            onMouseDown={(event) => event.preventDefault()}
            title={t('common.clearSelection')}
            type="button"
          >
            <span aria-hidden="true">×</span>
            <span className="visually-hidden">{t('common.clearSelection')}</span>
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="combo__panel">
          {status === 'loading' ? (
            <p className="combo__note">{t('common.loading')}</p>
          ) : null}

          {status === 'error' ? (
            <p className="combo__note combo__note--error">{t('common.errorTitle')}</p>
          ) : null}

          {status === 'ready' && options.length === 0 ? (
            <p className="combo__note">{t('common.noResultsTitle')}</p>
          ) : null}

          {options.length > 0 ? (
            <ul
              className="combo__list"
              id={listboxId}
              ref={listRef}
              role="listbox"
            >
              {options.map((option, index) => (
                <li
                  aria-selected={String(option.id) === String(value)}
                  className={index === activeIndex ? 'combo__option combo__option--active' : 'combo__option'}
                  data-index={index}
                  key={option.id}
                  onClick={() => select(option)}
                  // Evita que el campo pierda el foco antes de que llegue el
                  // clic, que es lo que haría desaparecer la lista sin elegir.
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  role="option"
                >
                  {optionLabel(option)}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Lo que el desplegable anterior callaba. */}
          {status === 'ready' && total > options.length ? (
            <p className="combo__note combo__note--more">
              {t('common.moreResults', { shown: options.length, total })}
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Región viva: quien usa lector de pantalla no ve cuántas opciones hay. */}
      <span aria-live="polite" className="visually-hidden" role="status">
        {isOpen && status === 'ready'
          ? tPlural('common.optionsAvailable', options.length)
          : ''}
      </span>
    </div>
  )
}
