import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { canAccessModule, canCreateModule, canDeleteModule, canEditModule, getRoleNames, moduleDefinitions } from '../config/modules'
import { useSession } from '../context/SessionContext'
import { api } from '../services/api'

function getValue(record, path) {
  return path.split('.').reduce((current, key) => current?.[key], record) ?? '-'
}

function normalizeTimeValue(value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()

  if (!trimmed) {
    return ''
  }

  const hhmmss = trimmed.match(/^(\d{2}):(\d{2}):\d{2}$/)
  if (hhmmss) {
    return `${hhmmss[1]}:${hhmmss[2]}`
  }

  const flexible = trimmed.match(/^(\d{1,2})\s*[hH:]\s*(\d{2})$/)
  if (flexible) {
    return `${flexible[1].padStart(2, '0')}:${flexible[2]}`
  }

  const compact = trimmed.match(/^(\d{1,2})(\d{2})$/)
  if (compact) {
    return `${compact[1].padStart(2, '0')}:${compact[2]}`
  }

  return trimmed
}

function normalizeFieldValue(field, value) {
  if (field.type === 'time') {
    return normalizeTimeValue(value)
  }

  return value ?? ''
}

function extractRequestError(error) {
  const fieldErrors = error?.response?.data?.errors
  if (fieldErrors && typeof fieldErrors === 'object') {
    const firstFieldError = Object.values(fieldErrors).flat().find(Boolean)
    if (firstFieldError) {
      return firstFieldError
    }
  }

  return error?.response?.data?.message || "L'enregistrement n'a pas pu etre sauvegarde."
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    paid: 'Paye',
    pending: 'En attente',
    cancelled: 'Annule',
    present: 'Present',
    absent: 'Absent',
    late: 'Retard',
    cash: 'Especes',
    card: 'Carte',
    transfer: 'Virement',
  }

  if (typeof value === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value.slice(0, 5)
  }

  return labels[value] ?? String(value)
}

