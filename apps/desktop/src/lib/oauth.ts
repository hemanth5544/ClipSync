

import { signIn } from "@/lib/better-auth";

export async function initiateSocialSignIn(provider: "google" | "github", callbackURL: string = "/") {
  try {
    console.log(`Initiating ${provider} OAuth flow with callbackURL: ${callbackURL}`);
    
   
    const result = await signIn.social({
      provider: provider,
      callbackURL: callbackURL,
    });
    
    console.log("OAuth sign-in result:", result);
  
    const redirectURL = result?.url || result?.redirect || (result as any)?.data?.url;
    
    if (redirectURL) {
      console.log("Redirecting to:", redirectURL);
      window.location.href = redirectURL;
      return;
    }
    
    if (result?.error) {
      throw new Error(result.error);
    }
    

    console.warn("No redirect URL in result, trying manual construction...");
    const baseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
    
    const oauthURL = `${baseURL}/api/auth/social/${provider}?callbackURL=${encodeURIComponent(callbackURL)}`;
    console.log("Manually redirecting to:", oauthURL);
    window.location.href = oauthURL;
    
  } catch (error: any) {
    console.error(`Failed to initiate ${provider} sign-in:`, error);
    console.error("Error details:", error.message, error.stack);
    throw error;
  }
}
