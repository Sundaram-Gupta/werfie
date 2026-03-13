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
  // Handle local uploads served from public directory via API route
  if (path.startsWith('/uploads')) {
    const filename = path.split('/').pop()
    return `${API_BASE_URL}/api/media/${filename}`
  }
  return path
}
