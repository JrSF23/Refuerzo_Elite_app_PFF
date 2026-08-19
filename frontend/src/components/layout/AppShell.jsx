import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { t } from '../../i18n/index.js'
import { useSession } from '../../context/SessionContext.jsx'
import { Drawer } from '../ui/Drawer.jsx'
import { Header } from './Header.jsx'
import { Sidebar } from './Sidebar.jsx'

/**
 * Marco de la aplicación.
 *
 * Barra lateral permanente en escritorio; por debajo de 1024 px se convierte en
 * panel deslizante (FR-018). El punto de corte sale de la suma real: 264 px de
 * barra más unos 720 px de tabla útil más el espaciado.
 *
 * La barra se renderiza DOS veces —una fija y otra dentro del panel—, en lugar de
 * moverla entre contenedores. Mover el mismo nodo desmonta y remonta el árbol al
 * cruzar el punto de corte, y con ello se pierde el foco y el estado. El coste es
 * un poco de marcado duplicado que CSS oculta según el ancho.
 */
export function AppShell() {
  const { organization, user, roleNames, isPlatformAdmin, logout } = useSession()
  const [isNavOpen, setIsNavOpen] = useState(false)
  const location = useLocation()

  // Cierra el panel al cambiar de ruta: dejarlo abierto tapando la pantalla que
  // el usuario acaba de pedir es desconcertante (FR-019).
  useEffect(() => {
    setIsNavOpen(false)
  }, [location.pathname])

  return (
    <div className="shell">
      {/* Primer tabulador de la página: salta la navegación entera. Sin esto,
          quien usa teclado atraviesa una docena de enlaces en cada pantalla. */}
      <a className="skip-link" href="#main">{t('nav.skipToContent')}</a>

      <div className="shell__sidebar">
        <Sidebar roleNames={roleNames} />
      </div>

      <Drawer
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        side="left"
        title={t('nav.label')}
      >
        <Sidebar onNavigate={() => setIsNavOpen(false)} roleNames={roleNames} />
      </Drawer>

      <div className="shell__main">
        <Header
          isPlatformAdmin={isPlatformAdmin}
          onLogout={logout}
          onOpenNav={() => setIsNavOpen(true)}
          organization={organization}
          roleNames={roleNames}
          user={user}
        />

        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
