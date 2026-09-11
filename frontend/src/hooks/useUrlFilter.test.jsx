import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AllStudentsPage } from '../pages/students/AllStudentsPage.jsx'
import { ClassGroupsPage } from '../pages/classGroups/ClassGroupsPage.jsx'
import { PaymentsPage } from '../pages/payments/PaymentsPage.jsx'
import { api } from '../lib/api.js'

vi.mock('../lib/api.js', () => ({
  api: { get: vi.fn() },
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}))

vi.mock('../context/SessionContext.jsx', () => ({
  useSession: () => ({ roleNames: ['org_admin'], user: { name: 'Administradora' } }),
}))

vi.mock('../context/ToastContext.jsx', () => ({
  useToast: () => ({ success: vi.fn(), error: vi.fn() }),
}))

const VACIO = { data: { data: [], current_page: 1, last_page: 1, total: 0, from: null, to: null } }

/**
 * El tramo que va de la URL a la petición.
 *
 * Es donde el arreglo del panel se rompería sin que nada avisara: el enlace
 * puede llevar el parámetro correcto y la pantalla ignorarlo, y entonces el
 * usuario vuelve a ver la lista general —exactamente el defecto de partida—
 * pero ahora con una URL que promete lo contrario.
 */
function renderAt(path, element, routePath) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={element} path={routePath} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('acotación por URL', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.get.mockResolvedValue(VACIO)
  })

  it('los grupos sin profesor se piden al servidor con teacher_id=none', async () => {
    renderAt('/grupos-asignatura?profesor=sin-asignar', <ClassGroupsPage />, '/grupos-asignatura')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [, opciones] = api.get.mock.calls[0]

    expect(opciones.params.teacher_id).toBe('none')
  })

  it('sin parámetro no se acota nada', async () => {
    renderAt('/grupos-asignatura', <ClassGroupsPage />, '/grupos-asignatura')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [, opciones] = api.get.mock.calls[0]

    expect(opciones.params.teacher_id).toBeUndefined()
  })

  it('los pagos pendientes se piden al servidor con status=pending', async () => {
    renderAt('/pagos?estado=pendiente', <PaymentsPage />, '/pagos')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [, opciones] = api.get.mock.calls[0]

    expect(opciones.params.status).toBe('pending')
  })

  it('los grupos descuadrados se piden con teacher_id=mismatch', async () => {
    renderAt('/grupos-asignatura?profesor=descuadrado', <ClassGroupsPage />, '/grupos-asignatura')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [, opciones] = api.get.mock.calls[0]

    expect(opciones.params.teacher_id).toBe('mismatch')
  })

  it('la baja asistencia se pide con attendance=low', async () => {
    renderAt('/alumnos/todos?asistencia=baja', <AllStudentsPage />, '/alumnos/todos')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [recurso, opciones] = api.get.mock.calls[0]

    expect(recurso).toBe('/students')
    expect(opciones.params.attendance).toBe('low')
  })

  /**
   * Un valor que no existe no puede inventarse un filtro. La lista sale entera,
   * y el servidor hace la otra mitad devolviendo conjunto vacío ante un estado
   * que no reconoce.
   */
  it('un valor desconocido no acota ni miente', async () => {
    renderAt('/pagos?estado=inventado', <PaymentsPage />, '/pagos')

    await waitFor(() => expect(api.get).toHaveBeenCalled())

    const [, opciones] = api.get.mock.calls[0]

    expect(opciones.params.status).toBeUndefined()
  })
})
