import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/Kath/', // <--- انقل السطر إلى هنا (خارج server)
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  }
})