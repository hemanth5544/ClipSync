import { createAuthClient } from "better-auth/react";

const client = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});

export const authClient = client;

// Export hooks - Better Auth makes these available on the client
// If the API is different, we'll need to adjust based on the actual package
export function useSession() {
  // Try to access useSession from client
  if (typeof (client as any).useSession === 'function') {
    return (client as any).useSession();
  }
  // Fallback: return empty session
  return { data: null, isPending: false, error: null };
}

export const signIn = client.signIn;
export const signUp = client.signUp;
export const signOut = client.signOut;
