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
      setError("No se han podido cargar las organizaciones.")
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
        setNotice('Organización actualizada.')
      } else {
        await api.post('/organizations', payload)
        setNotice('Organización creada. Ya puede dar de alta a su administrador.')
      }

      resetForm()
      await load()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(requestError.response.data.errors ?? {})
        return
      }

      setError("La operación ha fallado.")
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
        ? `«${organization.name}» suspendida. Sus usuarios pierden el acceso en la siguiente petición.`
        : `«${organization.name}» reactivada.`)
      await load()
    } catch {
      setError("El cambio de estado ha fallado.")
    }
  }

  async function remove(organization) {
    setNotice(null)
    setError(null)

    try {
      await api.delete(`/organizations/${organization.id}`)
      setNotice(`«${organization.name}» eliminada. Sus datos siguen siendo recuperables.`)
      await load()
    } catch (requestError) {
      // 409: la organización todavía tiene usuarios activos. Primero hay que
      // suspenderla, que es el acto que corta el acceso de su personal.
      setError(requestError.response?.status === 409
        ? "Esta organización todavía tiene usuarios activos. Suspéndala primero."
        : 'La eliminación ha fallado.')
    }
  }

  return (
    <section className="module-layout">
      <div className="section-head">
        <div>
          <p className="section-label">Plataforma</p>
          <h1>Organizaciones</h1>
          <p className="hint">{meta.total} organización(es) registrada(s).</p>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <form
        className="search-form"
        onSubmit={(event) => { event.preventDefault(); setPage(1); setSearchTerm(search) }}
      >
        <input
          aria-label="Buscar una organización"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nombre o identificador..."
          type="search"
          value={search}
        />
        <button className="ghost-btn" type="submit">Buscar</button>
      </form>

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>{editingId ? "Editar la organización" : 'Nueva organización'}</h2>

        <div className="module-grid">
          <label className="field">
            <span>Nombre *</span>
            <input
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
              type="text"
              value={form.name}
            />
            {errors.name ? <small className="hint">{errors.name[0]}</small> : null}
          </label>

          <label className="field">
            <span>Identificador legible</span>
            <input
              onChange={(event) => setForm({ ...form, slug: event.target.value })}
              placeholder="se deriva del nombre si se deja vacío"
              type="text"
              value={form.slug}
            />
            {errors.slug ? <small className="hint">{errors.slug[0]}</small> : null}
          </label>

          <label className="field">
            <span>Correo de contacto</span>
            <input
              onChange={(event) => setForm({ ...form, contact_email: event.target.value })}
              type="email"
              value={form.contact_email}
            />
            {errors.contact_email ? <small className="hint">{errors.contact_email[0]}</small> : null}
          </label>

          <label className="field">
            <span>Teléfono de contacto</span>
            <input
              onChange={(event) => setForm({ ...form, contact_phone: event.target.value })}
              type="text"
              value={form.contact_phone}
            />
            {errors.contact_phone ? <small className="hint">{errors.contact_phone[0]}</small> : null}
          </label>
        </div>

        <div className="row-actions">
          <button className="primary-btn" type="submit">{editingId ? 'Guardar' : 'Crear'}</button>
          {editingId ? <button className="ghost-btn" onClick={resetForm} type="button">Cancelar</button> : null}
        </div>

        <p className="hint">
          Toda organización se crea activa. Suspenderla es una acción deliberada y queda registrada.
        </p>
      </form>

      <div className="table-wrap">
        {isLoading ? <p className="table-loading">Cargando...</p> : null}

        {!isLoading && organizations.length === 0 ? (
          <p className="empty-state">No hay ninguna organización.</p>
        ) : null}

        {!isLoading && organizations.length > 0 ? (
          <table className="stacked-table">
            <thead>
              <tr>
                <th>Organización</th>
                <th>Identificador</th>
                <th>Estado</th>
                <th>Cuentas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => (
                <tr key={organization.id}>
                  <td data-label="Organización">
                    {organization.name}
                    {organization.contact_email ? <><br /><small className="hint">{organization.contact_email}</small></> : null}
                  </td>
                  <td data-label="Identificador"><code>{organization.slug}</code></td>
                  <td data-label="Estado">
                    <span className={`badge ${organization.status === 'active' ? 'ok' : 'warn'}`}>
                      {organization.status === 'active' ? 'Activa' : 'Suspendida'}
                    </span>
                  </td>
                  <td data-label="Cuentas">{organization.users_count}</td>
                  <td className="row-actions" data-label="Acciones">
                    <Link className="ghost-btn link-btn" to={`/espacio/organizaciones/${organization.id}/cuentas`}>
                      Cuentas
                    </Link>
                    <button className="ghost-btn" onClick={() => startEdit(organization)} type="button">
                      Editar
                    </button>
                    {organization.status === 'active' ? (
                      <button className="ghost-btn" onClick={() => changeStatus(organization, 'suspend')} type="button">
                        Suspender
                      </button>
                    ) : (
                      <button className="ghost-btn" onClick={() => changeStatus(organization, 'activate')} type="button">
                        Reactivar
                      </button>
                    )}
                    <button className="danger-btn" onClick={() => remove(organization)} type="button">
                      Eliminar
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
            Anterior
          </button>
          <span className="pagination-info">Página {meta.current_page} / {meta.last_page}</span>
          <button className="ghost-btn" disabled={page >= meta.last_page} onClick={() => setPage(page + 1)} type="button">
            Siguiente
          </button>
        </div>
      ) : null}
    </section>
  )
}
