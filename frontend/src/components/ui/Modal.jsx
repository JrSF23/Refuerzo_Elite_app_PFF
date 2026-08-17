import { useCallback, useId } from 'react'
import { createPortal } from 'react-dom'

import { t } from '../../i18n/index.js'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'

/**
 * Diálogo modal.
 *
 * Se renderiza con portal al `body` a propósito: dentro del árbol quedaría
 * atrapado por el `overflow` o el `transform` de cualquier ancestro, y un
 * diálogo recortado a la mitad es un fallo difícil de diagnosticar.
 *
 * Accesibilidad: foco atrapado, cierre con Escape y al pulsar fuera, devolución
 * del foco al disparador, `role="dialog"`, `aria-modal` y título enlazado
 * (FR-049).
 */
export function Modal({ isOpen, onClose, title, description, footer, children }) {
  const titleId = useId()
  const descriptionId = useId()
  const containerRef = useFocusTrap(isOpen, onClose)

  // Solo cierra si el clic empieza Y termina en la capa de fondo: arrastrar una
  // selección de texto desde dentro y soltar fuera no debe descartar el
  // formulario que el usuario acaba de rellenar.
  const handleOverlayMouseDown = useCallback((event) => {
    if (event.target !== event.currentTarget) return

    const overlay = event.currentTarget
    const handleUp = (upEvent) => {
      if (upEvent.target === overlay) onClose?.()
      overlay.removeEventListener('mouseup', handleUp)
    }

    overlay.addEventListener('mouseup', handleUp)
  }, [onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="overlay" onMouseDown={handleOverlayMouseDown}>
      <div
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="modal"
        ref={containerRef}
        role="dialog"
      >
        <div className="modal__header">
          <h2 className="modal__title" id={titleId}>{title}</h2>

          <button
            aria-label={t('common.close')}
            className="icon-btn"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        {description ? (
          <p className="modal__description" id={descriptionId}>{description}</p>
        ) : null}

        {children ? <div className="modal__body">{children}</div> : null}

        {footer ? <div className="modal__footer">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
