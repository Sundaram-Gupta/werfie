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
    // Listen on all interfaces so other devices on LAN can reach the app (e.g. http://YOUR_PC_IP:5173)
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (err.code !== 'ECONNRESET' && err.code !== 'ECONNABORTED') {
              console.warn('[vite] proxy error:', err.message)
            }
            if (res && typeof res.writeHead === 'function' && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ status: false, message: 'Backend unreachable. Run on dev machine: pm2 list then pm2 start ecosystem.config.js --only auth-service' }))
            } else if (res && typeof res.destroy === 'function') {
              // It's a raw socket (i.e. WebSocket upgrade)
              res.destroy()
            }
          })
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
      '/feed': {
        target: 'http://127.0.0.1:3001',
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
      '/ws': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        ws: true,
      },
    }
  }
})
