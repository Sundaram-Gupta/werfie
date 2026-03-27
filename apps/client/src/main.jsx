import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ThemeProvider } from "./components/theme-provider"
import api, { getGatewayUrl } from "@/lib/api"

import ErrorBoundary from './components/ErrorBoundary'

import './i18n'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

function warmupLink(rel, href, crossOrigin = false) {
  try {
    if (!href || typeof document === "undefined") return
    const exists = document.head.querySelector(`link[rel="${rel}"][href="${href}"]`)
    if (exists) return
    const el = document.createElement("link")
    el.rel = rel
    el.href = href
    if (crossOrigin) el.crossOrigin = "anonymous"
    document.head.appendChild(el)
  } catch {
    // ignore
  }
}

function scheduleFeedWarmup() {
  if (typeof window === "undefined") return
  const token = localStorage.getItem("accessToken")
  if (!token) return

  const run = async () => {
    try {
      const now = Date.now()
      const tsKey = "werfie:posts:prefetchTs:v1:for-you"
      const cacheKey = "werfie:posts:v1:for-you"
      const lastTs = Number(sessionStorage.getItem(tsKey) || 0)
      if (now - lastTs < 45_000) return

      const [postsRes, annRes] = await Promise.all([
        api.get("/api/posts", { params: { tab: "for-you", limit: 20, _ts: now }, timeout: 8000 }),
        api.get("/api/announcements/feed", { params: { _ts: now }, timeout: 6000 }).catch(() => ({ data: [] })),
      ])
      const postsData = postsRes?.data
      const posts = Array.isArray(postsData) ? postsData : (postsData?.posts || [])
      const annData = annRes?.data
      const announcements = (Array.isArray(annData) ? annData : (annData?.posts || [])).map((a) => ({
        ...a,
        isOfficialAnnouncement: true,
      }))
      const merged = [...posts, ...announcements]
      if (merged.length > 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(merged.slice(0, 50)))
        sessionStorage.setItem(tsKey, String(now))
      }
    } catch {
      // ignore warmup failures
    }
  }

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => { run() }, { timeout: 3000 })
  } else {
    setTimeout(run, 600)
  }
}

// Network warmups before app interaction.
warmupLink("preconnect", getGatewayUrl(), true)
scheduleFeedWarmup()

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
