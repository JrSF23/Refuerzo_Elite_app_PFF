import { formatAmount, t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Asignaturas.
 *
 * CERRADA AL PROFESOR (FR-037): lleva `monthly_fee`, y es una de las tres
 * entidades con campos monetarios que el servidor le veda. No basta con ocultar
 * la sección en la navegación —el servidor responde 403 igualmente—, pero
 * ofrecerla sería contradecir una garantía del producto.
 */
export function SubjectsPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('fields.name') },
        { key: 'code', label: t('fields.code') },
        { key: 'level', label: t('fields.level') },
        {
          key: 'monthly_fee',
          label: t('subjects.fields.monthlyFee'),
          // Con separador de millar y dos decimales, nunca como número desnudo
          // (SC-010).
          render: (record) => <span className="tabular">{formatAmount(record.monthly_fee)}</span>,
        },
      ]}
      emptyBody={t('subjects.emptyBody')}
      emptyTitle={t('subjects.emptyTitle')}
      fields={[
        { name: 'name', label: t('fields.name'), required: true },
        {
          name: 'code',
          label: t('fields.code'),
          required: true,
          hint: t('subjects.fields.codeHint'),
        },
        { name: 'level', label: t('fields.level') },
        {
          name: 'monthly_fee',
          label: t('subjects.fields.monthlyFee'),
          type: 'number',
          required: true,
        },
        { name: 'description', label: t('fields.description'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.name}
      section="subjects"
    />
  )
}
