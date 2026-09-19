import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { queryClient } from './lib/queryClient.ts'
import './index.css'
import App from './App.tsx'
import AnalyticsConsent from './components/analytics/AnalyticsConsent.tsx'
import AnalyticsRouteBoundary from './components/analytics/AnalyticsRouteBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AnalyticsRouteBoundary>
          <App />
        </AnalyticsRouteBoundary>
        <AnalyticsConsent />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)