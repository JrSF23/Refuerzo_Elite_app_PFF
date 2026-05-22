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

const attendanceLabels = { present: 'Présent', absent: 'Absent', late: 'En retard' }
const attendanceBadge = { present: 'badge-ok', absent: 'badge-danger', late: 'badge-warn' }

// ── Admin dashboard ──────────────────────────────────────────────────────────

const adminStatLabels = {
  students: 'Élèves', teachers: 'Enseignants', groups: 'Groupes',
  attendances: 'Présences', payments: 'Paiements',
}

const paymentStatusLabels = { paid: 'Payé', pending: 'En attente', cancelled: 'Annulé' }
const paymentStatusBadge = { paid: 'badge-ok', pending: 'badge-warn', cancelled: 'badge-danger' }

function AdminDashboard({ data, user, roleNames }) {
  return (
    <div>
      <section className="dashboard-hero">
        <div className="hero-grid">
          <div className="hero-stack">
            <div className="hero-chip">Pilotage du centre</div>
            <h1 className="hero-title">Une administration claire et maîtrisable.</h1>
            <p className="hero-copy">
              Vue d'ensemble du centre : élèves, groupes, séances, présences et paiements.
            </p>
          </div>
          <div className="hero-sidecard">
            <div className="section-label">Profil connecté</div>
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
              <div className="section-label">Élèves récents</div>
              <h2>Dernières inscriptions</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/students">Voir tout</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Élève</th><th>Responsable</th><th>Niveau</th></tr></thead>
              <tbody>
                {data.recentStudents.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>Aucun enregistrement récent.</td></tr>
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
              <div className="section-label">Séances récentes</div>
              <h2>Planning du centre</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/classSessions">Voir tout</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Séance</th><th>Groupe</th><th>Date</th></tr></thead>
              <tbody>
                {data.recentSessions.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>Aucune séance récente.</td></tr>
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
              <div className="section-label">Paiements récents</div>
              <h2>Suivi financier</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/payments">Voir tout</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Élève</th><th>Période</th><th>Statut</th></tr></thead>
              <tbody>
                {data.recentPayments.length === 0
                  ? <tr><td className="empty-state" colSpan={3}>Aucun paiement récent.</td></tr>
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
    groups: 'Mes groupes', students: 'Mes élèves', upcoming_sessions: 'Séances à venir',
  }

  return (
    <div>
      <section className="dashboard-hero">
        <div className="hero-grid">
          <div className="hero-stack">
            <div className="hero-chip">Espace enseignant</div>
            <h1 className="hero-title">
              {teacher ? `Bienvenue, ${teacher.first_name}.` : `Bienvenue, ${user?.name}.`}
            </h1>
            <p className="hero-copy">
              {teacher?.specialty
                ? `Spécialité : ${teacher.specialty}. Retrouvez vos groupes, séances à venir et le suivi des présences.`
                : 'Retrouvez vos groupes, séances à venir et le suivi des présences de vos élèves.'}
            </p>
          </div>
          <div className="hero-sidecard">
            <div className="section-label">Profil connecté</div>
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
          Votre compte utilisateur n'est pas encore associé à un profil enseignant.
          Contactez l'administration pour lier votre compte.
        </div>
      )}

      <section className="cards-grid">
        {/* Mis grupos */}
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Mes groupes</div>
              <h2>Groupes assignés</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/classGroups">Voir tout</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Groupe</th><th>Matière</th><th>Horaire</th><th>Statut</th></tr></thead>
              <tbody>
                {data.myGroups.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>Aucun groupe assigné.</td></tr>
                  : data.myGroups.map((g) => (
                    <tr key={g.id}>
                      <td><strong>{g.name}</strong></td>
                      <td>{g.subject?.name || '—'}</td>
                      <td className="hint">{g.schedule || '—'}</td>
                      <td>
                        <span className={`badge ${g.status === 'active' ? 'badge-ok' : 'badge-muted'}`}>
                          {g.status === 'active' ? 'Actif' : 'Inactif'}
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
              <div className="section-label">Séances à venir</div>
              <h2>Mon planning</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/classSessions">Nouvelle séance</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Séance</th><th>Groupe</th><th>Date</th><th>Heure</th></tr></thead>
              <tbody>
                {data.upcomingSessions.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>Aucune séance à venir.</td></tr>
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
              <div className="section-label">Présences récentes</div>
              <h2>Suivi des élèves</h2>
            </div>
            <Link className="ghost-btn link-btn" to="/espace/module/attendances">Saisir présences</Link>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Élève</th><th>Séance</th><th>Groupe</th><th>Statut</th></tr></thead>
              <tbody>
                {data.recentAttendances.length === 0
                  ? <tr><td className="empty-state" colSpan={4}>Aucune présence enregistrée.</td></tr>
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
      .catch(() => setLoadError('Impossible de charger le tableau de bord. Veuillez recharger la page.'))
  }, [])

  if (loadError) {
    return <div className="error-banner" style={{ margin: '24px' }}>{loadError}</div>
  }

  if (!data) {
    return <div className="panel-empty">Chargement du tableau de bord...</div>
  }

  if (data.role === 'teacher') {
    return <TeacherDashboard data={data} roleNames={roleNames} user={user} />
  }

  return <AdminDashboard data={data} roleNames={roleNames} user={user} />
}
