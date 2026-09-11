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
          const destination = DESTINATION_FOR[item.key]

          // El permiso se comprueba SIEMPRE contra la sección; `path` solo
          // cambia a qué pantalla de esa sección se entra.
          const allowed = destination ? linkTo(destination.section) : undefined
          const base = allowed ? destination.path ?? allowed : undefined

          // Sin permiso de sección `linkTo` devuelve indefinido y el aviso se
          // queda sin enlace: mejor eso que ofrecer una redirección.
          const to = base ? `${base}${destination.query ?? ''}` : undefined

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
 * A qué lleva cada aviso.
 *
 * La acotación va en la URL para que el destino sea ENLAZABLE: el aviso cuenta
 * un problema y el enlace tiene que dejar al usuario delante de él. Enlazar solo
 * a la sección obligaba a buscar a mano lo que el aviso acababa de decir, que es
 * justo lo que la primera regla de arriba dice que no debe pasar.
 *
 * Los dos que todavía no llevan `query` son los que aún no tienen destino
 * acotado en el servidor: `lowAttendance` es hoy un agregado que solo sabe
 * devolver un número, y `groupsSubjectMismatch`, una condición compuesta. Hasta
 * que lo tengan siguen enlazando a su sección, que es mejor que no enlazar.
 *
 * Vive en la interfaz y no en la API a propósito: las rutas son cosa del
 * frontend, y mandarlas desde el servidor obligaría a desplegar backend para
 * cambiar un enlace. El servidor manda la clave y el número; dónde se arregla lo
 * sabe quien dibuja.
 */
const DESTINATION_FOR = {
  pendingPayments: { section: 'payments', query: '?estado=pendiente' },
  /*
   * Va a `/alumnos/todos` y NO a `/alumnos`, que es el índice de AULAS. Mandarlo
   * a la sección dejaría al administrador delante de una lista de aulas para
   * buscar dentro de ellas a los alumnos de los que acaba de avisarse — que es
   * el defecto que esto arregla, servido con otro disfraz.
   */
  lowAttendance: { section: 'students', path: '/alumnos/todos', query: '?asistencia=baja' },
  groupsWithoutTeacher: { section: 'classGroups', query: '?profesor=sin-asignar' },
  groupsSubjectMismatch: { section: 'classGroups', query: '?profesor=descuadrado' },
}
