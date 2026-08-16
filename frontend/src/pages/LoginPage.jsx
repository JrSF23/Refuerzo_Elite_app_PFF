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
    return <Navigate replace to="/espacio" />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form)
      navigate(location.state?.from?.pathname || '/espacio', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.message || "No se ha podido iniciar sesión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell login-shell">
      <div className="login-card">
        <section className="login-brand">
          <div className="eyebrow">Acceso del equipo</div>
          <img alt="Refuerzo Elite" className="login-logo" src="/brand/logo-refuerzo-elite.png" />
          <h1>Un acceso reservado a la administración y al profesorado.</h1>
          <p>
            El sitio público sigue abierto a visitantes y alumnos. Este espacio seguro sirve para gestionar los grupos,
            las sesiones, la asistencia y la administración interna del centro.
          </p>

          <div className="login-points">
            <div className="login-point">Seguimiento claro de los alumnos, los grupos y la asistencia.</div>
            <div className="login-point">Interfaz moderna, inspirada en la identidad de siempre del centro.</div>
            <div className="login-point">API Laravel protegida, con acceso limitado según el rol.</div>
          </div>
        </section>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-meta">
            <div className="section-label">Identificación</div>
            <h2 style={{ margin: '6px 0 0' }}>Iniciar sesión</h2>
            <p className="hint">Use su nombre de usuario o su correo profesional.</p>
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="field-grid">
            <div className="field">
              <label htmlFor="login">Usuario o correo</label>
              <input
                autoComplete="username"
                id="login"
                value={form.login}
                onChange={(event) => setForm((current) => ({ ...current, login: event.target.value }))}
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
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
            {loading ? 'Acceder en cours...' : "Entrar en el espacio del equipo"}
          </button>

          <Link className="text-link" to="/">
            Volver al sitio public
          </Link>
        </form>
      </div>
    </div>
  )
}
