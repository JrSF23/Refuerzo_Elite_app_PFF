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
 * ── El efecto depende SOLO de `isOpen` ──────────────────────────────────────
 *
 * `onClose` va en una ref a propósito. Cuando estaba en las dependencias, bastaba
 * con que quien llama pasara una función en línea —`onClose={() => cerrar()}`,
 * que es lo natural de escribir— para que su identidad cambiara en cada render.
 * El efecto se limpiaba y se volvía a montar, y su montaje **mueve el foco al
 * primer elemento enfocable**.
 *
 * El resultado era que escribir una letra en un formulario disparaba un render,
 * y el foco saltaba al botón de cerrar. La segunda letra ya no llegaba al campo:
 * los formularios eran inservibles con teclado.
 *
 * Con la ref, el efecto se monta una vez por apertura y `onClose` puede cambiar
 * cuantas veces quiera. El gancho queda inmune a callbacks inestables, que es
 * mejor que confiar en que cada componente recuerde memorizar el suyo.
 *
 * @param {boolean} isOpen
 * @param {() => void} onClose  Se invoca al pulsar Escape.
 */
export function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Siempre la última versión, sin formar parte de las dependencias del efecto.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!isOpen) return undefined

    const container = containerRef.current
    if (!container) return undefined

    // Se guarda ANTES de mover el foco, para poder devolverlo al cerrar.
    previousFocusRef.current = document.activeElement

    /*
     * Se descartan solo los elementos ocultos DE FORMA EXPLÍCITA.
     *
     * El filtro anterior usaba `offsetParent !== null`, que es la heurística
     * habitual para «está visible». Tiene dos problemas: devuelve `null` también
     * para cualquier elemento `position: fixed` —y el diálogo vive dentro de una
     * capa fija—, y en jsdom devuelve `null` SIEMPRE, porque no hay motor de
     * maquetación. Con ella, la trampa se quedaba sin elementos que enfocar y
     * caía al contenedor, cosa que ninguna prueba podía detectar sin un
     * navegador de verdad.
     *
     * Lo que de verdad importa aquí es lo que el autor del diálogo ha ocultado a
     * propósito, y eso se declara.
     */
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))
      .filter((el) => !el.hidden && el.getAttribute('aria-hidden') !== 'true')

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
        onCloseRef.current?.()
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
  }, [isOpen])

  return containerRef
}
