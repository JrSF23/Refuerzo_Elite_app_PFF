import { useEffect, useState } from 'react'
import { roleLabels } from '../config/modules'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'

const statLabels = {
  students: 'Eleves',
  teachers: 'Enseignants',
  groups: 'Groupes',
  attendances: 'Presences',
  payments: 'Paiements',
}

function formatDate(value) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function DashboardPage() {
  const { hasAnyRole, roleNames, user } = useSession()
  const [data, setData] = useState(null)
  const isAdmin = hasAnyRole(['admin'])

  useEffect(() => {
    api.get('/dashboard').then(({ data: payload }) => setData(payload))
  }, [])

  if (!data) {
    return <div className="panel-empty">Chargement du tableau de bord...</div>
  }

  return (
    <div>
      <section className="dashboard-hero">
        <div className="hero-grid">
          <div className="hero-stack">
            <div className="hero-chip">{isAdmin ? 'Pilotage du centre' : 'Suivi pedagogique'}</div>
            <h1 className="hero-title">{isAdmin ? 'Une administration claire et maitrisable.' : 'Un espace de suivi simple pour les enseignants.'}</h1>
            <p className="hero-copy">
              Cette interface reprend les codes du centre historique et concentre les informations utiles pour suivre
              les eleves, les groupes, les seances et l activite quotidienne.
            </p>
          </div>

          <div className="hero-sidecard">
            <div className="section-label">Profil connecte</div>
            <p>{user?.name}</p>
            <p className="hint">{roleNames.map((role) => roleLabels[role] ?? role).join(', ')}</p>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        {Object.entries(data.stats).map(([key, value]) => (
          <article className="stat-card" key={key}>
            <div className="stat-label">{statLabels[key] ?? key}</div>
            <div className="stat-value">{value}</div>
          </article>
        ))}
      </section>

      <section className="cards-grid">
        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Eleves recents</div>
              <h2>Dernieres inscriptions</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Eleve</th>
                  <th>Responsable</th>
                  <th>Niveau</th>
                </tr>
              </thead>
              <tbody>
                {data.recentStudents.length === 0 ? (
                  <tr><td className="empty-state" colSpan={3}>Aucun enregistrement recent.</td></tr>
                ) : data.recentStudents.map((student) => (
                  <tr key={student.id}>
                    <td>{student.full_name}</td>
                    <td>{student.guardian?.full_name || 'Non renseigne'}</td>
                    <td>{student.school_level || 'Non renseigne'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="module-card">
          <div className="section-head">
            <div>
              <div className="section-label">Seances recentes</div>
              <h2>Planning du centre</h2>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Seance</th>
                  <th>Groupe</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.length === 0 ? (
                  <tr><td className="empty-state" colSpan={3}>Aucune seance recente.</td></tr>
                ) : data.recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.title}</td>
                    <td>{session.class_group?.name || 'Non renseigne'}</td>
                    <td>{formatDate(session.session_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        {isAdmin ? (
          <article className="module-card">
            <div className="section-head">
              <div>
                <div className="section-label">Paiements recents</div>
                <h2>Suivi financier</h2>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Eleve</th>
                    <th>Periode</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.length === 0 ? (
                    <tr><td className="empty-state" colSpan={3}>Aucun paiement recent.</td></tr>
                  ) : data.recentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.student?.full_name || 'Non renseigne'}</td>
                      <td>{payment.period_label}</td>
                      <td>{payment.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : (
          <article className="module-card">
            <div className="section-head">
              <div>
                <div className="section-label">Repere enseignant</div>
                <h2>Priorites du jour</h2>
              </div>
            </div>

            <div className="info-stack">
              <div className="info-chip">Verifier les presences par seance</div>
              <div className="info-chip">Consulter les derniers eleves ajoutes au centre</div>
              <div className="info-chip">Mettre a jour les seances de la semaine</div>
            </div>
          </article>
        )}
      </section>
    </div>
  )
}
