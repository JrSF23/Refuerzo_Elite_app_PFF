import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SearchSelect } from './SearchSelect.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { api } from '../../lib/api.js'

vi.mock('../../lib/api.js', () => ({
  api: { get: vi.fn() },
  setAuthToken: vi.fn(),
  setUnauthorizedHandler: vi.fn(),
}))

/**
 * Centro de 1.000 alumnos. El caso que motivó todo esto.
 *
 * `BaseApiController::index` limita `per_page` a 50, así que ninguna petición
 * puede traer más. Este doble reproduce ese tope: devuelve como mucho `per_page`
 * registros, pero informa del `total` real.
 */
const ALL_STUDENTS = Array.from({ length: 1000 }, (_, index) => ({
  id: index + 1,
  full_name: `Alumno ${String(index + 1).padStart(4, '0')}`,
}))

const SERVER_MAX_PER_PAGE = 50

function fakeApi() {
  api.get.mockImplementation((url, config = {}) => {
    const byId = url.match(/^\/students\/(\d+)$/)

    if (byId) {
      const record = ALL_STUDENTS.find((s) => s.id === Number(byId[1]))
      return record
        ? Promise.resolve({ data: record })
        : Promise.reject(Object.assign(new Error('404'), { status: 404 }))
    }

    const { search, per_page: perPage = 10 } = config.params ?? {}

    const matched = search
      ? ALL_STUDENTS.filter((s) => s.full_name.toLowerCase().includes(String(search).toLowerCase()))
      : ALL_STUDENTS

    return Promise.resolve({
      data: {
        data: matched.slice(0, Math.min(perPage, SERVER_MAX_PER_PAGE)),
        total: matched.length,
      },
    })
  })
}

/** El campo tal como lo monta el formulario: valor controlado por el padre. */
function Formulario({ initialValue = '', onSubmit }) {
  const [value, setValue] = useState(initialValue)

  return (
    <form onSubmit={onSubmit}>
      <SearchSelect
        endpoint="students"
        name="student_id"
        onChange={(event) => setValue(event.target.value)}
        optionLabel={(student) => student.full_name}
        value={value}
      />
      <output>valor:{value}</output>
    </form>
  )
}

beforeEach(fakeApi)
afterEach(() => vi.clearAllMocks())

describe('SearchSelect', () => {
  /**
   * REGRESIÓN — «con 1.000 alumnos habría que desplazarse para encontrar uno».
   *
   * El problema real era peor que la incomodidad: el desplegable anterior pedía
   * una página de 50 y pintaba lo que llegara, de modo que el alumno 900 NO
   * ESTABA EN EL CONTROL. No se podía matricular, y nada lo explicaba.
   *
   * Esta prueba elige precisamente uno que queda fuera de la primera página.
   */
  it('encuentra un alumno que no está en la primera página', async () => {
    render(<Formulario />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: 'Alumno 0900' } })

    const opcion = await screen.findByRole('option', { name: 'Alumno 0900' })

    // Comprobación de que la prueba comprueba algo: sin búsqueda en servidor,
    // este alumno nunca habría estado entre los 50 primeros.
    expect(ALL_STUDENTS.findIndex((s) => s.full_name === 'Alumno 0900'))
      .toBeGreaterThan(SERVER_MAX_PER_PAGE)

    fireEvent.click(opcion)

    expect(screen.getByText('valor:900')).toBeTruthy()
    expect(campo.value).toBe('Alumno 0900')
  })

  /**
   * REGRESIÓN — al editar, el valor guardado puede no estar en ninguna primera
   * página. Si no se resolviera por id, el campo aparecería VACÍO y guardar
   * borraría la relación sin que el usuario lo pidiera.
   */
  it('muestra el rótulo del valor ya guardado aunque no venga en la primera página', async () => {
    render(<Formulario initialValue="873" />)

    await waitFor(() => {
      expect(screen.getByRole('combobox').value).toBe('Alumno 0873')
    })

    expect(api.get).toHaveBeenCalledWith('/students/873', expect.anything())
  })

  /** Un registro borrado no deja el campo en blanco, que parecería «sin asignar». */
  it('avisa cuando el valor guardado ya no se puede resolver', async () => {
    render(<Formulario initialValue="99999" />)

    await waitFor(() => {
      expect(screen.getByRole('combobox').value).toBe('Registro no disponible')
    })
  })

  /**
   * Lo que el control anterior callaba: cuando hay más coincidencias que las
   * mostradas, se dice. Callarlo es lo que hace concluir que el registro no
   * existe.
   */
  it('avisa de que la lista está recortada', async () => {
    render(<Formulario />)

    fireEvent.mouseDown(screen.getByRole('combobox'))

    expect(await screen.findByText(/Se muestran 20 de 1000/)).toBeTruthy()
  })

  it('no avisa de recorte cuando se muestran todas las coincidencias', async () => {
    render(<Formulario />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: 'Alumno 0007' } })

    await screen.findByRole('option', { name: 'Alumno 0007' })
    expect(screen.queryByText(/Se muestran/)).toBeNull()
  })

  it('permite recorrer las opciones con el teclado y elegir con Enter', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault())
    render(<Formulario onSubmit={onSubmit} />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    await screen.findByRole('option', { name: 'Alumno 0001' })

    fireEvent.keyDown(campo, { key: 'ArrowDown' })
    fireEvent.keyDown(campo, { key: 'Enter' })

    expect(screen.getByText('valor:2')).toBeTruthy()

    // Enter elige la opción; NO envía el formulario. Sin esto, abrir el
    // desplegable y pulsar Enter guardaría el registro a medias.
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('quita la selección con el botón de limpiar', async () => {
    render(<Formulario initialValue="873" />)

    await waitFor(() => expect(screen.getByRole('combobox').value).toBe('Alumno 0873'))

    fireEvent.click(screen.getByRole('button', { name: 'Quitar la selección' }))

    expect(screen.getByText('valor:')).toBeTruthy()
  })
})

