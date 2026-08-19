import { Component } from 'react'

import { t } from '../i18n/index.js'

/**
 * Límite de error.
 *
 * Sin esto, CUALQUIER excepción durante el render desmonta el árbol entero y
 * deja la página en blanco: React lo hace a propósito desde la versión 16, para
 * no dejar una interfaz a medias mostrando datos incoherentes. El problema es
 * que una pantalla en blanco no dice nada —ni al usuario, que no sabe si esperar
 * o recargar, ni a quien tiene que diagnosticarlo—.
 *
 * Tiene que ser un componente de clase: los ganchos no pueden capturar errores
 * de render, y `componentDidCatch` no tiene equivalente en función.
 */
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // A la consola siempre: es lo único que permite diagnosticar el fallo de un
    // usuario que solo puede decir «se ha quedado en blanco».
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleReset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state

    if (!error) {
      return this.props.children
    }

    return (
      <div className="boot">
        <div className="crash" role="alert">
          <h1 className="crash__title">{t('common.crashTitle')}</h1>
          <p className="crash__body">{t('common.crashBody')}</p>

          {/* El mensaje técnico solo en desarrollo: en producción no aporta nada
              al usuario y puede revelar detalles internos. */}
          {import.meta.env.DEV ? (
            <pre className="crash__detail">{error.message}</pre>
          ) : null}

          <div className="crash__actions">
            <button className="btn btn--secondary" onClick={this.handleReset} type="button">
              {t('common.retry')}
            </button>

            <button
              className="btn btn--primary"
              onClick={() => window.location.assign('/')}
              type="button"
            >
              {t('common.backToStart')}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
