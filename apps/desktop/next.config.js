/** @type {import('next').NextConfig} */
const path = require('path');
const { config } = require('dotenv');

const root = path.resolve(__dirname, '../..');

// Load root .env first
try {
  config({ path: path.join(root, '.env') });
} catch (e) {}

// USE_PROD_ENV=1 → load .env.prod (Railway auth + API). Run: pnpm electron:dev:prod
if (process.env.USE_PROD_ENV === '1') {
  try {
    config({ path: path.join(root, '.env.prod'), override: true });
  } catch (e) {}
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  env: {
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}

module.exports = nextConfig
