const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env from repo root (monorepo) or current dir
// For EAS production builds, set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_BETTER_AUTH_URL as EAS secrets
const rootEnv = path.resolve(__dirname, '../../.env');
const localEnv = path.resolve(__dirname, '.env');
const cwdEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) config({ path: rootEnv });
else if (fs.existsSync(localEnv)) config({ path: localEnv });
else if (fs.existsSync(cwdEnv)) config({ path: cwdEnv });

// URLs from env - no hardcoded localhost. Set EXPO_PUBLIC_* or NEXT_PUBLIC_* in .env
const apiUrl = process.env.EXPO_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL;
const authUrl = process.env.EXPO_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BETTER_AUTH_URL;

// Derive app links domain from auth URL for iOS universal links (e.g. applinks:clipsync-auth.up.railway.app)
function getAppLinksDomain() {
  const domain = process.env.EXPO_PUBLIC_APP_LINKS_DOMAIN;
  if (domain) return domain;
  if (authUrl) {
    try {
      const u = new URL(authUrl);
      return u.hostname;
    } catch (_) {}
  }
  return null;
}
const appLinksDomain = getAppLinksDomain();
const associatedDomains = appLinksDomain ? [`applinks:${appLinksDomain}`] : [];

if (!apiUrl || !authUrl) {
  console.warn('[ClipSync mobile] Missing EXPO_PUBLIC_API_URL or EXPO_PUBLIC_BETTER_AUTH_URL. Set in .env or EAS secrets for builds.');
}

module.exports = {
  expo: {
    name: "ClipSync",
    slug: "clipsync-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.clipsync.mobile",
      associatedDomains
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.clipsync.mobile",
      permissions: ["CLIPBOARD_READ", "CLIPBOARD_WRITE", "READ_SMS", "RECEIVE_SMS"],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "clipsync",
              host: "pair"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    scheme: "clipsync",
    extra: (() => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[ClipSync mobile] apiUrl:", apiUrl || "(not set)", "| authUrl:", authUrl || "(not set)");
      }
      return {
        apiUrl: apiUrl || "",
        authUrl: authUrl || "",
        eas: {
          projectId: "d17e5cca-f104-4387-a1e5-53a001d98ad3"
        }
      };
    })(),
    plugins: [
      "expo-secure-store"
    ]
  }
};
