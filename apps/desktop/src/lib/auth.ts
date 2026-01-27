import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// Get DATABASE_URL from environment (lazy evaluation - check at runtime)
// Railway automatically provides this when PostgreSQL service is linked
// If not set, check for Railway's service reference format or construct from components
const getDatabaseUrl = (): string => {
  // Log all env vars for debugging (only in Railway/dev)
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
  if (isRailway || process.env.NODE_ENV === 'development') {
    console.log('[DATABASE_URL Check] Checking environment variables...');
    console.log('[DATABASE_URL Check] Railway detected:', isRailway);
    
    // Log ALL env vars (for debugging - Railway should have them)
    const allEnvVars = Object.keys(process.env).sort();
    console.log(`[DATABASE_URL Check] Total env vars: ${allEnvVars.length}`);
    
    // Check for DATABASE_URL specifically
    if (process.env.DATABASE_URL) {
      const dbUrl = process.env.DATABASE_URL;
      const preview = dbUrl.length > 40 
        ? `${dbUrl.substring(0, 20)}...${dbUrl.substring(dbUrl.length - 20)}`
        : dbUrl.substring(0, 20) + '...';
      console.log(`[DATABASE_URL Check] ✅ Found DATABASE_URL: ${preview}`);
      return process.env.DATABASE_URL;
    } else {
      console.log('[DATABASE_URL Check] ❌ DATABASE_URL not found in process.env');
    }
  }
  
  // First, try direct DATABASE_URL
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Try Railway's PostgreSQL service reference (if services are linked)
  // Railway format: ${{Postgres.DATABASE_URL}} or similar
  const railwayDbUrl = process.env.POSTGRES_URL || 
                       process.env.RAILWAY_DATABASE_URL ||
                       process.env.POSTGRES_PRIVATE_URL ||
                       process.env.POSTGRES_PUBLIC_URL;
  
  if (railwayDbUrl) {
    console.log('[DATABASE_URL Check] ✅ Found Railway PostgreSQL URL');
    return railwayDbUrl;
  }
  
  // Try to construct from individual components (if Railway provides them)
  const pgHost = process.env.PGHOST || process.env.POSTGRES_HOST;
  const pgPort = process.env.PGPORT || process.env.POSTGRES_PORT || '5432';
  const pgUser = process.env.PGUSER || process.env.POSTGRES_USER;
  const pgPassword = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const pgDatabase = process.env.PGDATABASE || process.env.POSTGRES_DB;
  const pgSslMode = process.env.PGSSLMODE || process.env.POSTGRES_SSLMODE || 'require';
  
  if (pgHost && pgUser && pgPassword && pgDatabase) {
    const constructedUrl = `postgresql://${pgUser}:${pgPassword}@${pgHost}:${pgPort}/${pgDatabase}?sslmode=${pgSslMode}`;
    console.log("[DATABASE_URL Check] ✅ Constructed DATABASE_URL from individual PostgreSQL components");
    return constructedUrl;
  }
  
  // Log all available env vars for debugging (in Railway)
  console.error("ERROR: DATABASE_URL is not set!");
  
  // Check if we're in Railway
  if (isRailway) {
    console.error("Running in Railway - checking for PostgreSQL service variables...");
  }
  
  const relevantVars = Object.keys(process.env)
    .filter(k => 
      k.includes('DATABASE') || 
      k.includes('DB') || 
      k.includes('POSTGRES') || 
      k.includes('RAILWAY')
    );
  
  if (relevantVars.length > 0) {
    console.error("Found these related env vars:", relevantVars);
    // Show first 50 chars of each (not full value for security)
    relevantVars.forEach(k => {
      const val = process.env[k] || '';
      console.error(`  ${k}=${val.substring(0, 50)}${val.length > 50 ? '...' : ''}`);
    });
  } else {
    console.error("No DATABASE/DB/POSTGRES/RAILWAY env vars found!");
  }
  
  // Log ALL env vars to see what Railway is actually providing
  console.error("=== ALL ENVIRONMENT VARIABLES ===");
  const allVars = Object.keys(process.env).sort();
  allVars.forEach(k => {
    const val = process.env[k] || '';
    // Only show first 30 chars to avoid logging sensitive data
    const preview = val.length > 30 ? val.substring(0, 30) + '...' : val;
    console.error(`  ${k}=${preview}`);
  });
  
  throw new Error(
    "DATABASE_URL is required but not set.\n" +
    "Railway Setup:\n" +
    "1. Go to Railway Dashboard → Your Desktop Service → Variables\n" +
    "2. Click '+ New Variable'\n" +
    "3. Name: DATABASE_URL\n" +
    "4. Value: Click 'Reference' and select your PostgreSQL service's DATABASE_URL\n" +
    "   OR manually paste: postgresql://user:pass@host:port/dbname\n" +
    "5. Redeploy the service\n\n" +
    "See RAILWAY_SETUP.md for detailed instructions."
  );
};

