import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

import { ToastViewport } from '../components/ui/Toast.jsx'

const ToastContext = createContext(null)

const DEFAULT_DURATION = 5000

/**
 * Avisos de resultado de una acción (FR-045).
 *
 * Los de error NO se cierran solos: si el usuario aparta la vista justo cuando
 * aparece, un aviso de error que se va a los cinco segundos deja la impresión de
 * que la acción salió bien. Los de éxito sí, porque su desaparición no oculta
 * nada.
 *
 * El aviso nunca es el único canal: un error de validación se muestra además
 * junto al campo (FR-030).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))

    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const push = useCallback((message, { tone = 'info', duration } = {}) => {
    idRef.current += 1
    const id = idRef.current

    setToasts((current) => [...current, { id, message, tone }])

    const effectiveDuration = duration ?? (tone === 'error' ? null : DEFAULT_DURATION)

    if (effectiveDuration !== null) {
      timersRef.current.set(id, setTimeout(() => dismiss(id), effectiveDuration))
    }

    return id
  }, [dismiss])

  const value = useMemo(() => ({
    push,
    dismiss,
    success: (message, options) => push(message, { ...options, tone: 'success' }),
    error: (message, options) => push(message, { ...options, tone: 'error' }),
    info: (message, options) => push(message, { ...options, tone: 'info' }),
  }), [push, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport onDismiss={dismiss} toasts={toasts} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (context === null) {
    throw new Error('useToast debe usarse dentro de ToastProvider.')
  }

  return context
}
