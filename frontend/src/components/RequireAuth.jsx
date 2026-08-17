import { Navigate, useLocation } from 'react-router-dom'

import { t } from '../i18n/index.js'
import { useSession } from '../context/SessionContext.jsx'
import { canAccess } from '../lib/permissions.js'
import { Spinner } from './ui/Spinner.jsx'

/**
 * Guarda de autenticación.
 *
 * El estado de carga es imprescindible: mientras se resuelve `/me` todavía no se
 * sabe si hay sesión, y redirigir a `/login` en ese momento expulsaría al usuario
 * en cada recarga de página (FR-006).
 */
export function RequireAuth({ children }) {
  const { isLoading, isAuthenticated } = useSession()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="boot">
        <Spinner label={t('common.loading')} size="lg" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // El destino viaja en el estado de navegación para poder volver tras el
    // acceso. `replace` evita que el botón de atrás devuelva a una ruta que no
    // se puede ver.
    return <Navigate replace state={{ from: location.pathname + location.search }} to="/login" />
  }

  return children
}

/**
 * Guarda de sección.
 *
 * Una sección no permitida redirige a la ruta de inicio del rol, NO muestra un
 * 403 (FR-004): el usuario no ha hecho nada mal, simplemente ha llegado por URL
 * a un sitio que no le corresponde, y dejarlo en una pantalla de error sin salida
 * es peor que llevarlo a donde sí puede trabajar.
 *
 * Esto NO es seguridad. El servidor autoriza igualmente (FR-040).
 */
export function RequireSection({ section, children }) {
  const { roleNames, homePath } = useSession()

  if (!canAccess(section, roleNames)) {
    return <Navigate replace to={homePath} />
  }

  return children
}
