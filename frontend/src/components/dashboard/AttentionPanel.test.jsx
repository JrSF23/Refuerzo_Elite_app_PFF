import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AttentionPanel } from './AttentionPanel.jsx'
import { SECTIONS } from '../../lib/permissions.js'

/**
 * Los avisos tienen que llevar a lo que anuncian.
 *
 * El defecto que estas pruebas fijan: cada aviso enlazaba a la SECCIÓN, de modo
 * que «12 pagos pendientes» dejaba al usuario en la lista completa de pagos, a
 * buscar a mano los doce. El panel avisa de algo concreto; el enlace tiene que
 * abrir eso concreto.
 */
const linkTo = (key) => SECTIONS[key].path

function renderPanel(items) {
  return render(
    <MemoryRouter>
      <AttentionPanel items={items} linkTo={linkTo} />
    </MemoryRouter>,
  )
}

describe('AttentionPanel', () => {
  it('lleva los pagos pendientes a la lista acotada, no a todos los pagos', () => {
    renderPanel([{ key: 'pendingPayments', count: 12 }])

    const enlace = screen.getByRole('link')

    expect(enlace.getAttribute('href')).toBe('/pagos?estado=pendiente')
    expect(enlace.getAttribute('href')).not.toBe('/pagos')
  })

  it('lleva los grupos sin profesor a la lista acotada', () => {
    renderPanel([{ key: 'groupsWithoutTeacher', count: 3 }])

    expect(screen.getByRole('link').getAttribute('href'))
      .toBe('/grupos-asignatura?profesor=sin-asignar')
  })

  /**
   * Va a `/alumnos/todos` y no a `/alumnos`, que es el índice de AULAS.
   * Enlazar a la sección dejaría al administrador buscando a los alumnos dentro
   * de las aulas: el mismo defecto con otro disfraz.
   */
  it('lleva la baja asistencia a la lista de alumnos, no al índice de aulas', () => {
    renderPanel([{ key: 'lowAttendance', count: 4 }])

    const enlace = screen.getByRole('link')

    expect(enlace.getAttribute('href')).toBe('/alumnos/todos?asistencia=baja')
    expect(enlace.getAttribute('href')).not.toBe('/alumnos')
  })

  it('lleva los grupos descuadrados a la lista acotada', () => {
    renderPanel([{ key: 'groupsSubjectMismatch', count: 2 }])

    expect(screen.getByRole('link').getAttribute('href'))
      .toBe('/grupos-asignatura?profesor=descuadrado')
  })

  /** Los cuatro avisos llevan ya a lo que anuncian, ninguno a una lista general. */
  it('ningún aviso se queda en la lista general de su sección', () => {
    const avisos = [
      { key: 'pendingPayments', count: 1 },
      { key: 'lowAttendance', count: 1 },
      { key: 'groupsWithoutTeacher', count: 1 },
      { key: 'groupsSubjectMismatch', count: 1 },
    ]

    renderPanel(avisos)

    const destinos = screen.getAllByRole('link').map((enlace) => enlace.getAttribute('href'))

    expect(destinos).toHaveLength(avisos.length)
    destinos.forEach((destino) => expect(destino).toContain('?'))
  })

  it('no se dibuja cuando no hay nada que atender', () => {
    const { container } = renderPanel([])

    expect(container.innerHTML).toBe('')
  })

  /**
   * Sin permiso de sección no hay enlace. `linkTo` devuelve indefinido y el
   * aviso se queda en texto: ofrecer un enlace que acaba en redirección es peor
   * que no ofrecerlo.
   */
  it('no enlaza cuando el rol no alcanza la sección', () => {
    render(
      <MemoryRouter>
        <AttentionPanel items={[{ key: 'pendingPayments', count: 12 }]} linkTo={() => undefined} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('link')).toBeNull()
  })
})
