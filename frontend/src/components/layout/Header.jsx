import { t } from '../../i18n/index.js'
import { useTheme } from '../../hooks/useTheme.js'
import { Dropdown, DropdownItem } from '../ui/Dropdown.jsx'
import { ThemeToggle } from './ThemeToggle.jsx'

/**
 * Cabecera de la aplicación.
 *
 * Muestra en todo momento la organización activa, la identidad y el rol (FR-021).
 * En un producto multi-organización eso no es decoración: quien administra varios
 * centros necesita saber sin dudar en cuál está operando antes de borrar algo.
 *
 * El super administrador no tiene organización —no pertenece a ninguna—, y en su
 * caso se rotula como plataforma en lugar de dejar el hueco vacío.
 */
export function Header({ organization, user, roleNames, isPlatformAdmin, onLogout, onOpenNav }) {
  const { isDark, toggle } = useTheme()

  const roleLabel = roleNames.length > 0
    ? roleNames.map((role) => t(`roles.${role}`)).join(', ')
    : t('roles.none')

  const contextLabel = isPlatformAdmin
    ? t('roles.super_admin')
    : organization?.name ?? t('organization.missingTitle')

  return (
    <header className="header">
      <button
        aria-label={t('nav.open')}
        className="header__nav-toggle"
        onClick={onOpenNav}
        type="button"
      >
        <span aria-hidden="true" className="burger" />
      </button>

      <div className="header__context">
        <span className="header__context-label">{t('fields.organization')}</span>
        <span className="header__context-value">{contextLabel}</span>
      </div>

      <Dropdown
        align="end"
        label={user?.name ?? ''}
        trigger={(
          <span className="account">
            <span aria-hidden="true" className="account__avatar">
              {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
            </span>
            <span className="account__text">
              <span className="account__name">{user?.name}</span>
              <span className="account__role">{roleLabel}</span>
            </span>
          </span>
        )}
      >
        {({ close }) => (
          <>
            {/* Quién eres, dentro del menú que lleva tu nombre. En la cabecera
                el rótulo se oculta por debajo de 640 px para que quepa el resto,
                así que en móvil este es el único sitio donde se puede comprobar
                con qué cuenta se está trabajando antes de borrar algo. */}
            <div className="dropdown__identity">
              <span className="dropdown__identity-name">{user?.name}</span>
              <span className="dropdown__identity-role">{roleLabel}</span>
            </div>

            {/* La apariencia NO es una opción del menú: es un interruptor.
                Como opción habría que cerrar el menú para ver el resultado y
                volver a abrirlo si no convence. Aquí se ve cambiar la pantalla
                debajo mientras se pulsa, y por eso NO cierra el menú.

                Va aquí y no en el panel porque es una preferencia que se toca
                una vez: en mitad de la pantalla ocuparía sitio permanente a
                cambio de un uso al año. */}
            <ThemeToggle isDark={isDark} onToggle={toggle} />

            <DropdownItem onClick={() => { close(); onLogout() }} tone="danger">
              {t('auth.logout')}
            </DropdownItem>
          </>
        )}
      </Dropdown>
    </header>
  )
}
