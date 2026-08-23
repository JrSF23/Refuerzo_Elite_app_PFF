import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { DateField } from './DateField.jsx'
import { displayToIso, isoToDisplay, toIsoDate } from '../../lib/dates.js'

function Formulario({ initialValue = '' }) {
  const [value, setValue] = useState(initialValue)

  return (
    <>
      <DateField name="fecha" onChange={(e) => setValue(e.target.value)} value={value} />
      <output>iso:{value}</output>
    </>
  )
}

describe('conversión de fechas', () => {
  /**
   * REGRESIÓN — todas las fechas salían EN BLANCO al editar.
   *
   * Laravel devuelve `2026-01-13T00:00:00.000000Z`, que ningún control de fecha
   * acepta como valor. El campo aparecía vacío en las cinco pantallas con fecha
   * aunque el registro tuviera una, y sin ningún error que lo explicara.
   */
  it('acepta la fecha con hora que devuelve la API', () => {
    expect(toIsoDate('2026-01-13T00:00:00.000000Z')).toBe('2026-01-13')
    expect(isoToDisplay('2026-01-13T00:00:00.000000Z')).toBe('13/01/2026')
  })

  it('acepta también la fecha ya limpia', () => {
    expect(toIsoDate('2026-01-13')).toBe('2026-01-13')
  })

  it('devuelve vacío ante lo que no es una fecha', () => {
    expect(toIsoDate('')).toBe('')
    expect(toIsoDate(null)).toBe('')
    expect(toIsoDate('mañana')).toBe('')
  })

  /**
   * El 31 de febrero encaja en el patrón dd/mm/aaaa y no existe. `new Date`
   * no falla: se desborda al 3 de marzo. Aceptarlo guardaría una fecha que el
   * usuario no escribió.
   */
  it('rechaza fechas con forma correcta pero imposibles', () => {
    expect(displayToIso('31/02/2026')).toBe('')
    expect(displayToIso('32/01/2026')).toBe('')
    expect(displayToIso('01/13/2026')).toBe('')
    expect(displayToIso('00/01/2026')).toBe('')
  })

  it('acepta el 29 de febrero solo en año bisiesto', () => {
    expect(displayToIso('29/02/2024')).toBe('2024-02-29')
    expect(displayToIso('29/02/2026')).toBe('')
  })
})

describe('DateField', () => {
  it('muestra dd/mm/aaaa a partir del valor ISO', () => {
    render(<Formulario initialValue="2026-01-13" />)

    expect(screen.getByRole('textbox').value).toBe('13/01/2026')
  })

  /**
   * El orden importa y es el motivo del cambio: el control nativo mostraría
   * «1/13/2026» en un navegador en inglés, y 01/02 significaría dos días
   * distintos según el puesto desde el que se mire.
   */
  it('muestra el día primero, no el mes', () => {
    render(<Formulario initialValue="2026-01-13" />)

    const texto = screen.getByRole('textbox').value
    expect(texto.startsWith('13')).toBe(true)
    expect(texto).not.toBe('01/13/2026')
  })

  it('pone las barras solo mientras se teclean los dígitos', () => {
    render(<Formulario />)
    const campo = screen.getByRole('textbox')

    fireEvent.change(campo, { target: { value: '1' } })
    expect(campo.value).toBe('1')

    fireEvent.change(campo, { target: { value: '13' } })
    expect(campo.value).toBe('13')

    fireEvent.change(campo, { target: { value: '130' } })
    expect(campo.value).toBe('13/0')

    fireEvent.change(campo, { target: { value: '13/01/2026' } })
    expect(campo.value).toBe('13/01/2026')
  })

  /** Hacia fuera siempre ISO: es lo que la API espera, no dd/mm/aaaa. */
  it('emite ISO, nunca el formato que se ve', () => {
    render(<Formulario />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '13/01/2026' } })

    expect(screen.getByText('iso:2026-01-13')).toBeTruthy()
  })

  it('no emite nada mientras la fecha está a medias', () => {
    render(<Formulario />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '13/0' } })

    expect(screen.getByText('iso:')).toBeTruthy()
  })

  /**
   * Lo tecleado no se borra al quedar incompleto. Si el componente se
   * resincronizara con el valor vacío que acaba de emitir, cada dígito
   * desaparecería al escribirlo y el campo sería inservible.
   */
  it('conserva lo tecleado aunque todavía no sea una fecha válida', () => {
    render(<Formulario />)
    const campo = screen.getByRole('textbox')

    fireEvent.change(campo, { target: { value: '1' } })
    fireEvent.change(campo, { target: { value: '13' } })
    fireEvent.change(campo, { target: { value: '130' } })
    fireEvent.change(campo, { target: { value: '1301' } })

    expect(campo.value).toBe('13/01')
  })

  it('avisa de una fecha imposible en cuanto está completa', () => {
    render(<Formulario />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '31/02/2026' } })

    expect(screen.getByRole('alert').textContent).toMatch(/no es válida/i)
    expect(screen.getByText('iso:')).toBeTruthy()
  })

  it('descarta lo que no sean dígitos', () => {
    render(<Formulario />)
    const campo = screen.getByRole('textbox')

    fireEvent.change(campo, { target: { value: 'aa/bb/cccc' } })
    expect(campo.value).toBe('')

    fireEvent.change(campo, { target: { value: '13-01-2026' } })
    expect(campo.value).toBe('13/01/2026')
  })
})
