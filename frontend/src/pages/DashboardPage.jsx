import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { roleLabels } from '../config/modules'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'

function formatDate(value) {
  if (!value) return '-'
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatTime(value) {
  if (!value) return ''
  return value.slice(0, 5)
}

const attendanceLabels = { present: 'Presente', absent: 'Ausente', late: 'Con retraso' }
const attendanceBadge = { present: 'badge-ok', absent: 'badge-danger', late: 'badge-warn' }

// ── Admin dashboard ──────────────────────────────────────────────────────────

const adminStatLabels = {
  students: 'Alumnos', teachers: 'Profesores', groups: 'Grupos',
  attendances: 'Asistencia', payments: 'Pagos',
}

const paymentStatusLabels = { paid: 'Pagado', pending: 'Pendiente', cancelled: 'Anulado' }
const paymentStatusBadge = { paid: 'badge-ok', pending: 'badge-warn', cancelled: 'badge-danger' }

function AdminDashboard({ data, user, roleNames }) {
  return (
    <div>
      <section className="dashboard-hero">
        <div className="hero-grid">
          <div className="hero-stack">
            <div className="hero-chip">Gestión del centro</div>
            <h1 className="hero-title">Una administración clara y manejable.</h1>
            <p className="hero-copy">
              Visión general del centro: alumnos, grupos, sesiones, asistencia y pagos.
            </p>
          </div>
          <div className="hero-sidecard">
            <div className="section-label">Perfil conectado</div>
            <p>{user?.name}</p>
            <p className="hint">{roleNames.map((r) => roleLabels[r] ?? r).join(', ')}</p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {Object.entries(data.stats).map(([key, value]) => (
          <article className="stat-card" key={key}>
            <div className="stat-label">{adminStatLabels[key] ?? key}</div>
            <div className="stat-value">{value}</div>
          </article>
        ))}
      </section>

      <section className="cards-grid">
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Alumnos recientes</div>
              <h2>Últimas altas</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/students">Ver todo</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Alumno</th><th>Tutor</th><th>Nivel</th></tr></thead>
              <tbody>
                {data.recentStudents.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>No hay registros recientes.</td></tr>
                  : data.recentStudents.map((s) => (
                    <tr key={s.id}>
                      <td>{s.full_name}</td>
                      <td>{s.guardian?.full_name || '—'}</td>
                      <td>{s.school_level || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Sesiones recientes</div>
              <h2>Agenda del centro</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/classSessions">Ver todo</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sesión</th><th>Grupo</th><th>Fecha</th></tr></thead>
              <tbody>
                {data.recentSessions.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>No hay sesiones recientes.</td></tr>
                  : data.recentSessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>{s.class_group?.name || '—'}</td>
                      <td>{formatDate(s.session_date)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Pagos recientes</div>
              <h2>Seguimiento económico</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/payments">Ver todo</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Alumno</th><th>Periodo</th><th>Estado</th></tr></thead>
              <tbody>
                {data.recentPayments.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>No hay pagos recientes.</td></tr>
                  : data.recentPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.student?.full_name || '—'}</td>
                      <td>{p.period_label}</td>
                      <td><span className={`badge ${paymentStatusBadge[p.status] ?? ''}`}>{paymentStatusLabels[p.status] ?? p.status}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  )
}

// ── Teacher dashboard ────────────────────────────────────────────────────────

function TeacherDashboard({ data, user, roleNames }) {
  const teacher = data.teacher
  const teacherStatLabels = {
    groups: 'Mis grupos', students: 'Mis alumnos', upcoming_sessions: 'Próximas sesiones',
  }

  return (
    <div>
      <section className="dashboard-hero">
        <div className="hero-grid">
          <div className="hero-stack">
            <div className="hero-chip">Espacio del profesor</div>
            <h1 className="hero-title">
              {teacher ? `Bienvenido/a, ${teacher.first_name}.` : `Bienvenido/a, ${user?.name}.`}
            </h1>
            <p className="hero-copy">
              {teacher?.specialty
                ? `Especialidad: ${teacher.specialty}. Consulte sus grupos, las próximas sesiones y el seguimiento de la asistencia.`
                : 'Consulte sus grupos, las próximas sesiones y el seguimiento de la asistencia de sus alumnos.'}
            </p>
          </div>
          <div className="hero-sidecard">
            <div className="section-label">Perfil conectado</div>
            <p>{user?.name}</p>
            <p className="hint">{roleNames.map((r) => roleLabels[r] ?? r).join(', ')}</p>
            {teacher?.specialty && <p className="hint" style={{ marginTop: 4 }}>{teacher.specialty}</p>}
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {Object.entries(data.stats).map(([key, value]) => (
          <article className="stat-card" key={key}>
            <div className="stat-label">{teacherStatLabels[key] ?? key}</div>
            <div className="stat-value">{value}</div>
          </article>
        ))}
      </section>

      {!teacher && (
        <div className="notice-banner" style={{ margin: '0 0 24px' }}>
          Su cuenta de usuario todavía no está asociada a una ficha de profesor.
          Póngase en contacto con la administración para vincularla.
        </div>
      )}

      <section className="cards-grid">
        {/* Mis grupos */}
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Mis grupos</div>
              <h2>Grupos asignados</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/classGroups">Ver todo</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Grupo</th><th>Asignatura</th><th>Horario</th><th>Estado</th></tr></thead>
              <tbody>
                {data.myGroups.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>No tiene ningún grupo asignado.</td></tr>
                  : data.myGroups.map((g) => (
                    <tr key={g.id}>
                      <td><strong>{g.name}</strong></td>
                      <td>{g.subject?.name || '—'}</td>
                      <td className="hint">{g.schedule || '—'}</td>
                      <td>
                        <span className={`badge ${g.status === 'active' ? 'badge-ok' : 'badge-muted'}`}>
                          {g.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Próximas sesiones */}
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Próximas sesiones</div>
              <h2>Mi agenda</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/classSessions">Nueva sesión</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Sesión</th><th>Grupo</th><th>Fecha</th><th>Hora</th></tr></thead>
              <tbody>
                {data.upcomingSessions.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>No hay próximas sesiones.</td></tr>
                  : data.upcomingSessions.map((s) => (
                    <tr key={s.id}>
                      <td>{s.title}</td>
                      <td>{s.class_group?.name || '—'}</td>
                      <td>{formatDate(s.session_date)}</td>
                      <td className="hint">
                        {s.starts_at ? `${formatTime(s.starts_at)}${s.ends_at ? ` – ${formatTime(s.ends_at)}` : ''}` : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>

        {/* Asistencias recientes */}
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Asistencia reciente</div>
              <h2>Seguimiento de los alumnos</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espacio/modulo/attendances">Registrar asistencia</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Alumno</th><th>Sesión</th><th>Grupo</th><th>Estado</th></tr></thead>
              <tbody>
                {data.recentAttendances.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>No hay asistencia registrada.</td></tr>
                  : data.recentAttendances.map((a) => (
                    <tr key={a.id}>
                      <td>{a.student?.full_name || '—'}</td>
                      <td className="hint">{a.class_session?.title || '—'}</td>
                      <td className="hint">{a.class_session?.class_group?.name || '—'}</td>
                      <td>
                        <span className={`badge ${attendanceBadge[a.status] ?? ''}`}>
                          {attendanceLabels[a.status] ?? a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </div>
  )
}

// ── Entry point ───────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { roleNames, user } = useSession()
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data: payload }) => setData(payload))
      .catch(() => setLoadError('No se ha podido cargar el panel. Vuelva a cargar la página.'))
  }, [])

  if (loadError) {
    return <div className="error-banner" style={{ margin: '24px' }}>{loadError}</div>
  }

  if (!data) {
    return <div className="panel-empty">Cargando el panel...</div>
  }

  if (data.role === 'teacher') {
    return <TeacherDashboard data={data} roleNames={roleNames} user={user} />
  }

  return <AdminDashboard data={data} roleNames={roleNames} user={user} />
}
