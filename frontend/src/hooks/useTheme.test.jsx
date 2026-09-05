import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from './useTheme.js'
import { ThemeToggle } from '../components/layout/ThemeToggle.jsx'

const STORAGE_KEY = 'smartwork.theme'

/** Sonda mínima: el interruptor real, movido por el gancho real. */
function Probe() {
  const { isDark, toggle } = useTheme()

  return <ThemeToggle isDark={isDark} onToggle={toggle} />
}

/**
 * `matchMedia` no existe en jsdom. Se sustituye por uno controlable para poder
 * simular tanto la preferencia del sistema como su cambio en vivo.
 */
function stubMatchMedia(prefersDark) {
  const listeners = new Set()

  window.matchMedia = vi.fn().mockReturnValue({
    matches: prefersDark,
    addEventListener: (_event, handler) => listeners.add(handler),
    removeEventListener: (_event, handler) => listeners.delete(handler),
  })

  return {
    emit: (matches) => listeners.forEach((handler) => handler({ matches })),
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  stubMatchMedia(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('modo oscuro', () => {
  it('parte de lo que el guion de index.html dejó aplicado', () => {
    document.documentElement.setAttribute('data-theme', 'dark')

    render(<Probe />)

    expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('true')
  })

  it('al encenderlo pinta la aplicación en oscuro y lo recuerda', () => {
    render(<Probe />)

    fireEvent.click(screen.getByRole('menuitemcheckbox'))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('true')
  })

  /**
   * En claro el atributo se QUITA, no se pone a `"light"`. Si se quedara puesto
   * habría dos formas de decir lo mismo y el selector del tema oscuro tendría
   * que contemplar las dos.
   */
  it('al apagarlo retira el atributo en vez de ponerlo a «light»', () => {
    render(<Probe />)

    const toggle = screen.getByRole('menuitemcheckbox')

    fireEvent.click(toggle)
    fireEvent.click(toggle)

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  /**
   * Mientras nadie haya elegido, la aplicación sigue al sistema en vivo: quien
   * tiene el portátil en automático la ve cambiar al anochecer sin recargar.
   */
  it('sigue al sistema mientras no haya elección propia', () => {
    const media = stubMatchMedia(false)

    render(<Probe />)

    act(() => media.emit(true))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
    expect(screen.getByRole('menuitemcheckbox').getAttribute('aria-checked')).toBe('true')
  })

  /**
   * Y deja de seguirlo en cuanto hay elección. Sin esto, alguien que fuerza el
   * modo claro de día vería la aplicación cambiar a oscuro a su espalda cuando
   * el sistema lo hiciera, deshaciendo lo que acababa de elegir.
   */
  it('deja de seguir al sistema una vez que se ha elegido', () => {
    const media = stubMatchMedia(false)

    render(<Probe />)

    // Elección explícita: claro. El primer clic enciende, el segundo apaga.
    const toggle = screen.getByRole('menuitemcheckbox')
    fireEvent.click(toggle)
    fireEvent.click(toggle)

    expect(localStorage.getItem(STORAGE_KEY)).toBe('light')

    act(() => media.emit(true))

    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(toggle.getAttribute('aria-checked')).toBe('false')
  })

  /**
   * `localStorage` lanza en el modo privado de algunos navegadores. El
   * interruptor tiene que seguir cambiando el tema: lo único aceptable que se
   * pierde es que sobreviva a la recarga.
   */
  it('sigue funcionando sin acceso al almacenamiento', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('acceso denegado')
    })

    render(<Probe />)

    fireEvent.click(screen.getByRole('menuitemcheckbox'))

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})
