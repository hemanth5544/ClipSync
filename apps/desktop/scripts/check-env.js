#!/usr/bin/env node

/**
 * Environment Variable Diagnostic Script
 * Run this to check if DATABASE_URL and other required vars are set
 * Useful for debugging Railway deployments
 */

console.log('=== Environment Variable Check ===\n');

// Check if we're in Railway
const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
console.log('Environment:', isRailway ? 'Railway' : 'Local');
if (isRailway) {
  console.log('Railway Environment:', process.env.RAILWAY_ENVIRONMENT);
  console.log('Railway Project ID:', process.env.RAILWAY_PROJECT_ID);
}
console.log('');

// Check DATABASE_URL
const databaseUrl = process.env.DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.RAILWAY_DATABASE_URL ||
                    process.env.POSTGRES_PRIVATE_URL ||
                    process.env.POSTGRES_PUBLIC_URL;

console.log('DATABASE_URL Status:', databaseUrl ? '✅ SET' : '❌ NOT SET');
if (databaseUrl) {
  // Show first and last 20 chars (hide middle for security)
  const preview = databaseUrl.length > 40 
    ? `${databaseUrl.substring(0, 20)}...${databaseUrl.substring(databaseUrl.length - 20)}`
    : databaseUrl.substring(0, 20) + '...';
  console.log('  Preview:', preview);
} else {
  console.log('  ⚠️  DATABASE_URL is required!');
}

// Check PostgreSQL components
console.log('\nPostgreSQL Components:');
const components = {
  'PGHOST / POSTGRES_HOST': process.env.PGHOST || process.env.POSTGRES_HOST,
  'PGPORT / POSTGRES_PORT': process.env.PGPORT || process.env.POSTGRES_PORT,
  'PGUSER / POSTGRES_USER': process.env.PGUSER || process.env.POSTGRES_USER,
  'PGPASSWORD / POSTGRES_PASSWORD': process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD ? '***SET***' : undefined,
  'PGDATABASE / POSTGRES_DB': process.env.PGDATABASE || process.env.POSTGRES_DB,
};

Object.entries(components).forEach(([name, value]) => {
  console.log(`  ${name}:`, value ? '✅ SET' : '❌ NOT SET');
});

// Check other required vars
console.log('\nOther Required Variables:');
const requiredVars = {
  'BETTER_AUTH_SECRET': process.env.BETTER_AUTH_SECRET,
  'BETTER_AUTH_BASE_URL': process.env.BETTER_AUTH_BASE_URL,
  'NEXT_PUBLIC_BETTER_AUTH_URL': process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
};

Object.entries(requiredVars).forEach(([name, value]) => {
  console.log(`  ${name}:`, value ? '✅ SET' : '⚠️  NOT SET (optional)');
});

// List all env vars (for debugging)
console.log('\n=== All Environment Variables ===');
const allVars = Object.keys(process.env).sort();
console.log(`Total: ${allVars.length} variables`);
console.log('\nFirst 20 variables:');
allVars.slice(0, 20).forEach(key => {
  const value = process.env[key] || '';
  const preview = value.length > 50 ? value.substring(0, 50) + '...' : value;
  console.log(`  ${key}=${preview}`);
});

if (allVars.length > 20) {
  console.log(`  ... and ${allVars.length - 20} more`);
}

// Summary
console.log('\n=== Summary ===');
if (!databaseUrl) {
  console.log('❌ DATABASE_URL is missing!');
  console.log('\nTo fix in Railway:');
  console.log('1. Go to Railway Dashboard → Your Service → Variables');
  console.log('2. Click "+ New Variable"');
  console.log('3. Name: DATABASE_URL');
  console.log('4. Value: Reference your PostgreSQL service\'s DATABASE_URL');
  console.log('5. Or manually set: postgresql://user:pass@host:port/dbname');
  console.log('\nSee RAILWAY_SETUP.md for detailed instructions.');
  process.exit(1);
} else {
  console.log('✅ DATABASE_URL is set!');
  process.exit(0);
}
