import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DashboardPage } from './DashboardPage.jsx'
import { api } from '../lib/api.js'

vi.mock('../lib/api.js', () => ({
  api: { get: vi.fn() },
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}))

// La pantalla solo usa la sesión para decidir qué indicadores enlazan. Se
// sustituye para que la prueba se centre en el estado de los datos.
vi.mock('../context/SessionContext.jsx', () => ({
  useSession: () => ({ roleNames: ['org_admin'] }),
}))

const ADMIN_PAYLOAD = {
  role: 'admin',
  stats: { students: 8, teachers: 2, groups: 4, attendances: 24, payments: 21 },
  recentStudents: [],
  recentSessions: [],
  recentPayments: [],
}

function renderDashboard({ strict = true } = {}) {
  const tree = (
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  )

  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

/** Error de cancelación tal como lo produce el interceptor de `lib/api.js`. */
function canceledError() {
  return Object.assign(new Error('canceled'), { isCanceled: true, status: 0 })
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('DashboardPage', () => {
  /**
   * REGRESIÓN — «Cannot read properties of null (reading 'role')».
   *
   * StrictMode monta, desmonta y vuelve a montar cada efecto en desarrollo, de
   * modo que la PRIMERA petición del panel siempre se cancela. La versión
   * anterior del hook descartaba la cancelación con un `return` temprano pero
   * dejaba que el `finally` sacara del estado de carga, produciendo la
   * combinación imposible «ni cargando, ni error, ni datos». La pantalla se
   * colaba entre las dos guardas y leía `data.role` sobre un `null`.
   *
   * Que se viera o no dependía de si la petición cancelada terminaba antes que
   * la que la sustituía: una carrera, y por eso el fallo era intermitente.
   */
  it('no revienta cuando la primera petición se cancela por el doble montaje', async () => {
    let resolveSecond
    api.get
      .mockRejectedValueOnce(canceledError())
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve }))

    renderDashboard()

    // Mientras la petición vigente sigue en vuelo, la pantalla DEBE seguir en
    // carga. Antes del arreglo, aquí ya se había intentado leer `data.role`.
    await waitFor(() => {
      expect(screen.getByText('Cargando…')).toBeTruthy()
    })

    resolveSecond({ data: ADMIN_PAYLOAD })

    await waitFor(() => {
      expect(screen.getByText('Alumnos')).toBeTruthy()
    })
  })

  it('una cancelación por sí sola nunca deja la pantalla sin datos y sin carga', async () => {
    // Todas las peticiones se cancelan: no llega nunca una respuesta buena.
    api.get.mockRejectedValue(canceledError())

    renderDashboard()

    // El estado correcto es seguir cargando, NO caer en un render sin datos.
    await waitFor(() => {
      expect(screen.getByText('Cargando…')).toBeTruthy()
    })

    // Y no se muestra ni error ni contenido.
    expect(screen.queryByText('No se han podido cargar los datos')).toBeNull()
    expect(screen.queryByText('Alumnos')).toBeNull()
  })

  it('muestra el panel de administración cuando la respuesta llega', async () => {
    api.get.mockResolvedValue({ data: ADMIN_PAYLOAD })

    renderDashboard({ strict: false })

    await waitFor(() => {
      expect(screen.getByText('Alumnos')).toBeTruthy()
    })

    expect(screen.getByText('8')).toBeTruthy()
    // FR-014: una sola petición, sin completar con llamadas a los listados.
    expect(api.get).toHaveBeenCalledTimes(1)
    expect(api.get).toHaveBeenCalledWith('/dashboard', expect.anything())
  })

  it('muestra el estado de error con reintento cuando la petición falla', async () => {
    api.get.mockRejectedValue(Object.assign(new Error('fallo del servidor'), { status: 500 }))

    renderDashboard({ strict: false })

    await waitFor(() => {
      expect(screen.getByText('Reintentar')).toBeTruthy()
    })

    expect(screen.queryByText('Alumnos')).toBeNull()
  })

  it('elige la variante por el campo `role` de la respuesta, no por el rol de la cuenta', async () => {
    // La sesión simulada es org_admin, pero el servidor devuelve `teacher`.
    // Manda la respuesta (FR-016).
    api.get.mockResolvedValue({
      data: {
        role: 'teacher',
        teacher: { id: 1 },
        stats: { groups: 2, students: 5, upcoming_sessions: 0 },
        myGroups: [],
        upcomingSessions: [],
        recentAttendances: [],
      },
    })

    renderDashboard({ strict: false })

    // «Mis alumnos» es exclusivo de la variante de profesor. No se usa «Mis
    // grupos» porque aparece dos veces —indicador y título de bloque— y la
    // aserción sería ambigua.
    await waitFor(() => {
      expect(screen.getByText('Mis alumnos')).toBeTruthy()
    })

    // «Profesores» es un indicador exclusivo de la variante de administración.
    expect(screen.queryByText('Profesores')).toBeNull()
  })

  it('avisa cuando la cuenta de profesor no tiene ficha vinculada', async () => {
    api.get.mockResolvedValue({
      data: {
        role: 'teacher',
        teacher: null,
        stats: { groups: 0, students: 0, upcoming_sessions: 0 },
        myGroups: [],
        upcomingSessions: [],
        recentAttendances: [],
      },
    })

    renderDashboard({ strict: false })

    await waitFor(() => {
      expect(screen.getByText('Cuenta sin ficha de profesor')).toBeTruthy()
    })
  })
})
