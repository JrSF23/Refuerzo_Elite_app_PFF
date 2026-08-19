import { EMPTY_VALUE, formatAmount, formatDate, formatTime, t } from '../i18n/index.js'
import { useSession } from '../context/SessionContext.jsx'
import { useDashboard } from '../hooks/useDashboard.js'
import { SECTIONS, canAccess } from '../lib/permissions.js'
import { StatCard } from '../components/dashboard/StatCard.jsx'
import { RecentPanel } from '../components/dashboard/RecentPanel.jsx'
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
  const { roleNames } = useSession()

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
      <h1 className="page-title">{t('dashboard.title')}</h1>

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

/* ── Administración ────────────────────────────────────────────────────────── */

function AdminDashboard({ data, linkTo }) {
  const { stats, recentStudents, recentSessions, recentPayments } = data

  return (
    <>
      <section className="stats-grid">
        <StatCard label={t('dashboard.stats.students')} to={linkTo('students')} value={stats.students} />
        <StatCard label={t('dashboard.stats.teachers')} to={linkTo('teachers')} value={stats.teachers} />
        <StatCard label={t('dashboard.stats.groups')} to={linkTo('classGroups')} value={stats.groups} />
        <StatCard label={t('dashboard.stats.attendances')} to={linkTo('attendance')} value={stats.attendances} />
        <StatCard label={t('dashboard.stats.payments')} to={linkTo('payments')} value={stats.payments} />
      </section>

      <section className="panels-grid">
        <RecentPanel
          emptyText={t('dashboard.emptyStudents')}
          items={recentStudents.map((student) => ({
            key: student.id,
            primary: student.full_name,
            secondary: student.guardian?.full_name ?? t('dashboard.noGuardian'),
            trailing: <RecordStatusBadge value={student.status} />,
          }))}
          title={t('dashboard.recentStudents')}
          to={linkTo('students')}
        />

        <RecentPanel
          emptyText={t('dashboard.emptySessions')}
          items={recentSessions.map((session) => ({
            key: session.id,
            primary: session.title,
            secondary: [
              session.class_group?.name,
              formatDate(session.session_date),
            ].filter(Boolean).join(' · '),
          }))}
          title={t('dashboard.recentSessions')}
          to={linkTo('sessions')}
        />

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
