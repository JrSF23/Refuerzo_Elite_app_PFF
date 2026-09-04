import { EMPTY_VALUE, formatAmount, formatDate, formatNumber, formatTime, t } from '../i18n/index.js'
import { useSession } from '../context/SessionContext.jsx'
import { useDashboard } from '../hooks/useDashboard.js'
import { SECTIONS, canAccess } from '../lib/permissions.js'
import { StatCard } from '../components/dashboard/StatCard.jsx'
import { RecentPanel } from '../components/dashboard/RecentPanel.jsx'
import { AttendanceCard } from '../components/dashboard/AttendanceCard.jsx'
import { AttentionPanel } from '../components/dashboard/AttentionPanel.jsx'
import {
  AttendanceStatusBadge,
  PaymentStatusBadge,
  RecordStatusBadge,
} from '../components/ui/Badge.jsx'
import { ErrorState, LoadingState } from '../components/data/states.jsx'

/**
 * Panel operativo.
 *
 * Dos variantes desde el mismo endpoint. La elección la hace el campo `role` de
 * la respuesta y no los roles del usuario (FR-016): una cuenta puede tener
 * varios roles, y quien decide qué conjunto de datos ha construido es el
 * servidor.
 */
export function DashboardPage() {
  const { status, data, error, retry } = useDashboard()
  const { roleNames, user } = useSession()

  // Un indicador solo enlaza si el rol puede entrar en la sección; si no, sería
  // un enlace que acaba en redirección (FR-017).
  const linkTo = (key) => (canAccess(key, roleNames) ? SECTIONS[key].path : undefined)

  // Se decide sobre UN solo estado, no encadenando comprobaciones de tres
  // valores sueltos. La versión anterior preguntaba `if (isLoading)` y luego
  // `if (error)`, y una combinación que no debía existir —ni cargando, ni
  // error, ni datos— se colaba hasta `data.role` sobre un `null`. Con este
  // `switch` no hay hueco por donde pasar: los datos solo se leen en 'ready'.
  return (
    <>
      {/* Saludo en vez de «Panel». El rótulo de la sección ya está en la barra
          lateral, así que repetirlo aquí gasta el encabezado de nivel 1 —el
          primero que anuncia un lector de pantalla— en decir dónde estás, que ya
          sabías. Corto a propósito: nadie lee «aquí tienes el resumen de tu
          centro» dos veces. */}
      <h1 className="page-title page-title--greeting">
        {t(greetingKey(), { name: user?.name ?? '' })}
      </h1>

      {status === 'loading' ? <LoadingState rows={4} /> : null}

      {status === 'error' ? (
        <ErrorState message={error?.message} onRetry={retry} />
      ) : null}

      {status === 'ready' ? (
        data.role === 'teacher'
          ? <TeacherDashboard data={data} linkTo={linkTo} />
          : <AdminDashboard data={data} linkTo={linkTo} />
      ) : null}
    </>
  )
}

/**
 * Saludo según la hora del reloj de quien mira.
 *
 * Se resuelve en el cliente y no en el servidor a propósito: la hora que importa
 * es la de la persona que tiene la pantalla delante, no la del contenedor.
 */
function greetingKey() {
  const hour = new Date().getHours()

  if (hour < 13) return 'dashboard.greetingMorning'
  if (hour < 21) return 'dashboard.greetingAfternoon'

  return 'dashboard.greetingEvening'
}

/* ── Administración ────────────────────────────────────────────────────────── */

