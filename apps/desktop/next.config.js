/** @type {import('next').NextConfig} */
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from root .env file
try {
  config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
  // .env file doesn't exist, that's okay
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Skip type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Don't open browser automatically (for Electron)
  // This prevents Next.js from opening browser when running electron:dev
  // Browser will be opened by Electron instead
  // Pass env vars to Next.js (only what's needed for client)
  env: {
    // Auth service URL (used by better-auth client)
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
    // API URL for backend
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
