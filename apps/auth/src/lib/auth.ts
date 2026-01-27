import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// Get DATABASE_URL from environment
const getDatabaseUrl = (): string => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  throw new Error(
    "DATABASE_URL is required but not set.\n" +
    "Make sure DATABASE_URL is set in your .env file or environment variables."
  );
};

let databaseUrl: string | null = null;
const getDatabaseUrlLazy = (): string => {
  if (!databaseUrl) {
    databaseUrl = getDatabaseUrl();
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = databaseUrl;
    }
  }
  return databaseUrl;
};

let prisma: PrismaClient | null = null;

const getPrisma = (): PrismaClient => {
  if (!prisma) {
    const dbUrl = getDatabaseUrlLazy();
    
    if (!process.env.DATABASE_URL && dbUrl) {
      process.env.DATABASE_URL = dbUrl;
    }
    
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      errorFormat: "pretty",
      datasources: {
        db: {
          url: process.env.DATABASE_URL || dbUrl,
        },
      },
    });
    
    prisma.$connect().catch((error) => {
      console.error("Prisma connection error:", error);
    });
  }
  return prisma;
};

// Get base URL for auth service
const getBaseURL = (): string => {
  return process.env.BETTER_AUTH_BASE_URL || 
         process.env.AUTH_SERVICE_URL || 
         "http://localhost:3001";
};

export const auth = betterAuth({
  database: prismaAdapter(getPrisma(), {
    provider: "postgresql",
  }),
  secret: process.env.BETTER_AUTH_SECRET || "change-me-in-production",
  baseURL: getBaseURL(),
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
