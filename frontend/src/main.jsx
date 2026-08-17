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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
