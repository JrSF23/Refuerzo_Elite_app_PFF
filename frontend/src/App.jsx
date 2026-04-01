import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { SessionProvider } from './context/SessionContext'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ModulePage } from './pages/ModulePage'
import { PublicHomePage } from './pages/PublicHomePage'

function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route path="/" element={<PublicHomePage />} />
        <Route path="/connexion" element={<LoginPage />} />
        <Route path="/login" element={<Navigate replace to="/connexion" />} />
        <Route
          path="/espace"
          element={(
            <RequireAuth allowedRoles={['admin', 'teacher']}>
              <AppShell />
            </RequireAuth>
          )}
        >
          <Route index element={<DashboardPage />} />
          <Route path="module/:moduleKey" element={<ModulePage />} />
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </SessionProvider>
  )
}

export default App
