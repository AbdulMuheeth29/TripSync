import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { User } from "@shared/schema";
import { queryClient } from "./queryClient";

export type SubscriptionTier = "free" | "pro" | "teams";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  /** Current subscription tier (defaults to "free" if missing) */
  subscriptionTier: SubscriptionTier;
  /** True if user has Pro or Teams and subscription is not expired */
  isPro: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, name: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  /** Call after checkout success to refresh user (e.g. refetch /api/auth/me) */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tripsync_token";
function getStorage(): Storage {
  return localStorage.getItem("tripsync_remember") === "true" ? localStorage : sessionStorage;
}

function normalizeUser(data: Record<string, unknown>): User {
  const createdAt = data.createdAt != null
    ? (typeof data.createdAt === "string" ? new Date(data.createdAt) : (data.createdAt as Date))
    : new Date();
  const tier = (data.subscriptionTier as string) || "free";
  const expiresAt = data.subscriptionExpiresAt != null
    ? (typeof data.subscriptionExpiresAt === "string" ? new Date(data.subscriptionExpiresAt) : (data.subscriptionExpiresAt as Date))
    : null;
  return {
    ...data,
    createdAt,
    subscriptionTier: tier as "free" | "pro" | "teams",
    subscriptionExpiresAt: expiresAt,
  } as User;
}

function isProTier(user: User | null): boolean {
  if (!user) return false;
  const tier = (user as { subscriptionTier?: string }).subscriptionTier ?? "free";
  const expiresAt = (user as { subscriptionExpiresAt?: Date | string | null }).subscriptionExpiresAt;
  if (tier !== "pro" && tier !== "teams") return false;
  if (expiresAt && new Date(expiresAt) <= new Date()) return false;
  return true;
}
export function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (token) {
    return {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
  return { "Content-Type": "application/json" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verify token and load user on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      // Verify token by fetching user info
      fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${savedToken}`,
        },
      })
        .then(res => {
          if (!res.ok) throw new Error("Token invalid");
          return res.json();
        })
        .then(userData => {
          setUser(normalizeUser(userData));
        })
        .catch(() => {
          localStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const register = async (email: string, name: string, password: string, rememberMe = true) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const { token: newToken, user: userData } = await response.json();
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, newToken);
    // Commit auth state synchronously
    flushSync(() => {
      setToken(newToken);
      setUser(userData);
    });
  };

  const login = async (email: string, password: string, rememberMe = true) => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmedEmail, password: trimmedPassword }),
    });

    if (!response.ok) {
      let message = "Invalid email or password";
      try {
        const error = await response.json();
        if (error?.error && typeof error.error === "string") message = error.error;
      } catch {
        if (response.statusText) message = response.statusText;
      }
      throw new Error(message);
    }

    let data: { token?: string; user?: User };
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response from server");
    }
    const newToken = data.token;
    const userData = data.user;
    if (!newToken || !userData || !userData.id) {
      throw new Error("Invalid response from server");
    }
    // Normalize user for client (createdAt may be string from JSON; server never sends passwordHash)
    const normalizedUser = normalizeUser(userData as Record<string, unknown>);
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, newToken);
    // Commit auth state synchronously so redirect to /dashboard sees the user (avoids double sign-in).
    flushSync(() => {
      setToken(newToken);
      setUser(normalizedUser);
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    // Clear trip data so next login doesn't see previous user's trips
    queryClient.removeQueries({ queryKey: ["/api/trips"] });
  };

  const refreshUser = async () => {
    const t = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    if (!t) return;
    const res = await fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } });
    if (res.ok) {
      const userData = await res.json();
      setUser(normalizeUser(userData));
    }
  };

  const subscriptionTier: SubscriptionTier = (user as { subscriptionTier?: string } | null)?.subscriptionTier === "teams"
    ? "teams"
    : (user as { subscriptionTier?: string } | null)?.subscriptionTier === "pro"
      ? "pro"
      : "free";
  const isPro = isProTier(user);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, subscriptionTier, isPro, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
