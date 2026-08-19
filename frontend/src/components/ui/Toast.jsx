import { createPortal } from 'react-dom'

import { t } from '../../i18n/index.js'

/**
 * Zona de avisos.
 *
 * DOS regiones activas separadas, y no una, porque `aria-live` no se puede
 * cambiar sobre la marcha de forma fiable: el lector de pantalla lee el valor
 * que tenía la región al insertarse el contenido. Con dos regiones fijas, cada
 * aviso entra en la que le corresponde (FR-046):
 *
 *   · 'polite'    — éxitos e informativos: esperan a que el usuario termine.
 *   · 'assertive' — errores: interrumpen, porque exigen atención.
 */
export function ToastViewport({ toasts, onDismiss }) {
  const polite = toasts.filter((toast) => toast.tone !== 'error')
  const assertive = toasts.filter((toast) => toast.tone === 'error')

  return createPortal(
    <>
      <div aria-live="polite" className="toast-region" role="status">
        {polite.map((toast) => <Toast key={toast.id} onDismiss={onDismiss} {...toast} />)}
      </div>

      <div aria-live="assertive" className="toast-region" role="alert">
        {assertive.map((toast) => <Toast key={toast.id} onDismiss={onDismiss} {...toast} />)}
      </div>
    </>,
    document.body,
  )
}

function Toast({ id, message, tone, onDismiss }) {
  return (
    <div className={`toast toast--${tone}`}>
      <p className="toast__message">{message}</p>

      <button
        aria-label={t('common.close')}
        className="icon-btn icon-btn--inverse"
        onClick={() => onDismiss(id)}
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  )
}
