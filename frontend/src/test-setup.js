import { beforeEach } from 'vitest'

import { setLocale } from './i18n/index.js'

/**
 * Idioma fijo en las pruebas.
 *
 * La aplicación detecta el idioma del navegador cuando nadie ha elegido uno, y
 * eso es lo correcto en producción. En las pruebas es una fuente de fallos
 * fantasma: `jsdom` anuncia inglés, así que toda comprobación sobre un texto
 * pasaba a fallar según el idioma de la máquina, no según el código.
 *
 * Se fija el español antes de cada prueba. Quien necesite comprobar otro idioma
 * llama a `setLocale` en su propio caso, y este gancho lo devuelve al español
 * para el siguiente.
 */
beforeEach(() => {
  setLocale('es')
})
