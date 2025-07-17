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
  },
})
