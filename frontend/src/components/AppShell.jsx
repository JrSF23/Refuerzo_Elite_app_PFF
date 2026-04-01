import { Link, NavLink, Outlet } from 'react-router-dom'
import { canAccessModule, getRoleNames, moduleDefinitions, roleLabels, sidebarModules } from '../config/modules'
import { useSession } from '../context/SessionContext'

export function AppShell() {
  const { logout, user } = useSession()
  const roleNames = getRoleNames(user)
  const visibleModules = sidebarModules.filter((module) => canAccessModule(moduleDefinitions[module.key], roleNames))
  const profileLabel = roleNames.map((role) => roleLabels[role] ?? role).join(', ') || 'Aucun role'

  return (
    <div className="page-shell">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img alt="Refuerzo Elite" className="sidebar-logo" src="/brand/logo-refuerzo-elite.png" />
            <div>
              <div className="eyebrow">Espace equipe</div>
              <h2>Refuerzo Elite</h2>
              <p>Gestion quotidienne du centre, des groupes, des seances et du suivi pedagogique.</p>
            </div>
          </div>

          <div className="nav-list">
            <NavLink className="nav-link" end to="/espace">Tableau de bord</NavLink>
            {visibleModules.map((module) => (
              <NavLink key={module.key} className="nav-link" to={`/espace/module/${module.key}`}>
                {module.label}
              </NavLink>
            ))}
          </div>

          <div className="sidebar-footer">
            <div className="section-label">Session</div>
            <p>{user?.name}</p>
            <p className="hint">{profileLabel}</p>
            <button className="ghost-btn" onClick={() => void logout()} type="button">
              Se deconnecter
            </button>
          </div>
        </aside>

        <main className="workspace-panel">
          <div className="workspace-topbar">
            <div>
              <div className="section-label">Administration</div>
              <p className="workspace-copy">Le site public reste accessible aux visiteurs et aux eleves, tandis que cet espace est reserve a l equipe.</p>
            </div>
            <Link className="ghost-btn link-btn" to="/">
              Voir le site public
            </Link>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
