import { t } from '../../i18n/index.js'
import { Button } from '../ui/Button.jsx'

/**
 * Los tres estados de una vista con datos remotos.
 *
 * Tienen que ser DISTINGUIBLES entre sí (FR-041). Es la confusión más común y la
 * más dañina: si «cargando», «no hay nada» y «ha fallado» se parecen, el usuario
 * no sabe si esperar, si crear el primer registro o si reintentar.
 */

/**
 * Estado de carga.
 *
 * Reserva la altura del contenido que va a aparecer (FR-042). Sin eso, la página
 * crece de golpe al llegar los datos y desplaza lo que el usuario estaba a punto
 * de pulsar.
 *
 * ── Un solo indicador, no tres ──────────────────────────────────────────────
 *
 * Antes se enseñaban a la vez el esqueleto, una ruleta y el texto «Cargando…».
 * Tres cosas diciendo lo mismo compiten entre sí y convierten una espera
 * tranquila en una pantalla nerviosa. El esqueleto solo ya dice «viene
 * contenido», y lo dice mejor que las otras dos: enseña CUÁNTO viene y con qué
 * forma.
 *
 * El texto no desaparece, se vuelve invisible: `role="status"` lo anuncia a
 * quien usa lector de pantalla, que es quien de verdad lo necesitaba —un
 * esqueleto no se puede leer en voz alta—.
 *
 * ── La forma importa ────────────────────────────────────────────────────────
 *
 * `variant` hace que el hueco se parezca a lo que va a ocuparlo. Unas barras
 * genéricas dejan claro que algo carga, pero la transición al llegar los datos
 * es un salto; cuando el esqueleto tiene la forma de la tabla o de las tarjetas,
 * el contenido parece revelarse en su sitio en lugar de sustituir a otra cosa.
 */
export function LoadingState({ rows = 5, label, variant = 'rows' }) {
  return (
    <div className="state state--loading">
      <div aria-hidden="true" className={`skeleton skeleton--${variant}`}>
        {Array.from({ length: rows }, (_, index) => (
          <div className="skeleton__row" key={index}>
            {variant === 'rows' ? null : (
              <>
                <span className="skeleton__bar skeleton__bar--wide" />
                <span className="skeleton__bar skeleton__bar--narrow" />
              </>
            )}
          </div>
        ))}
      </div>

      {/* Sin `aria-live`: el anuncio de `role="status"` basta y llega solo
          cuando el elemento aparece, que es cuando hay algo que decir. */}
      <p className="visually-hidden" role="status">
        {label ?? t('common.loading')}
      </p>
    </div>
  )
}

/**
 * Estado vacío.
 *
 * Distingue «todavía no hay registros» de «la búsqueda no encontró nada»
 * (FR-043). No es un matiz cosmético: en el primer caso la acción útil es crear
 * el primer registro; en el segundo, limpiar la búsqueda. Ofrecer «crear» a
 * quien acaba de buscar mal es desorientarlo.
 */
export function EmptyState({ title, body, action, icon }) {
  return (
    <div className="state state--empty">
      {icon ? <div aria-hidden="true" className="state__icon">{icon}</div> : null}
      <p className="state__title">{title}</p>
      {body ? <p className="state__body">{body}</p> : null}
      {action ? <div className="state__action">{action}</div> : null}
    </div>
  )
}

export function NoResultsState({ term, onClear }) {
  return (
    <EmptyState
      action={<Button onClick={onClear}>{t('common.clear')}</Button>}
      body={t('common.noResultsBody', { term })}
      title={t('common.noResultsTitle')}
    />
  )
}

/**
 * Estado de error.
 *
 * Siempre con reintento que NO recarga la página (FR-044): recargar pierde el
 * contexto —la página en la que estaba, lo que había escrito— por un fallo que
 * probablemente sea pasajero.
 */
export function ErrorState({ title, message, onRetry }) {
  return (
    <div className="state state--error" role="alert">
      <p className="state__title">{title ?? t('common.errorTitle')}</p>
      <p className="state__body">{message ?? t('common.errorBody')}</p>

      {onRetry ? (
        <div className="state__action">
          <Button onClick={onRetry} variant="secondary">{t('common.retry')}</Button>
        </div>
      ) : null}
    </div>
  )
}
