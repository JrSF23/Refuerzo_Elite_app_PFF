import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { t } from '../i18n/index.js'
import { useSession } from '../context/SessionContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Field.jsx'

/**
 * Pantalla de acceso.
 *
 * Un solo campo para usuario o correo, porque es lo que acepta la API: el
 * parámetro se llama `login` y el servidor resuelve contra ambas columnas
 * (FR-010).
 *
 * NO hay recuperación de contraseña ni registro (FR-013). La API no los soporta,
 * y ofrecer un enlace que no lleva a ninguna parte es peor que no ofrecerlo.
 */
export function LoginPage() {
  const { login, isAuthenticated, homePath, expiredNotice, dismissExpiredNotice } = useSession()
  const navigate = useNavigate()
  const location = useLocation()

  const [form, setForm] = useState({ login: '', password: '' })
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loginRef = useRef(null)

  // Destino guardado por la guarda de ruta: quien pidió /alumnos sin sesión debe
  // acabar en /alumnos, no en el panel (FR-002).
  const redirectTo = location.state?.from ?? homePath

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo, { replace: true })
  }, [isAuthenticated, navigate, redirectTo])

  async function handleSubmit(event) {
    event.preventDefault()

    if (isSubmitting) return

    setError('')
    setFieldErrors({})
    setIsSubmitting(true)
    dismissExpiredNotice()

    try {
      await login(form)
    } catch (requestError) {
      // El mensaje del servidor manda: está en español, es más concreto y no
      // revela si falló el usuario o la contraseña (FR-011).
      setError(requestError.message || t('auth.genericError'))
      setFieldErrors(requestError.fieldErrors ?? {})

      // El foco vuelve al primer campo para poder reintentar sin tocar el ratón.
      loginRef.current?.focus()
      loginRef.current?.select()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <main className="auth-card">
        <div className="auth-card__brand">
          <span aria-hidden="true" className="auth-card__mark">SW</span>
          <div>
            <strong>{t('app.name')}</strong>
            <span className="auth-card__tagline">{t('app.tagline')}</span>
          </div>
        </div>

        <h1 className="auth-card__title">{t('auth.title')}</h1>
        <p className="auth-card__subtitle">{t('auth.subtitle')}</p>

        {expiredNotice ? (
          <p className="alert alert--info" role="status">{t('auth.sessionExpired')}</p>
        ) : null}

        {error ? (
          <p className="alert alert--error" role="alert">{error}</p>
        ) : null}

        <form className="auth-form" noValidate onSubmit={handleSubmit}>
          <Field
            error={fieldErrors.login?.[0]}
            hint={t('auth.loginHint')}
            label={t('auth.login')}
            required
          >
            {(props) => (
              <Input
                {...props}
                autoComplete="username"
                onChange={(event) => setForm({ ...form, login: event.target.value })}
                ref={loginRef}
                value={form.login}
              />
            )}
          </Field>

          <Field
            error={fieldErrors.password?.[0]}
            label={t('auth.password')}
            required
          >
            {(props) => (
              <Input
                {...props}
                autoComplete="current-password"
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                type="password"
                value={form.password}
              />
            )}
          </Field>

          <Button isLoading={isSubmitting} type="submit" variant="primary">
            {isSubmitting ? t('auth.submitting') : t('auth.submit')}
          </Button>
        </form>
      </main>
    </div>
  )
}
