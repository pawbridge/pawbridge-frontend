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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <RouteSeo />
        <MemberChatProvider><NoteNotificationsProvider><App /></NoteNotificationsProvider></MemberChatProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
)
