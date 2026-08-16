import { Link, NavLink, Outlet } from 'react-router-dom'
import { canAccessModule, moduleDefinitions, platformModules, roleLabels, sidebarModules } from '../config/modules'
import { useSession } from '../context/SessionContext'

export function AppShell() {
  const { logout, roleNames, user } = useSession()
  const isTeacher = roleNames.includes('teacher') && !roleNames.includes('org_admin')
  const visibleModules = sidebarModules.filter((module) => canAccessModule(moduleDefinitions[module.key], roleNames))
  // Entradas de plataforma: tienen sus propias páginas, no pasan por ModulePage.
  const visiblePlatformModules = platformModules.filter((module) => module.roles.some((role) => roleNames.includes(role)))
  const profileLabel = roleNames.map((role) => roleLabels[role] ?? role).join(', ') || 'Sin rol'

  return (
    <div className="page-shell">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img alt="Refuerzo Elite" className="sidebar-logo" src="/brand/logo-refuerzo-elite.png" />
            <div>
              <div className="eyebrow">{isTeacher ? 'Espacio del profesor' : 'Espacio del equipo'}</div>
              <h2>Refuerzo Elite</h2>
              <p>
                {isTeacher
                  ? 'Gestione sus sesiones, registre la asistencia y consulte sus grupos.'
                  : 'Gestión diaria del centro: grupos, sesiones y seguimiento pedagógico.'}
              </p>
            </div>
          </div>

          <div className="nav-list">
            <NavLink className="nav-link" end to="/espacio">Panel</NavLink>
            {visiblePlatformModules.map((module) => (
              <NavLink key={module.key} className="nav-link" to={module.path}>
                {module.label}
              </NavLink>
            ))}
            {visibleModules.map((module) => (
              <NavLink key={module.key} className="nav-link" to={`/espacio/modulo/${module.key}`}>
                {module.label}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="section-label">Sesión</div>
            <p>{user?.name}</p>
            <p className="hint">{profileLabel}</p>
            <button className="ghost-btn" onClick={() => void logout()} type="button">
              Se déconnecter
            </button>
          </div>
        </aside>

        <main className="workspace-panel">
          <div className="workspace-topbar">
            <div>
              <div className="section-label">{isTeacher ? 'Profesor' : 'Administración'}</div>
              <p className="workspace-copy">
                {isTeacher
                  ? 'Este espacio está reservado al profesorado para gestionar las sesiones y el seguimiento pedagógico.'
                  : 'El sitio público sigue abierto a visitantes y alumnos, mientras que este espacio queda reservado al equipo.'}
              </p>
            </div>
            <Link className="ghost-btn link-btn" to="/">
              Ver el sitio public
            </Link>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
