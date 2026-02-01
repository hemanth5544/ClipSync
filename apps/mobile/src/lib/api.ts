import { Clip, CreateClipRequest, PaginatedResponse } from "@clipsync/types";
import Constants from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_TOKEN_KEY = "clipsync_auth_token";

// On Android emulator, localhost = device. Replace with 10.0.2.2 to reach host machine.
function resolveBaseUrl(url: string): string {
  if (!url) return url;
  if (Platform.OS === "android" && /localhost|127\.0\.0\.1/.test(url)) {
    return url.replace(/localhost|127\.0\.0\.1/g, "10.0.2.2");
  }
  return url;
}

function getApiUrl(): string {
  const raw = Constants.expoConfig?.extra?.apiUrl ?? "";
  if (!raw) {
    console.warn("[ClipSync] apiUrl not set. Set EXPO_PUBLIC_API_URL or NEXT_PUBLIC_API_URL in .env");
  }
  return resolveBaseUrl(raw);
}

export function getAuthBaseUrl(): string {
  const raw = Constants.expoConfig?.extra?.authUrl ?? "";
  if (!raw) {
    console.warn("[ClipSync] authUrl not set. Set EXPO_PUBLIC_BETTER_AUTH_URL or NEXT_PUBLIC_BETTER_AUTH_URL in .env");
  }
  return resolveBaseUrl(raw);
}

// Export for screens that need the raw API base (e.g. pairing)
export { getApiUrl };

// expo-secure-store can crash on some Android devices in release. Fall back to AsyncStorage.
let _store: { setItem: (k: string, v: string) => Promise<void>; getItem: (k: string) => Promise<string | null>; removeItem: (k: string) => Promise<void> } | null = null;

async function getSecureStore(): Promise<{
  setItem: (key: string, value: string) => Promise<void>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<void>;
}> {
  if (_store) return _store;
  if (Platform.OS === "web") {
    _store = { setItem: (k, v) => AsyncStorage.setItem(k, v), getItem: (k) => AsyncStorage.getItem(k), removeItem: (k) => AsyncStorage.removeItem(k) };
    return _store;
  }
  try {
    const SecureStore = await import("expo-secure-store");
    _store = {
      setItem: (k, v) => SecureStore.setItemAsync(k, v),
      getItem: (k) => SecureStore.getItemAsync(k),
      removeItem: (k) => SecureStore.deleteItemAsync(k),
    };
    return _store;
  } catch (e) {
    console.warn("[ClipSync] SecureStore failed, using AsyncStorage:", e);
    _store = { setItem: (k, v) => AsyncStorage.setItem(k, v), getItem: (k) => AsyncStorage.getItem(k), removeItem: (k) => AsyncStorage.removeItem(k) };
    return _store;
  }
}

// Store auth token (secure on native, AsyncStorage on web)
export async function setAuthToken(token: string | null): Promise<void> {
  const store = await getSecureStore();
  if (token) {
    await store.setItem(AUTH_TOKEN_KEY, token);
  } else {
    await store.removeItem(AUTH_TOKEN_KEY);
  }
}

// Get stored auth token
export async function getAuthToken(): Promise<string | null> {
  try {
    const store = await getSecureStore();
    return await store.getItem(AUTH_TOKEN_KEY);
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error("Not authenticated. Please sign in.");
  }
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Clear invalid token
      await setAuthToken(null);
      throw new Error("Authentication failed. Please sign in again.");
    }
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response;
}

export const api = {
  clips: {
    getAll: async (params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      favorite?: boolean;
    }): Promise<PaginatedResponse<Clip>> => {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.pageSize) queryParams.append("pageSize", params.pageSize.toString());
      if (params?.search) queryParams.append("search", params.search);
      if (params?.favorite) queryParams.append("favorite", "true");

      const response = await fetchWithAuth(`/clips?${queryParams}`);
      return response.json();
    },

    get: async (id: string): Promise<Clip> => {
      const response = await fetchWithAuth(`/clips/${id}`);
      return response.json();
    },

    create: async (clip: CreateClipRequest): Promise<Clip> => {
      const response = await fetchWithAuth("/clips", {
        method: "POST",
        body: JSON.stringify(clip),
      });
      return response.json();
    },

    delete: async (id: string): Promise<void> => {
      await fetchWithAuth(`/clips/${id}`, {
        method: "DELETE",
      });
    },

    toggleFavorite: async (id: string): Promise<Clip> => {
      const response = await fetchWithAuth(`/clips/${id}/favorite`, {
        method: "PUT",
      });
      return response.json();
    },
  },

  sync: {
    getStatus: async (deviceId?: string): Promise<{
      lastSync: string | null;
      totalClips: number;
      unsyncedClips: number;
    }> => {
      const queryParams = deviceId ? `?deviceId=${deviceId}` : "";
      const response = await fetchWithAuth(`/sync/status${queryParams}`);
      return response.json();
    },

    pull: async (deviceId: string, lastSync?: string): Promise<{
      clips: Clip[];
      lastSync: string;
    }> => {
      const response = await fetchWithAuth("/sync/pull", {
        method: "POST",
        body: JSON.stringify({ deviceId, lastSync }),
      });
      return response.json();
    },

    push: async (deviceId: string, clips: CreateClipRequest[]): Promise<{
      synced: number;
      lastSync: string;
    }> => {
      const response = await fetchWithAuth("/sync/push", {
        method: "POST",
        body: JSON.stringify({ deviceId, clips }),
      });
      return response.json();
    },
  },

  secure: {
    getVaultStatus: async (): Promise<{
      exists: boolean;
      salt?: string;
      createdAt?: string;
    }> => {
      const response = await fetchWithAuth("/secure/vault");
      return response.json();
    },

    createVault: async (): Promise<{ salt: string; createdAt: string }> => {
      const response = await fetchWithAuth("/secure/vault", {
        method: "POST",
      });
      return response.json();
    },

    getClips: async (): Promise<
      Array<{
        id: string;
        encryptedPayload: string;
        nonce: string;
        createdAt: string;
      }>
    > => {
      const response = await fetchWithAuth("/secure/clips");
      return response.json();
    },

    createClip: async (encryptedPayload: string, nonce: string): Promise<{
      id: string;
      createdAt: string;
    }> => {
      const response = await fetchWithAuth("/secure/clips", {
        method: "POST",
        body: JSON.stringify({ encryptedPayload, nonce }),
      });
      return response.json();
    },

    updateClip: async (
      id: string,
      encryptedPayload: string,
      nonce: string
    ): Promise<{ id: string }> => {
      const response = await fetchWithAuth(`/secure/clips/${id}`, {
        method: "PUT",
        body: JSON.stringify({ encryptedPayload, nonce }),
      });
      return response.json();
    },

    deleteClip: async (id: string): Promise<void> => {
      await fetchWithAuth(`/secure/clips/${id}`, {
        method: "DELETE",
      });
    },
  },

  user: {
    getMe: async (): Promise<{
      id: string;
      email: string;
      name: string | null;
      image: string | null;
    }> => {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const authUrl = getAuthBaseUrl();
      const response = await fetch(`${authUrl}/api/user`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to get user details");
      }

      return response.json();
    },
  },
};
