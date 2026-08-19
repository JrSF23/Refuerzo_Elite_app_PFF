import { useEffect, useId, useRef, useState } from 'react'

/**
 * Menú desplegable navegable con teclado.
 *
 * Se usa en la cabecera para el menú de la cuenta y en las filas cuando hay más
 * acciones de las que caben.
 *
 * Teclado: Escape cierra y devuelve el foco al disparador; las flechas recorren
 * las opciones; Inicio y Fin saltan a los extremos. Un menú que solo responde al
 * ratón deja fuera a quien navega con teclado, y es un fallo habitual en menús
 * hechos a mano.
 */
export function Dropdown({ trigger, label, children, align = 'end' }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const wrapperRef = useRef(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  // Cierra al pulsar fuera. `mousedown` y no `click`: si se esperara al click,
  // pulsar un control de detrás del menú lo activaría antes de cerrarlo.
  useEffect(() => {
    if (!isOpen) return undefined

    function handlePointerDown(event) {
      if (!wrapperRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [isOpen])

  // Al abrir, el foco va a la primera opción, que es lo que permite recorrer el
  // menú con las flechas sin tener que tabular hasta él.
  useEffect(() => {
    if (!isOpen) return
    menuRef.current?.querySelector('[role="menuitem"]')?.focus()
  }, [isOpen])

  function close({ restoreFocus = true } = {}) {
    setIsOpen(false)
    if (restoreFocus) triggerRef.current?.focus()
  }

  function handleMenuKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
      return
    }

    if (event.key === 'Tab') {
      // Tabular sale del menú: se cierra sin robar el foco, para no interferir
      // con el recorrido normal de la página.
      close({ restoreFocus: false })
      return
    }

    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') ?? [])
    if (items.length === 0) return

    const current = items.indexOf(document.activeElement)

    const target = {
      ArrowDown: items[(current + 1) % items.length],
      ArrowUp: items[(current - 1 + items.length) % items.length],
      Home: items[0],
      End: items[items.length - 1],
    }[event.key]

    if (target) {
      event.preventDefault()
      target.focus()
    }
  }

  return (
    <div className="dropdown" ref={wrapperRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={label}
        className="dropdown__trigger"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        {trigger}
      </button>

      {isOpen ? (
        <div
          className={`dropdown__menu dropdown__menu--${align}`}
          id={menuId}
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      ) : null}
    </div>
  )
}

export function DropdownItem({ onClick, children, tone = 'default' }) {
  return (
    <button
      className={`dropdown__item dropdown__item--${tone}`}
      onClick={onClick}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  )
}
