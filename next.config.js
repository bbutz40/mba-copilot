/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy API requests to Python backend during local development
  async rewrites() {
    // Only proxy in development - in production, Vercel handles this
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/api/:path*',
        },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
