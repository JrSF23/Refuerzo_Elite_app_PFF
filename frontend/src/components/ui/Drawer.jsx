import { useId } from 'react'
import { createPortal } from 'react-dom'

import { t } from '../../i18n/index.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

/**
 * Panel deslizante lateral.
 *
 * Dos usos: la navegación en pantallas estrechas (FR-018) y los formularios de
 * las pantallas de entidad, donde permite crear o editar sin perder de vista el
 * listado.
 *
 * Comparte con `Modal` el gancho de foco: es un diálogo con otra presentación,
 * no otro comportamiento (FR-019, FR-049).
 *
 * @param {'left'|'right'} side  Izquierda para navegación, derecha para formularios.
 */
export function Drawer({ isOpen, onClose, title, side = 'right', footer, children }) {
  const titleId = useId()
  const containerRef = useFocusTrap(isOpen, onClose)

  if (!isOpen) return null

  return createPortal(
    <div className="overlay overlay--drawer" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`drawer drawer--${side}`}
        ref={containerRef}
        role="dialog"
      >
        <div className="drawer__header">
          <h2 className="drawer__title" id={titleId}>{title}</h2>

          <button
            aria-label={t('common.close')}
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="drawer__body">{children}</div>

        {footer ? <div className="drawer__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
