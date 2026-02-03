import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"

import ErrorBoundary from './components/ErrorBoundary'

import './i18n'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-black text-white"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
          <App />
        </Suspense>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
