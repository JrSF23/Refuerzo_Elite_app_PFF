import { Navigate, Route, Routes } from 'react-router-dom'

import { SessionProvider, useSession } from './context/SessionContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { RequireAuth, RequireSection } from './components/RequireAuth.jsx'
import { AppShell } from './components/layout/AppShell.jsx'
import { SECTIONS } from './lib/permissions.js'
import { LoginPage } from './pages/LoginPage.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { PlaceholderPage } from './pages/PlaceholderPage.jsx'
import { StudentsPage } from './pages/students/StudentsPage.jsx'
import { GuardiansPage } from './pages/guardians/GuardiansPage.jsx'
import { TeachersPage } from './pages/teachers/TeachersPage.jsx'
import { SubjectsPage } from './pages/subjects/SubjectsPage.jsx'

/**
 * Secciones que todavía no tienen pantalla propia.
 *
 * Se irán vaciando fase a fase. Al cerrar la fase 5 la lista debe quedar vacía.
 */
const PENDING_SECTIONS = [
  'groups', 'enrollments', 'sessions', 'attendance',
  'payments', 'users', 'organizations',
]

/** Secciones que ya tienen su pantalla. */
const BUILT_SECTIONS = {
  dashboard: DashboardPage,
  students: StudentsPage,
  guardians: GuardiansPage,
  teachers: TeachersPage,
  subjects: SubjectsPage,
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

        {PENDING_SECTIONS.map((key) => (
          <Route
            element={(
              <RequireSection section={key}>
                <PlaceholderPage section={key} />
              </RequireSection>
            )}
            key={key}
            // `path` sin la barra inicial: es una ruta hija de "/".
            path={SECTIONS[key].path.slice(1)}
          />
        ))}
      </Route>

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
  return (
    // Envuelve TODO, proveedores incluidos: un fallo al restaurar la sesión o al
    // montar el contexto también dejaría la página en blanco, y es justo el
    // momento en que menos información tiene el usuario.
    <ErrorBoundary>
      <SessionProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </SessionProvider>
    </ErrorBoundary>
  )
}
