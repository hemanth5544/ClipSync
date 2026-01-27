#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const { config } = require('dotenv');

// Load root .env file (if it exists) - for local development
// In Railway, env vars are already in process.env, so this is just a fallback
const rootEnvPath = path.resolve(__dirname, '../../../.env');
try {
  config({ path: rootEnvPath });
} catch (e) {
  // .env file doesn't exist (e.g., in Railway), that's okay - use process.env
}

// Get the command to run (everything after the script name)
const args = process.argv.slice(2);
const command = args.join(' ');

if (!command) {
  console.error('Usage: node prisma-with-env.js <prisma-command>');
  process.exit(1);
}

// Check if DATABASE_URL is needed (only for db operations, not for generate)
// prisma generate doesn't need DATABASE_URL, only db push/migrate/studio do
const needsDatabase = command.includes('db push') || 
                      command.includes('db pull') || 
                      command.includes('migrate') || 
                      command.includes('studio') ||
                      command.includes('db seed');

if (needsDatabase && !process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set!');
  console.error('This is required for database operations like db push, migrate, etc.');
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB')));
  process.exit(1);
}

// For generate, DATABASE_URL is optional (only needed for schema validation)
if (!needsDatabase) {
  console.log('Prisma generate - DATABASE_URL not required, continuing...');
}

try {
  // Run the Prisma command using npx to ensure it's found
  const fullCommand = command.startsWith('prisma ') ? `npx ${command}` : command;
  
  // Pass all environment variables explicitly
  const env = {
    ...process.env,
  };
  
  // Only log DATABASE_URL status for db operations
  if (needsDatabase) {
    console.log('Running Prisma command with DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  }
  
  execSync(fullCommand, { 
    stdio: 'inherit', 
    cwd: path.resolve(__dirname, '..'),
    env: env
  });
} catch (error) {
  console.error('Prisma command failed:', error.message);
  process.exit(error.status || 1);
}
