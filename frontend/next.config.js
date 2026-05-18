/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'culturemagazin.com',
      },
      {
        protocol: 'https',
        hostname: 'www.agoda.com',
      },
    ],
  },
}

module.exports = nextConfig
