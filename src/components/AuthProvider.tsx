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
  login: (name: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  /** Passcode stored in memory (not persisted) for pick submission */
  passcode: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  passcode: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [passcode, setPasscode] = useState<string | null>(null);

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

  const login = useCallback(async (name: string, pc: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, passcode: pc }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Login failed" };
      }

      setUser(data.user);
      setPasscode(pc);
      localStorage.setItem("wcf_user", JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, pc: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, passcode: pc }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Registration failed" };
      }

      setUser(data.user);
      setPasscode(pc);
      localStorage.setItem("wcf_user", JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPasscode(null);
    localStorage.removeItem("wcf_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, passcode }}>
      {children}
    </AuthContext.Provider>
  );
}
