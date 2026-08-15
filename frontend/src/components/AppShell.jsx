import { Link, NavLink, Outlet } from 'react-router-dom'
import { canAccessModule, moduleDefinitions, platformModules, roleLabels, sidebarModules } from '../config/modules'
import { useSession } from '../context/SessionContext'

export function AppShell() {
  const { logout, roleNames, user } = useSession()
  const isTeacher = roleNames.includes('teacher') && !roleNames.includes('org_admin')
  const visibleModules = sidebarModules.filter((module) => canAccessModule(moduleDefinitions[module.key], roleNames))
  // Entrées de plateforme : elles ont leurs propres pages, pas ModulePage.
  const visiblePlatformModules = platformModules.filter((module) => module.roles.some((role) => roleNames.includes(role)))
  const profileLabel = roleNames.map((role) => roleLabels[role] ?? role).join(', ') || 'Aucun rôle'

  return (
    <div className="page-shell">
      <div className="app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <img alt="Refuerzo Elite" className="sidebar-logo" src="/brand/logo-refuerzo-elite.png" />
            <div>
              <div className="eyebrow">{isTeacher ? 'Espace enseignant' : 'Espace équipe'}</div>
              <h2>Refuerzo Elite</h2>
              <p>
                {isTeacher
                  ? 'Gérez vos séances, suivez les présences et consultez vos groupes.'
                  : 'Gestion quotidienne du centre, des groupes, des séances et du suivi pédagogique.'}
              </p>
            </div>
          </div>

          <div className="nav-list">
            <NavLink className="nav-link" end to="/espace">Tableau de bord</NavLink>
            {visiblePlatformModules.map((module) => (
              <NavLink key={module.key} className="nav-link" to={module.path}>
                {module.label}
              </NavLink>
            ))}
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
              Se déconnecter
            </button>
          </div>
        </aside>

        <main className="workspace-panel">
          <div className="workspace-topbar">
            <div>
              <div className="section-label">{isTeacher ? 'Enseignant' : 'Administration'}</div>
              <p className="workspace-copy">
                {isTeacher
                  ? 'Cet espace est réservé aux enseignants pour la gestion des séances et le suivi pédagogique.'
                  : "Le site public reste accessible aux visiteurs et aux élèves, tandis que cet espace est réservé à l'équipe."}
              </p>
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
