import { t } from '../../i18n/index.js'

/**
 * Evolución de la asistencia de lunes a viernes.
 *
 * SVG a mano y sin librería de gráficos. Son cinco puntos: traer un motor de
 * gráficos entero para dibujar cuatro segmentos añadiría cientos de kilobytes al
 * paquete y una dependencia que mantener, a cambio de nada que no quepa en
 * treinta líneas.
 *
 * ── Lo que NO se dibuja ─────────────────────────────────────────────────────
 *
 * Un día sin registros vale `null`, no cero, y se salta: la línea se corta y el
 * punto no aparece. Cero por ciento significa «no vino nadie»; nulo significa
 * «no hubo clase». Pintarlos igual convertiría un puente en un desplome, que es
 * justo la lectura equivocada en el dato que se mira primero.
 *
 * ── Accesibilidad ───────────────────────────────────────────────────────────
 *
 * El gráfico es decorativo por definición: los mismos números están en el
 * titular, en el desglose y en la tabla que lo acompaña para lectores de
 * pantalla. Por eso va `aria-hidden` y la información real viaja en texto.
 */
export function AttendanceTrend({ points }) {
  const withData = points.filter((point) => point.rate !== null)

  if (withData.length === 0) {
    return <p className="trend__empty">{t('dashboard.attendance.noTrend')}</p>
  }

  // El eje vertical NO arranca en cero. Entre 85 % y 95 % de asistencia hay una
  // diferencia que importa, y sobre una escala de 0 a 100 esa diferencia es una
  // línea plana. Se encuadra el rango real con un margen, de modo que la forma
  // signifique algo; el titular en grande evita que la escala engañe.
  const values = withData.map((point) => point.rate)
  const min = Math.max(0, Math.min(...values) - 5)
  const max = Math.min(100, Math.max(...values) + 5)
  const span = max - min || 1

  const width = 100
  const height = 36

  const coords = points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? width / 2 : (index / (points.length - 1)) * width,
    y: point.rate === null ? null : height - ((point.rate - min) / span) * height,
  }))

  // Se parte en tramos continuos: un hueco no se cose con una recta que no
  // representa ninguna medición.
  const segments = []
  let current = []

  for (const point of coords) {
    if (point.y === null) {
      if (current.length > 1) segments.push(current)
      current = []
    } else {
      current.push(point)
    }
  }

  if (current.length > 1) segments.push(current)

  return (
    <div className="trend">
      <svg
        aria-hidden="true"
        className="trend__chart"
        preserveAspectRatio="none"
        viewBox={`0 0 ${width} ${height}`}
      >
        {segments.map((segment) => (
          <polyline
            className="trend__line"
            key={`${segment[0].day}-${segment.length}`}
            points={segment.map((point) => `${point.x},${point.y}`).join(' ')}
          />
        ))}

        {coords
          .filter((point) => point.y !== null)
          .map((point) => (
            <circle className="trend__dot" cx={point.x} cy={point.y} key={point.day} r="1.6" />
          ))}
      </svg>

      <ol className="trend__axis">
        {coords.map((point) => (
          <li className="trend__tick" key={point.day}>
            {t(`dashboard.attendance.days.${point.day}`)}
          </li>
        ))}
      </ol>
    </div>
  )
}
