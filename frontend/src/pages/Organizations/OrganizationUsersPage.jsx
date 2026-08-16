import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../services/api'

const EMPTY_FORM = {
  name: '',
  username: '',
  email: '',
  password: '',
  role: 'org_admin',
}

/**
 * Alta del administrador inicial de una organización, y de sus demás cuentas.
 *
 * Es la pantalla que permite incorporar un centro piloto sin tocar la base de
 * datos a mano (SC-003).
 */
export function OrganizationUsersPage() {
  const { organizationId } = useParams()
  const [organization, setOrganization] = useState(null)
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [organizationResponse, usersResponse] = await Promise.all([
        api.get(`/organizations/${organizationId}`),
        api.get('/users', { params: { organization_id: organizationId, per_page: 50 } }),
      ])

      setOrganization(organizationResponse.data)
      setUsers(usersResponse.data.data ?? [])
    } catch {
      setError('No se ha podido cargar esta organización.')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  useEffect(() => { load() }, [load])

  async function handleSubmit(event) {
    event.preventDefault()
    setErrors({})
    setNotice(null)

    try {
      await api.post('/users', { ...form, organization_id: Number(organizationId) })
      setNotice(`Cuenta «${form.username}» creada. Comuníquele sus credenciales.`)
      setForm(EMPTY_FORM)
      await load()
    } catch (requestError) {
      if (requestError.response?.status === 422) {
        setErrors(requestError.response.data.errors ?? {})
        return
      }

      setError('La creación de la cuenta ha fallado.')
    }
  }

  async function toggleActive(user) {
    setNotice(null)
    setError(null)

    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active })
      await load()
    } catch {
      setError('El cambio de estado ha fallado.')
    }
  }

  if (isLoading) {
    return <section className="module-layout"><p className="table-loading">Cargando...</p></section>
  }

  return (
    <section className="module-layout">
      <div className="section-head">
        <div>
          <p className="section-label">Plataforma</p>
          <h1>Cuentas — {organization?.name}</h1>
          <p className="hint">
            <Link className="link-btn" to="/espacio/organizaciones">← Volver a organizaciones</Link>
          </p>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <form className="form-card" onSubmit={handleSubmit}>
        <h2>Nueva cuenta</h2>

        <div className="module-grid">
          <label className="field">
            <span>Nombre completo *</span>
            <input onChange={(event) => setForm({ ...form, name: event.target.value })} required type="text" value={form.name} />
            {errors.name ? <small className="hint">{errors.name[0]}</small> : null}
          </label>

          <label className="field">
            <span>Usuario de acceso *</span>
            <input onChange={(event) => setForm({ ...form, username: event.target.value })} required type="text" value={form.username} />
            {errors.username ? <small className="hint">{errors.username[0]}</small> : null}
          </label>

          <label className="field">
            <span>Correo *</span>
            <input onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} />
            {errors.email ? <small className="hint">{errors.email[0]}</small> : null}
          </label>

          <label className="field">
            <span>Contraseña provisional *</span>
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
            <span>Rol *</span>
            <select onChange={(event) => setForm({ ...form, role: event.target.value })} value={form.role}>
              <option value="org_admin">Administración del centro</option>
              <option value="teacher">Profesor</option>
            </select>
            {errors.role ? <small className="hint">{errors.role[0]}</small> : null}
          </label>
        </div>

        <div className="row-actions">
          <button className="primary-btn" type="submit">Crear la cuenta</button>
        </div>

        <p className="hint">
          El correo debe ser único en toda la plataforma: una misma persona que trabaje en dos
          centros necesita dos cuentas con correos distintos.
        </p>
      </form>

      <div className="table-wrap">
        {users.length === 0 ? (
          <p className="empty-state">No hay ninguna cuenta en esta organización.</p>
        ) : (
          <table className="stacked-table">
            <thead>
              <tr>
                <th>Cuenta</th>
                <th>Correo</th>
                <th>Roles</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td data-label="Cuenta">{user.name}<br /><small className="hint">{user.username}</small></td>
                  <td data-label="Correo">{user.email}</td>
                  <td data-label="Roles">{(user.roles ?? []).map((role) => role.name).join(', ')}</td>
                  <td data-label="Estado">
                    <span className={`badge ${user.is_active ? 'ok' : 'muted'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="row-actions" data-label="Acciones">
                    <button className="ghost-btn" onClick={() => toggleActive(user)} type="button">
                      {user.is_active ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
