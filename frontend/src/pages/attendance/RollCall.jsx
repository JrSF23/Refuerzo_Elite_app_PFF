import { useCallback, useEffect, useState } from 'react'

import { t } from '../../i18n/index.js'
import { api } from '../../lib/api.js'
import { useToast } from '../../context/ToastContext.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Drawer } from '../../components/ui/Drawer.jsx'
import { ErrorState, LoadingState } from '../../components/data/states.jsx'

/** Los cuatro estados, en el orden en que se usan al pasar lista. */
const ESTADOS = ['present', 'absent', 'late', 'excused']

/**
 * Pasar lista: la clase entera de una vez.
 *
 * Antes la asistencia se creaba de una en una, eligiendo alumno y sesión en dos
 * desplegables. Para un profesor con 25 alumnos eso son 25 altas, 50
 * selecciones y una oportunidad de equivocarse en cada una. No es como se pasa
 * lista en ningún sitio: se pasa mirando la lista de la clase de arriba abajo.
 *
 * ── La lista la compone el servidor ─────────────────────────────────────────
 *
 * Salen los alumnos MATRICULADOS en el grupo de la sesión, y solo esos. No se
 * elige a quién marcar, porque la lista ES la clase; eso además impide de raíz
 * el otro medio error de antes: registrar a un alumno en la sesión de un grupo
 * en el que no está.
 *
 * ── Nadie nace presente ─────────────────────────────────────────────────────
 *
 * Quien no se ha marcado todavía aparece «Sin marcar», no como presente. Poner
 * la clase entera en presente al abrir la pantalla convertiría el descuido en un
 * dato: bastaría con abrir y guardar para dar por asistida una clase que nadie
 * miró. Y por eso se avisa de cuántos quedan sin marcar antes de guardar.
 *
 * ── Volver sobre la lista corrige, no duplica ───────────────────────────────
 *
 * Lo ya marcado llega con la lista y se pinta seleccionado, así que reabrirla
 * para corregir a uno no toca a los demás. El servidor actualiza en vez de
 * crear, de modo que pasar lista dos veces deja una fila por alumno.
 */
export function RollCall({ sessionId, sessionTitle, isOpen, onClose, onSaved }) {
  const toast = useToast()

  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  const load = useCallback(async (signal) => {
    setStatus('loading')

    try {
      const { data } = await api.get(`/class-sessions/${sessionId}/roll`, { signal })

      setRows(data.students)
      setStatus('ready')
    } catch (problem) {
      if (problem.isCanceled) return

      setError(problem)
      setStatus('error')
    }
  }, [sessionId])

  useEffect(() => {
    if (!isOpen || !sessionId) return undefined

    const controller = new AbortController()
    load(controller.signal)

    return () => controller.abort()
  }, [isOpen, sessionId, load])

  function setStudentStatus(studentId, value) {
    setRows((current) => current.map((row) => (
      row.student_id === studentId ? { ...row, status: value || null } : row
    )))
  }

  /** Marca de golpe a los que aún no tienen estado. */
  function fillUnmarked(value) {
    setRows((current) => current.map((row) => (
      row.status === null ? { ...row, status: value } : row
    )))
  }

  const unmarked = rows.filter((row) => row.status === null).length

  async function save() {
    const entries = rows
      .filter((row) => row.status !== null)
      .map((row) => ({ student_id: row.student_id, status: row.status, comment: row.comment }))

    if (entries.length === 0) {
      toast.error(t('attendance.roll.nothingToSave'))
      return
    }

    setIsSaving(true)

    try {
      await api.post(`/class-sessions/${sessionId}/roll`, { entries })
      toast.success(t('attendance.roll.saved', { count: entries.length }))
      onSaved?.()
      onClose()
    } catch (problem) {
      toast.error(problem.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={isSaving ? undefined : onClose}
      side="right"
      title={sessionTitle ? `${t('attendance.roll.title')} — ${sessionTitle}` : t('attendance.roll.title')}
    >
      {status === 'loading' ? <LoadingState rows={5} /> : null}

      {status === 'error' ? (
        <ErrorState message={error?.message} onRetry={() => load()} />
      ) : null}

      {status === 'ready' ? (
        <>
          {/* Atajo para el caso corriente: casi todos vinieron. Rellena SOLO a
              los que están sin marcar, así que no pisa lo ya decidido. */}
          {unmarked > 0 ? (
            <div className="roll__bulk">
              <span className="roll__pending">
                {t('attendance.roll.unmarked', { count: unmarked })}
              </span>
              <Button onClick={() => fillUnmarked('present')} size="sm">
                {t('attendance.roll.markRestPresent')}
              </Button>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <p className="roll__empty">{t('attendance.roll.noStudents')}</p>
          ) : (
            <ul className="roll">
              {rows.map((row) => (
                <li className="roll__row" key={row.student_id}>
                  <label className="roll__name" htmlFor={`roll-${row.student_id}`}>
                    {row.full_name}
                  </label>

                  <select
                    className="control roll__select"
                    id={`roll-${row.student_id}`}
                    onChange={(event) => setStudentStatus(row.student_id, event.target.value)}
                    value={row.status ?? ''}
                  >
                    {/* La opción vacía se queda: es la única forma de expresar
                        «todavía no lo he mirado», y quitarla obligaría a mentir. */}
                    <option value="">{t('attendance.roll.unset')}</option>
                    {ESTADOS.map((estado) => (
                      <option key={estado} value={estado}>
                        {t(`attendanceStatus.${estado}`)}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}

          <div className="roll__actions">
            <Button disabled={isSaving} onClick={onClose}>
              {t('common.cancel')}
            </Button>

            <Button isLoading={isSaving} onClick={save} variant="primary">
              {t('attendance.roll.save')}
            </Button>
          </div>
        </>
      ) : null}
    </Drawer>
  )
}
