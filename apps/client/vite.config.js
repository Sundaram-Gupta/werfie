import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['werfie.ai', 'localhost', '127.0.0.1', '.werfie.ai', '192.168.1.37'],
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
              console.warn('[vite] proxy error:', err.message)
            }
          })
        },
      },
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/feed': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on('error', (err, _req, _res) => {
            if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
              console.warn('[vite] proxy error:', err.message)
            }
          })
        },
      },
    }
  }
})
