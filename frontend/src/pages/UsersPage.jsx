import { useCallback, useEffect, useState } from 'react'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'

const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'teacher', teacher_id: '' }

/**
 * Gestión de las cuentas del centro, para la administración de la organización.
 *
 * No hay selector de organización a propósito: la cuenta creada pertenece siempre
 * a la del administrador, y el servidor ignora cualquier valor que envíe el
 * cliente.
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
      setError('No se han podido cargar las cuentas.')
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
      setNotice(`Cuenta «${form.username}» creada.`)
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

  async function remove(user) {
    setNotice(null)
    setError(null)

    try {
      await api.delete(`/users/${user.id}`)
      setNotice('Cuenta eliminada. La ficha de profesor, si la había, se conserva.')
      await load()
    } catch {
      setError('La eliminación ha fallado.')
    }
  }

  return (
    <section className="module-layout">
      <div className="section-head">
        <div>
          <p className="section-label">{organization?.name ?? 'Mi centro'}</p>
          <h1>Cuentas</h1>
          <p className="hint">Los accesos del personal de su centro.</p>
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
              <option value="teacher">Profesor</option>
              <option value="org_admin">Administración</option>
            </select>
            {errors.role ? <small className="hint">{errors.role[0]}</small> : null}
          </label>

          {form.role === 'teacher' ? (
            <label className="field">
              <span>Ficha de profesor a vincular</span>
              <select onChange={(event) => setForm({ ...form, teacher_id: event.target.value })} value={form.teacher_id}>
                <option value="">Ninguna</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.full_name ?? `${teacher.first_name} ${teacher.last_name}`}</option>
                ))}
              </select>
              {errors.teacher_id ? <small className="hint">{errors.teacher_id[0]}</small> : null}
            </label>
          ) : null}
        </div>

        <div className="row-actions">
          <button className="primary-btn" type="submit">Crear la cuenta</button>
        </div>

        <p className="hint">
          Sin ficha de profesor vinculada, una cuenta de profesor no ve ningún grupo ni ningún alumno.
        </p>
      </form>

      <div className="table-wrap">
        {isLoading ? <p className="table-loading">Cargando...</p> : null}

        {!isLoading && users.length === 0 ? <p className="empty-state">No hay ninguna cuenta.</p> : null}

        {!isLoading && users.length > 0 ? (
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
                    <button className="danger-btn" onClick={() => remove(user)} type="button">
                      Eliminar
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