/**
 * REGRESIÓN — «los searchselect para los grupos no corren bien, aun habiendo
 * grupos registrados».
 *
 * Los grupos tutoriales se rotulaban componiendo el nombre con el turno,
 * «1º ESO — Mañana», pero `TutorGroupController` solo declara `name` buscable.
 * Teclear exactamente lo que se veía en pantalla devolvía «Sin resultados»
 * habiendo cuatro grupos, y «Mañana» —presente en casi todas las opciones— no
 * encontraba ninguna.
 */
describe('SearchSelect con dato secundario', () => {
  const GRUPOS = [
    { id: 1, name: '1º ESO', shift: 'morning' },
    { id: 2, name: '1º ESO', shift: 'afternoon' },
    { id: 3, name: '4º ESO', shift: 'morning' },
    { id: 4, name: '2º Bachiller', shift: 'afternoon' },
  ]

  const TURNOS = { morning: 'Mañana', afternoon: 'Tarde' }

  /** El servidor busca SOLO por `name`, como el real. */
  function fakeGrupos() {
    api.get.mockImplementation((url, config = {}) => {
      const byId = url.match(/^\/tutor-groups\/(\d+)$/)
      if (byId) return Promise.resolve({ data: GRUPOS.find((g) => g.id === Number(byId[1])) })

      const { search } = config.params ?? {}
      const matched = search
        ? GRUPOS.filter((g) => g.name.toLowerCase().includes(String(search).toLowerCase()))
        : GRUPOS

      return Promise.resolve({ data: { data: matched, total: matched.length } })
    })
  }

  function FormularioGrupo() {
    const [value, setValue] = useState('')

    return (
      <>
        <SearchSelect
          endpoint="tutor-groups"
          name="tutor_group_id"
          onChange={(event) => setValue(event.target.value)}
          optionLabel={(group) => group.name}
          optionMeta={(group) => TURNOS[group.shift]}
          value={value}
        />
        <output>valor:{value}</output>
      </>
    )
  }

  beforeEach(fakeGrupos)

  it('encuentra el grupo al teclear el rótulo completo que se ve en pantalla', async () => {
    render(<FormularioGrupo />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    await screen.findByRole('option', { name: /1º ESO.*Mañana/ })

    // Exactamente lo que el usuario lee y vuelve a teclear.
    fireEvent.change(campo, { target: { value: '1º ESO — Mañana' } })

    // Se espera a que aterrice la consulta con retardo: sin esto la lista aún
    // contiene los cuatro grupos de la apertura y la prueba pasaría sin haber
    // buscado nada.
    await waitFor(() => {
      expect(api.get).toHaveBeenLastCalledWith(
        '/tutor-groups',
        expect.objectContaining({ params: expect.objectContaining({ search: '1º ESO' }) }),
      )
    })

    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(2))
  })

  it('el turno se muestra pero no se envía como término de búsqueda', async () => {
    render(<FormularioGrupo />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    await screen.findAllByRole('option')

    // El turno se ve en cada opción…
    expect(screen.getAllByText('Mañana').length).toBeGreaterThan(0)

    // …y elegir conserva el turno en el texto visible, para saber cuál es.
    fireEvent.click(screen.getAllByRole('option')[0])
    expect(campo.value).toBe('1º ESO — Mañana')
    expect(screen.getByText('valor:1')).toBeTruthy()
  })

  /** Buscar por algo que el servidor no indexa no puede dejar sin salida. */
  it('ofrece volver al catálogo completo cuando no hay resultados', async () => {
    render(<FormularioGrupo />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    await screen.findAllByRole('option')

    fireEvent.change(campo, { target: { value: 'Mañana' } })
    expect(await screen.findByText(/Sin resultados para «Mañana»/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Ver todas las opciones' }))

    expect(await screen.findAllByRole('option')).toHaveLength(4)
  })
})

/**
 * REGRESIÓN — Escape dentro de un cajón.
 *
 * `useFocusTrap` escucha Escape en `document` para cerrar el cajón. Sin detener
 * la propagación en el desplegable, cerrar la lista de resultados cerraría
 * ADEMÁS el formulario entero, y se perdería todo lo escrito.
 */
describe('SearchSelect dentro de un cajón con trampa de foco', () => {
  function Cajon() {
    const [isOpen, setIsOpen] = useState(true)
    const [value, setValue] = useState('')
    const ref = useFocusTrap(isOpen, () => setIsOpen(false))

    if (!isOpen) return <p>cajón cerrado</p>

    return (
      <div ref={ref}>
        <SearchSelect
          endpoint="students"
          name="student_id"
          onChange={(event) => setValue(event.target.value)}
          optionLabel={(student) => student.full_name}
          value={value}
        />
      </div>
    )
  }

  it('Escape cierra solo la lista, no el cajón', async () => {
    render(<Cajon />)

    const campo = screen.getByRole('combobox')
    fireEvent.mouseDown(campo)
    await screen.findByRole('option', { name: 'Alumno 0001' })

    fireEvent.keyDown(campo, { key: 'Escape' })

    expect(screen.queryByRole('listbox')).toBeNull()
    expect(screen.queryByText('cajón cerrado')).toBeNull()

    // Y el segundo Escape, ya sin lista abierta, sí cierra el cajón.
    fireEvent.keyDown(campo, { key: 'Escape' })
    expect(screen.getByText('cajón cerrado')).toBeTruthy()
  })
})
