import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useFocusTrap } from './useFocusTrap.js'

/**
 * Diálogo de prueba que reproduce el patrón real de la aplicación: el que llama
 * pasa `onClose` como función EN LÍNEA, que es lo natural de escribir y lo que
 * hacía `ResourcePage`.
 *
 * Cada pulsación en el campo provoca un render, y con él una identidad nueva de
 * `onClose`. Si el efecto del gancho dependiera de ella, se desmontaría y
 * volvería a montarse, moviendo el foco al primer elemento enfocable.
 */
function DialogoDePrueba({ onCloseSpy }) {
  const [isOpen, setIsOpen] = useState(true)
  const [valor, setValor] = useState('')

  const ref = useFocusTrap(isOpen, () => {
    onCloseSpy?.()
    setIsOpen(false)
  })

  if (!isOpen) return <p>cerrado</p>

  return (
    <div ref={ref}>
      <button type="button">cerrar</button>
      <input aria-label="nombre" onChange={(e) => setValor(e.target.value)} value={valor} />
      <button type="button">guardar</button>
    </div>
  )
}

describe('useFocusTrap', () => {
  /**
   * REGRESIÓN — «las teclas del teclado no funcionan en los formularios».
   *
   * El efecto dependía de `onClose`. Con una función en línea, su identidad
   * cambiaba en cada render, el efecto se remontaba y su montaje mueve el foco
   * al primer elemento enfocable —el botón de cerrar—.
   *
   * Consecuencia real: se escribía una letra, el foco saltaba al botón, y la
   * siguiente tecla ya no llegaba al campo. Los formularios eran inservibles.
   */
  it('no roba el foco al teclear, aunque onClose cambie de identidad', () => {
    render(<DialogoDePrueba />)

    const campo = screen.getByLabelText('nombre')
    campo.focus()
    expect(document.activeElement).toBe(campo)

    fireEvent.change(campo, { target: { value: 'A' } })
    expect(document.activeElement).toBe(campo)

    fireEvent.change(campo, { target: { value: 'An' } })
    expect(document.activeElement).toBe(campo)

    fireEvent.change(campo, { target: { value: 'Ana' } })
    expect(document.activeElement).toBe(campo)
    expect(campo.value).toBe('Ana')
  })

  it('lleva el foco dentro al abrir', () => {
    render(<DialogoDePrueba />)

    // El primer enfocable del contenedor.
    expect(document.activeElement).toBe(screen.getByText('cerrar'))
  })

  it('cierra con Escape usando la última versión de onClose', () => {
    const spy = vi.fn()
    render(<DialogoDePrueba onCloseSpy={spy} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(spy).toHaveBeenCalledTimes(1)
    expect(screen.getByText('cerrado')).toBeTruthy()
  })

  it('cicla el foco con Tab en lugar de dejarlo escapar', () => {
    render(<DialogoDePrueba />)

    const guardar = screen.getByText('guardar')
    guardar.focus()

    fireEvent.keyDown(document, { key: 'Tab' })

    // Desde el último enfocable, Tab vuelve al primero: sin esto se saldría al
    // navegador o a la página de detrás, que sigue tapada.
    expect(document.activeElement).toBe(screen.getByText('cerrar'))
  })

  it('devuelve el foco al elemento que lo abrió', () => {
    function Contenedor() {
      const [abierto, setAbierto] = useState(false)

      return (
        <>
          <button onClick={() => setAbierto(true)} type="button">abrir</button>
          {abierto ? <Dialogo onClose={() => setAbierto(false)} /> : null}
        </>
      )
    }

    function Dialogo({ onClose }) {
      const ref = useFocusTrap(true, onClose)
      return (
        <div ref={ref}>
          <button type="button">dentro</button>
        </div>
      )
    }

    render(<Contenedor />)

    const disparador = screen.getByText('abrir')
    disparador.focus()
    fireEvent.click(disparador)

    expect(document.activeElement).toBe(screen.getByText('dentro'))

    fireEvent.keyDown(document, { key: 'Escape' })

    // FR-049: al cerrar, el foco vuelve al disparador y no al principio de la
    // página, que obligaría a recorrerla entera otra vez con el teclado.
    expect(document.activeElement).toBe(disparador)
  })
})
