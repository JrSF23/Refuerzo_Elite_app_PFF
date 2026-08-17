/**
 * Persistencia del token de sesión.
 *
 * Se mantiene en `localStorage`, como hacía el frontend anterior. Endurecerlo a
 * cookie de sesión con `SameSite` y CSRF sería más robusto frente a XSS, pero
 * exige cambios de configuración y de rutas en el backend, que esta feature
 * tiene vedado. Queda anotado en plan.md → Complexity Tracking.
 */

const TOKEN_KEY = 'smartwork.token'

/**
 * `localStorage` lanza en modo privado de algunos navegadores y cuando la cuota
 * está agotada. Si falla, la sesión no persiste entre recargas, que es molesto
 * pero no impide trabajar; caer con una excepción sí lo impediría.
 */
export function readToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function writeToken(token) {
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token)
    } else {
      window.localStorage.removeItem(TOKEN_KEY)
    }
    return true
  } catch {
    return false
  }
}

export function clearToken() {
  writeToken(null)
}
