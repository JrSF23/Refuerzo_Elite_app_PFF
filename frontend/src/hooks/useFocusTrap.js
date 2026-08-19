import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/**
 * Atrapa el foco dentro de un contenedor mientras está abierto, y lo devuelve al
 * elemento que lo abrió al cerrarse (FR-049).
 *
 * Lo comparten `Modal` y `Drawer`. Escribirlo una vez es lo que evita que uno de
 * los dos se quede a medias: sin esto, quien navega con teclado puede tabular
 * fuera del diálogo y quedarse operando la página de detrás, que sigue tapada.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose  Se invoca al pulsar Escape.
 */
export function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    const container = containerRef.current
    if (!container) return undefined

    // Se guarda ANTES de mover el foco, para poder devolverlo al cerrar.
    previousFocusRef.current = document.activeElement

    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))
      .filter((el) => el.offsetParent !== null || el === document.activeElement)

    // El primer elemento enfocable, o el contenedor si no hay ninguno: un
    // diálogo sin foco dentro deja al lector de pantalla anunciando la página de
    // detrás.
    const first = focusables()[0]
    if (first) {
      first.focus()
    } else {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
        return
      }

      if (event.key !== 'Tab') return

      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }

      const firstItem = items[0]
      const lastItem = items[items.length - 1]

      // El ciclo se cierra a mano: el navegador llevaría el foco al navegador
      // mismo o a la página de detrás.
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    // Bloquea el desplazamiento de la página de detrás: sin esto, la rueda del
    // ratón sobre el diálogo mueve el contenido que hay debajo.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow

      // `focus()` sobre un nodo ya desmontado no hace nada, pero comprobarlo
      // evita excepciones si el disparador desapareció con el propio cambio.
      const previous = previousFocusRef.current
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) {
        previous.focus()
      }
    }
  }, [isOpen, onClose])

  return containerRef
}
