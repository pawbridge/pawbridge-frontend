import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Store Service (상점) - 8085
      '/api/products': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/carts': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/orders': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      // Payment Service (결제) - 8084
      '/api/payments': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:8084');
          });
        },
      },
      // User Service (사용자/인증) - 9020
      '/api': {
        target: 'http://localhost:9020',
        changeOrigin: true,
      },
      '/login': {
        target: 'http://localhost:9020',
        changeOrigin: true,
      }
    }
  }
})
