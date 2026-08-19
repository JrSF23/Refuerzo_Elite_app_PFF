import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../lib/api.js'

/**
 * Listado paginado contra el servidor.
 *
 * Es el punto donde se concentran paginación, búsqueda, cancelación y los tres
 * estados, para que las nueve pantallas de entidad no repitan —ni repitan mal—
 * la misma lógica.
 *
 * ── Estado ──────────────────────────────────────────────────────────────────
 *
 * Un único `status`, por la misma razón que en `useDashboard`: con banderas
 * sueltas se puede representar «ni cargando, ni error, ni datos», y esa
 * combinación imposible fue la que dejó el panel en blanco. Aquí no puede
 * ocurrir.
 *
 * ── Cancelación ─────────────────────────────────────────────────────────────
 *
 * Cada carga cancela la anterior. Sin esto, teclear en la búsqueda deja varias
 * peticiones en vuelo y la respuesta más lenta puede pisar a la más reciente,
 * mostrando resultados que no corresponden a lo escrito (FR-065). El
 * identificador de petición vigente cierra el otro flanco: una respuesta que
 * llega tarde tampoco escribe el estado.
 */
export function useResourceList(endpoint, { perPage = 20, params } = {}) {
  const [state, setState] = useState({
    status: 'loading',
    records: [],
    pagination: null,
    error: null,
  })

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const requestRef = useRef(0)
  const abortRef = useRef(null)

  // En una ref para que un objeto nuevo en cada render no recree `load` y
  // dispare una recarga infinita.
  const paramsRef = useRef(params)
  const paramsKey = JSON.stringify(params ?? null)
  paramsRef.current = params

  const load = useCallback(async ({ page: nextPage, search: nextSearch }) => {
    const requestId = requestRef.current + 1
    requestRef.current = requestId

    const isStale = () => requestRef.current !== requestId

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setState((current) => ({ ...current, status: 'loading', error: null }))

    try {
      const { data } = await api.get(`/${endpoint}`, {
        // El servidor topa `per_page` en 50; pedir más no da más (FR-023).
        params: {
          page: nextPage,
          per_page: perPage,
          search: nextSearch || undefined,
          // Acotación fija de la pantalla —por ejemplo, un grupo concreto—. Va
          // al servidor: filtrar en cliente obligaría a traerse el centro entero.
          ...(paramsRef.current ?? {}),
        },
        signal: controller.signal,
      })

      if (isStale()) return

      setState({
        status: 'ready',
        records: data.data ?? [],
        pagination: {
          page: data.current_page,
          lastPage: data.last_page,
          total: data.total,
          from: data.from,
          to: data.to,
        },
        error: null,
      })
    } catch (error) {
      if (error.isCanceled || isStale()) return

      setState({ status: 'error', records: [], pagination: null, error })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, perPage, paramsKey])

  useEffect(() => {
    load({ page, search })
    return () => abortRef.current?.abort()
  }, [load, page, search])

  /**
   * Buscar reinicia a la primera página (FR-025): mantener la 3 tras acotar el
   * listado deja al usuario mirando una página que probablemente ya no existe.
   */
  const changeSearch = useCallback((term) => {
    setSearch(term)
    setPage(1)
  }, [])

  const refresh = useCallback(() => load({ page, search }), [load, page, search])

  /**
   * Tras eliminar el último registro de una página, esa página deja de existir
   * y el servidor devolvería una lista vacía. Se retrocede una.
   */
  const refreshAfterDelete = useCallback(() => {
    if (state.records.length === 1 && page > 1) {
      setPage(page - 1)
      return
    }

    refresh()
  }, [state.records.length, page, refresh])

  return {
    status: state.status,
    records: state.records,
    pagination: state.pagination,
    error: state.error,
    page,
    search,
    setPage,
    setSearch: changeSearch,
    refresh,
    refreshAfterDelete,
    isEmpty: state.status === 'ready' && state.records.length === 0,
  }
}
