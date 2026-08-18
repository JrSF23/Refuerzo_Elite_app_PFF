import { t } from '../../i18n/index.js'
import { useSession } from '../../context/SessionContext.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { ResourcePage } from '../../components/data/ResourcePage.jsx'

/**
 * Cuentas de acceso.
 *
 * La única sección que comparten la administración del centro y la plataforma, y
 * con reglas distintas para cada una:
 *
 *   · El `org_admin` solo ve las de su centro, y NO envía la organización: el
 *     servidor la toma de su contexto. Los roles que puede asignar son los de
 *     organización.
 *   · El `super_admin` ve las de cualquier centro, DEBE indicar la organización
 *     —salvo al crear otro administrador de plataforma, que no pertenece a
 *     ninguna— y puede asignar los tres roles.
 *
 * La contraseña es obligatoria al crear y opcional al editar: dejarla vacía
 * significa «no la cambies», no «bórrala».
 */
export function UsersPage() {
  const { isPlatformAdmin } = useSession()

  const assignableRoles = isPlatformAdmin
    ? ['super_admin', 'org_admin', 'teacher']
    : ['org_admin', 'teacher']

  return (
    <ResourcePage
      columns={[
        { key: 'name', label: t('users.fields.name') },
        { key: 'username', label: t('users.fields.username') },
        { key: 'email', label: t('fields.email') },
        {
          key: 'roles',
          label: t('users.fields.role'),
          render: (record) => (record.roles ?? [])
            .map((role) => t(`roles.${role.name}`))
            .join(', ') || t('roles.none'),
        },
        {
          key: 'is_active',
          label: t('fields.status'),
          render: (record) => (
            <Badge tone={record.is_active ? 'success' : 'neutral'}>
              {t(record.is_active ? 'status.active' : 'status.inactive')}
            </Badge>
          ),
        },
      ]}
      emptyBody={t('users.emptyBody')}
      emptyTitle={t('users.emptyTitle')}
      fields={[
        { name: 'name', label: t('users.fields.name'), required: true },
        {
          name: 'username',
          label: t('users.fields.username'),
          required: true,
          hint: t('users.fields.usernameHint'),
        },
        { name: 'email', label: t('fields.email'), type: 'email', required: true },
        {
          name: 'password',
          label: t('users.fields.password'),
          type: 'password',
          hint: t('users.fields.passwordHint'),
        },
        {
          name: 'role',
          label: t('users.fields.role'),
          type: 'select',
          required: true,
          defaultValue: 'teacher',
          options: assignableRoles.map((role) => ({ value: role, label: t(`roles.${role}`) })),
        },
        /*
         * Solo la plataforma elige organización. Para el `org_admin` el campo ni
         * siquiera aparece: el servidor ignora lo que envíe y usa la suya, así
         * que mostrarlo sugeriría un control que no tiene.
         */
        ...(isPlatformAdmin ? [{
          name: 'organization_id',
          label: t('fields.organization'),
          type: 'relation',
          endpoint: 'organizations',
          optionLabel: (organization) => organization.name,
          hint: t('users.fields.organizationHint'),
        }] : []),
        {
          name: 'teacher_id',
          label: t('users.fields.teacherProfile'),
          type: 'relation',
          endpoint: 'teachers',
          optionLabel: (teacher) => teacher.full_name,
          hint: t('users.fields.teacherProfileHint'),
        },
      ]}
      getRecordName={(record) => record.name}
      section="users"
    />
  )
}
