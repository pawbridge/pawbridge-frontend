import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient.ts'
import './index.css'
import App from './App.tsx'
import RouteSeo from './components/seo/RouteSeo.tsx'
import NoteNotificationsProvider from './components/contact/NoteNotificationsProvider.tsx'
import MemberChatProvider from './components/contact/MemberChatProvider.tsx'
import { refreshExpiredSessionOnStartup } from './api/authSession.ts'
import ErrorBoundary from './components/common/ErrorBoundary.tsx'
import ScreenErrorFallback from './components/common/ScreenErrorFallback.tsx'

// 소셜 로그인 콜백은 새 세션을 직접 받으므로 이전 토큰을 재발급하지 않는다.
if (window.location.pathname !== '/oauth/callback') {
  void refreshExpiredSessionOnStartup()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 최후 안전망: SiteLayout 밖 화면(관리자, 로그인 등)과 헤더·공통 Provider의 오류를 받는다. */}
    <ErrorBoundary fallback={<ScreenErrorFallback fullScreen />}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <RouteSeo />
          <MemberChatProvider><NoteNotificationsProvider><App /></NoteNotificationsProvider></MemberChatProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
