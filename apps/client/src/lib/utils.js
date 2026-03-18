import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"


import { API_BASE_URL } from "./api"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function getMediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  // Handle paths that already include /api/media
  if (path.startsWith('/api/media')) return `${API_BASE_URL}${path}`
  // Local uploads are served by the gateway and proxied to content-service
  // Keep the full path (including subfolders) so `/uploads/images/...` resolves correctly.
  if (path.startsWith('/uploads')) return `${API_BASE_URL}${path}`
  return path
}
