import { t } from '../../i18n/index.js'

/**
 * Interruptor de apariencia, dentro del menú de la cuenta.
 *
 * ── Por qué un interruptor y no dos opciones ────────────────────────────────
 *
 * Con «Claro / Oscuro» como dos entradas del menú hay que elegir, ver cómo
 * queda, y volver a abrir el menú para deshacerlo si no convence. Un
 * interruptor cambia la pantalla debajo mientras el menú sigue abierto, de modo
 * que probar y volver atrás cuesta un pulso. Por eso NO cierra el menú al
 * usarse: cerrarlo destruiría justo la ventaja.
 *
 * ── Accesibilidad ──────────────────────────────────────────────────────────
 *
 * Es un `menuitemcheckbox` con `aria-checked`, que es lo que un lector de
 * pantalla anuncia como «Modo oscuro, casilla, activada» — información completa
 * sin ver el dibujo. El icono va `aria-hidden`: es decoración, y anunciar
 * «emoji sol» no comunica nada.
 *
 * La etiqueta dice «Modo oscuro» y no «Apariencia», porque `aria-checked` tiene
 * que responder a una pregunta de sí o no. «Apariencia: activada» no significa
 * nada; «Modo oscuro: activado», sí.
 */
export function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      aria-checked={isDark}
      className="theme-toggle"
      onClick={onToggle}
      role="menuitemcheckbox"
      type="button"
    >
      <span aria-hidden="true" className="theme-toggle__icon">{isDark ? '☾' : '☀'}</span>

      <span className="theme-toggle__label">{t('theme.darkMode')}</span>

      {/* El estado se dibuja con posición y relleno, no solo con color: el
          interruptor se lee igual en escala de grises. */}
      <span aria-hidden="true" className="theme-toggle__switch">
        <span className="theme-toggle__knob" />
      </span>
    </button>
  )
}
