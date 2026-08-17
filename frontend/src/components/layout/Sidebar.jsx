import { NavLink } from 'react-router-dom'

import { t } from '../../i18n/index.js'
import { visibleSections } from '../../lib/permissions.js'

/**
 * Navegación principal.
 *
 * Las secciones se filtran por rol (FR-004). Ocultar no basta como seguridad
 * —la guarda de ruta y, sobre todo, el servidor son los que deciden—, pero
 * mostrar una sección que va a devolver 403 al pulsarla es una interfaz que
 * miente sobre lo que el usuario puede hacer.
 */
export function Sidebar({ roleNames, onNavigate }) {
  const sections = visibleSections(roleNames)

  // Agrupa conservando el orden de declaración de `SECTIONS`.
  const groups = sections.reduce((acc, section) => {
    const group = acc.find((item) => item.key === section.group)

    if (group) {
      group.sections.push(section)
    } else {
      acc.push({ key: section.group, sections: [section] })
    }

    return acc
  }, [])

  return (
    <nav aria-label={t('nav.label')} className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark" aria-hidden="true">SW</span>
        <span className="sidebar__brand-text">
          <strong>{t('app.name')}</strong>
          <span className="sidebar__tagline">{t('app.tagline')}</span>
        </span>
      </div>

      <div className="sidebar__scroll">
        {groups.map((group) => (
          <div className="sidebar__group" key={group.key ?? 'root'}>
            {group.key ? (
              <h2 className="sidebar__group-label">{t(`nav.${group.key}`)}</h2>
            ) : null}

            <ul>
              {group.sections.map((section) => (
                <li key={section.key}>
                  <NavLink
                    className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
                    onClick={onNavigate}
                    to={section.path}
                  >
                    {/* La sección activa se marca con una barra lateral además del
                        color y del grosor: el color solo no vale (FR-020). */}
                    <span aria-hidden="true" className="nav-link__marker" />
                    {t(`${section.key}.title`)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  )
}
