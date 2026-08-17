import { useCallback, useEffect, useRef, useState } from 'react'

import { api } from '../lib/api.js'

/**
 * Formulario de alta y edición.
 *
 * Lo que de verdad resuelve, y que ninguna librería de formularios daría hecho
 * porque es específico del formato de Laravel: repartir los errores 422 al
 * campo que les corresponde (FR-030) y llevar el foco al primero que falla
 * (FR-031).
 */
export function useResourceForm({ endpoint, fields, onSaved }) {
  const [values, setValues] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [generalError, setGeneralError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const formRef = useRef(null)

  const reset = useCallback(() => {
    setValues({})
    setEditingId(null)
    setFieldErrors({})
    setGeneralError('')
  }, [])

  const startCreate = useCallback(() => {
    reset()

    // Valores por defecto de los campos que los declaran, para que un `status`
    // obligatorio no salga vacío en un formulario nuevo.
    const defaults = {}
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) defaults[field.name] = field.defaultValue
    })
    setValues(defaults)
  }, [fields, reset])

  const startEdit = useCallback((record) => {
    const next = {}

    fields.forEach((field) => {
      const raw = record[field.name]

      // La API devuelve las horas como HH:MM:SS y el control `time` solo acepta
      // HH:MM. Se normaliza aquí para no repetirlo en cada pantalla.
      next[field.name] = field.type === 'time' && typeof raw === 'string'
        ? raw.slice(0, 5)
        : raw ?? ''
    })

    setValues(next)
    setEditingId(record.id)
    setFieldErrors({})
    setGeneralError('')
  }, [fields])

  const setValue = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }))

    // El error de un campo desaparece en cuanto se toca: mantenerlo mientras el
    // usuario corrige es ruido que no aporta nada.
    setFieldErrors((current) => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }, [])

  /**
   * Prepara el cuerpo de la petición.
   *
   * Al CREAR, los opcionales vacíos se omiten para que el servidor aplique sus
   * valores por defecto. Al EDITAR se envían como `null`, que es la única forma
   * de vaciar un campo que ya tenía contenido: omitirlo dejaría el valor
   * anterior.
   *
   * `organization_id` no aparece jamás: lo asigna el servidor desde el contexto
   * y aceptarlo del cliente reabriría una vía de fuga entre organizaciones
   * (FR-063).
   */
  const buildPayload = useCallback(() => {
    const payload = {}

    fields.forEach((field) => {
      const value = values[field.name]
      const isBlank = value === '' || value === null || value === undefined

      if (isBlank) {
        if (editingId && !field.required) payload[field.name] = null
        return
      }

      payload[field.name] = value
    })

    return payload
  }, [fields, values, editingId])

  const submit = useCallback(async (event) => {
    event?.preventDefault()

    if (isSaving) return false

    setIsSaving(true)
    setFieldErrors({})
    setGeneralError('')

    try {
      const payload = buildPayload()

      const { data } = editingId
        ? await api.put(`/${endpoint}/${editingId}`, payload)
        : await api.post(`/${endpoint}`, payload)

      onSaved?.(data, { wasEditing: Boolean(editingId) })
      reset()
      return true
    } catch (error) {
      setFieldErrors(error.fieldErrors ?? {})

      // El mensaje general solo cuando NO hay errores por campo: si los hay, ya
      // están junto a su campo y repetirlos arriba es ruido.
      if (!error.fieldErrors || Object.keys(error.fieldErrors).length === 0) {
        setGeneralError(error.message)
      }

      return false
    } finally {
      setIsSaving(false)
    }
  }, [isSaving, buildPayload, editingId, endpoint, onSaved, reset])

  // El foco va al primer campo con error (FR-031). Se busca por nombre en el
  // orden de declaración, no por el orden de las claves del objeto de errores,
  // que no tiene por qué coincidir con el orden visual del formulario.
  useEffect(() => {
    const names = Object.keys(fieldErrors)
    if (names.length === 0 || !formRef.current) return

    const firstInOrder = fields.find((field) => names.includes(field.name))
    if (!firstInOrder) return

    const control = formRef.current.querySelector(`[name="${firstInOrder.name}"]`)
    control?.focus()
  }, [fieldErrors, fields])

  return {
    values,
    editingId,
    isEditing: editingId !== null,
    fieldErrors,
    generalError,
    isSaving,
    formRef,
    setValue,
    startCreate,
    startEdit,
    submit,
    reset,
  }
}
