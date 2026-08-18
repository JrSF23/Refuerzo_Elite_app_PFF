import { useEffect, useState } from 'react'

import { api } from '../../lib/api.js'

/**
 * Cuántos alumnos están pendientes de asignar a un grupo.
 *
 * Necesita consulta propia porque esos alumnos no pertenecen a ningún grupo que
 * pueda contarlos con `withCount`. Se pide **una sola fila** —`per_page=1`— y se
 * lee `total` del paginador: la cifra viene del servidor sin traerse los
 * registros.
 */
export function useUnassignedCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    api.get('/students', {
      params: { tutor_group_id: 'none', per_page: 1 },
      signal: controller.signal,
    })
      .then(({ data }) => setCount(data.total ?? 0))
      .catch(() => {
        // Un fallo aquí no debe romper el índice de grupos: se muestra sin la
        // tarjeta de pendientes, que es peor que nada pero mucho mejor que una
        // pantalla en blanco.
      })

    return () => controller.abort()
  }, [])

  return { count }
}
