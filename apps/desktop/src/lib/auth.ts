import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// Get DATABASE_URL from environment
// Railway automatically provides this when PostgreSQL service is linked
// If not set, check for Railway's service reference format or construct from components
const getDatabaseUrl = (): string => {
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
    console.log("Constructed DATABASE_URL from individual PostgreSQL components");
    return constructedUrl;
  }
  
  // Log all available env vars for debugging (in Railway)
  console.error("ERROR: DATABASE_URL is not set!");
  
  // Check if we're in Railway
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_PROJECT_ID;
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
  
  // Log a few sample env vars to verify Railway is passing them
  const sampleVars = Object.keys(process.env).slice(0, 10);
  console.error("Sample environment variables (first 10):", sampleVars);
  
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

const databaseUrl = getDatabaseUrl();

// Initialize PrismaClient with connection pooling for production
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  errorFormat: "pretty",
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

// Handle Prisma connection errors gracefully
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
  console.error("DATABASE_URL:", databaseUrl ? "SET" : "NOT SET");
});

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
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
