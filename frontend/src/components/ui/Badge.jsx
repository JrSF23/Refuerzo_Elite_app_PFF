import { t } from '../../i18n/index.js'

/**
 * Distintivo de estado.
 *
 * SIEMPRE con texto (FR-051). Un distintivo rojo sin la palabra «Anulado» no
 * transmite nada a quien no distingue colores, y es lo primero que falla una
 * auditoría de accesibilidad.
 *
 * El texto usa la variante `-text` de cada estado sobre su fondo suave, no el
 * color puro: medido, ni éxito ni aviso ni información alcanzan 4,5:1 sobre
 * blanco. Ver design-system.md §1.
 */
export function Badge({ tone = 'neutral', children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>
}

/* ── Correspondencias de estado ───────────────────────────────────────────────
   Las claves son los valores que devuelve la API y NO se traducen: son contrato.
   Solo se traduce lo que se muestra.
   ───────────────────────────────────────────────────────────────────────────── */

const RECORD_TONES = { active: 'success', inactive: 'neutral' }

/**
 * La falta JUSTIFICADA va en neutro, no en rojo: el centro sabe por qué faltó y
 * no hay nada que atender. Gastar el rojo en ella lo volvería invisible en la
 * ausencia que sí lo necesita.
 */
const ATTENDANCE_TONES = { present: 'success', late: 'warning', absent: 'error', excused: 'neutral' }

/**
 * Un pago anulado va en tono NEUTRO, no de error: es un estado administrativo
 * legítimo, no un fallo. El rojo se reserva a lo que exige atención, y gastarlo
 * en lo rutinario lo vuelve invisible cuando de verdad hace falta.
 */
const PAYMENT_TONES = { paid: 'success', pending: 'warning', cancelled: 'neutral' }

const ORGANIZATION_TONES = { active: 'success', suspended: 'error' }

/**
 * Pendiente va en NEUTRO, no en ámbar: una sesión que aún no se ha dado no exige
 * atención, es el estado normal de todo lo que está por venir. Reservar el ámbar
 * para lo rutinario lo vuelve invisible cuando algo sí lo necesita.
 */
const SESSION_TONES = { taught: 'success', pending: 'neutral' }

function statusBadge(map, catalog) {
  return function StatusBadge({ value }) {
    if (!value) return <span className="text-muted">{t('common.emptyValue')}</span>

    return <Badge tone={map[value] ?? 'neutral'}>{t(`${catalog}.${value}`)}</Badge>
  }
}

export const RecordStatusBadge = statusBadge(RECORD_TONES, 'status')
export const AttendanceStatusBadge = statusBadge(ATTENDANCE_TONES, 'attendanceStatus')
export const PaymentStatusBadge = statusBadge(PAYMENT_TONES, 'paymentStatus')
export const OrganizationStatusBadge = statusBadge(ORGANIZATION_TONES, 'status')
export const SessionStatusBadge = statusBadge(SESSION_TONES, 'sessionStatus')
