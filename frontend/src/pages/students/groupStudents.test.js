import { describe, expect, it } from 'vitest'

import { groupStudents } from './groupStudents.js'

const group = (id, name, sortOrder, shift = 'morning') => ({
  id, name, sort_order: sortOrder, shift, tutor: null,
})

const student = (id, firstName, lastName, tutorGroup = null) => ({
  id,
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`,
  tutor_group: tutorGroup,
})

describe('groupStudents', () => {
  it('reparte los alumnos en un bloque por grupo', () => {
    const primero = group(1, '1º ESO', 10)
    const cuarto = group(2, '4º ESO', 40)

    const blocks = groupStudents([
      student(1, 'Ana', 'Alonso', cuarto),
      student(2, 'Beto', 'Bravo', primero),
      student(3, 'Carla', 'Cruz', cuarto),
    ])

    expect(blocks).toHaveLength(2)
    expect(blocks.map((b) => b.group.name)).toEqual(['1º ESO', '4º ESO'])
    expect(blocks[1].students.map((s) => s.first_name)).toEqual(['Ana', 'Carla'])
  })

  /**
   * El caso que justifica que el orden sea un dato y no código: alfabéticamente
   * «1º Bachiller» precede a «1º ESO», que es justo lo contrario del orden
   * académico. Ordenar por el texto del nivel daría el resultado equivocado.
   */
  it('ordena los bloques por sort_order y no alfabéticamente', () => {
    const bachiller = group(1, '1º Bachiller', 50)
    const eso = group(2, '1º ESO', 10)

    const blocks = groupStudents([
      student(1, 'Ana', 'Alonso', bachiller),
      student(2, 'Beto', 'Bravo', eso),
    ])

    expect(blocks.map((b) => b.group.name)).toEqual(['1º ESO', '1º Bachiller'])
  })

  it('ordena los alumnos por apellidos y luego por nombre', () => {
    const g = group(1, '1º ESO', 10)

    const blocks = groupStudents([
      student(1, 'Zoe', 'Álvarez', g),
      student(2, 'Ana', 'Zapata', g),
      student(3, 'Ana', 'Álvarez', g),
    ])

    expect(blocks[0].students.map((s) => s.full_name)).toEqual([
      'Ana Álvarez',
      'Zoe Álvarez',
      'Ana Zapata',
    ])
  })

  it('agrupa aparte a los alumnos sin grupo y los deja al final', () => {
    const g = group(1, '1º ESO', 10)

    const blocks = groupStudents([
      student(1, 'Ana', 'Alonso'),
      student(2, 'Beto', 'Bravo', g),
    ])

    expect(blocks).toHaveLength(2)
    expect(blocks[0].group.name).toBe('1º ESO')

    // Sin grupo: bloque propio, al final. NUNCA ocultos: tras la migración son
    // todos, y esconderlos dejaría la pantalla vacía sin explicación.
    expect(blocks[1].group).toBeNull()
    expect(blocks[1].students.map((s) => s.first_name)).toEqual(['Ana'])
  })

  it('no inventa bloques para grupos sin alumnos', () => {
    // Se construye desde los alumnos, no cruzando dos listados, así que un grupo
    // vacío no aparece por construcción (FR-028).
    const blocks = groupStudents([student(1, 'Ana', 'Alonso', group(1, '1º ESO', 10))])

    expect(blocks).toHaveLength(1)
  })

  it('separa dos grupos con el mismo nombre y distinto turno', () => {
    const manana = { ...group(1, '1º ESO', 10, 'morning') }
    const tarde = { ...group(2, '1º ESO', 11, 'afternoon') }

    const blocks = groupStudents([
      student(1, 'Ana', 'Alonso', manana),
      student(2, 'Beto', 'Bravo', tarde),
    ])

    expect(blocks).toHaveLength(2)
    expect(blocks.map((b) => b.group.shift)).toEqual(['morning', 'afternoon'])
  })

  it('devuelve una lista vacía cuando no hay alumnos', () => {
    expect(groupStudents([])).toEqual([])
  })

  it('mantiene un orden estable cuando dos grupos comparten sort_order', () => {
    const b = group(1, 'B', 10)
    const a = group(2, 'A', 10)

    const blocks = groupStudents([
      student(1, 'Uno', 'Uno', b),
      student(2, 'Dos', 'Dos', a),
    ])

    // Sin desempate, dos grupos con el mismo orden podrían intercambiarse entre
    // cargas y la lista parecería moverse sola.
    expect(blocks.map((x) => x.group.name)).toEqual(['A', 'B'])
  })
})
