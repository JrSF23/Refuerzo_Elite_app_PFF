import { Link } from 'react-router-dom'

import { formatNumber, t } from '../../i18n/index.js'
import { Card, CardHeader } from '../ui/Card.jsx'

/**
 * Requiere atención.
 *
 * La parte del panel que lo convierte en un centro de control y no en un
 * escaparate: no dice cómo va el centro, dice qué hay que hacer hoy.
 *
 * Tres reglas que se sostienen entre sí:
 *
 * - **Cada aviso lleva su acción.** Un aviso sin destino obliga a buscar a mano
 *   dónde se arregla lo que acaba de leer, y entonces deja de usarse.
 * - **Solo aparece lo que tiene algo que atender.** El servidor ya filtra los
 *   recuentos a cero: «0 pagos pendientes» es ruido con aspecto de aviso.
 * - **El color no es el mensaje.** El icono va con `aria-hidden` y el texto dice
 *   entero lo que pasa, de modo que la tarjeta se lee igual en escala de grises
 *   o con daltonismo. El ámbar acompaña; no informa por su cuenta.
 *
 * Cuando no hay nada pendiente la sección NO se dibuja vacía ni con un «todo en
 * orden» que ocuparía sitio permanente. Simplemente no está.
 */
export function AttentionPanel({ items, linkTo }) {
  if (items.length === 0) {
    return null
  }

  return (
    <Card as="section" className="attention">
      <CardHeader title={t('dashboard.attention.title')} />

      <ul className="attention__list">
        {items.map((item) => {
          const to = linkTo(SECTION_FOR[item.key])

          return (
            <li className="attention__row" key={item.key}>
              <span aria-hidden="true" className="attention__icon">!</span>

              <span className="attention__text">
                {t(`dashboard.attention.${item.key}`, { count: formatNumber(item.count) })}
              </span>

              {to ? (
                <Link className="attention__action" to={to}>
                  {t('common.view')}
                  <span aria-hidden="true"> →</span>
                </Link>
              ) : null}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

/**
 * A qué sección lleva cada aviso.
 *
 * Vive en la interfaz y no en la API a propósito: las rutas son cosa del
 * frontend, y mandarlas desde el servidor obligaría a desplegar backend para
 * cambiar un enlace. El servidor manda la clave y el número; dónde se arregla lo
 * sabe quien dibuja.
 */
const SECTION_FOR = {
  pendingPayments: 'payments',
  lowAttendance: 'attendance',
  groupsWithoutTeacher: 'classGroups',
  groupsSubjectMismatch: 'classGroups',
}
