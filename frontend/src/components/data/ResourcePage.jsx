import { useCallback, useState } from 'react'

import { t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { SECTIONS, canWrite } from '../../lib/permissions.js'
import { useSession } from '../../context/SessionContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useResourceList } from '../../hooks/useResourceList.js'
import { useResourceForm } from '../../hooks/useResourceForm.js'
import { Breadcrumbs } from '../layout/Breadcrumbs.jsx'
import { Button } from '../ui/Button.jsx'
import { Drawer } from '../ui/Drawer.jsx'
import { Field, Input, Select, Textarea } from '../ui/Field.jsx'
import { RelationSelect } from '../ui/RelationSelect.jsx'
import { DataTable } from './DataTable.jsx'
import { ConfirmDialog } from './ConfirmDialog.jsx'

/**
 * Pantalla de entidad: listado, formulario y borrado.
 *
 * Es un COMPUESTO reutilizable, no una pantalla genérica dirigida por
 * configuración. La diferencia importa: el `ModulePage` anterior renderizaba
 * nueve entidades desde un objeto de configuración, y por eso ninguna podía
 * apartarse de lo que el objeto permitía —de ahí que se mostrara búsqueda donde
 * la API la ignora—. Aquí cada pantalla es su propio fichero, declara sus
 * columnas y sus campos, y puede divergir cuando su dominio lo pida.
 *
 * @param {string} section  Clave de `lib/permissions.js`: de ahí salen el
 *   endpoint, la ruta, si admite búsqueda y qué puede hacer el rol.
 */
export function ResourcePage({
  section,
  columns,
  fields,
  getRecordName,
  emptyTitle,
  emptyBody,
  perPage,
  /** Convierte la página cargada en bloques. Si no se pasa, listado plano. */
  buildBlocks,
  renderBlockHeader,
}) {
  const { roleNames } = useSession()
  const toast = useToast()

  const definition = SECTIONS[section]
  const canModify = canWrite(section, roleNames)

  const list = useResourceList(definition.endpoint, { perPage })

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleSaved = useCallback((record, { wasEditing }) => {
    setIsFormOpen(false)
    toast.success(t(wasEditing ? 'common.savedChanges' : 'common.created'))
    list.refresh()
  }, [toast, list])

  const form = useResourceForm({
    endpoint: definition.endpoint,
    fields,
    onSaved: handleSaved,
  })

  function openCreate() {
    form.startCreate()
    setIsFormOpen(true)
  }

  function openEdit(record) {
    form.startEdit(record)
    setIsFormOpen(true)
  }

  async function confirmDelete() {
    setIsDeleting(true)

    try {
      await api.delete(`/${definition.endpoint}/${pendingDelete.id}`)
      toast.success(t('common.deleted'))
      setPendingDelete(null)
      list.refreshAfterDelete()
    } catch (error) {
      // El mensaje del servidor manda: puede explicar por qué NO se puede
      // borrar —una organización con cuentas activas, por ejemplo—.
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const title = t(`${section}.title`)

  return (
    <>
      <Breadcrumbs items={[{ label: title }]} />

      <div className="page-head">
        <h1 className="page-title">{title}</h1>

        {/* Sin permiso de escritura no hay acción de crear. No es seguridad
            —el servidor autoriza igual—, es no ofrecer lo que va a fallar. */}
        {canModify ? (
          <Button onClick={openCreate} variant="primary">
            {t(`${section}.create`)}
          </Button>
        ) : null}
      </div>

      <DataTable
        blocks={buildBlocks ? buildBlocks(list.records) : null}
        columns={columns}
        emptyAction={canModify ? (
          <Button onClick={openCreate} variant="primary">{t(`${section}.create`)}</Button>
        ) : null}
        emptyBody={emptyBody}
        emptyTitle={emptyTitle ?? t('common.noRecordsTitle')}
        error={list.error}
        onPageChange={list.setPage}
        onRetry={list.refresh}
        onSearchChange={list.setSearch}
        pagination={list.pagination}
        records={list.records}
        rowActions={canModify ? (record) => (
          <>
            <Button onClick={() => openEdit(record)} size="sm">
              {t('common.edit')}
            </Button>
            <Button onClick={() => setPendingDelete(record)} size="sm" variant="danger">
              {t('common.delete')}
            </Button>
          </>
        ) : undefined}
        renderBlockHeader={renderBlockHeader}
        search={list.search}
        searchable={definition.searchable}
        status={list.status}
      />

      <Drawer
        isOpen={isFormOpen}
        onClose={form.isSaving ? undefined : () => setIsFormOpen(false)}
        title={form.isEditing ? t(`${section}.edit`) : t(`${section}.create`)}
      >
        <form className="resource-form" noValidate onSubmit={form.submit} ref={form.formRef}>
          {form.generalError ? (
            <p className="alert alert--error" role="alert">{form.generalError}</p>
          ) : null}

          {fields.map((field) => (
            <FormField field={field} form={form} key={field.name} />
          ))}

          <div className="resource-form__actions">
            <Button disabled={form.isSaving} onClick={() => setIsFormOpen(false)} type="button">
              {t('common.cancel')}
            </Button>

            <Button isLoading={form.isSaving} type="submit" variant="primary">
              {form.isEditing ? t('common.saveChanges') : t('common.create')}
            </Button>
          </div>
        </form>
      </Drawer>

      <ConfirmDialog
        isBusy={isDeleting}
        isOpen={pendingDelete !== null}
        name={pendingDelete ? getRecordName(pendingDelete) : ''}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  )
}

/** Un campo del formulario, con el control que le corresponde a su tipo. */
function FormField({ field, form }) {
  const value = form.values[field.name] ?? ''
  const error = form.fieldErrors[field.name]?.[0]

  const common = (props) => ({
    ...props,
    name: field.name,
    value,
    onChange: (event) => form.setValue(field.name, event.target.value),
  })

  return (
    <Field error={error} hint={field.hint} label={field.label} required={field.required}>
      {(props) => {
        if (field.type === 'textarea') {
          return <Textarea {...common(props)} rows={field.rows ?? 3} />
        }

        /*
         * Relación con otra entidad. El desplegable se alimenta del recurso que
         * indique el campo, acotado por el servidor a la organización activa
         * (FR-034).
         *
         * `params` e `isDisabled` pueden ser funciones del estado del formulario:
         * es lo que permite que el delegado ofrezca solo alumnos DEL GRUPO que se
         * está editando, y que quede deshabilitado al crear, cuando el grupo
         * todavía no tiene alumnos.
         */
        if (field.type === 'relation') {
          const resolve = (value) => (typeof value === 'function' ? value(form) : value)

          return (
            <RelationSelect
              {...common(props)}
              disabledHint={field.disabledHint}
              endpoint={field.endpoint}
              isDisabled={resolve(field.isDisabled) ?? false}
              optionLabel={field.optionLabel}
              params={resolve(field.params)}
              placeholder={field.placeholder}
            />
          )
        }

        if (field.type === 'select') {
          return (
            <Select {...common(props)} placeholder={field.placeholder ?? ''}>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          )
        }

        return (
          <Input
            {...common(props)}
            // `step` en los decimales: sin él, el navegador rechaza los
            // céntimos en un campo numérico y el usuario no ve por qué.
            step={field.type === 'number' ? (field.step ?? '0.01') : undefined}
            type={field.type ?? 'text'}
          />
        )
      }}
    </Field>
  )
}
