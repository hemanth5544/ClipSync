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
  // Skip type checking and linting during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Pass env vars to Next.js
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL || process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  },
}

module.exports = nextConfig
