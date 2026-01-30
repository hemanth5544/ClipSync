import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";

// Use the same base URL as auth.ts
const AUTH_BASE_URL = "http://192.168.1.7:3000";

export const authClient = createAuthClient({
  baseURL: AUTH_BASE_URL,
});

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
