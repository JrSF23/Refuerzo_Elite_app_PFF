import { Navigate, Route, Routes } from 'react-router-dom'
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

function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/centre" element={<CentrePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/methode" element={<MethodPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/login" element={<Navigate replace to="/connexion" />} />
        <Route
          path="/espace"
          element={(
            <RequireAuth allowedRoles={['super_admin', 'org_admin', 'teacher']}>
              <AppShell />
            </RequireAuth>
          )}
        >
          <Route index element={<DashboardPage />} />
          <Route path="module/:moduleKey" element={<ModulePage />} />
          <Route
            path="comptes"
            element={(
              <RequireAuth allowedRoles={['org_admin']}>
                <UsersPage />
              </RequireAuth>
            )}
          />
          <Route
            path="organisations"
            element={(
              <RequireAuth allowedRoles={['super_admin']}>
                <OrganizationsPage />
              </RequireAuth>
            )}
          />
          <Route
            path="organisations/:organizationId/comptes"
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
