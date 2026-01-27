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
// Check multiple possible Railway env var names
const databaseUrl = process.env.DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.RAILWAY_DATABASE_URL ||
                    process.env.POSTGRES_PRIVATE_URL ||
                    process.env.POSTGRES_PUBLIC_URL;

console.log('Next.js config - DATABASE_URL:', databaseUrl ? 'SET' : 'NOT SET');
if (!databaseUrl) {
  console.warn('WARNING: DATABASE_URL not found. Available Railway env vars:');
  const railwayVars = Object.keys(process.env)
    .filter(k => k.includes('DATABASE') || k.includes('DB') || k.includes('POSTGRES') || k.includes('RAILWAY'))
    .slice(0, 10); // Limit output
  console.warn(railwayVars.length > 0 ? railwayVars : 'None found');
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  // Explicitly pass env vars to Next.js
  // Railway env vars are in process.env, but Next.js needs them in env: {} for server-side
  env: {
    DATABASE_URL: databaseUrl || process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_BASE_URL: process.env.BETTER_AUTH_BASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  },
  // Also ensure serverRuntimeConfig has access (for API routes)
  serverRuntimeConfig: {
    DATABASE_URL: databaseUrl || process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
