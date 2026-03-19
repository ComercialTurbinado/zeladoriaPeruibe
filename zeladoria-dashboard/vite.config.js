import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy para zeladoria-api em desenvolvimento local
      // (evita problemas de CORS ao rodar frontend e backend separados)
      '/admin': { target: 'http://localhost:3001', changeOrigin: true },
      '/ocorrencias': { target: 'http://localhost:3001', changeOrigin: true },
      '/dashboard': { target: 'http://localhost:3001', changeOrigin: true },
      '/health': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
})
