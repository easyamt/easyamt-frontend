import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './shared/i18n'
import './styles.css'

const DevMascotGallery = import.meta.env.DEV && window.location.pathname === '/dev/mascot'
  ? React.lazy(() => import('./features/mascot/MascotGallery'))
  : null

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={null}>{DevMascotGallery ? <DevMascotGallery /> : <App />}</React.Suspense>
    </QueryClientProvider>
  </React.StrictMode>,
)
