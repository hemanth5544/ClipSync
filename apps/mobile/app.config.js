const { config } = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env from repo root (monorepo) or current dir so NEXT_PUBLIC_* are available
const rootEnv = path.resolve(__dirname, '../../.env');
const localEnv = path.resolve(__dirname, '.env');
const cwdEnv = path.resolve(process.cwd(), '.env');
if (fs.existsSync(rootEnv)) config({ path: rootEnv });
else if (fs.existsSync(localEnv)) config({ path: localEnv });
else if (fs.existsSync(cwdEnv)) config({ path: cwdEnv });

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
      associatedDomains: ["applinks:localhost"]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.clipsync.mobile",
      permissions: ["CLIPBOARD_READ", "CLIPBOARD_WRITE"],
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
      // When you run Metro, this logs what the app will use (restart Metro after changing .env)
      if (process.env.NODE_ENV !== "production") {
        console.log("[ClipSync mobile] apiUrl:", apiUrl, "| authUrl:", authUrl);
      }
      return {
        apiUrl,
        authUrl,
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
