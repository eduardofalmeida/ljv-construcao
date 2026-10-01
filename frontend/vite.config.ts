import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const railwayPort = Number(process.env.PORT) || undefined

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three', '@react-three/fiber', '@react-three/drei'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three')) return 'cena'
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: railwayPort || 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: railwayPort || 4173,
    strictPort: true,
    allowedHosts: true,
  }
})
