# Railway Deployment Guide for Desktop Next.js App

## Prerequisites
- Railway account
- PostgreSQL database (can use the same one as backend or separate)
- Backend API deployed and accessible

## Deployment Steps

1. **Create a New Service in Railway**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - **IMPORTANT**: Leave Root Directory empty (use repo root) OR set to "." (repo root)
   - This is because we need access to the root `package.json` and `pnpm-workspace.yaml`

2. **Configure Environment Variables**
   Add these environment variables in Railway dashboard:
   - `DATABASE_URL` - PostgreSQL connection string (same as backend or separate)
   - `BETTER_AUTH_SECRET` - Better Auth secret key (same as local)
   - `BETTER_AUTH_BASE_URL` - Your Railway domain (e.g., `https://your-app.up.railway.app`)
   - `NEXT_PUBLIC_API_URL` - Your backend API URL (e.g., `https://clipsync-production.up.railway.app/api`)
   - `NEXT_PUBLIC_BETTER_AUTH_URL` - Same as `BETTER_AUTH_BASE_URL`
   - `JWT_SECRET` - Must match backend JWT_SECRET
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` (if using Google OAuth)
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (if using GitHub OAuth)

3. **Configure Build Settings**
   - **Builder**: Use "Nixpacks" or "Railpack" (Default)
   - **Build Command**: `cd apps/desktop && pnpm install && pnpm prisma:generate && pnpm build`
   - **Start Command**: `cd apps/desktop && pnpm start`

4. **Run Prisma Migrations**
   After deployment, run migrations:
   ```bash
   railway run --service your-desktop-service-name cd apps/desktop && pnpm prisma:db:push
   ```

## Build Process

Railway will:
1. Install dependencies at root (pnpm workspace)
2. Install dependencies in `apps/desktop`
3. Generate Prisma client
4. Build Next.js app (outputs to `.next/standalone`) - **Electron files are excluded**
5. Start Next.js server as a web application

**Note**: This deployment is for the **Next.js web app only**, not the Electron desktop app. The Electron files are excluded from the build.

## Monorepo Structure

Since this is a monorepo:
- **Root `node_modules`**: Contains workspace dependencies and shared packages
- **`apps/desktop/node_modules`**: Contains app-specific dependencies
- Railway needs to install at root first, then in the desktop app

## Notes

- The `railway.toml` file in `apps/desktop/` configures the build and start commands
- Next.js `output: 'standalone'` creates a self-contained build in `.next/standalone`
- Make sure `NEXT_PUBLIC_API_URL` points to your deployed backend
- Update OAuth callback URLs in Google/GitHub to use your Railway domain

## Troubleshooting

### Build fails with "Cannot find module"
- Make sure root dependencies are installed: Railway should run `pnpm install` at root first
- Check that workspace packages (`@clipsync/types`, `@clipsync/ui`) are properly linked

### Prisma errors
- Make sure `DATABASE_URL` is set correctly
- Run `pnpm prisma:generate` before build
- Run `pnpm prisma:db:push` after deployment

### Port issues
- Next.js will use Railway's `PORT` environment variable automatically
- Make sure your app listens on `process.env.PORT || 3000`
