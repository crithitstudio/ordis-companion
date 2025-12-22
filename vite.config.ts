import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/warframe': {
        target: 'https://api.warframe.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/warframe\/dynamic/, '/cdn')
      }
    }
  }
})
