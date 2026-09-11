import { LOCALES, getLocale, t } from '../../i18n/index.js'
import { useChangeLocale } from '../../context/LocaleContext.js'
import { Dropdown, DropdownItem } from '../ui/Dropdown.jsx'

/**
 * Selector de idioma de la barra superior.
 *
 * Desplegable y no un botón que rota entre idiomas: con tres, rotar obliga a
 * pasar por los que no quieres para llegar al que sí, y a leer un rótulo en un
 * idioma que no entiendes para saber dónde estás.
 *
 * Cada opción se rotula EN SU PROPIO IDIOMA —«Español», «Français», «English»—
 * y no traducida al idioma activo. Es la convención de todo selector de idioma,
 * y por un motivo práctico: quien tiene la aplicación en un idioma que no
 * domina necesita reconocer el suyo, no leer cómo se dice en el otro.
 *
 * El disparador muestra el código en mayúsculas —ES, FR, EN— porque en una barra
 * estrecha el nombre completo desplaza al resto, y el código de dos letras se
 * reconoce igual de rápido.
 */
export function LanguageMenu() {
  const changeLocale = useChangeLocale()
  const active = getLocale()

  return (
    <Dropdown
      align="end"
      label={t('language.change')}
      trigger={(
        <span className="language-menu__trigger">
          <span aria-hidden="true" className="language-menu__globe">🌐</span>
          <span className="language-menu__code">{active.toUpperCase()}</span>
        </span>
      )}
    >
      {({ close }) => LOCALES.map((locale) => (
        <DropdownItem
          key={locale.code}
          onClick={() => { close(); changeLocale(locale.code) }}
        >
          <span className={`language-menu__item${locale.code === active ? ' is-active' : ''}`}>
            {/* La marca va con `aria-hidden`: el idioma activo se anuncia con
                `aria-current`, que es lo que un lector de pantalla entiende. */}
            <span aria-hidden="true" className="language-menu__check">
              {locale.code === active ? '✓' : ''}
            </span>
            <span aria-current={locale.code === active ? 'true' : undefined}>
              {locale.label}
            </span>
          </span>
        </DropdownItem>
      ))}
    </Dropdown>
  )
}
