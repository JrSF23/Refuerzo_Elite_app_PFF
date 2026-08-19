import { useEffect, useId, useState } from 'react'

import { t } from '../../i18n/index.js'

const DEBOUNCE_MS = 350

/**
 * Caja de búsqueda con retardo de escritura.
 *
 * El retardo evita una petición por tecla. La cancelación de las peticiones que
 * quedan obsoletas la resuelve `useResourceList` con `AbortController`: sin
 * ambas cosas, la respuesta más lenta puede pisar a la más reciente y mostrar
 * resultados que no corresponden a lo escrito (FR-065, research.md D4).
 *
 * Se renderiza SOLO donde el endpoint admite búsqueda (FR-024). En matrículas,
 * sesiones, asistencia y pagos la API ignora el parámetro, así que ofrecer la
 * caja sería mentir al usuario. Lo decide `lib/permissions.js`, no este
 * componente.
 */
export function SearchInput({ value, onChange, label, placeholder }) {
  const id = useId()
  const [draft, setDraft] = useState(value ?? '')

  // Sincroniza cuando el valor cambia desde fuera —al limpiar la búsqueda desde
  // el estado vacío, por ejemplo—, sin pisar lo que el usuario está tecleando.
  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  useEffect(() => {
    if (draft === (value ?? '')) return undefined

    const timer = setTimeout(() => onChange(draft), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <form
      className="search"
      onSubmit={(event) => {
        // Enter aplica de inmediato, sin esperar el retardo.
        event.preventDefault()
        onChange(draft)
      }}
      role="search"
    >
      <label className="visually-hidden" htmlFor={id}>
        {label ?? t('common.search')}
      </label>

      <input
        className="control search__input"
        id={id}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? `${t('common.search')}…`}
        type="search"
        value={draft}
      />

      {draft ? (
        <button
          aria-label={t('common.clear')}
          className="search__clear"
          onClick={() => { setDraft(''); onChange('') }}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      ) : null}
    </form>
  )
}
