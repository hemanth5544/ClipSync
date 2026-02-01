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

All URLs are read from environment variables. No hardcoded localhost or IPs.

**Local development:** Create or update `.env` in the repo root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
```

For physical devices or emulators, use your machine's LAN IP instead of localhost:
- Find your IP: `ip addr show` (Linux) or `ifconfig` (Mac)
- Example: `NEXT_PUBLIC_API_URL=http://192.168.1.100:8080/api`

**Production builds (EAS):** Set these as EAS secrets before running `eas build`:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://clipsync-production.up.railway.app/api"
eas secret:create --name EXPO_PUBLIC_BETTER_AUTH_URL --value "https://clipsync-auth.up.railway.app"
```

Or use `NEXT_PUBLIC_*` - both are supported. Restart Metro after changing `.env`.

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

### Android

**AAB** (for Google Play Store):
```bash
eas build --platform android --profile production
```

**APK** (for direct install / testing on device):
```bash
eas build --platform android --profile preview
```
The preview profile outputs an `.apk` you can install directly.

**Installing an existing AAB** (from production build):
1. Download [bundletool](https://github.com/google/bundletool/releases)
2. Connect your Android device via USB with USB debugging enabled
3. Run:
   ```bash
   java -jar bundletool-all-1.x.x.jar build-apks --bundle=your-app.aab --output=app.apks --mode=universal
   java -jar bundletool-all-1.x.x.jar install-apks --apks=app.apks
   ```

### iOS App
```bash
eas build --platform ios
```

(Requires Expo EAS account)

## Debugging Crashes

If the app crashes on startup when installed from an APK/AAB:

1. Enable USB debugging on your Android device
2. Connect via USB and run: `adb logcat *:E`
3. Launch the app; when it crashes, check the terminal for `----- beginning of crash` and the error below it
4. Common causes: expo-secure-store on some devices (we fall back to AsyncStorage), missing env vars in EAS build

## Notes

- For local development, ensure your phone and computer are on the same network
- Set `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` in root `.env` (use LAN IP for physical devices)
- Clipboard monitoring works on both iOS and Android
- URL opening uses Expo Linking
