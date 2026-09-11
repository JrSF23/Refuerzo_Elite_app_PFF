import { useEffect, useRef, useState } from 'react'

/**
 * Cuándo enseñar el indicador de carga. No es lo mismo que «está cargando».
 *
 * ── El problema: el parpadeo ────────────────────────────────────────────────
 *
 * En una red buena, la mayoría de las peticiones de esta aplicación vuelven en
 * menos de 200 ms. Enseñar un esqueleto durante 150 ms y quitarlo produce un
 * destello: la pantalla salta dos veces —al aparecer el hueco y al llenarse— y
 * se percibe como un fallo de dibujo, no como una espera. Se siente PEOR que no
 * enseñar nada.
 *
 * Y el caso contrario también existe: si el indicador aparece justo cuando los
 * datos están a punto de llegar, se ve 30 ms y desaparece. Mismo destello.
 *
 * ── La solución: dos umbrales ───────────────────────────────────────────────
 *
 * ESPERA. No se enseña nada durante los primeros `delay` milisegundos. Una
 * respuesta rápida sustituye el contenido sin que haya habido indicador, que es
 * exactamente lo que se quiere: la aplicación parece instantánea.
 *
 * PERMANENCIA. Una vez enseñado, se mantiene al menos `minimum` milisegundos
 * aunque los datos ya hayan llegado. Es lo que evita el destello del segundo
 * caso: si algo apareció, se queda el tiempo suficiente para leerse.
 *
 * Los valores por defecto —250 y 400— salen del uso, no de una fórmula: por
 * debajo de ~200 ms una espera no se percibe como tal, y por debajo de ~400 ms
 * algo que aparece y desaparece se lee como un parpadeo.
 *
 * ── Lo que NO hace ──────────────────────────────────────────────────────────
 *
 * No retrasa los datos ni el error: solo el INDICADOR. Cuando la respuesta
 * llega, el contenido se dibuja de inmediato; lo único que puede quedarse un
 * instante de más es el esqueleto que ya estaba puesto.
 */
export function useDeferredLoading(isLoading, { delay = 250, minimum = 400 } = {}) {
  const [visible, setVisible] = useState(false)

  // Cuándo se enseñó, para saber cuánto le queda de permanencia. En una ref y no
  // en estado: cambiarlo no debe provocar un dibujado por sí mismo.
  const shownAt = useRef(0)

  useEffect(() => {
    if (isLoading) {
      // Ya visible —una segunda carga encadenada— no reinicia nada: el
      // indicador sigue puesto y su reloj sigue corriendo.
      if (visible) return undefined

      const timer = setTimeout(() => {
        shownAt.current = Date.now()
        setVisible(true)
      }, delay)

      return () => clearTimeout(timer)
    }

    if (!visible) return undefined

    // Siempre por temporizador, incluso cuando la permanencia ya se cumplió y el
    // retardo sale cero o negativo. Llamar a `setState` de forma síncrona dentro
    // del efecto encadena un segundo dibujado inmediato —React avisa de ello— y
    // no gana nada: un temporizador de cero milisegundos retira el indicador en
    // el siguiente tic, que es indistinguible a la vista.
    const remaining = Math.max(0, minimum - (Date.now() - shownAt.current))

    const timer = setTimeout(() => setVisible(false), remaining)
    return () => clearTimeout(timer)
  }, [isLoading, visible, delay, minimum])

  return visible
}