export function ModulePage() {
  const { moduleKey } = useParams()
  const { user } = useSession()
  const definition = moduleDefinitions[moduleKey]
  const roleNames = getRoleNames(user)
  const [records, setRecords] = useState([])
  const [supportingData, setSupportingData] = useState({})
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const canAccess = definition ? canAccessModule(definition, roleNames) : false
  const canCreate = definition ? canCreateModule(definition, roleNames) : false
  const canEdit = definition ? canEditModule(definition, roleNames) : false
  const canDelete = definition ? canDeleteModule(definition, roleNames) : false

  const dependencies = useMemo(
    () => [...new Set(definition?.fields.filter((field) => field.source).map((field) => field.source) ?? [])],
    [definition],
  )

  useEffect(() => {
    if (!definition) return

    loadRecords('')
    Promise.all(
      dependencies.map(async (dependency) => {
        const { data } = await api.get(`/${dependency}`, { params: { per_page: 100 } })
        return [dependency, data.data]
      }),
    ).then((entries) => setSupportingData(Object.fromEntries(entries)))

    setForm({})
    setEditingId(null)
    setMessage('')
    setError('')
  }, [definition, dependencies])

  if (!definition) {
    return <div className="panel-empty">Module introuvable.</div>
  }

  if (!canAccess) {
    return <Navigate replace to="/espace" />
  }

  async function loadRecords(term = search) {
    const { data } = await api.get(`/${definition.endpoint}`, { params: { search: term } })
    setRecords(data.data)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    const payload = Object.fromEntries(
      definition.fields
        .map((field) => [field.name, normalizeFieldValue(field, form[field.name])])
        .filter(([, value]) => value !== '' && value !== null && value !== undefined),
    )

    try {
      if (editingId) {
        await api.put(`/${definition.endpoint}/${editingId}`, payload)
        setMessage('Enregistrement mis a jour.')
      } else {
        await api.post(`/${definition.endpoint}`, payload)
        setMessage('Enregistrement cree.')
      }

      setForm({})
      setEditingId(null)
      loadRecords()
    } catch (requestError) {
      setError(extractRequestError(requestError))
    }
  }

  async function handleDelete(id) {
    setMessage('')
    setError('')

    try {
      await api.delete(`/${definition.endpoint}/${id}`)
      setMessage('Enregistrement supprime.')
      if (editingId === id) {
        setEditingId(null)
        setForm({})
      }
      loadRecords()
    } catch (requestError) {
      setError(extractRequestError(requestError))
    }
  }

  function startEditing(record) {
    const nextForm = {}
    definition.fields.forEach((field) => {
      nextForm[field.name] = normalizeFieldValue(field, record[field.name])
    })
    setEditingId(record.id)
    setForm(nextForm)
    setError('')
  }

  return (
    <div className="module-layout">
      <div className="section-head">
        <div>
          <div className="section-label">Module</div>
          <h1 style={{ margin: '6px 0 0' }}>{definition.title}</h1>
        </div>
      </div>

      {message ? <div className="notice-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <div className="module-grid">
        <section className="module-card">
          <div className="toolbar">
            <div>
              <div className="section-label">Liste</div>
              <h2>{definition.title}</h2>
            </div>

            <div className="field">
              <label htmlFor="search">Recherche</label>
              <input
                id="search"
                placeholder="Rechercher..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    loadRecords(search)
                  }
                }}
                onBlur={() => loadRecords(search)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                  {(canEdit || canDelete) ? <th>Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td className="empty-state" colSpan={definition.columns.length + (canEdit || canDelete ? 1 : 0)}>Aucun enregistrement pour le moment.</td></tr>
                ) : records.map((record) => (
                  <tr key={record.id}>
                    {definition.columns.map((column) => <td key={`${record.id}-${column.key}`}>{formatDisplayValue(getValue(record, column.key))}</td>)}
                    {(canEdit || canDelete) ? (
                      <td>
                        <div className="row-actions">
                          {canEdit ? <button className="ghost-btn" onClick={() => startEditing(record)} type="button">Modifier</button> : null}
                          {canDelete ? <button className="danger-btn" onClick={() => handleDelete(record.id)} type="button">Supprimer</button> : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {(canCreate || canEdit) ? (
          <section className="module-card">
            <div className="section-head">
              <div>
                <div className="section-label">Formulaire</div>
                <h2>{editingId ? 'Mettre a jour' : 'Nouvel enregistrement'}</h2>
              </div>
              {editingId ? <button className="ghost-btn" onClick={() => { setEditingId(null); setForm({}) }} type="button">Nouveau</button> : null}
            </div>

            <form className="form-card" onSubmit={handleSubmit}>
              {definition.fields.map((field) => (
                <div className="field" key={field.name}>
                  <label htmlFor={field.name}>{field.label}</label>

                  {field.type === 'textarea' ? (
                    <textarea id={field.name} required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))} />
                  ) : field.type === 'select' ? (
                    <select id={field.name} required={field.required} value={form[field.name] ?? ''} onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}>
                      <option value="">Selectionner</option>
                      {(field.options ?? supportingData[field.source] ?? []).map((option) => {
                        const value = typeof option === 'string' ? option : option.value ?? option[field.optionValue ?? 'id']
                        const label = typeof option === 'string' ? formatDisplayValue(option) : option.label ?? option[field.optionLabel ?? 'name']
                        return <option key={`${field.name}-${value}`} value={value}>{label}</option>
                      })}
                    </select>
                  ) : (
                    <input
                      id={field.name}
                      required={field.required}
                      step={field.type === 'number' ? '0.01' : undefined}
                      type={field.type === 'number' ? 'number' : field.type}
                      value={form[field.name] ?? ''}
                      onChange={(event) => setForm((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  )}
                </div>
              ))}

              <button className="primary-btn" type="submit">{editingId ? 'Enregistrer les modifications' : 'Creer'}</button>
            </form>
          </section>
        ) : (
          <section className="module-card read-only-card">
            <div className="section-label">Acces enseignant</div>
            <h2>Consultation uniquement</h2>
            <p className="hint">Ce module reste visible pour suivre les informations du centre, mais sa modification est reservee a l administration.</p>
          </section>
        )}
      </div>
    </div>
  )
}
