# ClipSync

Clipboard sync across your devices. Copy once, paste anywhere — desktop (Linux, Windows, macOS), web, and mobile.

**Status:** Alpha. Linux desktop available now; Windows and macOS coming soon. [Try the web app](https://clipsync.up.railway.app).

---

## Features

- **Instant sync** — Copy on one device, paste on another in real time
- **Secure notes** — End-to-end encrypted vault for sensitive clips
- **Favorites** — Star clips for quick access
- **Search & filter** — Find any clip by type, date, or full-text
- **Device pairing** — Pair desktop with your phone via QR code
- **Synced messages** — Send clips between devices and see sync status
- **Global shortcuts** — Open clipboard anywhere (e.g. Ctrl+Shift+V)
- **Version history** — Automatic backup so you never lose a clip

---

## Monorepo layout

ClipSync is a pnpm workspace. **Always install dependencies from the repository root** so all apps use the same workspace packages.

| Path | Description |
|------|-------------|
| **packages/** | Shared code: `@clipsync/types`, `@clipsync/ui`, `@clipsync/eslint-config`, `@clipsync/tsconfig` |
| **apps/desktop** | Electron + Next.js desktop app (Linux DEB & AppImage; Windows/macOS coming soon) |
| **apps/web** | Next.js marketing site + download section; serves desktop installers from `/releases` |
| **apps/mobile** | Expo/React Native app |
| **apps/backend** | Go API server (auth, clips, sync, pairing, secure vault) |

---

## Setup

```bash
pnpm install
```

Do **not** run `pnpm install` inside `apps/desktop`, `apps/mobile`, or `apps/web` alone; use the root so workspace links are correct.

Copy `.env.example` to `.env` in the root and set at least:

- `DATABASE_URL` — PostgreSQL connection string
- `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_BETTER_AUTH_URL` — for desktop and web
- `BETTER_AUTH_SECRET` — for auth

See `.env.example` for the full list.

---

## Scripts (from root)

| Script | Description |
|--------|-------------|
| `pnpm electron:dev` | Run desktop app (Electron + Next) |
| `pnpm electron:build` | Build desktop for current platform |
| `pnpm electron:build:linux:deb` | Build Linux DEB only |
| `pnpm electron:build:linux` | Build Linux DEB + AppImage |
| `pnpm electron:build:win` | Build Windows installer |
| `pnpm electron:build:mac` | Build macOS DMG (on Mac only) |
| `pnpm web:dev` | Run marketing web app (Next.js) |
| `pnpm web:build` | Build web app |
| `pnpm mobile:start` | Run mobile app (Expo) |
| `pnpm backend:dev` | Run Go API server |

---

## Building the desktop app

From the repo root:

```bash
pnpm electron:build:linux:deb   # Linux DEB only
pnpm electron:build:linux        # Linux DEB + AppImage
pnpm electron:build:win          # Windows (from any OS)
pnpm electron:build:mac          # macOS (must run on Mac)
```

Output: `apps/desktop/dist/` (e.g. `clipsync-desktop_1.0.0_amd64.deb`, `ClipSync-1.0.0.AppImage`).

**Alpha:** Desktop builds are early release. Linux is available; Windows and macOS are coming soon.

---

## Web app

- **Marketing site:** `pnpm web:dev` → [http://localhost:3000](http://localhost:3000) (or your deployed URL).
- **Try ClipSync in the browser:** [https://clipsync.up.railway.app](https://clipsync.up.railway.app).

To serve desktop installers from the site, put built files (e.g. from `apps/desktop/dist/`) into `apps/web/public/releases/`. The download section links to `/releases/<filename>`.

---

## API and CORS

The desktop app uses the `app://` origin. Your Go API and auth service must:

- Allow `app://.` and `app://localhost` in CORS / `trustedOrigins`.
- Handle OPTIONS for `/api/auth/*` and return 200 with CORS headers.

Set `ALLOWED_ORIGINS` (and any auth CORS config) to include these origins. See `.env.example`.

---

## License

Private / as specified in the repository.
