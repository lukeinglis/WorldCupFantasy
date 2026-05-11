"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  paymentConfirmed: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  join: (name: string, email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  join: async () => ({ success: false }),
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("wcf_user");
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
    setLoading(false);
  }, []);

  const join = useCallback(async (name: string, email: string) => {
    try {
      const res = await fetch("/api/auth/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Something went wrong" };
      }

      setUser(data.user);
      localStorage.setItem("wcf_user", JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("wcf_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, join, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
