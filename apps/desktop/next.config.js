/** @type {import('next').NextConfig} */
const path = require('path');
const { config } = require('dotenv');

// Load environment variables from root .env file (for local dev)
// In Railway, env vars are already in process.env
try {
  config({ path: path.resolve(__dirname, '../../.env') });
} catch (e) {
  // .env file doesn't exist (e.g., in Railway), that's okay
}

// Log DATABASE_URL status (without exposing the actual URL)
console.log('Next.js config - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Explicitly pass env vars to Next.js (Railway env vars are already in process.env)
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  },
}

module.exports = nextConfig
