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
 *
 * @param {object}  [params]        Parámetros extra para acotar el listado.
 * @param {boolean} [isDisabled]    Deshabilita el control por una razón de dominio.
 * @param {string}  [disabledHint]  Por qué está deshabilitado. Un control gris y
 *   mudo deja al usuario sin saber si es un fallo o una regla.
 */
export function RelationSelect({
  endpoint,
  optionLabel,
  placeholder,
  value,
  onChange,
  name,
  params,
  isDisabled = false,
  disabledHint,
  ...props
}) {
  const [options, setOptions] = useState([])
  const [status, setStatus] = useState('loading')

  // Los parámetros se serializan para la dependencia del efecto: un objeto nuevo
  // en cada render dispararía una petición en cada render.
  const paramsKey = JSON.stringify(params ?? null)

  useEffect(() => {
    if (isDisabled) {
      setOptions([])
      setStatus('ready')
      return undefined
    }

    const controller = new AbortController()

    api.get(`/${endpoint}`, {
      params: { per_page: 50, ...(params ?? {}) },
      signal: controller.signal,
    })
      .then(({ data }) => {
        setOptions(data.data ?? [])
        setStatus('ready')
      })
      .catch((error) => {
        if (error.isCanceled) return
        setStatus('error')
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramsKey, isDisabled])

  function firstOptionLabel() {
    if (isDisabled) return disabledHint ?? t('common.select')
    if (status === 'loading') return t('common.loading')
    if (status === 'error') return t('common.errorTitle')
    if (options.length === 0) return t('common.noOptions')

    return placeholder ?? t('common.select')
  }

  return (
    <select
      {...props}
      className="control control--select"
      disabled={isDisabled || status !== 'ready' || props.disabled}
      name={name}
      onChange={onChange}
      value={value ?? ''}
    >
      <option value="">{firstOptionLabel()}</option>

      {options.map((option) => (
        <option key={option.id} value={option.id}>{optionLabel(option)}</option>
      ))}
    </select>
  )
}
