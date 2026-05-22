import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isStaff, login } = useSession()
  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated && isStaff) {
    return <Navigate replace to="/espace" />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/espace', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || "La connexion n'a pas pu etre etablie.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell login-shell">
      <div className="login-card">
        <section className="login-brand">
          <div className="eyebrow">Connexion equipe</div>
          <img alt="Refuerzo Elite" className="login-logo" src="/brand/logo-refuerzo-elite.png" />
          <h1>Un acces reserve a l administration et aux enseignants.</h1>
          <p>
            La page publique reste ouverte aux visiteurs et aux eleves. Cet espace securise sert a piloter les groupes,
            les seances, les presences et la gestion interne du centre.
          </p>

          <div className="login-points">
            <div className="login-point">Suivi clair des eleves, des groupes et des presences.</div>
            <div className="login-point">Interface moderne, inspiree de l identite historique du centre.</div>
            <div className="login-point">API Laravel securisee avec acces limite selon le role.</div>
          </div>
        </section>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-meta">
            <div className="section-label">Identification</div>
            <h2 style={{ margin: '6px 0 0' }}>Se connecter</h2>
            <p className="hint">Utilisez votre identifiant ou votre adresse e-mail professionnelle.</p>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="login">Identifiant ou e-mail</label>
              <input
                autoComplete="username"
                id="login"
                value={form.login}
                onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Mot de passe</label>
              <input
                autoComplete="current-password"
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </div>
          </div>

          <button className="primary-btn login-submit" disabled={loading} type="submit">
            {loading ? 'Connexion en cours...' : "Entrer dans l espace equipe"}
          </button>

          <Link className="text-link" to="/">
            Retour au site public
          </Link>
        </form>
      </div>
    </div>
  )
}
