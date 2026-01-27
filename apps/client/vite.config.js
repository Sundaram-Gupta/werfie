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
    port: 5173, // ensuring port remains standard
    allowedHosts: ['werfie.ai', 'localhost', '127.0.0.1', '192.168.1.4', '.werfie.ai'],
  }
})
