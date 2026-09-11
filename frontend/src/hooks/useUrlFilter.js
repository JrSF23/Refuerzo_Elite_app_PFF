import { useSearchParams } from 'react-router-dom'

/**
 * Acotación de un listado que viaja en la URL.
 *
 * Nace de un defecto concreto del panel: sus avisos —«12 pagos pendientes»,
 * «3 grupos sin profesor»— enlazaban a la SECCIÓN, así que al pulsar «Ver» el
 * usuario aterrizaba en la lista general y tenía que buscar a mano justo lo que
 * el aviso acababa de contarle. Un aviso así deja de usarse.
 *
 * ── Por qué en la URL y no en estado del componente ─────────────────────────
 *
 * Porque el destino tiene que ser ENLAZABLE: el panel necesita apuntar a «los
 * pendientes», no pulsar un control después de llegar. Y de paso la vista se
 * puede compartir y sobrevive a una recarga.
 *
 * Son los primeros parámetros de consulta del proyecto. Hasta ahora lo acotado
 * iba por subruta (`/alumnos/grupo/:id`), que es lo correcto cuando el ámbito es
 * OTRA entidad —los alumnos DE un aula—. Aquí no: es la misma lista de siempre
 * vista en parte, y por subruta acabaríamos multiplicando rutas por cada criterio.
 *
 * ── Idioma ──────────────────────────────────────────────────────────────────
 *
 * La URL es interfaz y va en español (`?estado=pendiente`); lo que se manda al
 * servidor es contrato y va en inglés (`status=pending`). El mapeo lo hace cada
 * pantalla al declarar sus valores, igual que un `label` español sobre un
 * `value` inglés. El convenio `sin-asignar` → `none` ya existía en los alumnos
 * sin aula.
 *
 * @param {Array<{param: string, values: Object}>} filters Valores admitidos.
 *   Cada valor declara `params` —lo que viaja al servidor— y `label()`, que se
 *   resuelve en render porque `t()` lee estado de módulo, no de React.
 * @returns {{listParams: Object|undefined, activeFilter: {label: string}|null}}
 */
export function useUrlFilter(filters) {
  const [searchParams] = useSearchParams()

  for (const filter of filters) {
    const value = searchParams.get(filter.param)

    if (value === null) continue

    const match = filter.values[value]

    /*
     * Valor desconocido: NO se inventa un filtro ni se dibuja el distintivo. La
     * lista sale entera, que es exactamente lo que se está mostrando, y decir lo
     * contrario sería peor que no decir nada. El servidor hace la otra mitad:
     * ante un valor que no reconoce devuelve conjunto vacío en vez del listado
     * completo, para que nadie crea estar viendo «todos los pendientes».
     */
    if (match === undefined) continue

    return { listParams: match.params, activeFilter: { label: match.label() } }
  }

  return { listParams: undefined, activeFilter: null }
}
