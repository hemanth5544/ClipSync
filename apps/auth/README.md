# ClipSync Auth Service

Standalone authentication service for ClipSync. This service provides Better-Auth authentication that can be used by desktop, mobile, and web applications.

## Features

- ✅ Better-Auth authentication
- ✅ Email/Password authentication
- ✅ OAuth providers (Google, GitHub)
- ✅ JWT token generation for backend API
- ✅ User session management
- ✅ Can be hosted independently

## Quick Start

### Development

```bash
# Install dependencies (from project root)
pnpm install

# Run auth service
cd apps/auth
pnpm dev
```

The service will run on `http://localhost:3001`

### Production Build

```bash
cd apps/auth
pnpm build
pnpm start
```

## Environment Variables

The service uses environment variables from the root `.env` file:

- `DATABASE_URL` - PostgreSQL connection string (required)
- `BETTER_AUTH_SECRET` - Secret for Better-Auth (required)
- `BETTER_AUTH_BASE_URL` or `AUTH_SERVICE_URL` - Base URL for auth service (default: http://localhost:3001)
- `JWT_SECRET` - Secret for JWT tokens (required)
- `GOOGLE_CLIENT_ID` - Google OAuth client ID (optional)
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret (optional)
- `GITHUB_CLIENT_ID` - GitHub OAuth client ID (optional)
- `GITHUB_CLIENT_SECRET` - GitHub OAuth client secret (optional)

## API Endpoints

### Authentication
- `GET/POST /api/auth/[...all]` - Better-Auth endpoints (sign-in, sign-up, sign-out, session, etc.)

### Token
- `GET /api/token` - Get JWT token for backend API (requires authenticated session)

### User
- `GET /api/user` - Get current user info (requires JWT token in Authorization header)

## Usage in Other Apps

### Desktop App
Set `NEXT_PUBLIC_BETTER_AUTH_URL` or `AUTH_SERVICE_URL` to point to this service:
```env
AUTH_SERVICE_URL=http://localhost:3001
# or
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001
```

### Mobile App
Update the `AUTH_BASE_URL` in mobile app to point to this service:
```typescript
const AUTH_BASE_URL = "http://localhost:3001";
// or in production:
const AUTH_BASE_URL = "https://your-auth-service.com";
```

## Hosting

This service can be hosted on:
- **Railway** - Add as new service, set environment variables
- **Vercel** - Deploy as Next.js app
- **Any Node.js hosting** - Run `pnpm build && pnpm start`

## Database Setup

The service uses the same Prisma schema as the desktop app. Make sure to:

1. Run migrations:
   ```bash
   pnpm prisma:db:push
   ```

2. Generate Prisma client:
   ```bash
   pnpm prisma:generate
   ```

## Notes

- The service runs on port 3001 by default (to avoid conflicts with desktop app on 3000)
- All apps (desktop, mobile, web) can use the same auth service
- The service is stateless - sessions are stored in the database
- CORS is handled by Next.js (configure in `next.config.js` if needed)
