import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { staffRoles } from '../config/modules'
import { api, setAuthToken } from '../services/api'

const SessionContext = createContext(null)
const STORAGE_KEY = 'refuerzo-elite-session'

function readStoredSession() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function SessionProvider({ children }) {
  const stored = readStoredSession()
  const [token, setToken] = useState(stored?.token ?? null)
  const [user, setUser] = useState(stored?.user ?? null)
  const [isBooting, setIsBooting] = useState(Boolean(stored?.token))
  const roleNames = useMemo(() => user?.roles?.map((role) => role.name) ?? [], [user])

  useEffect(() => {
    setAuthToken(token)
  }, [token])

  useEffect(() => {
    if (!token) {
      setIsBooting(false)
      return
    }

    api.get('/me')
      .then(({ data }) => {
        setUser(data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user: data }))
      })
      .catch(() => {
        setToken(null)
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      })
      .finally(() => setIsBooting(false))
  }, [token])

  const value = useMemo(() => ({
    token,
    user,
    roleNames,
    isStaff: roleNames.some((role) => staffRoles.includes(role)),
    isAuthenticated: Boolean(token),
    isBooting,
    hasAnyRole(roles) {
      const requiredRoles = Array.isArray(roles) ? roles : [roles]
      return requiredRoles.some((role) => roleNames.includes(role))
    },
    async login(credentials) {
      const { data } = await api.post('/login', credentials)
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: data.token, user: data.user }))
    },
    async logout() {
      try {
        await api.post('/logout')
      } finally {
        setToken(null)
        setUser(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    },
  }), [isBooting, roleNames, token, user])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useSession must be used inside SessionProvider')
  }

  return context
}
