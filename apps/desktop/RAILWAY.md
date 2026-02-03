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
   - **IMPORTANT**: Leave **Root Directory** empty (use repo root). Railway will use the **root `railway.toml`**, which runs `pnpm run desktop:build` and `pnpm run desktop:start`. This gives access to the monorepo workspace and `pnpm-workspace.yaml`.

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
   - **Root Directory**: Leave empty (repo root) so workspace deps install correctly.
   - **Build Command**: `pnpm install && pnpm run desktop:build` (or use `railway.toml` defaults)
   - **Start Command**: `pnpm run desktop:start` (or use `railway.toml` defaults)
   - **Do not use** `desktop:dev` or `build:skip` — that runs the dev server and skips the build, which causes CSS parse errors (Tailwind not compiled) and is not for production.

4. **Run Prisma Migrations**
   After deployment, run migrations:
   ```bash
   railway run --service your-desktop-service-name cd apps/desktop && pnpm prisma:db:push
   ```

## Build Process

Railway will:
1. Install dependencies at root (pnpm workspace) via `pnpm install`
2. Build the desktop app via `pnpm run desktop:build` (runs `next build` in `apps/desktop`)
3. Next.js compiles CSS (Tailwind/PostCSS), TypeScript, and outputs to `.next` (standalone when not exporting)
4. Start the production server via `pnpm run desktop:start` (runs `next start`; uses Railway's `PORT`)

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
