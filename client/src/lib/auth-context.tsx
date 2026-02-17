import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { flushSync } from "react-dom";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, name: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "tripsync_token";
function getStorage(): Storage {
  return localStorage.getItem("tripsync_remember") === "true" ? localStorage : sessionStorage;
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
          setUser(userData);
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
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const { token: newToken, user: userData } = await response.json();
    const store = rememberMe ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, newToken);
    // Commit auth state synchronously so redirect to /dashboard sees the user (avoids double sign-in).
    flushSync(() => {
      setToken(newToken);
      setUser(userData);
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
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
