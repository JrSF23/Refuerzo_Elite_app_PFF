import { t } from '../../i18n/index.js'
import { Button } from '../ui/Button.jsx'
import { Modal } from '../ui/Modal.jsx'

/**
 * Confirmación de acción destructiva (FR-035).
 *
 * NOMBRA lo que se va a eliminar. Un «¿Está seguro?» sin sujeto obliga al usuario
 * a recordar sobre qué fila pulsó, y es justo cuando se borra el registro
 * equivocado.
 *
 * La acción de confirmar es `danger` y NO recibe el foco inicial: el foco va al
 * primer enfocable, que es cancelar, de modo que un Enter reflejo no destruya
 * nada.
 */
export function ConfirmDialog({
  isOpen,
  name,
  title,
  body,
  confirmLabel,
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      description={body ?? t('common.deleteBody', { name })}
      footer={(
        <>
          <Button disabled={isBusy} onClick={onCancel}>
            {t('common.cancel')}
          </Button>

          <Button isLoading={isBusy} onClick={onConfirm} variant="danger">
            {confirmLabel ?? t('common.delete')}
          </Button>
        </>
      )}
      isOpen={isOpen}
      onClose={isBusy ? undefined : onCancel}
      title={title ?? t('common.deleteTitle', { name })}
    />
  )
}
