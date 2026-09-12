import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { PasswordInput } from './PasswordInput.jsx'

const campo = () => screen.getByLabelText('Contraseña')

describe('PasswordInput', () => {
  it('nace oculto', () => {
    render(<PasswordInput aria-label="Contraseña" />)

    expect(campo().getAttribute('type')).toBe('password')
  })

  it('muestra y vuelve a ocultar la contraseña', () => {
    render(<PasswordInput aria-label="Contraseña" />)

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(campo().getAttribute('type')).toBe('text')

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(campo().getAttribute('type')).toBe('password')
  })

  /**
   * El fallo clásico de este control.
   *
   * Dentro de un formulario, un botón sin `type` es de ENVÍO por defecto: pulsar
   * el ojo intentaría acceder con la contraseña a medio escribir, y el usuario
   * vería un error de credenciales por mirar lo que estaba tecleando.
   */
  it('no envía el formulario que lo contiene', () => {
    const enviar = vi.fn((event) => event.preventDefault())

    render(
      <form onSubmit={enviar}>
        <PasswordInput aria-label="Contraseña" />
      </form>,
    )

    fireEvent.click(screen.getByRole('button'))

    expect(enviar).not.toHaveBeenCalled()
  })

  /** El rótulo nombra la ACCIÓN, no el estado: es lo que va a pasar al pulsar. */
  it('el rótulo accesible dice lo que hará el botón', () => {
    render(<PasswordInput aria-label="Contraseña" />)

    expect(screen.getByRole('button').textContent).toContain('Mostrar contraseña')

    fireEvent.click(screen.getByRole('button'))

    expect(screen.getByRole('button').textContent).toContain('Ocultar contraseña')
  })

  it('deja pasar autoComplete al campo, que es lo que lee el gestor de contraseñas', () => {
    render(<PasswordInput aria-label="Contraseña" autoComplete="current-password" />)

    expect(campo().getAttribute('autocomplete')).toBe('current-password')
  })
})
