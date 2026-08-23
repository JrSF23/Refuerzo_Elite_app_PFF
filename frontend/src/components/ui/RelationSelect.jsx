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
 * SOLO PARA RECURSOS QUE EL SERVIDOR NO SABE BUSCAR —matrículas y sesiones—.
 * El resto usa `SearchSelect`; el reparto lo decide `endpointIsSearchable`.
 *
 * Se pide una página y se pinta entera, que es lo único que se puede hacer sin
 * búsqueda. Como la API tope `per_page` en 50, el listado PUEDE QUEDARSE CORTO,
 * y entonces se dice: callarlo es lo que hacía que el usuario concluyera que el
 * registro no existe cuando lo que pasaba es que no se había traído. Cuando
 * estos dos recursos declaren campos buscables, pasan a `SearchSelect` y este
 * componente desaparece.
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
  /*
   * Se recoge para DESCARTARLO. `ResourcePage` no sabe qué control va a tocar
   * —lo decide `endpointIsSearchable` en el momento— así que pasa `optionMeta`
   * siempre; solo `SearchSelect` lo usa. Sin esta línea cae en `...props` y se
   * vuelca sobre el `<select>` de abajo: React avisa por consola de un atributo
   * que no reconoce, en todo campo de relación de un recurso no buscable
   * —matrículas, sesiones, asistencias y pagos—.
   *
   * Un desplegable NO lo pinta porque no tiene dónde: sus opciones son texto
   * plano, sin sitio para un dato secundario atenuado.
   */
  // eslint-disable-next-line no-unused-vars
  optionMeta,
  ...props
}) {
  const [options, setOptions] = useState([])
  const [total, setTotal] = useState(0)
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
        setTotal(data.total ?? 0)
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

  const isTruncated = status === 'ready' && total > options.length

  return (
    <>
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

      {isTruncated ? (
        <p className="field__hint field__hint--warning">
          {t('common.truncatedOptions', { shown: options.length, total })}
        </p>
      ) : null}
    </>
  )
}
