import { Clip, CreateClipRequest, PaginatedResponse } from "@clipsync/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

async function getAuthToken(): Promise<string | null> {
  try {
    // Call external auth service (apps/auth on port 3001)
    const authServiceUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3001";
    const response = await fetch(`${authServiceUrl}/api/token`, {
      credentials: "include", // Send cookies
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Token API error:", response.status, errorData);
      return null;
    }
    
    const data = await response.json();
    if (!data.token) {
      console.error("No token in response:", data);
      return null;
    }
    return data.token;
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

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
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

    togglePin: async (id: string): Promise<Clip> => {
      const response = await fetchWithAuth(`/clips/${id}/pin`, {
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

  pairing: {
    generateCode: async (): Promise<{
      code: string;
      expiresAt: string;
      qrData: string;
    }> => {
      const response = await fetchWithAuth("/pairing/code");
      return response.json();
    },
  },
};
