import { useEffect, useRef, useState } from 'react'

/**
 * Ancho real del contenedor, observado.
 *
 * FR-060 exige que los cambios de forma se deriven del espacio disponible y no
 * de anchos de dispositivo. Una media query mide la VENTANA, que no es lo que
 * determina si una tabla cabe: en escritorio la barra lateral se come 264 px, y
 * la misma ventana deja un espacio muy distinto según haya barra o no.
 *
 * Con esto, una tabla de tres columnas y otra de ocho cambian a tarjetas en
 * momentos distintos, que es lo correcto.
 */
export function useContainerWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return undefined

    // jsdom no implementa ResizeObserver. En pruebas se cae al ancho conocido
    // del nodo, que basta: allí no hay redimensionados.
    if (typeof ResizeObserver === 'undefined') {
      setWidth(node.getBoundingClientRect().width)
      return undefined
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
