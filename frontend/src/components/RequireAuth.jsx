import { Navigate, useLocation } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

export function RequireAuth({ children, allowedRoles = [] }) {
  const location = useLocation()
  const { hasAnyRole, isAuthenticated, isBooting } = useSession()

  if (isBooting) {
    return <div className="page-shell login-shell"><div className="login-card"><div className="login-form">Cargando la sesión...</div></div></div>
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/acceso" />
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return <Navigate replace to="/" />
  }

  return children
}
