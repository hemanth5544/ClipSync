import { betterAuth } from "better-auth";

//CHEKC in src/lib/auth.ts
export const auth = betterAuth({
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL || "",
  },
  secret: process.env.BETTER_AUTH_SECRET || "change-me-in-production",
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://localhost:3000",
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
