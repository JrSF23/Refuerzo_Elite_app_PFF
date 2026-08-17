import axios from 'axios'

import { t } from '../i18n/index.js'
import { clearToken, readToken } from './auth.js'

/**
 * Cliente de la API.
 *
 * Todo error se normaliza a la misma forma antes de llegar a un componente, para
 * que ninguna pantalla tenga que conocer el formato de Laravel:
 *
 *   { status, message, fieldErrors, isCanceled, isNetwork }
 */

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    // Obligatorio en todas las peticiones (FR-062). Sin esta cabecera, Laravel
    // trata la petición como de navegador: una llamada no autenticada recibe una
    // redirección o un 500 en lugar de 401. Es un defecto preexistente del
    // backend, detectado al validar la feature 001; el frontend lo evita
    // enviando siempre la cabecera.
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
    return
  }

  delete api.defaults.headers.common.Authorization
}

// Restaura el token al arrancar, antes de que se monte cualquier componente, de
// modo que la primera llamada a /me ya vaya autenticada (FR-006).
setAuthToken(readToken())

/**
 * Gancho que la sesión registra para enterarse de un 401.
 *
 * El interceptor no puede navegar por sí mismo —vive fuera del árbol de React y
 * no tiene acceso al enrutador—, así que avisa y deja que la sesión decida.
 */
let onUnauthorized = null

export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

/** Error normalizado. Lo que recibe todo `catch` de la aplicación. */
export class ApiError extends Error {
  constructor({ status, message, fieldErrors, isCanceled = false, isNetwork = false }) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors ?? {}
    this.isCanceled = isCanceled
    this.isNetwork = isNetwork
  }

  /** ¿Hay algún mensaje para este campo concreto? */
  fieldError(name) {
    const errors = this.fieldErrors[name]
    return Array.isArray(errors) ? errors[0] : errors
  }
}

/**
 * El mensaje del servidor manda siempre que exista: está en español y es más
 * concreto que cualquier texto genérico. Solo se sustituye cuando no lo hay.
 */
function resolveMessage(status, data) {
  if (data && typeof data.message === 'string' && data.message !== '') {
    return data.message
  }

  switch (status) {
    case 401: return t('auth.sessionExpired')
    case 403: return t('common.forbiddenTitle')
    case 404: return t('common.notFoundBody')
    case 429: return t('common.tooManyRequests')
    default:  return t('common.unexpectedError')
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Cancelación deliberada: la produce `useResourceList` al descartar una
    // petición que ya no interesa. NO es un fallo y no debe pintar un estado de
    // error, o teclear en la búsqueda mostraría errores constantemente (D4).
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(new ApiError({
        status: 0,
        message: 'canceled',
        isCanceled: true,
      }))
    }

    // Sin respuesta: servidor caído, DNS, timeout o red del usuario.
    if (!error.response) {
      return Promise.reject(new ApiError({
        status: 0,
        message: t('common.networkError'),
        isNetwork: true,
      }))
    }

    const { status, data } = error.response

    if (status === 401) {
      // Se limpia aquí, no en el componente: cualquier petición de cualquier
      // pantalla puede ser la que descubra que el token murió (FR-007).
      clearToken()
      setAuthToken(null)
      onUnauthorized?.()
    }

    return Promise.reject(new ApiError({
      status,
      message: resolveMessage(status, data),
      // Formato de Laravel: { message, errors: { campo: [texto] } }
      fieldErrors: status === 422 ? data?.errors : undefined,
    }))
  },
)
