import { signIn } from "@/lib/better-auth";
import { getAuthBase } from "@/lib/api";

/**
 * Resolve callback URL to a full URL so the auth service (different domain)
 * redirects back to this app after OAuth, not to the auth service's root.
 */
export function getFullCallbackURL(path: string = "/"): string {
  if (typeof window === "undefined") return path;
  const origin = window.location.origin;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${p}`;
}

export async function initiateSocialSignIn(
  provider: "google" | "github",
  callbackURL: string = "/"
): Promise<void> {
  const fullCallbackURL = getFullCallbackURL(callbackURL);
  try {
    const result = await signIn.social({
      provider,
      callbackURL: fullCallbackURL,
    });
    const redirectURL = result?.url || result?.redirect || (result as any)?.data?.url;
    if (redirectURL) {
      window.location.href = redirectURL;
      return;
    }
    if (result?.error) throw new Error(result.error);
    const base = getAuthBase();
    window.location.href = `${base}/api/auth/sign-in/social?provider=${provider}&callbackURL=${encodeURIComponent(fullCallbackURL)}`;
  } catch (error: any) {
    console.error(`Failed to initiate ${provider} sign-in:`, error);
    throw error;
  }
}