// Lazy initialization - only get DATABASE_URL when needed
let databaseUrl: string | null = null;
const getDatabaseUrlLazy = (): string => {
  if (!databaseUrl) {
    databaseUrl = getDatabaseUrl();
    // CRITICAL: Set it in process.env so Prisma can read it
    // Prisma reads from process.env.DATABASE_URL even if we pass it in datasources
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = databaseUrl;
      console.log('[Prisma] Set DATABASE_URL in process.env for Prisma to read');
    }
  }
  return databaseUrl;
};

// Initialize PrismaClient lazily (only when needed, so env vars are available)
let prisma: PrismaClient | null = null;

const getPrisma = (): PrismaClient => {
  if (!prisma) {
    // DEBUG: Log what env vars are available when Prisma initializes
    console.log('[Prisma] === Prisma Initialization Debug ===');
    console.log('[Prisma] Available env vars:', Object.keys(process.env).length);
    console.log('[Prisma] NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL ? '✅ SET' : '❌ NOT SET');
    console.log('[Prisma] DATABASE_URL before getDatabaseUrlLazy:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
    
    const dbUrl = getDatabaseUrlLazy();
    console.log('[Prisma] DATABASE_URL after getDatabaseUrlLazy:', process.env.DATABASE_URL ? '✅ SET' : '❌ NOT SET');
    
    // Ensure DATABASE_URL is in process.env (Prisma reads from here)
    // Even though we pass it in datasources, Prisma also checks process.env
    if (!process.env.DATABASE_URL && dbUrl) {
      process.env.DATABASE_URL = dbUrl;
      console.log('[Prisma] ✅ Set DATABASE_URL in process.env from getDatabaseUrl()');
    }
    
    // Final check before creating PrismaClient
    if (!process.env.DATABASE_URL) {
      console.error('[Prisma] ❌ CRITICAL: DATABASE_URL still not in process.env!');
      console.error('[Prisma] This will cause Prisma to fail!');
      console.error('[Prisma] dbUrl value:', dbUrl ? 'HAS VALUE' : 'NO VALUE');
    } else {
      const preview = process.env.DATABASE_URL.length > 40 
        ? `${process.env.DATABASE_URL.substring(0, 20)}...${process.env.DATABASE_URL.substring(process.env.DATABASE_URL.length - 20)}`
        : process.env.DATABASE_URL.substring(0, 20) + '...';
      console.log('[Prisma] ✅ DATABASE_URL is set:', preview);
    }
    console.log('[Prisma] ====================================');
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      errorFormat: "pretty",
      // Pass it explicitly in datasources too (belt and suspenders)
      datasources: {
        db: {
          url: process.env.DATABASE_URL || dbUrl,
        },
      },
    });
    
    // Handle Prisma connection errors gracefully
    prisma.$connect().catch((error) => {
      console.error("Failed to connect to database:", error);
      console.error("DATABASE_URL in process.env:", process.env.DATABASE_URL ? "SET" : "NOT SET");
      console.error("DATABASE_URL value:", dbUrl ? "SET" : "NOT SET");
    });
  }
  return prisma;
};

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "change-me-in-production",
  baseURL: process.env.BETTER_AUTH_BASE_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      scope: ["user:email"],
    },
  },
});
