import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

// Inter, servida desde el propio origen. `wght` es el eje de grosor: un solo
// fichero variable cubre 400 a 700, y pesa menos que cuatro estáticos. La hoja
// declara siete subconjuntos con `unicode-range`, así que el navegador descarga
// únicamente el que necesita el texto —con español, el latino—.
import '@fontsource-variable/inter/wght.css'

import './index.css'
import App from './App.jsx'
import { getLocale, loadLocale } from './i18n/index.js'

/*
 * El catálogo del idioma activo tiene que estar ANTES de la primera pintada.
 *
 * Desde que el francés y el inglés se descargan aparte, quien tenga uno de ellos
 * elegido necesita que llegue su fichero para no ver la primera pantalla en
 * español y verla cambiar un instante después — un destello peor que la espera
 * que lo evita.
 *
 * En español, que es el caso de la inmensa mayoría, esto NO pide nada a la red:
 * su catálogo viaja en el bundle y la promesa resuelve en el acto.
 */
loadLocale(getLocale()).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  )
})
