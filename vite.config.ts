import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
/**
 * Vite 설정
 * 
 * 주의: server.proxy는 개발 환경(npm run dev)에서만 작동합니다.
 * 배포 환경에서는 src/api/client.ts의 baseURL(VITE_API_BASE_URL)을 사용합니다.
 */
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
      // 주문 관련 API (관리자용) - API Gateway를 통해 요청
      '/api/admin/orders': {
        target: 'http://localhost:8080', // API Gateway
        changeOrigin: true,
      },
      // 주문 관련 API (일반 사용자용) - API Gateway를 통해 요청
      '/api/orders': {
        target: 'http://localhost:8080', // API Gateway
        changeOrigin: true,
      },
      '/api/categories': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/option-groups': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/images': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      '/api/v1/mypage': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1\/mypage/, '/api/v1/mypage'),
      },
      '/api/wishlists': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },
      // Store Service - /store-service 경로 (API Gateway를 통한 호출)
      '/store-service': {
        target: 'http://localhost:8080', // API Gateway
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
      // User Service (사용자/인증) - 9020 => minimini1212가 8080으로 변경함. api-gateway 포트로
      '/api': {
        target: 'http://localhost:8080', // API-GATEWAY
        changeOrigin: true,
      }
    }
  }
})
