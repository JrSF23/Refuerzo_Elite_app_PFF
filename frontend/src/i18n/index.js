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

import { en } from './locales/en.js'
import { es } from './locales/es.js'
import { fr } from './locales/fr.js'

const catalogs = { es, fr, en }

/**
 * El español es el idioma base y el respaldo de los demás.
 *
 * Toda clave que falte en otro catálogo se resuelve aquí antes de darse por
 * perdida. Un idioma incompleto enseña entonces algo de español —comprensible,
 * y evidente para quien deba completarlo— en vez de la clave cruda, que es
 * ilegible para cualquiera.
 */
const DEFAULT_LOCALE = 'es'

/** Los idiomas ofrecidos, en el orden en que se listan. */
export const LOCALES = [
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
]

const STORAGE_KEY = 'smartwork.locale'

/**
 * Configuraciones regionales para el formato de fechas y cifras. Se mantiene
 * separado del catálogo porque el idioma y la región no son lo mismo: un
 * segundo idioma puede compartir región, y una segunda región puede compartir
 * idioma.
 */
const localeTags = { es: 'es-ES', fr: 'fr-FR', en: 'en-GB' }

/**
 * Idioma inicial: lo que la persona eligió y, si no eligió nada, el de su
 * navegador cuando lo tengamos.
 *
 * Se resuelve al cargar el módulo, que ocurre antes de que React monte nada, de
 * modo que la primera pantalla ya sale en su idioma. Envuelto en try/catch
 * porque `localStorage` lanza en el modo privado de algunos navegadores, y
 * quedarse sin idioma preferido es un fallo cosmético que no debe impedir que la
 * aplicación arranque.
 */
function initialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && catalogs[stored]) return stored
  } catch {
    // Sin almacenamiento se sigue con la negociación del navegador.
  }

  if (typeof navigator !== 'undefined') {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const base = String(tag ?? '').slice(0, 2).toLowerCase()
      if (catalogs[base]) return base
    }
  }

  return DEFAULT_LOCALE
}

let activeLocale = initialLocale()

/**
 * Cambia el idioma activo y lo recuerda.
 *
 * Añadir un idioma sigue siendo añadir un catálogo y una entrada en `LOCALES`,
 * sin tocar ni un componente (FR-070). El portugués —tercer idioma oficial de
 * Guinea Ecuatorial— cabría así, con un fichero.
 *
 * NO provoca el repintado: esto es estado de módulo, no de React. Quien llama se
 * encarga de que el árbol se vuelva a dibujar; lo hace `App` remontando su
 * subárbol, porque `t()` se resuelve en tiempo de render y un remontado relee
 * todo sin que cada componente tenga que suscribirse a nada.
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

  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // El idioma se aplica igual; lo único que se pierde es que sobreviva a la
    // recarga.
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

  // Respaldo al idioma base antes de rendirse. Una traducción incompleta enseña
  // español —comprensible, y evidente para quien deba completarla— en lugar de
  // la clave cruda, que no le sirve a nadie.
  if (activeLocale !== DEFAULT_LOCALE) {
    const fallback = lookup(catalogs[DEFAULT_LOCALE], key)

    if (typeof fallback === 'string') {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Falta "${key}" en "${activeLocale}"; se usa "${DEFAULT_LOCALE}".`)
      }

      return interpolate(fallback, params)
    }
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
 * ── FCFA fijo, por decisión expresa del producto ────────────────────────────
 *
 * Antes no se ponía símbolo, y el motivo sigue siendo cierto: la base guarda el
 * importe como número desnudo, sin moneda asociada (deuda XII.b), así que este
 * sufijo lo pone la interfaz y no el dato. Vale para el centro de Guinea
 * Ecuatorial y NO vale para ningún otro: en cuanto haya una organización que
 * facture en otra divisa, esta línea muestra un importe falso en su pantalla.
 *
 * Queda escrito para que se lea como lo que es —una decisión tomada a sabiendas,
 * no un descuido— y para que quien salde la deuda XII.b sepa que el arreglo
 * completo es mover la moneda a la organización y usar `style: 'currency'`, no
 * cambiar el literal de aquí.
 */
const CURRENCY_SUFFIX = 'FCFA'

export function formatAmount(value) {
  const amount = formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Sin importe no hay moneda: «— FCFA» afirma que hay un pago en francos cuyo
  // valor se desconoce, cuando lo que ocurre es que no hay pago del que hablar.
  if (amount === EMPTY_VALUE) {
    return amount
  }

  return `${amount} ${CURRENCY_SUFFIX}`
}
