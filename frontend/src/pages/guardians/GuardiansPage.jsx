import { t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/** Tutores. Cerrada al profesor: solo la administración del centro los gestiona. */
export function GuardiansPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'full_name', label: t('guardians.fields.fullName') },
        { key: 'relationship_label', label: t('guardians.fields.relationship') },
        { key: 'phone', label: t('fields.phone') },
        { key: 'email', label: t('fields.email') },
      ]}
      emptyBody={t('guardians.emptyBody')}
      emptyTitle={t('guardians.emptyTitle')}
      fields={[
        { name: 'first_name', label: t('fields.firstName'), required: true },
        { name: 'last_name', label: t('fields.lastName'), required: true },
        // Obligatorio en la API, a diferencia del correo: es la vía de contacto
        // que el centro necesita tener siempre.
        { name: 'phone', label: t('fields.phone'), type: 'tel', required: true },
        {
          name: 'relationship_label',
          label: t('guardians.fields.relationship'),
          required: true,
          hint: t('guardians.fields.relationshipHint'),
        },
        { name: 'email', label: t('fields.email'), type: 'email' },
        { name: 'address', label: t('fields.address') },
        { name: 'notes', label: t('fields.notes'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.full_name}
      section="guardians"
    />
  )
}
