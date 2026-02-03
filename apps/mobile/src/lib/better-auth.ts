import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";

const AUTH_BASE_URL = Constants.expoConfig?.extra?.authUrl ?? "";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL || "https://clipsync-auth.up.railway.app",
});
//TODO: IN Futrure we need to support the singup and login flow in mobile app also
// FYI : Currenlty we use only pairing flow in mobile app

// Export auth methods
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;

// Session hook - Better-Auth provides useSession
export function useSession() {
  // Better-Auth's useSession is available on the client
  if (typeof (authClient as any).useSession === "function") {
    return (authClient as any).useSession();
  }
  // Fallback for React Native
  return { data: null, isPending: false, error: null };
}
