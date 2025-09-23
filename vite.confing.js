import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['*.ngrok-free.dev']
  },
  base: '/miniapp-ruleta/' // ¡Esta es la línea que necesitas agregar!
})