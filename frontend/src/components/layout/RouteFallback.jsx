import { t } from '../../i18n/index.js'
import { useDeferredLoading } from '../../hooks/useDeferredLoading.js'
import { Spinner } from '../ui/Spinner.jsx'

/**
 * Espera mientras llega el código de una pantalla.
 *
 * Desde que cada sección viaja en su propio fichero, cambiar de sección puede
 * exigir una descarga. Con la caché templada eso son milisegundos, así que
 * enseñar un indicador sin más produciría un destello en CADA navegación — y el
 * proyecto ya decidió que un destello se percibe peor que una espera corta sin
 * aviso (ver `useDeferredLoading`).
 *
 * Por eso no se dibuja nada durante los primeros 250 ms: la navegación normal
 * pasa a ser instantánea a la vista, y el indicador solo aparece cuando la espera
 * es de verdad. Es exactamente el criterio de los esqueletos de los listados,
 * aplicado a la llegada del código en vez de a la de los datos.
 *
 * El armazón —barra lateral y cabecera— NO se desmonta: la frontera de
 * `Suspense` envuelve solo el contenido, así que la navegación sigue visible y
 * quien esperaba ya sabe a dónde va.
 */
export function RouteFallback() {
  const isVisible = useDeferredLoading(true)

  if (!isVisible) {
    return null
  }

  return (
    <div className="route-fallback">
      <Spinner label={t('common.loading')} size="lg" />
    </div>
  )
}
