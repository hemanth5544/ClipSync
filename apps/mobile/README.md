# ClipSync Mobile App

React Native mobile app for ClipSync with all desktop features.

## Features

✅ **All Desktop Features:**
- Authentication (Email/Password, OAuth ready)
- Clipboard monitoring (auto-saves copied text)
- Search and filter clips
- Favorites
- Delete with confirmation
- Expandable clip preview
- URL detection and opening
- Relative time formatting
- Device tagging
- Settings page
- Dark mode support (via system)

## Setup

### Prerequisites

- Node.js 18+
- pnpm 8+
- Expo CLI (installed globally or via npx)
- iOS Simulator (for Mac) or Android Emulator

### Install Dependencies

```bash
cd apps/mobile
pnpm install
```

### Configure Environment

Update `app.json` with your API URLs:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR_IP:8080/api",
      "authUrl": "http://YOUR_IP:3000"
    }
  }
}
```

**Important:** For mobile devices, use your computer's local IP address instead of `localhost`:
- Find your IP: `ip addr show` (Linux) or `ifconfig` (Mac)
- Example: `http://192.168.1.100:8080/api`

### Run the App

**Development:**
```bash
pnpm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

**Android:**
```bash
pnpm android
```

**iOS (Mac only):**
```bash
pnpm ios
```

## Project Structure

```
apps/mobile/
├── src/
│   ├── components/      # Reusable components
│   │   └── ClipCard.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/           # Custom hooks
│   │   └── useClipboard.ts
│   ├── lib/             # Utilities and API
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── timeUtils.ts
│   │   └── urlUtils.ts
│   ├── navigation/      # Navigation setup
│   │   └── index.tsx
│   └── screens/         # App screens
│       ├── HomeScreen.tsx
│       ├── FavoritesScreen.tsx
│       ├── SettingsScreen.tsx
│       └── LoginScreen.tsx
├── App.tsx
└── package.json
```

## Features Implementation

### Clipboard Monitoring
- Monitors clipboard every 1 second
- Auto-saves to backend API
- Uses device name for tagging

### Authentication
- Email/password sign in/up
- Secure token storage (Expo SecureStore)
- OAuth ready (needs deep linking setup)

### UI Components
- Native React Native components
- Custom ClipCard component
- Bottom tab navigation
- Pull-to-refresh

### API Integration
- Uses same Go backend API
- JWT token authentication
- Secure token storage

## Building for Production

### Android APK
```bash
eas build --platform android
```

### iOS App
```bash
eas build --platform ios
```

(Requires Expo EAS account)

## Notes

- For local development, ensure your phone and computer are on the same network
- Update API URLs in `app.json` with your local IP
- Clipboard monitoring works on both iOS and Android
- URL opening uses Expo Linking
