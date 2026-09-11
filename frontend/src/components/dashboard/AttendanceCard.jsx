import { Link } from 'react-router-dom'

import { EMPTY_VALUE, formatNumber, t } from '../../i18n/index.js'
import { Card, CardHeader } from '../ui/Card.jsx'
import { AttendanceTrend } from './AttendanceTrend.jsx'

/**
 * Asistencia: el estado del centro en un número, su dirección y su detalle.
 *
 * Ocupa el sitio que tenía «Últimas sesiones». La diferencia no es de forma sino
 * de propósito: una lista de las cinco últimas sesiones no contesta a ninguna
 * pregunta que un administrador se haga —para eso está el módulo de Sesiones—,
 * mientras que esta tarjeta contesta a tres seguidas: cómo va, si mejora o
 * empeora, y si hay algo que mirar.
 *
 * El orden de lectura es deliberado: primero el número grande, después hacia
 * dónde va, después la forma de la semana, y solo al final el desglose. Quien
 * tiene diez segundos se queda en las dos primeras líneas y ya sabe lo que
 * necesita.
 */
export function AttendanceCard({ attendance, to }) {
  const { rate, delta, trend, breakdown } = attendance

  return (
    <Card as="section" className="attendance-card">
      <CardHeader
        actions={to ? (
          <Link className="btn btn--ghost btn--sm" to={to}>{t('common.viewAll')}</Link>
        ) : null}
        title={t('dashboard.attendance.title')}
      />

      <p className="attendance-card__rate tabular">
        {rate === null ? EMPTY_VALUE : `${formatNumber(rate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
      </p>

      <Delta value={delta} />

      <AttendanceTrend points={trend} />

      {/* Los mismos números del gráfico, en texto. No es una repetición
          decorativa: el gráfico va `aria-hidden`, así que esta lista ES la
          versión accesible, y de paso da la cifra exacta que una línea no puede
          dar. */}
      <dl className="attendance-card__breakdown">
        {breakdown.map((entry) => (
          <div className="attendance-card__entry" key={entry.status}>
            <dt>{t(`attendanceStatus.${entry.status}`)}</dt>
            <dd className="tabular">{formatNumber(entry.share, { maximumFractionDigits: 1 })}%</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

/**
 * Variación respecto a la semana anterior.
 *
 * La flecha va con `aria-hidden` y la dirección se dice con palabras, porque un
 * lector de pantalla que anuncia «flecha arriba tres coma dos» no comunica nada.
 * El signo tampoco basta: el color y la flecha acompañan, el texto informa.
 *
 * Sin dato —una semana sin registros con la que comparar— no se dibuja nada. Un
 * «0 %» inventado diría que la asistencia se mantiene igual, que es una
 * afirmación sobre el centro que nadie ha medido.
 */
function Delta({ value }) {
  if (value === null || value === undefined) {
    return null
  }

  const direction = value > 0 ? 'up' : value < 0 ? 'down' : 'flat'
  const arrow = { up: '↑', down: '↓', flat: '→' }[direction]

  return (
    <p className={`attendance-card__delta attendance-card__delta--${direction}`}>
      <span aria-hidden="true">{arrow} </span>
      {t(`dashboard.attendance.delta.${direction}`, {
        value: formatNumber(Math.abs(value), { maximumFractionDigits: 1 }),
      })}
    </p>
  )
}
