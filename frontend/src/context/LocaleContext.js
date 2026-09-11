import { createContext, useContext } from 'react'

/**
 * Cómo cambiar de idioma, para quien lo ofrezca.
 *
 * Lleva SOLO la función de cambio, no el idioma activo. El idioma vive en el
 * módulo de i18n y se lee con `getLocale()`; ponerlo también aquí crearía dos
 * fuentes para el mismo dato, y la de React se quedaría atrás en cuanto alguien
 * llamara a `setLocale` desde fuera —una prueba, una herramienta—.
 *
 * Fichero propio y no dentro de `App.jsx` porque exportar un contexto junto a un
 * componente rompe la recarga en caliente de Vite: el módulo deja de poder
 * refrescarse solo y la página se recarga entera en cada cambio.
 */
export const LocaleContext = createContext(() => {})

export function useChangeLocale() {
  return useContext(LocaleContext)
}
