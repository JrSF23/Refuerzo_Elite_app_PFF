import { lazy, useCallback, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { SessionProvider, useSession } from './context/SessionContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { RequireAuth, RequireSection } from './components/RequireAuth.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import { SECTIONS } from './lib/permissions.js'
import { LoginPage } from './pages/LoginPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { LocaleContext } from './context/LocaleContext.js'
import { getLocale, setLocale } from './i18n/index.js'

/*
 * Las pantallas viajan en su propio fichero y se descargan al entrar en ellas.
 *
 * Antes TODO iba en un bundle único: quien abría el panel descargaba también
 * pagos, matrículas, organizaciones y las otras dieciséis pantallas que no iba a
 * ver. Por el túnel, donde una descarga cuesta segundos, eso se paga entero
 * antes de pintar nada.
 *
 * `LoginPage` y `DashboardPage` se quedan ESTÁTICAS a propósito: son el camino
 * crítico —se entra por una y se aterriza en la otra— y diferirlas añadiría una
 * ida y vuelta justo donde más se nota. El resto se difiere.
 */
const StudentsPage = lazy(() => import('./pages/students/StudentsPage.jsx').then((m) => ({ default: m.StudentsPage })))
const AllStudentsPage = lazy(() => import('./pages/students/AllStudentsPage.jsx').then((m) => ({ default: m.AllStudentsPage })))
const GroupStudentsPage = lazy(() => import('./pages/students/GroupStudentsPage.jsx').then((m) => ({ default: m.GroupStudentsPage })))
const GroupSubjectsPage = lazy(() => import('./pages/classGroups/GroupSubjectsPage.jsx').then((m) => ({ default: m.GroupSubjectsPage })))
const GuardiansPage = lazy(() => import('./pages/guardians/GuardiansPage.jsx').then((m) => ({ default: m.GuardiansPage })))
const TeachersPage = lazy(() => import('./pages/teachers/TeachersPage.jsx').then((m) => ({ default: m.TeachersPage })))
const BillingPage = lazy(() => import('./pages/billing/BillingPage.jsx').then((m) => ({ default: m.BillingPage })))
const StagesPage = lazy(() => import('./pages/stages/StagesPage.jsx').then((m) => ({ default: m.StagesPage })))
const SubjectsPage = lazy(() => import('./pages/subjects/SubjectsPage.jsx').then((m) => ({ default: m.SubjectsPage })))
const TutorGroupsPage = lazy(() => import('./pages/tutorGroups/TutorGroupsPage.jsx').then((m) => ({ default: m.TutorGroupsPage })))
const ClassGroupsPage = lazy(() => import('./pages/classGroups/ClassGroupsPage.jsx').then((m) => ({ default: m.ClassGroupsPage })))
const EnrollmentsPage = lazy(() => import('./pages/enrollments/EnrollmentsPage.jsx').then((m) => ({ default: m.EnrollmentsPage })))
const SessionsPage = lazy(() => import('./pages/sessions/SessionsPage.jsx').then((m) => ({ default: m.SessionsPage })))
const AttendanceGroupsPage = lazy(() => import('./pages/attendance/AttendanceGroupsPage.jsx').then((m) => ({ default: m.AttendanceGroupsPage })))
const GroupAttendancePage = lazy(() => import('./pages/attendance/GroupAttendancePage.jsx').then((m) => ({ default: m.GroupAttendancePage })))
const RollHistoryPage = lazy(() => import('./pages/attendance/RollHistoryPage.jsx').then((m) => ({ default: m.RollHistoryPage })))
const PaymentsPage = lazy(() => import('./pages/payments/PaymentsPage.jsx').then((m) => ({ default: m.PaymentsPage })))
const UsersPage = lazy(() => import('./pages/users/UsersPage.jsx').then((m) => ({ default: m.UsersPage })))
const OrganizationsPage = lazy(() => import('./pages/organizations/OrganizationsPage.jsx').then((m) => ({ default: m.OrganizationsPage })))


/**
 * Secciones que todavía no tienen pantalla propia.
 *
 * Se irán vaciando fase a fase. Al cerrar la fase 5 la lista debe quedar vacía.
 */
/**
 * Ya no queda ninguna sección sin pantalla. `PlaceholderPage` deja de usarse.
 */

/** Secciones que ya tienen su pantalla. */
const BUILT_SECTIONS = {
  dashboard: DashboardPage,
  students: StudentsPage,
  guardians: GuardiansPage,
  teachers: TeachersPage,
  subjects: SubjectsPage,
  stages: StagesPage,
  billing: BillingPage,
  tutorGroups: TutorGroupsPage,
  classGroups: ClassGroupsPage,
  enrollments: EnrollmentsPage,
  sessions: SessionsPage,
  attendance: AttendanceGroupsPage,
  payments: PaymentsPage,
  users: UsersPage,
  organizations: OrganizationsPage,
}

/**
 * Envía a la ruta de inicio del rol.
 *
 * Vive dentro del árbol de sesión porque necesita saber el rol: el super
 * administrador va a organizaciones y no al panel, ya que `GET /dashboard` le
 * responde 403 (FR-003).
 */
function HomeRedirect() {
  const { homePath } = useSession()
  return <Navigate replace to={homePath} />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />

      <Route
        element={(
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        )}
        path="/"
      >
        <Route element={<HomeRedirect />} index />

        {Object.entries(BUILT_SECTIONS).map(([key, Screen]) => (
          <Route
            element={(
              <RequireSection section={key}>
                <Screen />
              </RequireSection>
            )}
            key={key}
            path={SECTIONS[key].path.slice(1)}
          />
        ))}

        {/* Subrutas de alumnos: el índice de aulas es `/alumnos`, y de ahí se
            entra al detalle de una o al listado completo. Van bajo la misma
            guarda de sección que el índice. */}
        <Route
          element={(
            <RequireSection section="students">
              <GroupStudentsPage />
            </RequireSection>
          )}
          path="alumnos/grupo/:groupId"
        />

        {/* Listas guardadas: el histórico de lo ya registrado, por sesión. No
            es sección del menú a propósito — «Asistencia» y «Listas» como dos
            entradas hermanas repetirían la confusión de los dos «Grupos»— y se
            llega desde el índice de asistencia. */}
        <Route
          element={(
            <RequireSection section="attendance">
              <RollHistoryPage />
            </RequireSection>
          )}
          path="asistencia/listas"
        />

        {/* Asistencia de un grupo. El índice son los grupos, y la asistencia
            se registra dentro de uno: la paginación es global, así que una lista
            única enseñaría fragmentos de cada grupo con recuentos falsos. */}
        <Route
          element={(
            <RequireSection section="attendance">
              <GroupAttendancePage />
            </RequireSection>
          )}
          path="asistencia/grupo/:groupId"
        />

        {/* Materias de un aula. Sustituye a la sección «Grupos de asignatura»,
            que sale del menú: la entidad es la misma, pero se gestiona desde el
            aula, que es donde el centro la reconoce. */}
        <Route
          element={(
            <RequireSection section="classGroups">
              <GroupSubjectsPage />
            </RequireSection>
          )}
          path="grupos/:groupId/materias"
        />
        <Route
          element={(
            <RequireSection section="students">
              <AllStudentsPage />
            </RequireSection>
          )}
          path="alumnos/todos"
        />

      </Route>

      {/* NOTA sobre `/grupos`: hasta esta entrega significaba «grupos de
          asignatura» y ahora significa «aula». No se añade redirección porque no
          hay adónde redirigir —la ruta sigue existiendo, con otro contenido— y
          porque la aplicación aún no está en producción, así que nadie tiene esa
          dirección guardada. Si lo estuviera, el reparto correcto sería dejar
          `/grupos` a los de asignatura y dar otra ruta a las aulas. */}

      {/* El concepto anterior era un sitio público con landing, servicios,
          método y contacto. Ya no existe superficie pública (FR-001), así que
          esas rutas y sus antiguas variantes francesas dejan de servir contenido
          y caen aquí (FR-009). Cualquier ruta desconocida va al inicio, que
          redirige según haya sesión o no. */}
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default function App() {
  /*
   * El idioma remonta el subárbol en lugar de propagarse por contexto.
   *
   * `t()` se resuelve en TIEMPO DE RENDER leyendo estado de módulo, no de React,
   * así que cambiar el idioma no invalida nada por sí solo: los componentes que
   * no vuelvan a dibujarse seguirían en el idioma anterior, y quedarían medias
   * pantallas traducidas.
   *
   * Un contexto no lo arregla —solo repintaría a quien lo consuma, y ningún
   * componente consume nada para llamar a `t()`— y suscribir 400 llamadas a un
   * contexto sería peor. Cambiar de idioma es algo que se hace una vez, así que
   * un remontado completo es la respuesta proporcionada: cuesta un parpadeo y
   * garantiza que no queda ni un texto sin actualizar.
   */
  const [localeKey, setLocaleKey] = useState(getLocale())

  const changeLocale = useCallback((locale) => {
    if (setLocale(locale)) {
      setLocaleKey(locale)
    }
  }, [])

  return (
    // Envuelve TODO, proveedores incluidos: un fallo al restaurar la sesión o al
    // montar el contexto también dejaría la página en blanco, y es justo el
    // momento en que menos información tiene el usuario.
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          <LocaleContext.Provider value={changeLocale}>
            <AppRoutes key={localeKey} />
          </LocaleContext.Provider>
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
