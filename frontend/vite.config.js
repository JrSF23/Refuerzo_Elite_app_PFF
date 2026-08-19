import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El backend vive en el contenedor de nginx, en el 8080. El proxy evita CORS y
// permite que el frontend llame a `/api/v1/...` como lo hará en producción, donde
// ambos se sirven desde el mismo origen.
const apiProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  },
}

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: apiProxy,
  },
  // El mismo proxy en `preview`: sin él, el build de producción no se puede
  // verificar contra la API y solo se comprueba el servidor de desarrollo, que
  // no es lo que se despliega.
  preview: {
    proxy: apiProxy,
  },
})
