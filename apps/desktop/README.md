# ClipSync Desktop - Electron App

A cross-platform clipboard manager built with Electron and Next.js.

## Quick Start

### Development

```bash
# Install dependencies (from project root)
pnpm install

# Run in development mode
cd apps/desktop
pnpm electron:dev
```

### Building for Distribution

```bash
cd apps/desktop

# Build for current platform
pnpm electron:build

# Or build for specific platform
pnpm electron:build:win    # Windows
pnpm electron:build:mac    # macOS
pnpm electron:build:linux  # Linux
```

The built installer will be in the `dist/` folder.

## Configuration

1. Copy `.env.example` to `.env` in the project root
2. Set your `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/clipsync
   ```
3. Configure other variables as needed (see `.env.example`)

## Features

- ✅ Cross-platform (Windows, macOS, Linux)
- ✅ System tray integration
- ✅ Global keyboard shortcuts (Ctrl+Shift+V)
- ✅ Clipboard history
- ✅ User authentication (Better-Auth)
- ✅ OAuth support (Google, GitHub)

## Project Structure

```
apps/desktop/
├── electron/          # Electron main process
│   ├── main.ts       # Main process (TypeScript)
│   └── preload.ts    # Preload script
├── src/              # Next.js app
│   ├── app/         # Next.js pages
│   └── lib/         # Shared libraries
│       └── auth.ts  # Authentication setup
├── prisma/           # Database schema
└── dist/             # Build output (after building)
```

## Database

The app requires a PostgreSQL database. Users can:
- Use a local PostgreSQL installation
- Use a remote database (Railway, Supabase, etc.)

Just set `DATABASE_URL` in the `.env` file.

## See Also

- [BUILD.md](./BUILD.md) - Detailed build instructions
- [.env.example](../../.env.example) - Environment variables template
