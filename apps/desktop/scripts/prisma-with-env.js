#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const { config } = require('dotenv');

// Load root .env file (if it exists)
// In Railway, env vars are already in process.env, so this is just for local dev
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

try {
  // Run the Prisma command using npx to ensure it's found
  const fullCommand = command.startsWith('prisma ') ? `npx ${command}` : command;
  execSync(fullCommand, { 
    stdio: 'inherit', 
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env } // Pass loaded env vars
  });
} catch (error) {
  process.exit(error.status || 1);
}
