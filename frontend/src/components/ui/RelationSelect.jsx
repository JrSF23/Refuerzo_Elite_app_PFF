import { useEffect, useState } from 'react'

import { t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'

/**
 * Desplegable alimentado por otro recurso.
 *
 * Ofrece ÚNICAMENTE registros de la organización activa (FR-034), y no porque
 * filtre nada: el global scope del servidor ya devuelve solo lo del propio
 * centro. Enviar un identificador ajeno se rechaza con el mismo error que si no
 * existiera, así que la interfaz no puede filtrar información que no tiene.
 *
 * Se pide una página amplia en lugar de paginar: estos catálogos —tutores,
 * asignaturas, profesores— son pequeños en un centro. Si alguno creciera más
 * allá del tope de 50 por página que impone la API, haría falta un buscador
 * dentro del desplegable, y eso es una feature con su propia decisión.
 */
export function RelationSelect({
  endpoint,
  optionLabel,
  placeholder,
  value,
  onChange,
  name,
  ...props
}) {
  const [options, setOptions] = useState([])
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const controller = new AbortController()

    api.get(`/${endpoint}`, { params: { per_page: 50 }, signal: controller.signal })
      .then(({ data }) => {
        setOptions(data.data ?? [])
        setStatus('ready')
      })
      .catch((error) => {
        if (error.isCanceled) return
        setStatus('error')
      })

    return () => controller.abort()
  }, [endpoint])

  return (
    <select
      {...props}
      className="control control--select"
      disabled={status !== 'ready' || props.disabled}
      name={name}
      onChange={onChange}
      value={value ?? ''}
    >
      <option value="">
        {status === 'loading' ? t('common.loading') : (placeholder ?? t('common.select'))}
      </option>

      {options.map((option) => (
        <option key={option.id} value={option.id}>{optionLabel(option)}</option>
      ))}
    </select>
  )
}
