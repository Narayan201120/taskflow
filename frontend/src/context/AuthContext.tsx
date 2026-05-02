import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserResponse } from "../types";
import { authService } from "../services/auth";

interface AuthContextType {
  user: UserResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, username: string, full_name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.getMe().then(setUser).catch(() => authService.logout()).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    await authService.login({ email, password });
    const me = await authService.getMe();
    setUser(me);
  };

  const signup = async (email: string, username: string, full_name: string, password: string) => {
    await authService.signup({ email, username, full_name, password });
    await login(email, password);
  };

  const logout = () => { authService.logout(); setUser(null); };

  return <AuthContext.Provider value={{ user, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
