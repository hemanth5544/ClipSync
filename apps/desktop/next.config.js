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

console.log('=== Next.js Config - Environment Check ===');
console.log('DATABASE_URL:', databaseUrl ? '✅ SET' : '❌ NOT SET');

// Log ALL env vars to help debug Railway issues
const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
console.log('Running in Railway:', isRailway);
if (isRailway) {
  console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);
  console.log('Railway Project ID:', process.env.RAILWAY_PROJECT_ID);
}

if (!databaseUrl) {
  console.warn('⚠️  WARNING: DATABASE_URL not found in Next.js config!');
  console.warn('Available Railway env vars:');
  const railwayVars = Object.keys(process.env)
    .filter(k => k.includes('DATABASE') || k.includes('DB') || k.includes('POSTGRES') || k.includes('RAILWAY'))
    .slice(0, 20); // Show more vars
  if (railwayVars.length > 0) {
    railwayVars.forEach(k => {
      const val = process.env[k] || '';
      const preview = val.length > 30 ? val.substring(0, 30) + '...' : val;
      console.warn(`  ${k}=${preview}`);
    });
  } else {
    console.warn('  None found! Railway env vars may not be available at build time.');
    console.warn('  They should be available at runtime though.');
  }
} else {
  const preview = databaseUrl.length > 40 
    ? `${databaseUrl.substring(0, 20)}...${databaseUrl.substring(databaseUrl.length - 20)}`
    : databaseUrl.substring(0, 20) + '...';
  console.log('DATABASE_URL preview:', preview);
}
console.log('==========================================');

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
