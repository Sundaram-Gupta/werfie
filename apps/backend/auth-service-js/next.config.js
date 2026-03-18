const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack: use auth-service-js as root so multiple lockfiles (monorepo) don't trigger a warning
  turbopack: { root: path.join(__dirname) },
  // Force restart 2026-02-05
  // CORS handled by proxy and headers in server.js
  async headers() {
    return []
  },
  async rewrites() {
    return [
      // User Service (Port 3002)
      {
        source: '/api/users/:path*',
        destination: 'http://localhost:3002/:path*',
      },
      {
        source: '/api/business/:path*',
        destination: 'http://localhost:3002/business/:path*',
      },
      // Proxy User Search to User Service directly
      {
        source: '/api/search/users',
        destination: 'http://localhost:3002/search',
      },

      // Content Service (Port 3003)
      {
        source: '/api/posts/following',
        destination: 'http://localhost:3003/following',
      },
      // Proxy Post Search to Content Service (we will add this endpoint)
      {
        source: '/api/search/posts',
        destination: 'http://localhost:3003/posts/search',
      },
      {
        source: '/api/posts/:path*',
        destination: 'http://localhost:3003/:path*',
      },
      {
        source: '/api/timeline/:path*',
        destination: 'http://localhost:3004/api/timeline/:path*',
      },
      {
        source: '/api/explore/:path*',
        destination: 'http://localhost:3003/explore/:path*',
      },
      {
        source: '/api/communities/:path*',
        destination: 'http://localhost:3003/communities/:path*',
      },
      {
        source: '/api/lists/:path*',
        destination: 'http://localhost:3003/lists/:path*',
      },
      {
        source: '/api/spaces/:path*',
        destination: 'http://localhost:3003/spaces/:path*',
      },
      {
        source: '/api/ads/:path*',
        destination: 'http://localhost:3003/ads/:path*',
      },
      {
        source: '/api/notifications/:path*',
        destination: 'http://localhost:3005/api/notifications/:path*',
      },

      // Search Service (Port 3006) - Fallback for other search
      {
        source: '/api/search/:path*',
        destination: 'http://localhost:3006/api/search/:path*',
      },

      // Messaging Service (Port 3007)
      {
        source: '/api/messages/:path*',
        destination: 'http://localhost:3019/api/messages/:path*',
      },



      // Analytics Service (Port 3009)
      {
        source: '/api/analytics/:path*',
        destination: 'http://localhost:3009/api/analytics/:path*',
      },
      {
        source: '/api/creator-studio/:path*',
        destination: 'http://localhost:3009/api/creator-studio/:path*',
      },

      // Moderation Service (Port 3010)
      {
        source: '/api/moderation/:path*',
        destination: 'http://localhost:3010/api/moderation/:path*',
      },

      // Monetization Service (Port 3014)
      {
        source: '/api/monetization/:path*',
        destination: 'http://localhost:3014/api/monetization/:path*',
      },

      // Settings Service (Port 3011)
      {
        source: '/api/settings/:path*',
        destination: 'http://localhost:3011/api/settings/:path*',
      },
    ]
  }
}

module.exports = nextConfig
