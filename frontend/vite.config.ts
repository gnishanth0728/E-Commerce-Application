import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/api/product': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/product/, '/api'),
      },
      '/api/cart': {
        target: 'http://localhost:8082',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/wishlist': {
        target: 'http://localhost:8083',
        changeOrigin: true,
      },
      '/api/shipping': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
    },
  },
})
