/**
 * Catálogo de textos.
 *
 * Ningún texto visible al usuario se escribe dentro de un componente (FR-066):
 * todos se resuelven aquí. Lo exige el Principio XII.a de la constitución.
 *
 * Deliberadamente sin librería de i18n. Con un único idioma, `react-i18next` y
 * equivalentes no resuelven ningún problema real —plurales complejos, carga por
 * idioma, negociación— y el Principio IV exige nombrar el problema concreto que
 * justifica cada capa. Cuando aparezca un segundo idioma con necesidades que
 * esto no cubra, se reevalúa; el cambio quedará dentro de este fichero, no en
 * los componentes.
 */

import { es } from './locales/es.js'

const catalogs = { es }

const DEFAULT_LOCALE = 'es'

/**
 * Configuraciones regionales para el formato de fechas y cifras. Se mantiene
 * separado del catálogo porque el idioma y la región no son lo mismo: un
 * segundo idioma puede compartir región, y una segunda región puede compartir
 * idioma.
 */
const localeTags = { es: 'es-ES' }

let activeLocale = DEFAULT_LOCALE

/**
 * Cambia el idioma activo.
 *
 * No hay selector de idioma en el MVP (FR-069). Existe para que añadir un
 * segundo idioma sea añadir un catálogo y llamar aquí, sin tocar ni un
 * componente (FR-070), y para poder verificarlo (SC-013).
 */
export function setLocale(locale) {
  if (!catalogs[locale]) {
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Idioma desconocido: "${locale}". Se mantiene "${activeLocale}".`)
    }
    return false
  }

  activeLocale = locale

  // Guardado por si se llama fuera del navegador —una prueba, una herramienta—:
  // cambiar de idioma no debe depender de que exista un documento.
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }

  return true
}

export function getLocale() {
  return activeLocale
}

function localeTag() {
  return localeTags[activeLocale] ?? activeLocale
}

/**
 * Recorre la clave separada por puntos: 'students.form.firstName'.
 *
 * Devuelve `undefined` si falta cualquier tramo, para que quien llama pueda
 * distinguir "no existe" de "existe y está vacío".
 */
function lookup(catalog, key) {
  return key.split('.').reduce((node, part) => {
    if (node === null || typeof node !== 'object') {
      return undefined
    }
    return node[part]
  }, catalog)
}

/**
 * Sustituye los marcadores `{nombre}` por sus valores.
 *
 * Interpolación por parámetro con nombre, nunca concatenando fragmentos
 * traducidos (FR-072). El orden de las palabras cambia entre idiomas: si el
 * texto se arma juntando trozos en el componente, el segundo idioma no se puede
 * traducir sin reescribir el componente, que es exactamente lo que este sistema
 * viene a evitar.
 */
function interpolate(template, params) {
  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (match, name) => {
    const value = params[name]

    if (value === undefined || value === null) {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Falta el parámetro "${name}" para el texto: "${template}"`)
      }
      return match
    }

    return String(value)
  })
}

/**
 * Resuelve una clave a su texto.
 *
 * Ante una clave inexistente devuelve la propia clave (FR-071). No cadena
 * vacía: un hueco en blanco es un fallo invisible que llega a producción sin
 * que nadie lo note, mientras que un `students.créate` a la vista se corrige el
 * mismo día. En desarrollo, además, avisa por consola.
 */
export function t(key, params) {
  if (typeof key !== 'string' || key === '') {
    if (import.meta.env.DEV) {
      console.warn('[i18n] Clave vacía o no textual:', key)
    }
    return ''
  }

  const value = lookup(catalogs[activeLocale], key)

  if (typeof value === 'string') {
    return interpolate(value, params)
  }

  if (import.meta.env.DEV) {
    const reason = value === undefined ? 'no existe' : `no es texto (es ${typeof value})`
    console.warn(`[i18n] La clave "${key}" ${reason} en el catálogo "${activeLocale}".`)
  }

  return key
}

/**
 * Elige entre singular y plural.
 *
 * El español se resuelve con dos formas, así que basta con esto y con que la
 * elección sea explícita en el punto de uso. Un idioma con más formas exigirá
 * ampliar esta función —no los componentes, que seguirán llamando igual—.
 */
export function tPlural(keyBase, count, params) {
  const suffix = count === 1 ? 'one' : 'many'
  return t(`${keyBase}.${suffix}`, { count, ...params })
}

/* ── Formato de datos ─────────────────────────────────────────────────────────
   Con la API de internacionalización del navegador y la región del idioma
   activo, nunca con formato fijo escrito a mano (FR-073).

   Los formateadores de `Intl` son caros de construir y se reutilizan mucho, así
   que se memorizan por combinación de región y opciones.
   ───────────────────────────────────────────────────────────────────────────── */

const formatterCache = new Map()

function formatter(kind, options) {
  const cacheKey = `${kind}:${localeTag()}:${JSON.stringify(options)}`

  if (!formatterCache.has(cacheKey)) {
    const Ctor = kind === 'date' ? Intl.DateTimeFormat : Intl.NumberFormat
    formatterCache.set(cacheKey, new Ctor(localeTag(), options))
  }

  return formatterCache.get(cacheKey)
}

/** Marcador de valor ausente. Nunca se muestra `null` ni cadena vacía. */
export const EMPTY_VALUE = '—'

export function formatDate(value, { long = false } = {}) {
  if (!value) return EMPTY_VALUE

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return EMPTY_VALUE

  return formatter('date', long
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

/**
 * La API devuelve las horas como `HH:MM:SS` y solo interesan horas y minutos.
 * Se recorta la cadena en lugar de construir un `Date`: montar una fecha para
 * quedarse con la hora arrastra la zona horaria sin ninguna necesidad.
 */
export function formatTime(value) {
  if (!value || typeof value !== 'string') return EMPTY_VALUE

  const match = value.match(/^(\d{2}):(\d{2})/)
  return match ? `${match[1]}:${match[2]}` : EMPTY_VALUE
}

export function formatNumber(value, options) {
  if (value === null || value === undefined || value === '') return EMPTY_VALUE

  const number = Number(value)
  return Number.isNaN(number) ? EMPTY_VALUE : formatter('number', options).format(number)
}

/**
 * Importes con separador de millar y dos decimales (SC-010).
 *
 * Sin símbolo de divisa a propósito: la base de datos guarda el importe como
 * número desnudo, sin moneda asociada —deuda XII.b, registrada y ajena a esta
 * feature—. Inventar aquí un símbolo acoplaría la interfaz a un país, que es
 * justo lo que el Principio XII prohíbe. Cuando la moneda sea configuración de
 * la organización, se pasa aquí y se usa `style: 'currency'`.
 */
export function formatAmount(value) {
  return formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
