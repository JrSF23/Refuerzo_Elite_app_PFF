import { useCallback, useEffect, useState } from 'react'

/**
 * Tema claro u oscuro.
 *
 * La primera aplicación NO ocurre aquí: la hace un guion en línea de
 * `index.html` antes de que el navegador pinte el primer fotograma. Si se
 * resolviera al montar React, quien tiene el modo oscuro puesto vería un
 * fogonazo blanco en cada carga. Este módulo solo LEE lo que aquel dejó puesto y
 * se encarga de los cambios posteriores.
 *
 * ── Qué se guarda ───────────────────────────────────────────────────────────
 *
 * Solo se guarda una elección EXPLÍCITA. Mientras nadie toque el interruptor no
 * hay nada en `localStorage` y la aplicación sigue al sistema: quien tiene el
 * portátil en automático ve la aplicación cambiar con él al anochecer, que es lo
 * que espera. En cuanto elige, su elección manda y deja de seguirlo.
 *
 * ── Por qué no está en un contexto ──────────────────────────────────────────
 *
 * El tema no es estado de la aplicación: vive en el atributo del elemento raíz,
 * y de ahí lo lee CSS. Un contexto obligaría a re-renderizar el árbol entero
 * para cambiar un color que CSS ya sabe cambiar solo. Este gancho existe para
 * que el interruptor sepa qué dibujar, no para propagar el tema.
 */
const STORAGE_KEY = 'smartwork.theme'

function readAppliedTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState(readAppliedTheme)

  // Mientras no haya elección propia, se sigue al sistema en vivo: si el
  // portátil cambia a oscuro al anochecer, la aplicación cambia con él sin
  // recargar.
  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')

    function handleSystemChange(event) {
      try {
        if (localStorage.getItem(STORAGE_KEY)) return
      } catch {
        // Sin almacenamiento no hay elección guardada que respetar: se sigue al
        // sistema, que es el comportamiento por defecto.
      }

      apply(event.matches ? 'dark' : 'light')
      setTheme(event.matches ? 'dark' : 'light')
    }

    query.addEventListener('change', handleSystemChange)
    return () => query.removeEventListener('change', handleSystemChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark'

      apply(next)

      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // El tema se aplica igual; lo único que se pierde es que sobreviva a la
        // recarga. Un almacenamiento inaccesible no debe romper el interruptor.
      }

      return next
    })
  }, [])

  return { theme, isDark: theme === 'dark', toggle }
}

/**
 * El atributo es la única fuente: CSS lo lee y repinta sin que React intervenga.
 * En claro se QUITA en vez de ponerlo a `"light"`, para que el selector del tema
 * oscuro sea uno solo y no haya dos formas de decir lo mismo.
 */
function apply(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
