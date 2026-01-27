# Build stage
FROM node:18-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy workspace files from repo root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages (needed for workspace dependencies)
COPY packages ./packages

# Copy auth app files
COPY apps/auth/package.json ./apps/auth/
COPY apps/auth/next.config.js ./apps/auth/
COPY apps/auth/tsconfig.json ./apps/auth/
COPY apps/auth/prisma ./apps/auth/prisma
COPY apps/auth/scripts ./apps/auth/scripts
COPY apps/auth/src ./apps/auth/src

# Install dependencies (from root for workspace)
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

WORKDIR /app

# Generate Prisma client
RUN cd apps/auth && pnpm prisma:generate

# Build Next.js app
RUN cd apps/auth && pnpm build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy the standalone output from builder
# Next.js standalone includes all dependencies and server.js
# The standalone output structure mirrors the monorepo structure
COPY --from=builder /app/apps/auth/.next/standalone ./
COPY --from=builder /app/apps/auth/.next/static ./apps/auth/.next/static
COPY --from=builder /app/apps/auth/public ./apps/auth/public

# Expose port (Railway will set PORT env var)
EXPOSE 3001

# The standalone output has server.js in apps/auth directory
WORKDIR /app/apps/auth

# Start the Next.js server
CMD ["node", "server.js"]
