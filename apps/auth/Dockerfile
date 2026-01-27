# Build stage
FROM node:18-slim AS base

# Install system dependencies needed for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy workspace files from repo root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all packages (needed for workspace dependencies)
COPY packages ./packages

# Copy auth app files
COPY apps/auth ./apps/auth

# Install all dependencies
# Set NODE_ENV to avoid issues with optional dependencies
ENV NODE_ENV=development
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder

WORKDIR /app

# Set build environment
ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=true

# Provide dummy DATABASE_URL for build (Next.js needs it during build-time analysis)
# Railway will provide the real DATABASE_URL at runtime
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client (doesn't need DATABASE_URL for generate)
RUN cd apps/auth && pnpm prisma:generate

# Build Next.js app
RUN cd apps/auth && pnpm build

# Production stage
FROM node:18-slim AS runner

# Install system dependencies for runtime (openssl for Prisma)
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

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
