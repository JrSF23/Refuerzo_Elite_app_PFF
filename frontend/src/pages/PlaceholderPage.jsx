import { t } from '../i18n/index.js'
import { Breadcrumbs } from '../components/layout/Breadcrumbs.jsx'
import { Card, CardBody } from '../components/ui/Card.jsx'
import { EmptyState } from '../components/data/states.jsx'

/**
 * Marcador temporal de sección.
 *
 * ANDAMIO DE LA FASE 1, no una pantalla del producto. Existe para que el
 * enrutado y las guardas por rol puedan verificarse ya —escenarios 1 y 2 del
 * quickstart— manteniendo la aplicación desplegable, como exige el Principio X.
 *
 * Cada fase posterior sustituye uno de estos marcadores por su pantalla real.
 * Al cerrar la fase 5 no debe quedar ninguno; si queda, es una sección que se
 * olvidó de construir.
 */
export function PlaceholderPage({ section }) {
  const title = t(`${section}.title`)

  return (
    <>
      <Breadcrumbs items={[{ label: title }]} />

      <h1 className="page-title">{title}</h1>

      <Card>
        <CardBody>
          <EmptyState
            body={t('common.sectionPendingBody')}
            title={t('common.sectionPendingTitle')}
          />
        </CardBody>
      </Card>
    </>
  )
}
