import { useCallback, useEffect, useState } from 'react'

import { api } from '../lib/api.js'

/**
 * Datos del panel.
 *
 * UNA sola petición a `GET /dashboard` (FR-014). El endpoint devuelve ya los
 * contadores y la actividad reciente; no se completa con llamadas a los
 * listados, y NO se agrega nada recorriendo páginas en el cliente (FR-015).
 *
 * La variante —administración o profesor— la decide el campo `role` de la
 * respuesta, no los roles del usuario (FR-016): el servidor es quien sabe qué
 * conjunto de datos ha construido.
 */
export function useDashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback((signal) => {
    setIsLoading(true)
    setError(null)

    return api.get('/dashboard', { signal })
      .then(({ data: payload }) => {
        setData(payload)
        setError(null)
      })
      .catch((requestError) => {
        // Una cancelación no es un fallo: ocurre al desmontar y mostrarla como
        // error dejaría un aviso rojo al salir de la pantalla.
        if (requestError.isCanceled) return
        setError(requestError)
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  // El reintento del estado de error no recarga la página (FR-044).
  const retry = useCallback(() => load(), [load])

  return { data, error, isLoading, retry }
}
