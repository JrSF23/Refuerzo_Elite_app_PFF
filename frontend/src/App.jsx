import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { SessionProvider } from './context/SessionContext'
import { CentrePage } from './pages/CentrePage'
import { ContactPage } from './pages/ContactPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { MethodPage } from './pages/MethodPage'
import { ModulePage } from './pages/ModulePage'
import { OrganizationsPage } from './pages/Organizations/OrganizationsPage'
import { OrganizationUsersPage } from './pages/Organizations/OrganizationUsersPage'
import { PublicHomePage } from './pages/PublicHomePage'
import { ServicesPage } from './pages/ServicesPage'
import { UsersPage } from './pages/UsersPage'

// Las dos rutas antiguas con parámetro necesitan leerlo para reconstruir el destino.
function LegacyModuleRedirect() {
  const { moduleKey } = useParams()
  return <Navigate replace to={`/espacio/modulo/${moduleKey}`} />
}

function LegacyOrganizationUsersRedirect() {
  const { organizationId } = useParams()
  return <Navigate replace to={`/espacio/organizaciones/${organizationId}/cuentas`} />
}

function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/centro" element={<CentrePage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        <Route path="/metodo" element={<MethodPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/acceso" element={<LoginPage />} />

        {/* Rutas antiguas en francés: el centro puede tener marcadores guardados,
            así que se mantienen como redirecciones permanentes al equivalente español. */}
        <Route path="/login" element={<Navigate replace to="/acceso" />} />
        <Route path="/connexion" element={<Navigate replace to="/acceso" />} />
        <Route path="/centre" element={<Navigate replace to="/centro" />} />
        <Route path="/services" element={<Navigate replace to="/servicios" />} />
        <Route path="/methode" element={<Navigate replace to="/metodo" />} />
        <Route path="/contact" element={<Navigate replace to="/contacto" />} />
        <Route path="/espace" element={<Navigate replace to="/espacio" />} />
        <Route path="/espace/module/:moduleKey" element={<LegacyModuleRedirect />} />
        <Route path="/espace/comptes" element={<Navigate replace to="/espacio/cuentas" />} />
        <Route path="/espace/organisations" element={<Navigate replace to="/espacio/organizaciones" />} />
        <Route
          path="/espace/organisations/:organizationId/comptes"
          element={<LegacyOrganizationUsersRedirect />}
        />

        <Route
          path="/espacio"
          element={(
            <RequireAuth allowedRoles={['super_admin', 'org_admin', 'teacher']}>
              <AppShell />
            </RequireAuth>
          )}
        >
          <Route index element={<DashboardPage />} />
          <Route path="modulo/:moduleKey" element={<ModulePage />} />
          <Route
            path="cuentas"
            element={(
              <RequireAuth allowedRoles={['org_admin']}>
                <UsersPage />
              </RequireAuth>
            )}
          />
          <Route
            path="organizaciones"
            element={(
              <RequireAuth allowedRoles={['super_admin']}>
                <OrganizationsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="organizaciones/:organizationId/cuentas"
            element={(
              <RequireAuth allowedRoles={['super_admin']}>
                <OrganizationUsersPage />
              </RequireAuth>
            )}
          />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </SessionProvider>
  )
}

export default App
