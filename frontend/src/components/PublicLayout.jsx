import { Link, NavLink, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { useSession } from '../context/SessionContext'

export function PublicLayout({ children, contactHref }) {
  const { isAuthenticated, isStaff } = useSession()
  const staffLink = isAuthenticated && isStaff ? '/espace' : '/connexion'
  const staffLabel = isAuthenticated && isStaff ? "Espace equipe" : 'Connexion'
  const location = useLocation()
  const navRef = useRef(null)
  const pillRef = useRef(null)

  useEffect(() => {
    const nav = navRef.current
    const pill = pillRef.current
    if (!nav || !pill) return

    const active = nav.querySelector('.public-nav-link.active')
    if (!active) { pill.style.opacity = '0'; return }

    pill.style.transform = `translateX(${active.offsetLeft}px)`
    pill.style.width = `${active.offsetWidth}px`
    pill.style.opacity = '1'
  }, [location.pathname])

  // Scroll-reveal via IntersectionObserver
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    if (!els.length) return
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [location.pathname])

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

        <nav className="public-nav" ref={navRef}>
          <span aria-hidden="true" className="nav-pill" ref={pillRef} />
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} end to="/">Accueil</NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/centre">Le centre</NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/services">Services</NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/methode">Methode</NavLink>
          <NavLink className={({ isActive }) => `public-nav-link${isActive ? ' active' : ''}`} to="/contact">Contact</NavLink>
        </nav>

        <Link className="primary-btn link-btn nav-cta" to={staffLink}>{staffLabel}</Link>
      </header>

      {children}

      <footer className="public-footer">
        <p>Refuerzo Elite &mdash; Centre d accompagnement scolaire</p>
      </footer>
    </div>
  )
}
