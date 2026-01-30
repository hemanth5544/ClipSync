import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getAuthToken, setAuthToken } from "../lib/api";
import { signOutAuth } from "../lib/auth";
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl || "http://localhost:8080/api";

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pairWithCode: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        // Try to verify token and get user details
        try {
          const { api } = require("../lib/api");
          // First verify token works
          await api.clips.getAll({ pageSize: 1 });
          // Then get user details
          try {
            const userDetails = await api.user.getMe();
            setUser(userDetails);
          } catch (userError) {
            console.error("Failed to get user details:", userError);
            // Token is valid but can't get user details - set placeholder
            setUser({
              id: "authenticated",
              email: "",
              name: null,
              image: null,
            });
          }
        } catch (error) {
          // Token invalid, clear it
          console.error("Token verification failed:", error);
          await setAuthToken(null);
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
    } finally {
      setLoading(false);
    }
  };

  const pairWithCode = async (code: string) => {
    try {
      const response = await fetch(`${API_URL}/pairing/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || "Pairing failed");
      }

      const data = await response.json();
      
      // Store the JWT token
      await setAuthToken(data.token);

      // Fetch full user details from desktop app's Better-Auth
      try {
        const { api } = require("../lib/api");
        const userDetails = await api.user.getMe();
        setUser(userDetails);
      } catch (error) {
        // If we can't get user details, at least set the userId
        console.error("Failed to get user details:", error);
        setUser({
          id: data.userId,
          email: "user@example.com",
          name: null,
          image: null,
        });
      }
    } catch (error: any) {
      console.error("Pairing error:", error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setUser(null);
        return;
      }

      const { api } = require("../lib/api");
      const userDetails = await api.user.getMe();
      setUser(userDetails);
    } catch (error) {
      console.error("Failed to refresh user:", error);
      // Don't clear user on error, just log it
    }
  };

  const signOut = async () => {
    await setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        pairWithCode,
        signOut,
        isAuthenticated: !!user,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