function AdminDashboard({ data, linkTo }) {
  const { stats, attendance, recentPayments, attentionItems } = data

  return (
    <>
      {/* DATOS → CONTEXTO → ALERTAS → ACCIÓN.
          La fila de indicadores da el estado general; la banda central, el
          detalle de lo que se mira a diario; y «Requiere atención» cierra con lo
          único que exige una decisión hoy. Va la última y no la primera a
          propósito: se lee después de saber cómo está el centro, no antes. */}
      <section className="stats-grid">
        <StatCard
          label={t('dashboard.stats.students')}
          to={linkTo('students')}
          value={formatNumber(stats.students)}
        />
        <StatCard
          label={t('dashboard.stats.teachers')}
          to={linkTo('teachers')}
          value={formatNumber(stats.teachers)}
        />
        <StatCard
          label={t('dashboard.stats.groups')}
          to={linkTo('classGroups')}
          value={formatNumber(stats.groups)}
        />
        {/* Un PORCENTAJE, no el recuento de registros. «24.318 registros de
            asistencia» es una medida del tamaño de la base de datos, no del
            centro: no se puede saber si es buena o mala cifra. */}
        <StatCard
          label={t('dashboard.stats.attendanceRate')}
          to={linkTo('attendance')}
          value={attendance.rate === null
            ? EMPTY_VALUE
            : `${formatNumber(attendance.rate, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`}
        />
        {/* Pagos PENDIENTES, no pagos totales. El total es historia; lo
            pendiente es trabajo. */}
        <StatCard
          hint={stats.pending_payments > 0 ? t('dashboard.stats.needsAttention') : undefined}
          label={t('dashboard.stats.pendingPayments')}
          to={linkTo('payments')}
          tone={stats.pending_payments > 0 ? 'warn' : undefined}
          value={formatNumber(stats.pending_payments)}
        />
      </section>

      <section className="dashboard-grid">
        <AttendanceCard attendance={attendance} to={linkTo('attendance')} />

        <RecentPanel
          emptyText={t('dashboard.emptyPayments')}
          items={recentPayments.map((payment) => ({
            key: payment.id,
            primary: payment.student?.full_name ?? EMPTY_VALUE,
            secondary: payment.period_label,
            // El importe es el dato que se busca en un panel de cobros, así que
            // va junto al estado y no escondido en la línea secundaria. Con
            // separador de millar y dos decimales, nunca como número desnudo
            // (SC-010).
            trailing: (
              <div className="recent__amount">
                <span className="tabular">{formatAmount(payment.amount)}</span>
                <PaymentStatusBadge value={payment.status} />
              </div>
            ),
          }))}
          title={t('dashboard.recentPayments')}
          to={linkTo('payments')}
        />
      </section>

      <AttentionPanel items={attentionItems} linkTo={linkTo} />
    </>
  )
}

/* ── Profesor ──────────────────────────────────────────────────────────────── */

function TeacherDashboard({ data, linkTo }) {
  const { teacher, stats, myGroups, upcomingSessions, recentAttendances } = data

  return (
    <>
      {/* Una cuenta de profesor sin ficha vinculada recibe TODO vacío por
          diseño del servidor. Sin este aviso, la pantalla es indistinguible de
          un centro sin datos y la persona no sabe que hay algo que arreglar
          ni a quién dirigirse (US2.3). */}
      {teacher === null ? (
        <div className="alert alert--warn" role="status">
          <strong>{t('dashboard.teacherUnlinkedTitle')}</strong>
          <p>{t('dashboard.teacherUnlinkedBody')}</p>
        </div>
      ) : null}

      <section className="stats-grid">
        <StatCard label={t('dashboard.stats.myGroups')} to={linkTo('classGroups')} value={stats.groups} />
        <StatCard label={t('dashboard.stats.myStudents')} to={linkTo('students')} value={stats.students} />
        <StatCard label={t('dashboard.stats.upcomingSessions')} to={linkTo('sessions')} value={stats.upcoming_sessions} />
      </section>

      <section className="panels-grid">
        <RecentPanel
          emptyText={t('dashboard.emptyGroups')}
          items={myGroups.map((group) => ({
            key: group.id,
            primary: group.name,
            secondary: [group.subject?.name, group.schedule].filter(Boolean).join(' · '),
            trailing: <RecordStatusBadge value={group.status} />,
          }))}
          title={t('dashboard.myGroups')}
          to={linkTo('classGroups')}
        />

        <RecentPanel
          emptyText={t('dashboard.emptyUpcoming')}
          items={upcomingSessions.map((session) => ({
            key: session.id,
            primary: session.title,
            secondary: [
              session.class_group?.name,
              formatDate(session.session_date),
              session.starts_at ? formatTime(session.starts_at) : null,
            ].filter((part) => part && part !== EMPTY_VALUE).join(' · '),
          }))}
          title={t('dashboard.upcomingSessions')}
          to={linkTo('sessions')}
        />

        <RecentPanel
          emptyText={t('dashboard.emptyAttendances')}
          items={recentAttendances.map((attendance) => ({
            key: attendance.id,
            primary: attendance.student?.full_name ?? EMPTY_VALUE,
            secondary: [
              attendance.class_session?.title,
              attendance.class_session?.class_group?.name,
            ].filter(Boolean).join(' · '),
            trailing: <AttendanceStatusBadge value={attendance.status} />,
          }))}
          title={t('dashboard.recentAttendances')}
          to={linkTo('attendance')}
        />
      </section>
    </>
  )
}
