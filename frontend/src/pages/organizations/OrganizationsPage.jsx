import { useState } from 'react'

import { formatNumber, t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { OrganizationStatusBadge } from '../../components/ui/Badge.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Organizaciones: el trabajo del operador de la plataforma.
 *
 * Dos cosas que la distinguen del resto de secciones:
 *
 * 1. **Suspender y activar** no son campos del formulario sino acciones propias,
 *    porque el estado de una organización corta el acceso de todo su personal.
 *    Enterrarlo en un desplegable entre otros seis campos lo convertiría en algo
 *    que se cambia sin querer.
 *
 * 2. **Solo se muestra `users_count`.** El servidor no expone recuentos de
 *    alumnos ni de pagos, deliberadamente: el administrador de plataforma no
 *    debe conocer el contenido de un centro. La interfaz no intenta completarlo
 *    por otra vía.
 */
export function OrganizationsPage() {
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  async function changeStatus(organization, action) {
    setBusyId(organization.id)

    try {
      await api.post(`/organizations/${organization.id}/${action}`)
      toast.success(t(action === 'suspend' ? 'organizations.suspended' : 'organizations.activated'))
      setReloadKey((key) => key + 1)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('organizations.fields.name') },
        { key: 'slug', label: t('organizations.fields.slug') },
        { key: 'contact_email', label: t('organizations.fields.contactEmail') },
        {
          key: 'users_count',
          label: t('organizations.fields.users'),
          render: (record) => (
            <span className="tabular">{formatNumber(record.users_count ?? 0)}</span>
          ),
        },
        {
          key: 'status',
          label: t('fields.status'),
          render: (record) => <OrganizationStatusBadge value={record.status} />,
        },
      ]}
      emptyBody={t('organizations.emptyBody')}
      emptyTitle={t('organizations.emptyTitle')}
      // `reloadKey` fuerza el remontado tras suspender o activar, para que el
      // listado refleje el estado nuevo sin duplicar la lógica de recarga.
      key={reloadKey}
      extraRowActions={(record) => (
        record.status === 'active' ? (
          <Button
            isLoading={busyId === record.id}
            onClick={() => changeStatus(record, 'suspend')}
            size="sm"
          >
            {t('organizations.suspend')}
          </Button>
        ) : (
          <Button
            isLoading={busyId === record.id}
            onClick={() => changeStatus(record, 'activate')}
            size="sm"
          >
            {t('organizations.activate')}
          </Button>
        )
      )}
      fields={[
        { name: 'name', label: t('organizations.fields.name'), required: true },
        {
          name: 'slug',
          label: t('organizations.fields.slug'),
          hint: t('organizations.fields.slugHint'),
        },
        {
          name: 'contact_email',
          label: t('organizations.fields.contactEmail'),
          type: 'email',
        },
        {
          name: 'contact_phone',
          label: t('organizations.fields.contactPhone'),
          type: 'tel',
        },
      ]}
      getRecordName={(record) => record.name}
      section="organizations"
    />
  )
}
