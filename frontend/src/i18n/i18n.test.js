import { afterEach, describe, expect, it, vi } from 'vitest'

import { EMPTY_VALUE, formatAmount, formatDate, formatTime, getLocale, setLocale, t } from './index.js'

afterEach(() => {
  setLocale('es')
  vi.restoreAllMocks()
})

describe('t', () => {
  it('resuelve una clave anidada', () => {
    expect(t('students.title')).toBe('Alumnos')
  })

  it('interpola por parámetro con nombre', () => {
    expect(t('common.pagePosition', { current: 2, total: 5 })).toBe('Página 2 de 5')
  })

  /**
   * Una clave inexistente devuelve la propia clave, NUNCA cadena vacía: un hueco
   * en blanco es un fallo invisible que llega a producción sin que nadie lo note,
   * mientras que una clave a la vista se corrige el mismo día (FR-071).
   */
  it('devuelve la clave cuando no existe, y no rompe', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(t('no.existe.esta.clave')).toBe('no.existe.esta.clave')
  })

  it('devuelve la clave cuando apunta a un objeto en vez de a un texto', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(t('students.fields')).toBe('students.fields')
  })
})

/**
 * SC-013 — añadir un idioma no debe exigir tocar ningún componente.
 *
 * Los componentes solo conocen `t`. Esta prueba comprueba que basta con
 * registrar un catálogo y seleccionarlo, que es lo que convierte «preparado para
 * i18n» en algo verificable y no en una intención.
 */
describe('preparación para un segundo idioma', () => {
  it('rechaza un idioma no registrado y conserva el activo', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(setLocale('zz')).toBe(false)
    expect(getLocale()).toBe('es')
    expect(t('students.title')).toBe('Alumnos')
  })

  it('acepta el idioma registrado y actualiza el documento', () => {
    expect(setLocale('es')).toBe(true)
    expect(document.documentElement.lang).toBe('es')
  })
})

describe('formato de datos', () => {
  it('no muestra nunca null ni cadena vacía', () => {
    expect(formatDate(null)).toBe(EMPTY_VALUE)
    expect(formatTime(null)).toBe(EMPTY_VALUE)
    expect(formatAmount(null)).toBe(EMPTY_VALUE)
  })

  it('recorta los segundos que devuelve la API', () => {
    expect(formatTime('09:30:00')).toBe('09:30')
  })

  it('formatea importes con dos decimales y separador de millar', () => {
    // Termina en la moneda, no en los decimales: `formatAmount` añade el sufijo
    // FCFA por decisión de producto (ver el comentario en `formatAmount`).
    const formatted = formatAmount(1234.5)
    expect(formatted).toContain('1')
    expect(formatted).toMatch(/[.,]50 FCFA$/)
  })

  it('descarta una fecha inválida en lugar de mostrar «Invalid Date»', () => {
    expect(formatDate('no-es-una-fecha')).toBe(EMPTY_VALUE)
  })
})
