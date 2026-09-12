import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UsersPage } from '../../pages/users/UsersPage.jsx'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api.js', () => ({
  api: { get: vi.fn() },
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}))

vi.mock('../../context/SessionContext.jsx', () => ({
  useSession: () => ({ roleNames: ['org_admin'], isPlatformAdmin: false, user: { name: 'Administradora' } }),
}))

vi.mock('../../context/ToastContext.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

/*
 * Con la lista vacía se dibujan DOS botones «Nueva cuenta» —el del encabezado y
 * el del estado vacío— y la consulta por rótulo se vuelve ambigua. Una fila
 * basta para que solo quede el del encabezado.
 */
const UNA_CUENTA = {
  data: {
    data: [{ id: 1, name: 'Ada Nguema', username: 'ada', email: 'ada@centro.test', roles: [], is_active: true }],
    current_page: 1,
    last_page: 1,
    total: 1,
    from: 1,
    to: 1,
  },
}

/**
 * El campo de contraseña del alta de cuentas es DECLARATIVO: no se escribe en la
 * pantalla, se pide con `type: 'password'` y lo dibuja `FormField`. Por eso el
 * interruptor no llegó solo cuando se añadió al acceso, y por eso conviene una
 * prueba aquí: sin ella, un cambio en `FormField` lo devolvería a un campo mudo
 * sin que nada avisara.
 */
describe('contraseña en un formulario declarativo', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockResolvedValue(UNA_CUENTA)
  })

  const abrirFormulario = async () => {
    render(
      <MemoryRouter>
        <UsersPage />
      </MemoryRouter>,
    )

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    fireEvent.click(screen.getByRole('button', { name: 'Nueva cuenta' }))
  }

  it('trae el interruptor para ver la contraseña', async () => {
    await abrirFormulario()

    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeTruthy()
  })

  it('el campo nace oculto y se puede mostrar', async () => {
    await abrirFormulario()

    const campo = screen.getByLabelText(/contraseña/i)

    expect(campo.getAttribute('type')).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))

    expect(campo.getAttribute('type')).toBe('text')
  })

  /**
   * `new-password` y no `current-password`: aquí se crea la contraseña de OTRA
   * cuenta. Sin declararlo, el navegador puede rellenar el campo con la del
   * propio administrador y asignársela sin querer a quien está dando de alta.
   */
  it('declara new-password para que el navegador no rellene la del administrador', async () => {
    await abrirFormulario()

    expect(screen.getByLabelText(/contraseña/i).getAttribute('autocomplete')).toBe('new-password')
  })
})
