import { Link, NavLink } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

export function PublicLayout({ children }) {
  const { isAuthenticated, isStaff } = useSession()
  const staffLink = isAuthenticated && isStaff ? '/espace' : '/connexion'
  const staffLabel = isAuthenticated && isStaff ? "Ouvrir l'espace equipe" : 'Connexion equipe'

  return (
    <div className="public-shell">
      <header className="public-header">
        <Link className="public-brand" to="/">
          <img alt="Refuerzo Elite" className="public-logo" src="/brand/logo-refuerzo-elite.png" />
          <div>
            <div className="eyebrow">Centre d accompagnement scolaire</div>
            <strong>Refuerzo Elite</strong>
          </div>
        </Link>

        <nav className="public-nav">
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} end to="/">
            Accueil
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/centre">
            Le centre
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/services">
            Services
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/methode">
            Methode
          </NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/contact">
            Contact
          </NavLink>
        </nav>

        <Link className="ghost-btn link-btn nav-cta" to={staffLink}>
          {staffLabel}
        </Link>
      </header>

      {children}

      <footer className="public-footer">
        <p>Refuerzo Elite - Centre d accompagnement scolaire.</p>
      </footer>
    </div>
  )
}
