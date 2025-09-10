import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: ["react-map-gl"],
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['caseclosure.org', 'dron4.caseclosure.org'],
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",  // Use IPv4 instead of localhost
        changeOrigin: true,
        secure: false
      }
    }
  },
})