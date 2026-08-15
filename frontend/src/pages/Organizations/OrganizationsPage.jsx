import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../services/api'

const EMPTY_FORM = { name: '', slug: '', contact_email: '', contact_phone: '' }

export function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { data } = await api.get('/organizations', { params: { page, search: searchTerm || undefined } })
      setOrganizations(data.data ?? [])
      setMeta({ current_page: data.current_page, last_page: data.last_page, total: data.total })
    } catch {
      setError("Impossible de charger les organisations.")
    } finally {
      setIsLoading(false)
    }
  }, [page, searchTerm])

  useEffect(() => { load() }, [load])

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setErrors({})
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setNotice(null)

    const payload = Object.fromEntries(
      Object.entries(form).filter(([, value]) => value !== ''),
    )

    try {
      if (editingId) {
        await api.put(`/organizations/${editingId}`, payload)
        setNotice('Organisation mise à jour.')
      } else {
        await api.post('/organizations', payload)
        setNotice('Organisation créée. Vous pouvez maintenant créer son administrateur.')
      }

      resetForm()
      await load()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(requestError.response.data.errors ?? {})
        return
      }

      setError("L'opération a échoué.")
    }
  }

  function startEdit(organization) {
    setEditingId(organization.id)
    setErrors({})
    setForm({
      name: organization.name ?? '',
      slug: organization.slug ?? '',
      contact_email: organization.contact_email ?? '',
      contact_phone: organization.contact_phone ?? '',
    })
  }

  async function changeStatus(organization, action) {
    setNotice(null)
    setError(null)

    try {
      await api.post(`/organizations/${organization.id}/${action}`)
      setNotice(action === 'suspend'
        ? `« ${organization.name} » suspendue. Ses utilisateurs perdent l'accès à la prochaine requête.`
        : `« ${organization.name} » réactivée.`)
      await load()
    } catch {
      setError("Le changement de statut a échoué.")
    }
  }

  async function remove(organization) {
    setNotice(null)
    setError(null)

    try {
      await api.delete(`/organizations/${organization.id}`)
      setNotice(`« ${organization.name} » supprimée. Ses données restent récupérables.`)
      await load()
    } catch (requestError) {
      // 409: l'organisation a encore des utilisateurs actifs. Il faut d'abord la
      // suspendre — c'est l'acte qui coupe l'accès de son personnel.
      setError(requestError.response?.status === 409
        ? "Cette organisation a encore des utilisateurs actifs. Suspendez-la d'abord."
        : 'La suppression a échoué.')
    }
  }

  return (
    <section className="module-layout">
      <div className="section-head">
        <div>
          <p className="section-label">Plateforme</p>
          <h1>Organisations</h1>
          <p className="hint">{meta.total} organisation(s) enregistrée(s).</p>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <form
        className="search-form"
        onSubmit={(event) => { event.preventDefault(); setPage(1); setSearchTerm(search) }}
      >
        <input
          aria-label="Rechercher une organisation"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nom ou identifiant..."
          type="search"
          value={search}
        />
        <button className="ghost-btn" type="submit">Rechercher</button>
      </form>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Modifier l'organisation" : 'Nouvelle organisation'}</h2>

        <div className="module-grid">
          <label className="field">
            <span>Nom *</span>
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              type="text"
              value={form.name}
            />
            {errors.name ? <small className="hint">{errors.name[0]}</small> : null}
          </label>

          <label className="field">
            <span>Identifiant lisible</span>
            <input
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="déduit du nom si vide"
              type="text"
              value={form.slug}
            />
            {errors.slug ? <small className="hint">{errors.slug[0]}</small> : null}
          </label>

          <label className="field">
            <span>Email de contact</span>
            <input
              onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
              type="email"
              value={form.contact_email}
            />
            {errors.contact_email ? <small className="hint">{errors.contact_email[0]}</small> : null}
          </label>

          <label className="field">
            <span>Téléphone de contact</span>
            <input
              onChange={(event) => setForm({ ...form, contact_phone: event.target.value })}
              type="text"
              value={form.contact_phone}
            />
            {errors.contact_phone ? <small className="hint">{errors.contact_phone[0]}</small> : null}
          </label>
        </div>

        <div className="row-actions">
          <button className="primary-btn" type="submit">{editingId ? 'Enregistrer' : 'Créer'}</button>
          {editingId ? <button className="ghost-btn" onClick={resetForm} type="button">Annuler</button> : null}
        </div>

        <p className="hint">
          Toute organisation est créée active. La suspension est une action délibérée et tracée.
        </p>
      </form>

      <div className="table-wrap">
        {isLoading ? <p className="table-loading">Chargement...</p> : null}

        {!isLoading && organizations.length === 0 ? (
          <p className="empty-state">Aucune organisation.</p>
        ) : null}

        {!isLoading && organizations.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Organisation</th>
                <th>Identifiant</th>
                <th>Statut</th>
                <th>Comptes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <td>
                    {organization.name}
                    {organization.contact_email ? <><br /><small className="hint">{organization.contact_email}</small></> : null}
                  </td>
                  <td><code>{organization.slug}</code></td>
                  <td>
                    <span className={`badge ${organization.status === 'active' ? 'ok' : 'warn'}`}>
                      {organization.status === 'active' ? 'Active' : 'Suspendue'}
                    </span>
                  </td>
                  <td>{organization.users_count}</td>
                  <td className="row-actions">
                    <Link className="ghost-btn link-btn" to={`/espace/organisations/${organization.id}/comptes`}>
                      Comptes
                    </Link>
                    <button className="ghost-btn" onClick={() => startEdit(organization)} type="button">
                      Modifier
                    </button>
                    {organization.status === 'active' ? (
                      <button className="ghost-btn" onClick={() => changeStatus(organization, 'suspend')} type="button">
                        Suspendre
                      </button>
                    ) : (
                      <button className="ghost-btn" onClick={() => changeStatus(organization, 'activate')} type="button">
                        Réactiver
                      </button>
                    )}
                    <button className="danger-btn" onClick={() => remove(organization)} type="button">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>

      {meta.last_page > 1 ? (
        <div className="pagination">
          <button className="ghost-btn" disabled={page <= 1} onClick={() => setPage(page - 1)} type="button">
            Précédent
          </button>
          <span className="pagination-info">Page {meta.current_page} / {meta.last_page}</span>
          <button className="ghost-btn" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} type="button">
            Suivant
          </button>
        </div>
      ) : null}
    </section>
  )
}
