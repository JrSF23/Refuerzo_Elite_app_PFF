/**
 * Reparte los alumnos en bloques por su grupo tutorial.
 *
 * Función PURA y sin dependencias de React: es la pieza con más reglas de esta
 * pantalla —orden académico, alumnos sin grupo, grupos vacíos— y separarla
 * permite probarla exhaustivamente sin montar nada.
 *
 * La agrupación se construye a partir del grupo que trae CADA ALUMNO, no de
 * un listado de grupos cruzado con otro de alumnos (FR-036). Así un grupo sin
 * alumnos no aparece por construcción, sin necesidad de filtrarlo después
 * (FR-028).
 *
 * @param {object[]} students  Alumnos con `tutor_group` cargado.
 * @returns {{key: string, group: object|null, students: object[]}[]}
 */
export function groupStudents(students) {
  const blocks = new Map()

  for (const student of students) {
    const group = student.tutor_group ?? null

    // Los alumnos sin grupo van a un bloque propio y NO se descartan (FR-029).
    // Tras la migración son todos, y ocultarlos dejaría la pantalla vacía sin
    // explicación.
    const key = group ? `group-${group.id}` : 'unassigned'

    if (!blocks.has(key)) {
      blocks.set(key, { key, group, students: [] })
    }

    blocks.get(key).students.push(student)
  }

  const ordered = [...blocks.values()]

  ordered.sort(compareBlocks)

  for (const block of ordered) {
    block.students.sort(compareStudents)
  }

  return ordered
}

/**
 * Orden de los bloques.
 *
 * Por `sort_order`, que es un DATO del grupo y no una escala escrita en el
 * código: el Principio XII prohíbe acoplar la lógica a un país, y ordenar por el
 * texto del nivel daría mal resultado —alfabéticamente «1º Bachiller» precede a
 * «1º ESO»— (FR-031).
 *
 * Los alumnos sin grupo van al final: son una tarea pendiente, no un curso.
 */
function compareBlocks(a, b) {
  if (a.group === null) return 1
  if (b.group === null) return -1

  const byOrder = (a.group.sort_order ?? 0) - (b.group.sort_order ?? 0)
  if (byOrder !== 0) return byOrder

  // Con el mismo orden, el nombre desempata para que la lista sea estable entre
  // cargas; sin esto, dos grupos con `sort_order` igual podrían intercambiarse.
  const byName = String(a.group.name ?? '').localeCompare(String(b.group.name ?? ''), 'es')
  if (byName !== 0) return byName

  return String(a.group.shift ?? '').localeCompare(String(b.group.shift ?? ''), 'es')
}

/** Por apellidos y luego nombre, con la intercalación del español (FR-031). */
function compareStudents(a, b) {
  const byLastName = String(a.last_name ?? '').localeCompare(String(b.last_name ?? ''), 'es')
  if (byLastName !== 0) return byLastName

  return String(a.first_name ?? '').localeCompare(String(b.first_name ?? ''), 'es')
}
