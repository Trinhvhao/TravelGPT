/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Persistent disk cache — tránh recompile 2310 modules mỗi reload
  cache: {
    build: 'persistent',
  },
  experimental: {
    // Turbopack persistent cache (Next.js 15+)
    turbo: {
      cache: {},
    },
  },
}

module.exports = nextConfig
