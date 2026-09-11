import { formatAmount, formatNumber, t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Etapas educativas y su cuota.
 *
 * La etapa es la unidad de cobro del centro: en Guinea Ecuatorial se paga por
 * nivel —Pre-escolar, Primaria (PEP), ESBA, Bachillerato— y no por asignatura.
 * Todos los cursos de una etapa cuestan lo mismo: del 1º al 6º de PEP se paga
 * igual, y 1º Bach CC vale lo mismo que 2º Bach Hum.
 *
 * Los nombres y los importes son del CENTRO, no del sistema. La demo siembra las
 * cuatro etapas de Guinea con cifras verosímiles, pero cada centro fija las
 * suyas, y por eso esto es una pantalla de gestión y no una lista fija.
 *
 * El recuento de aulas no es adorno: antes de cambiar una cuota conviene ver a
 * cuántas afecta, y antes de borrar una etapa, si queda alguna colgando.
 */
export function StagesPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('stages.fields.name') },
        {
          key: 'fee',
          label: t('stages.fields.fee'),
          render: (record) => <span className="tabular">{formatAmount(record.fee)}</span>,
        },
        {
          key: 'tutor_groups_count',
          label: t('stages.fields.groups'),
          render: (record) => (
            <span className="tabular">{formatNumber(record.tutor_groups_count ?? 0)}</span>
          ),
        },
      ]}
      emptyBody={t('stages.emptyBody')}
      emptyTitle={t('stages.emptyTitle')}
      fields={[
        { name: 'name', label: t('stages.fields.name'), required: true },
        {
          name: 'fee',
          label: t('stages.fields.fee'),
          type: 'number',
          step: '0.01',
          required: true,
          hint: t('stages.fields.feeHint'),
        },
        {
          name: 'sort_order',
          label: t('stages.fields.order'),
          type: 'number',
          step: '1',
          hint: t('stages.fields.orderHint'),
        },
      ]}
      getRecordName={(record) => record.name}
      section="stages"
    />
  )
}
