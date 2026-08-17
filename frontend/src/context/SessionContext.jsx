import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

import { api, setAuthToken, setUnauthorizedHandler } from '../lib/api.js'
import { clearToken, readToken, writeToken } from '../lib/auth.js'
import { homePathFor, ROLES } from '../lib/permissions.js'

const SessionContext = createContext(null)

/**
 * Sesión de la aplicación.
 *
 * Tres estados que hay que distinguir, porque las guardas de ruta se comportan
 * distinto en cada uno:
 *
 *   'loading'  — hay token guardado y se está resolviendo /me. NO se puede
 *                decidir todavía si redirigir: hacerlo aquí expulsaría al
 *                usuario a /login en cada recarga.
 *   'guest'    — no hay sesión.
 *   'active'   — usuario resuelto.
 */
export function SessionProvider({ children }) {
  const [status, setStatus] = useState(() => (readToken() ? 'loading' : 'guest'))
  const [user, setUser] = useState(null)
  const [expiredNotice, setExpiredNotice] = useState(false)

  // Evita avisar de sesión caducada durante el arranque: un token viejo que ya
  // no vale produce un 401 esperable, y anunciarlo confundiría a quien
  // simplemente vuelve al día siguiente.
  const bootstrapping = useRef(true)

  const reset = useCallback(() => {
    clearToken()
    setAuthToken(null)
    setUser(null)
    setStatus('guest')
  }, [])

  // El interceptor descubre el 401 en cualquier petición de cualquier pantalla,
  // pero no puede navegar: avisa aquí y la guarda de ruta hace el resto.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (!bootstrapping.current) {
        setExpiredNotice(true)
      }
      setUser(null)
      setStatus('guest')
    })

    return () => setUnauthorizedHandler(null)
  }, [])

  // Restaura la sesión al arrancar (FR-006). La organización activa llega en
  // /me y no en el login, así que hasta que esto resuelve no se puede pintar el
  // nombre del centro en la cabecera.
  useEffect(() => {
    if (status !== 'loading') {
      bootstrapping.current = false
      return
    }

    let cancelled = false

    api.get('/me')
      .then(({ data }) => {
        if (cancelled) return
        setUser(data)
        setStatus('active')
      })
      .catch(() => {
        // Un 401 ya lo trató el interceptor. Cualquier otro fallo aquí —red,
        // servidor caído— deja igualmente sin sesión utilizable.
        if (!cancelled) reset()
      })
      .finally(() => {
        bootstrapping.current = false
      })

    return () => { cancelled = true }
  }, [status, reset])

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/login', credentials)

    writeToken(data.token)
    setAuthToken(data.token)
    setExpiredNotice(false)

    // La respuesta del login trae el usuario pero NO la organización. Se pide
    // /me para tener la sesión completa antes de dar el acceso por bueno; así
    // ninguna pantalla se monta con datos a medias.
    try {
      const { data: me } = await api.get('/me')
      setUser(me)
    } catch {
      setUser(data.user)
    }

    setStatus('active')
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } catch {
      // Si el servidor no responde, la sesión local se cierra igualmente: dejar
      // al usuario dentro porque falló la red sería peor.
    }

    reset()
  }, [reset])

  const value = useMemo(() => {
    const roleNames = user?.roles?.map((role) => role.name) ?? []

    return {
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'active',
      user,
      roleNames,
      isPlatformAdmin: roleNames.includes(ROLES.SUPER_ADMIN),
      isTeacherOnly: roleNames.includes(ROLES.TEACHER) && !roleNames.includes(ROLES.ORG_ADMIN),
      organization: user?.organization ?? null,
      homePath: homePathFor(roleNames),
      expiredNotice,
      dismissExpiredNotice: () => setExpiredNotice(false),
      login,
      logout,
    }
  }, [status, user, expiredNotice, login, logout])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (context === null) {
    throw new Error('useSession debe usarse dentro de SessionProvider.')
  }

  return context
}
