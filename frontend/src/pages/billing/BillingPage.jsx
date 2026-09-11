import { EMPTY_VALUE, formatAmount, t } from '../../i18n/index.js'
import { useResourceList } from '../../hooks/useResourceList.js'
import { Breadcrumbs } from '../../components/layout/Breadcrumbs.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { DataTable } from '../../components/data/DataTable.jsx'

/**
 * Estado de cobros.
 *
 * Responde a la pregunta que un centro se hace a diario y que la aplicación no
 * sabía contestar: **¿quién debe y cuánto?**. La etapa sabía lo que cuesta el
 * curso y los pagos sabían lo ingresado, pero nadie restaba una cosa de la otra.
 *
 * La cuota sale del AULA: el alumno está en un aula, el aula declara su etapa y
 * la etapa lleva el importe del curso.
 *
 * ── «Sin cuota» no es «debe cero» ───────────────────────────────────────────
 *
 * Un alumno sin aula, o cuya aula no tenga etapa todavía, aparece con «Sin
 * cuota» y no con una deuda de cero ni con el importe completo. El centro aún no
 * ha dicho cuánto cuesta lo suyo, y fingir una cifra —en cualquiera de los dos
 * sentidos— convierte un dato que falta en una afirmación sobre una familia.
 *
 * ── Solo cuenta lo COBRADO ──────────────────────────────────────────────────
 *
 * Un pago pendiente o anulado no reduce lo que se debe. Meterlo en la suma haría
 * desaparecer de la lista justo a quien hay que reclamar.
 */
export function BillingPage() {
  const rows = useResourceList('billing', { perPage: 20 })

  return (
    <>
      <Breadcrumbs items={[{ label: t('billing.title') }]} />

      <div className="page-head">
        <h1 className="page-title">{t('billing.title')}</h1>
      </div>

      <p className="page-intro">{t('billing.intro')}</p>

      {/* `DataTable` trae su propia caja de búsqueda y su paginación: se le
          pasan y no se montan aparte, como en el resto de la aplicación. */}
      <div className="table-card">
        <DataTable
          columns={[
            { key: 'full_name', label: t('fields.student') },
            {
              key: 'tutor_group',
              label: t('fields.group'),
              render: (row) => row.tutor_group ?? (
                <span className="text-muted">{t('tutorGroups.unassigned')}</span>
              ),
            },
            {
              key: 'stage',
              label: t('billing.fields.stage'),
              render: (row) => row.stage ?? (
                <span className="text-muted">{t('billing.noFee')}</span>
              ),
            },
            {
              key: 'fee',
              label: t('billing.fields.fee'),
              render: (row) => (
                <span className="tabular">
                  {row.fee === null ? EMPTY_VALUE : formatAmount(row.fee)}
                </span>
              ),
            },
            {
              key: 'paid',
              label: t('billing.fields.paid'),
              render: (row) => <span className="tabular">{formatAmount(row.paid)}</span>,
            },
            {
              key: 'outstanding',
              label: t('billing.fields.outstanding'),
              render: (row) => <Outstanding value={row.outstanding} />,
            },
          ]}
          emptyBody={t('billing.emptyBody')}
          emptyTitle={t('billing.emptyTitle')}
          error={rows.error}
          getRowKey={(row) => row.id}
          onPageChange={rows.setPage}
          onRetry={rows.refresh}
          onSearchChange={rows.setSearch}
          pagination={rows.pagination}
          records={rows.records}
          search={rows.search}
          searchable
          status={rows.status}
        />
      </div>
    </>
  )
}

/**
 * Lo pendiente, con su estado dicho en palabras.
 *
 * El distintivo lleva TEXTO además de color: «Al día» y «Pendiente» se leen
 * igual en escala de grises, y quien no distingue el verde del ámbar no puede
 * quedarse sin saber quién debe.
 */
function Outstanding({ value }) {
  if (value === null) {
    return <span className="text-muted">{t('billing.noFee')}</span>
  }

  if (value <= 0) {
    return <Badge tone="success">{t('billing.settled')}</Badge>
  }

  return (
    <span className="billing__due">
      <span className="tabular">{formatAmount(value)}</span>
      <Badge tone="warning">{t('billing.due')}</Badge>
    </span>
  )
}
