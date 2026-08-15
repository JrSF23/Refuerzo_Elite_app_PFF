import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'teacher', teacher_id: '' }

/**
 * Gestion des comptes du centre, pour l'administration de l'organisation.
 *
 * Il n'y a volontairement aucun sélecteur d'organisation : le compte créé
 * appartient toujours à celle de l'administrateur, et le serveur ignore toute
 * valeur envoyée par le client.
 */
export function UsersPage() {
  const { organization } = useSession()
  const [users, setUsers] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [usersResponse, teachersResponse] = await Promise.all([
        api.get('/users', { params: { per_page: 50 } }),
        api.get('/teachers', { params: { per_page: 50 } }),
      ])

      setUsers(usersResponse.data.data ?? [])
      setTeachers(teachersResponse.data.data ?? [])
    } catch {
      setError('Impossible de charger les comptes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setNotice(null)

    const payload = { ...form }
    if (!payload.teacher_id) delete payload.teacher_id

    try {
      await api.post('/users', payload)
      setNotice(`Compte « ${form.username} » créé.`)
      setForm(EMPTY_FORM)
      await load()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(requestError.response.data.errors ?? {})
        return
      }

      setError('La création du compte a échoué.')
    }
  }

  async function toggleActive(user) {
    setNotice(null)
    setError(null)

    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active })
      await load()
    } catch {
      setError('Le changement de statut a échoué.')
    }
  }

  async function remove(user) {
    setNotice(null)
    setError(null)

    try {
      await api.delete(`/users/${user.id}`)
      setNotice('Compte supprimé. La fiche enseignant éventuelle est conservée.')
      await load()
    } catch {
      setError('La suppression a échoué.')
    }
  }

  return (
    <section className="module-layout">
      <div className="section-head">
        <div>
          <p className="section-label">{organization?.name ?? 'Mon centre'}</p>
          <h1>Comptes</h1>
          <p className="hint">Les accès du personnel de votre centre.</p>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Nouveau compte</h2>

        <div className="module-grid">
          <label className="field">
            <span>Nom complet *</span>
            <input onChange={(event) => setForm({ ...form, name: event.target.value })} required type="text" value={form.name} />
            {errors.name ? <small className="hint">{errors.name[0]}</small> : null}
          </label>

          <label className="field">
            <span>Identifiant de connexion *</span>
            <input onChange={(event) => setForm({ ...form, username: event.target.value })} required type="text" value={form.username} />
            {errors.username ? <small className="hint">{errors.username[0]}</small> : null}
          </label>

          <label className="field">
            <span>Email *</span>
            <input onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
            {errors.email ? <small className="hint">{errors.email[0]}</small> : null}
          </label>

          <label className="field">
            <span>Mot de passe provisoire *</span>
            <input
              minLength={8}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
              type="text"
              value={form.password}
            />
            {errors.password ? <small className="hint">{errors.password[0]}</small> : null}
          </label>

          <label className="field">
            <span>Rôle *</span>
            <select onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role}>
              <option value="teacher">Enseignant</option>
              <option value="org_admin">Administration</option>
            </select>
            {errors.role ? <small className="hint">{errors.role[0]}</small> : null}
          </label>

          {form.role === 'teacher' ? (
            <label className="field">
              <span>Fiche enseignant à lier</span>
              <select onChange={(event) => setForm({ ...form, teacher_id: event.target.value })} value={form.teacher_id}>
                <option value="">Aucune</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.full_name ?? `${teacher.first_name} ${teacher.last_name}`}</option>
                ))}
              </select>
              {errors.teacher_id ? <small className="hint">{errors.teacher_id[0]}</small> : null}
            </label>
          ) : null}
        </div>

        <div className="row-actions">
          <button className="primary-btn" type="submit">Créer le compte</button>
        </div>

        <p className="hint">
          Sans fiche enseignant liée, un compte enseignant ne voit aucun groupe ni aucun élève.
        </p>
      </form>

      <div className="table-wrap">
        {isLoading ? <p className="table-loading">Chargement...</p> : null}

        {!isLoading && users.length === 0 ? <p className="empty-state">Aucun compte.</p> : null}

        {!isLoading && users.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Compte</th>
                <th>Email</th>
                <th>Rôles</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}<br /><small className="hint">{user.username}</small></td>
                  <td>{user.email}</td>
                  <td>{(user.roles ?? []).map((role) => role.name).join(', ')}</td>
                  <td>
                    <span className={`badge ${user.is_active ? 'ok' : 'muted'}`}>
                      {user.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="ghost-btn" onClick={() => toggleActive(user)} type="button">
                      {user.is_active ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button className="danger-btn" onClick={() => remove(user)} type="button">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  )
}
