# ClipSync

ClipSync is a monorepo. **Always install dependencies from the repository root** so desktop and mobile apps use the same workspace packages.

## Monorepo layout

- **Root** – pnpm workspace; run `pnpm install` here only.
- **packages/** – Shared code used by apps:
  - `@clipsync/types` – shared TypeScript types
  - `@clipsync/ui` – shared UI components (desktop)
  - `@clipsync/eslint-config`, `@clipsync/tsconfig` – shared config
- **apps/desktop** – Next.js + Electron; depends on `@clipsync/types`, `@clipsync/ui`
- **apps/mobile** – Expo/React Native; depends on `@clipsync/types`
- **apps/backend** – Go API server

## Setup

```bash
pnpm install
```

Do not run `pnpm install` inside `apps/desktop` or `apps/mobile` alone; use the root so workspace links are correct.

**About `node_modules` in apps:** When you run `pnpm install` at the root, pnpm creates `node_modules` in each app (and in `packages/`) and links them to the root store. Those app `node_modules` are required for the build and runtime — do not remove them. Dependencies are not duplicated; they live in the root store and are symlinked. Install only from the root.

## Scripts (from root)

| Script | Description |
|--------|-------------|
| `pnpm electron:dev` | Run desktop app (Electron + Next) |
| `pnpm electron:build` | Build desktop app (Linux AppImage, etc.) |
| `pnpm mobile:start` | Run mobile app (Expo) |
| `pnpm backend:dev` | Run Go backend |

## Building the Electron app

```bash
pnpm electron:build
```

Output: `apps/desktop/dist/`.

**API URLs and CORS:** The desktop app bakes `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` at build time from the root `.env`. Ensure your root `.env` has the correct values (e.g. your Railway URLs) before running `pnpm electron:build`. The packaged app loads from the `app://` origin, so:
- **Go API** must allow that origin (we use `AllowOriginFunc` that accepts `app://` in this repo).
- **Auth service** (clipsync-auth) must handle **OPTIONS** for `/api/auth/*` and return 200 with CORS, and allow `app://.` and `app://localhost` in CORS / better-auth `trustedOrigins`. Otherwise Sign Out from the desktop app 
