import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useDeferredLoading } from './useDeferredLoading.js'

/** Sonda mínima: dice si el indicador estaría visible. */
function Probe({ isLoading }) {
  const visible = useDeferredLoading(isLoading)

  return <span data-testid="estado">{visible ? 'visible' : 'oculto'}</span>
}

function estado() {
  return screen.getByTestId('estado').textContent
}

/** Avanza el reloj dentro de `act`, para que React aplique lo que se dispare. */
function avanzar(ms) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('indicador de carga diferido', () => {
  /**
   * EL caso que motiva todo esto. Una respuesta de 150 ms no debe producir
   * ningún indicador: enseñarlo y quitarlo en ese tiempo es un destello que se
   * percibe como un fallo de dibujo, no como una espera.
   */
  it('una respuesta rápida no enseña nada', () => {
    const { rerender } = render(<Probe isLoading />)

    expect(estado()).toBe('oculto')

    avanzar(150)
    rerender(<Probe isLoading={false} />)
    avanzar(1000)

    expect(estado()).toBe('oculto')
  })

  it('una espera larga sí lo enseña', () => {
    render(<Probe isLoading />)

    avanzar(249)
    expect(estado()).toBe('oculto')

    avanzar(1)
    expect(estado()).toBe('visible')
  })

  /**
   * La otra mitad: una vez enseñado, se queda. Sin esto, una respuesta de 260 ms
   * mostraría el esqueleto 10 ms — el mismo destello que se quería evitar, solo
   * que desplazado.
   */
  it('una vez enseñado permanece el mínimo aunque los datos ya estén', () => {
    const { rerender } = render(<Probe isLoading />)

    avanzar(250)
    expect(estado()).toBe('visible')

    // Los datos llegan 10 ms después de aparecer el indicador.
    avanzar(10)
    rerender(<Probe isLoading={false} />)

    avanzar(100)
    expect(estado()).toBe('visible')

    // Se retira al cumplirse los 400 ms de permanencia.
    avanzar(300)
    expect(estado()).toBe('oculto')
  })

  it('se retira de inmediato si ya cumplió su permanencia', () => {
    const { rerender } = render(<Probe isLoading />)

    avanzar(250)
    avanzar(500)
    rerender(<Probe isLoading={false} />)
    avanzar(0)

    expect(estado()).toBe('oculto')
  })

  /**
   * Dos cargas encadenadas —paginar, buscar— no reinician el indicador ni lo
   * hacen parpadear entre una y otra: si ya está puesto, sigue puesto.
   */
  it('una segunda carga no reinicia el indicador ya visible', () => {
    const { rerender } = render(<Probe isLoading />)

    avanzar(250)
    expect(estado()).toBe('visible')

    rerender(<Probe isLoading={false} />)
    rerender(<Probe isLoading />)
    avanzar(50)

    expect(estado()).toBe('visible')
  })

  /** Nunca se enseña si nunca hubo carga. */
  it('sin carga no aparece jamás', () => {
    render(<Probe isLoading={false} />)

    avanzar(5000)

    expect(estado()).toBe('oculto')
  })
})
