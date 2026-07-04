import { useState, type ReactNode } from "react";
import { AuthContext, type AuthUser } from "@/lib/auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ms_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("ms_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (nextToken: string, nextUser: AuthUser) => {
    localStorage.setItem("ms_token", nextToken);
    localStorage.setItem("ms_user", JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("ms_token");
    localStorage.removeItem("ms_user");
    setToken(null);
    setUser(null);
  };

  const updateUser = (patch: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem("ms_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLogged: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
