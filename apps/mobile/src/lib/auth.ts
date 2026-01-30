import { getAuthBaseUrl, setAuthToken } from "./api";
import * as Linking from "expo-linking";

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
}

// Get JWT token from Better-Auth session
// Note: Mobile apps can't use cookies like web browsers
// We'll need to store the session token and pass it manually
async function getJWTToken(sessionCookie?: string): Promise<string | null> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // If we have a session cookie, pass it as a header
    if (sessionCookie) {
      headers["Cookie"] = sessionCookie;
    }

    const response = await fetch(`${getAuthBaseUrl()}/api/token`, {
      method: "GET",
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      console.error("Token API error:", response.status);
      return null;
    }

    const data = await response.json();
    if (!data.token) {
      console.error("No token in response:", data);
      return null;
    }
    return data.token;
  } catch (error) {
    console.error("Failed to get JWT token:", error);
    return null;
  }
}

// Sign in with email/password (same as desktop)
export async function signInEmail(email: string, password: string): Promise<AuthResponse> {
  try {
    // For React Native, use direct fetch instead of Better-Auth client
    // Better-Auth client is designed for web browsers with cookies
    const response = await fetch(`${getAuthBaseUrl()}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Sign in failed");
    }

    // Get cookies from response headers
    // React Native fetch doesn't automatically handle cookies like browsers
    const setCookieHeader = response.headers.get("set-cookie");
    console.log("Set-Cookie header:", setCookieHeader);

    // Extract session token from cookie if available
    let sessionCookie = "";
    if (setCookieHeader) {
      // Parse the cookie string to extract the session token
      const cookies = setCookieHeader.split(";");
      for (const cookie of cookies) {
        if (cookie.trim().startsWith("better-auth.session_token=")) {
          sessionCookie = cookie.trim();
          break;
        }
      }
    }

    // Wait a bit for session to be set
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get session from Better-Auth with cookie in header
    const sessionHeaders: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (sessionCookie) {
      sessionHeaders["Cookie"] = sessionCookie;
    }

    const sessionResponse = await fetch(`${getAuthBaseUrl()}/api/auth/session`, {
      credentials: "include",
      headers: sessionHeaders,
    });

    if (!sessionResponse.ok) {
      throw new Error("Failed to get session");
    }

    const session = await sessionResponse.json();

    if (!session?.user) {
      throw new Error("Failed to get user session");
    }

    // Get JWT token for backend with session cookie
    const token = await getJWTToken(sessionCookie);
    if (!token) {
      throw new Error("Failed to get JWT token");
    }

    await setAuthToken(token);

    return {
      token,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  }
}

// Sign up with email/password (same as desktop)
export async function signUpEmail(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  try {
    // For React Native, use direct fetch instead of Better-Auth client
    const response = await fetch(`${getAuthBaseUrl()}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Sign up failed");
    }

    // After signup, sign in automatically
    return signInEmail(email, password);
  } catch (error: any) {
    console.error("Sign up error:", error);
    throw error;
  }
}

// Sign in with OAuth provider (same as desktop)
export async function signInSocial(provider: "google" | "github"): Promise<void> {
  try {
    // For React Native, we need to use direct fetch instead of Better-Auth client
    // Better-Auth client is designed for web browsers
    const callbackURL = "clipsync://auth/callback";
    
    // Construct the OAuth URL directly
    const oauthURL = `${getAuthBaseUrl()}/api/auth/social/${provider}?callbackURL=${encodeURIComponent(callbackURL)}`;
    
    console.log("Opening OAuth URL:", oauthURL);
    
    // Open OAuth URL in browser
    const canOpen = await Linking.canOpenURL(oauthURL);
    if (canOpen) {
      await Linking.openURL(oauthURL);
    } else {
      throw new Error(`Cannot open OAuth URL: ${oauthURL}`);
    }
  } catch (error: any) {
    console.error(`Failed to initiate ${provider} sign-in:`, error);
    throw error;
  }
}

// Handle OAuth callback (called after OAuth redirect)
// Note: After OAuth, the browser handles cookies, so we need to get them from the redirect
export async function handleOAuthCallback(url?: string): Promise<AuthResponse | null> {
  try {
    // Extract session token from URL if available (Better-Auth might pass it)
    // Or try to get session from Better-Auth
    // For OAuth, the session should be set in the browser, but we need to get it
    const sessionResponse = await fetch(`${getAuthBaseUrl()}/api/auth/session`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!sessionResponse.ok) {
      console.error("Session response not OK:", sessionResponse.status);
      return null;
    }

    const session = await sessionResponse.json();

    if (!session?.user) {
      console.error("No user in session:", session);
      return null;
    }

    // Get cookies from session response
    const setCookieHeader = sessionResponse.headers.get("set-cookie");
    let sessionCookie = "";
    if (setCookieHeader) {
      const cookies = setCookieHeader.split(";");
      for (const cookie of cookies) {
        if (cookie.trim().startsWith("better-auth.session_token=")) {
          sessionCookie = cookie.trim();
          break;
        }
      }
    }

    // Get JWT token for backend
    const token = await getJWTToken(sessionCookie);
    if (!token) {
      throw new Error("Failed to get JWT token");
    }

    await setAuthToken(token);

    return {
      token,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
    };
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return null;
  }
}

// Sign out (same as desktop)
export async function signOutAuth(): Promise<void> {
  try {
    // Call Better-Auth sign out endpoint
    await fetch(`${getAuthBaseUrl()}/api/auth/sign-out`, {
      method: "POST",
      credentials: "include",
    });
    await setAuthToken(null);
  } catch (error) {
    console.error("Sign out error:", error);
    // Clear token even if request fails
    await setAuthToken(null);
  }
}

// Get current session
export async function getSession(): Promise<AuthResponse | null> {
  try {
    const sessionResponse = await fetch(`${getAuthBaseUrl()}/api/auth/session`, {
      credentials: "include",
    });

    const session = await sessionResponse.json();

    if (!session?.user) {
      return null;
    }

    const token = await getAuthToken();
    if (!token) {
      // Try to get new token (without session cookie, might fail)
      const newToken = await getJWTToken();
      if (!newToken) {
        return null;
      }
      await setAuthToken(newToken);
      return {
        token: newToken,
        user: session.user,
      };
    }

    return {
      token,
      user: session.user,
    };
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

// Helper to get stored auth token
async function getAuthToken(): Promise<string | null> {
  const { getAuthToken } = require("./api");
  return getAuthToken();
}
