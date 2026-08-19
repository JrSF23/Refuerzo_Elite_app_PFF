import { t } from '../../i18n/index.js'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Profesores.
 *
 * Es la FICHA del profesor, distinta de su CUENTA de acceso. El vínculo entre
 * ambas se hace desde Cuentas mediante `teacher_id`, no desde aquí: una ficha
 * puede existir sin cuenta —un profesor que no usa la aplicación— y el servidor
 * resuelve el alcance del profesor por ese vínculo, no por el correo.
 */
export function TeachersPage() {
  return (
    <ResourcePage
      columns={[
        { key: 'full_name', label: t('teachers.fields.fullName') },
        { key: 'specialty', label: t('teachers.fields.specialty') },
        { key: 'phone', label: t('fields.phone') },
        { key: 'email', label: t('fields.email') },
      ]}
      emptyBody={t('teachers.emptyBody')}
      emptyTitle={t('teachers.emptyTitle')}
      fields={[
        { name: 'first_name', label: t('fields.firstName'), required: true },
        { name: 'last_name', label: t('fields.lastName'), required: true },
        { name: 'email', label: t('fields.email'), type: 'email' },
        { name: 'phone', label: t('fields.phone'), type: 'tel' },
        { name: 'specialty', label: t('teachers.fields.specialty') },
        { name: 'bio', label: t('teachers.fields.bio'), type: 'textarea' },
      ]}
      getRecordName={(record) => record.full_name}
      section="teachers"
    />
  )
}
