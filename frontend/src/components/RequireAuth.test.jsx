import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RequireAuth } from './RequireAuth.jsx'
import { SessionProvider } from '../context/SessionContext.jsx'
import { api } from '../lib/api.js'

vi.mock('../lib/api.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), defaults: { headers: { common: {} } } },
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
  ApiError: class ApiError extends Error {},
}))

const TOKEN_KEY = 'smartwork.token'

function renderApp() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/dashboard']}>
        <SessionProvider>
          <Routes>
            <Route element={<p>pantalla de acceso</p>} path="/login" />
            <Route
              element={<RequireAuth><p>contenido protegido</p></RequireAuth>}
              path="/dashboard"
            />
          </Routes>
        </SessionProvider>
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('RequireAuth durante la restauración de sesión', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  /**
   * El caso que importa: hay token guardado, así que la sesión arranca en
   * 'loading' y `user` vale `null` mientras se resuelve `/me`.
   *
   * Ni el contenido protegido ni una redirección a `/login` deben aparecer en
   * ese momento. Si se redirigiera, el usuario sería expulsado a la pantalla de
   * acceso en CADA recarga de página, aun teniendo una sesión perfectamente
   * válida.
   */
  it('no renderiza el contenido protegido mientras la sesión no está resuelta', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'token-guardado')

    // `/me` queda pendiente: reproduce el instante de la restauración.
    let resolveMe
    api.get.mockReturnValue(new Promise((resolve) => { resolveMe = resolve }))

    renderApp()

    expect(screen.queryByText('contenido protegido')).toBeNull()
    expect(screen.queryByText('pantalla de acceso')).toBeNull()

    // Y cuando /me responde, entonces sí.
    resolveMe({ data: { id: 1, name: 'Ana', roles: [{ name: 'org_admin' }] } })

    await waitFor(() => {
      expect(screen.getByText('contenido protegido')).toBeTruthy()
    })
  })

  it('lleva a la pantalla de acceso cuando no hay token que restaurar', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByText('pantalla de acceso')).toBeTruthy()
    })

    expect(screen.queryByText('contenido protegido')).toBeNull()
    // Sin token no se pregunta por el usuario: no hay nada que restaurar.
    expect(api.get).not.toHaveBeenCalled()
  })

  it('lleva a la pantalla de acceso cuando el token guardado ya no vale', async () => {
    window.localStorage.setItem(TOKEN_KEY, 'token-caducado')
    api.get.mockRejectedValue(Object.assign(new Error('no autorizado'), { status: 401 }))

    renderApp()

    await waitFor(() => {
      expect(screen.getByText('pantalla de acceso')).toBeTruthy()
    })

    expect(screen.queryByText('contenido protegido')).toBeNull()
  })
})
