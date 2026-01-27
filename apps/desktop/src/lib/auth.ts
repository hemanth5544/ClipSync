import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

// Ensure DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set!");
  console.error("Available env vars with 'DATABASE' or 'DB':", 
    Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB'))
  );
}

// Initialize PrismaClient with connection pooling for production
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  errorFormat: "pretty",
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Handle Prisma connection errors gracefully
prisma.$connect().catch((error) => {
  console.error("Failed to connect to database:", error);
  console.error("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");
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
