import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Configuración de pruebas.
 *
 * Separada de `vite.config.js` a propósito: la de build lleva el proxy al
 * backend, y las pruebas no deben poder alcanzar la API real ni por accidente.
 * Aquí `lib/api.js` se sustituye siempre por un doble.
 */
export default defineConfig({
  plugins: [react()],
  // Runtime automático de JSX explícito: sin esto, esbuild transforma los
  // ficheros de prueba con el runtime clásico y falla con «React is not
  // defined», porque ningún fichero del proyecto importa React por nombre.
  esbuild: { jsx: 'automatic' },
  test: {
    environment: 'jsdom',
    // Fija el idioma antes de cada prueba: la aplicación detecta el del
    // navegador, y `jsdom` anuncia inglés, así que sin esto las comprobaciones
    // de texto fallarían según la máquina y no según el código.
    setupFiles: ['./src/test-setup.js'],
    globals: true,
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
  },
})
