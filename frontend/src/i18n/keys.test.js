import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { es } from './locales/es.js'

/**
 * Toda clave usada en el código tiene que existir en el catálogo.
 *
 * ── Por qué hace falta una prueba para esto ─────────────────────────────────
 *
 * Cuando una clave no existe, `t()` devuelve LA CLAVE MISMA. No lanza, no rompe
 * la pantalla y no aparece en ningún log de producción: simplemente se pinta
 * `attendance.searchGroups` donde debería poner «Buscar grupo». En una interfaz
 * en español eso se lee como texto en inglés, y es exactamente así como se
 * detectó —mirando la pantalla, no ejecutando los tests—.
 *
 * El fallo llegó por editar el catálogo a ciegas: las claves nuevas de
 * asistencia acabaron dentro de `dashboard.attendance`, que ya existía para la
 * tarjeta del panel, en lugar de en la sección `attendance` de primer nivel. Dos
 * bloques con el mismo nombre a distinta profundidad, y ninguna herramienta que
 * avisara.
 *
 * ── Lo que NO comprueba ────────────────────────────────────────────────────
 *
 * Solo las llamadas con clave literal, que son la inmensa mayoría. Una clave
 * construida —`t(\`status.\${valor}\`)`— no se puede resolver sin ejecutar la
 * pantalla, y forzar que todas fueran literales por gusto de esta prueba sería
 * la cola moviendo al perro.
 */
// `fileURLToPath` y no manipular la cadena del URL: en Windows, `pathname` da
// «/C:/…» y cualquier recorte a mano acaba en una ruta que no existe.
const RAIZ = dirname(dirname(fileURLToPath(import.meta.url)))

function ficherosDeCodigo(directorio) {
  const salida = []

  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada)

    if (statSync(ruta).isDirectory()) {
      salida.push(...ficherosDeCodigo(ruta))
      continue
    }

    // Fuera el catálogo y fuera las PRUEBAS. `i18n.test.js` usa a propósito una
    // clave inexistente y otra que apunta a un objeto, porque lo que comprueba
    // es justamente cómo se comporta `t()` en esos casos. Son ejemplos, no
    // errores, y ninguna cadena de un fichero de prueba llega a la pantalla.
    if (/\.(jsx|js)$/.test(ruta) && !ruta.includes('locales') && !/\.test\.jsx?$/.test(ruta)) {
      salida.push(ruta)
    }
  }

  return salida
}

function resuelve(clave) {
  return clave
    .split('.')
    .reduce((nodo, parte) => (nodo && typeof nodo === 'object' ? nodo[parte] : undefined), es)
}

describe('catálogo de traducciones', () => {
  it('no hay ninguna clave usada en el código que no exista', () => {
    const rotas = []
    let comprobadas = 0

    for (const fichero of ficherosDeCodigo(RAIZ)) {
      const codigo = readFileSync(fichero, 'utf8')

      for (const encontrada of codigo.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)) {
        comprobadas++

        if (resuelve(encontrada[1]) === undefined) {
          rotas.push(`${encontrada[1]} — ${fichero.replace(RAIZ, '')}`)
        }
      }
    }

    // Si esto baja de golpe, alguien ha roto el recorrido y la prueba estaría
    // pasando sin comprobar nada.
    expect(comprobadas).toBeGreaterThan(300)
    expect(rotas).toEqual([])
  })

  it('ninguna clave apunta a un objeto en vez de a un texto', () => {
    // `t('attendance')` sobre un bloque entero devuelve la clave igual que si no
    // existiera, y es un error tan silencioso como el otro.
    const objetos = []

    for (const fichero of ficherosDeCodigo(RAIZ)) {
      const codigo = readFileSync(fichero, 'utf8')

      for (const encontrada of codigo.matchAll(/\bt\(\s*'([a-zA-Z][\w.]*)'/g)) {
        const valor = resuelve(encontrada[1])

        if (valor !== undefined && typeof valor !== 'string') {
          objetos.push(`${encontrada[1]} — ${fichero.replace(RAIZ, '')}`)
        }
      }
    }

    expect(objetos).toEqual([])
  })
})
