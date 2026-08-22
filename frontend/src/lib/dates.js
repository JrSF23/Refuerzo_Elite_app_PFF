/**
 * Conversión entre la fecha que se ve y la que viaja.
 *
 * Dentro de la aplicación las fechas son SIEMPRE ISO `aaaa-mm-dd`, que es lo que
 * la API espera. `dd/mm/aaaa` es presentación y no sale de la capa de interfaz.
 *
 * Aparte para que no dependan de React: las usa `DateField` para pintar y
 * `useResourceForm` para normalizar lo que llega del servidor, y un gancho no
 * tiene por qué importar un componente para convertir una cadena.
 */

/**
 * `2026-01-13T00:00:00.000000Z` y `2026-01-13` → `2026-01-13`.
 *
 * La tolerancia al sufijo de hora NO es un extra: Laravel serializa las columnas
 * `date` como fecha y hora completas, y ningún control de fecha acepta ese
 * valor. Sin recortarlo, todas las fechas aparecían en blanco al editar.
 */
export function toIsoDate(value) {
  if (typeof value !== 'string' || value === '') return ''

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? match[0] : ''
}

/** ISO → lo que se ve. */
export function isoToDisplay(iso) {
  const clean = toIsoDate(iso)
  if (clean === '') return ''

  const [year, month, day] = clean.split('-')
  return `${day}/${month}/${year}`
}

/**
 * dd/mm/aaaa → ISO, o cadena vacía si no es una fecha real.
 *
 * Se comprueba que la fecha EXISTA, no solo que encaje en el patrón: el 31 de
 * febrero pasa cualquier expresión regular y no es un día.
 */
export function displayToIso(text) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text)
  if (!match) return ''

  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  // `new Date(2026, 1, 31)` no falla: se desborda al 3 de marzo. Comparar los
  // tres componentes es lo que detecta el desbordamiento.
  const real = date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day)

  return real ? `${year}-${month}-${day}` : ''
}

/** Inserta las barras mientras se escribe, y descarta lo que no sea dígito. */
export function maskDate(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}
