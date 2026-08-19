import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../lib/api.js'

/**
 * Datos del panel.
 *
 * UNA sola petición a `GET /dashboard` (FR-014). El endpoint devuelve ya los
 * contadores y la actividad reciente; no se completa con llamadas a los
 * listados, y NO se agrega nada recorriendo páginas en el cliente (FR-015).
 *
 * ── Sobre el estado ─────────────────────────────────────────────────────────
 *
 * El estado se expone como un ÚNICO valor `status` y no como tres booleanos
 * sueltos. La versión anterior tenía `data`, `error` e `isLoading` por separado,
 * y eso permitía representar una combinación imposible —«ni cargando, ni error,
 * ni datos»— en la que la pantalla se colaba entre las dos guardas y leía
 * `data.role` sobre un `null`.
 *
 * Cómo se llegaba a esa combinación: el `.catch` descartaba las cancelaciones
 * con un `return` temprano, pero el `.finally` ponía `isLoading` a `false` de
 * todos modos. Al cancelarse una petición quedaba `isLoading:false`,
 * `error:null`, `data:null`. Y las cancelaciones no son un caso raro: en
 * desarrollo, StrictMode monta, desmonta y vuelve a montar cada efecto, así que
 * la primera petición SIEMPRE se aborta. Que se viera o no dependía de si el
 * `finally` de la petición abortada corría antes o después de que respondiera
 * la segunda: una carrera, y por eso el fallo era intermitente.
 *
 * Con un solo `status` esa combinación deja de ser representable: mientras no
 * sea `'ready'`, no hay datos que leer, y el compilador de la pantalla no tiene
 * por dónde colarse.
 */
export function useDashboard() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null })

  // Identifica la petición vigente. Una respuesta —o un fallo— de una petición
  // que ya fue superada no debe tocar el estado: es la otra mitad de la carrera.
  const requestRef = useRef(0)

  const load = useCallback(async (signal) => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId

    const isStale = () => requestRef.current !== requestId

    setState((current) => ({ ...current, status: 'loading', error: null }))

    try {
      const { data } = await api.get('/dashboard', { signal })

      if (isStale()) return
      setState({ status: 'ready', data, error: null })
    } catch (error) {
      // Cancelación deliberada: la produce el desmontaje o una recarga que la
      // sustituye. NO es un fallo y, sobre todo, NO debe sacar del estado de
      // carga: quien manda es la petición que la reemplazó.
      if (error.isCanceled || isStale()) return

      setState({ status: 'error', data: null, error })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [load])

  // El reintento no recarga la página (FR-044).
  const retry = useCallback(() => load(), [load])

  return {
    status: state.status,
    data: state.data,
    error: state.error,
    isLoading: state.status === 'loading',
    retry,
  }
}
