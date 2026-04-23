/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    return [
      {
        // Auth API: /api/auth/* -> backend /auth/*
        source: '/api/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        // All other API: /api/* -> backend /api/*
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/health',
        destination: `${backendUrl}/health`,
      },
    ]
  },
}

module.exports = nextConfig
