import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { canAccessModule, canCreateModule, canDeleteModule, canEditModule, moduleDefinitions } from '../config/modules'
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

  return error?.response?.data?.message || "L'enregistrement n'a pas pu être sauvegardé."
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  const labels = {
    active: 'Actif',
    inactive: 'Inactif',
    paid: 'Payé',
    pending: 'En attente',
    cancelled: 'Annulé',
    present: 'Présent',
    absent: 'Absent',
    late: 'En retard',
    cash: 'Espèces',
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
  const { roleNames } = useSession()
  const definition = moduleDefinitions[moduleKey]
  const [records, setRecords] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [supportingData, setSupportingData] = useState({})
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({})
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const abortRef = useRef(null)

  const canAccess = definition ? canAccessModule(definition, roleNames) : false
  const canCreate = definition ? canCreateModule(definition, roleNames) : false
  const canEdit = definition ? canEditModule(definition, roleNames) : false
  const canDelete = definition ? canDeleteModule(definition, roleNames) : false

  const dependencies = useMemo(
    () => [...new Set(definition?.fields.filter((field) => field.source).map((field) => field.source) ?? [])],
    [definition],
  )

  const loadRecords = useCallback(async (term = search, page = 1) => {
    if (!definition) return

    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort()
    }
    const controller = new AbortController()
    abortRef.current = controller

    setIsLoading(true)
    setLoadError('')

    try {
      const { data } = await api.get(`/${definition.endpoint}`, {
        params: { search: term, page },
        signal: controller.signal,
      })
      setRecords(data.data)
      setPagination({
        currentPage: data.current_page,
        lastPage: data.last_page,
        total: data.total,
        from: data.from,
        to: data.to,
      })
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
        setLoadError('Impossible de charger les enregistrements. Veuillez réessayer.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [definition, search])

  useEffect(() => {
    if (!definition) return

    setSearch('')
    setSearchInput('')
    setCurrentPage(1)
    setForm({})
    setEditingId(null)
    setMessage('')
    setError('')
    setLoadError('')
    setSupportingData({})

    loadRecords('', 1)

    // Only fetch supporting data when the user can actually use the form
    if (canCreate || canEdit) {
      Promise.all(
        dependencies.map(async (dependency) => {
          const { data } = await api.get(`/${dependency}`, { params: { per_page: 200 } })
          return [dependency, data.data]
        }),
      )
        .then((entries) => setSupportingData(Object.fromEntries(entries)))
        .catch(() => {
          setError('Impossible de charger les données des listes déroulantes.')
        })
    }

    return () => {
      if (abortRef.current) {
        abortRef.current.abort()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, dependencies])

  if (!definition) {
    return <div className="panel-empty">Module introuvable.</div>
  }

  if (!canAccess) {
    return <Navigate replace to="/espace" />
  }

  function handleSearch(event) {
    event.preventDefault()
    setSearch(searchInput)
    setCurrentPage(1)
    loadRecords(searchInput, 1)
  }

  function handlePageChange(page) {
    setCurrentPage(page)
    loadRecords(search, page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    const payload = Object.fromEntries(
      definition.fields.map((field) => {
        const normalized = normalizeFieldValue(field, form[field.name])
        // When editing, send null for empty optional fields so the backend can clear them.
        // When creating, skip empty optional fields to let the backend apply its defaults.
        if (normalized === '' || normalized === null || normalized === undefined) {
          return [field.name, editingId && !field.required ? null : undefined]
        }
        return [field.name, normalized]
      }).filter(([, value]) => value !== undefined),
    )

    try {
      if (editingId) {
        await api.put(`/${definition.endpoint}/${editingId}`, payload)
        setMessage('Enregistrement mis à jour.')
      } else {
        await api.post(`/${definition.endpoint}`, payload)
        setMessage('Enregistrement créé.')
      }

      setForm({})
      setEditingId(null)
      loadRecords(search, currentPage)
    } catch (requestError) {
      setError(extractRequestError(requestError))
    }
  }

  function requestDelete(id) {
    setConfirmDeleteId(id)
  }

  async function confirmDelete() {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setMessage('')
    setError('')

    try {
      await api.delete(`/${definition.endpoint}/${id}`)
      setMessage('Enregistrement supprimé.')
      if (editingId === id) {
        setEditingId(null)
        setForm({})
      }
      loadRecords(search, currentPage)
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
    setMessage('')
  }

  const colSpan = definition.columns.length + (canEdit || canDelete ? 1 : 0)

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

      {/* Confirmation de suppression */}
      {confirmDeleteId !== null ? (
        <div className="confirm-overlay">
          <div className="confirm-card">
            <p>Confirmez-vous la suppression de cet enregistrement ? Cette action est irréversible.</p>
            <div className="row-actions">
              <button className="danger-btn" onClick={confirmDelete} type="button">Oui, supprimer</button>
              <button className="ghost-btn" onClick={() => setConfirmDeleteId(null)} type="button">Annuler</button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="module-grid">
        <section className="module-card">
          <div className="toolbar">
            <div>
              <div className="section-label">Liste</div>
              <h2>{definition.title}</h2>
            </div>

            <form className="search-form" onSubmit={handleSearch}>
              <div className="field">
                <label htmlFor="search">Recherche</label>
                <input
                  id="search"
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <button className="ghost-btn" type="submit">Rechercher</button>
            </form>
          </div>

          <div className="table-wrap">
            {isLoading ? (
              <div className="table-loading">Chargement des enregistrements...</div>
            ) : loadError ? (
              <div className="error-banner">{loadError}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {definition.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                    {(canEdit || canDelete) ? <th>Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td className="empty-state" colSpan={colSpan}>Aucun enregistrement pour le moment.</td></tr>
                  ) : records.map((record) => (
                    <tr key={record.id}>
                      {definition.columns.map((column) => <td key={`${record.id}-${column.key}`}>{formatDisplayValue(getValue(record, column.key))}</td>)}
                      {(canEdit || canDelete) ? (
                        <td>
                          <div className="row-actions">
                            {canEdit ? <button className="ghost-btn" onClick={() => startEditing(record)} type="button">Modifier</button> : null}
                            {canDelete ? <button className="danger-btn" onClick={() => requestDelete(record.id)} type="button">Supprimer</button> : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Controles de paginación */}
          {pagination && pagination.lastPage > 1 ? (
            <div className="pagination">
              <button
                className="ghost-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                type="button"
              >
                ← Précédent
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} sur {pagination.lastPage}
                {pagination.total ? ` · ${pagination.total} enregistrement${pagination.total > 1 ? 's' : ''}` : ''}
              </span>
              <button
                className="ghost-btn"
                disabled={currentPage >= pagination.lastPage}
                onClick={() => handlePageChange(currentPage + 1)}
                type="button"
              >
                Suivant →
              </button>
            </div>
          ) : pagination && pagination.total > 0 ? (
            <div className="pagination-info" style={{ padding: '8px 0', fontSize: '0.85em', color: 'var(--color-muted)' }}>
              {pagination.total} enregistrement{pagination.total > 1 ? 's' : ''}
            </div>
          ) : null}
        </section>

        {(canCreate || canEdit) ? (
          <section className="module-card">
            <div className="section-head">
              <div>
                <div className="section-label">Formulaire</div>
                <h2>{editingId ? 'Mettre à jour' : 'Nouvel enregistrement'}</h2>
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
                      <option value="">Sélectionner</option>
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

              <button className="primary-btn" type="submit">{editingId ? 'Enregistrer les modifications' : 'Créer'}</button>
            </form>
          </section>
        ) : (
          <section className="module-card read-only-card">
            <div className="section-label">Accès enseignant</div>
            <h2>Consultation uniquement</h2>
            <p className="hint">Ce module reste visible pour suivre les informations du centre, mais sa modification est réservée à l'administration.</p>
          </section>
        )}
      </div>
    </div>
  )
}
