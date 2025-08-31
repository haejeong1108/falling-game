import { createContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, signup as apiSignup, me as apiMe, type Me } from "../api/auth";

type AuthContextType = {
  user: Me | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE = { token: "token", user: "user" };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Me | null>(() => {
    const raw = localStorage.getItem(STORAGE.user);
    return raw ? (JSON.parse(raw) as Me) : null;
  });

  const isAuthenticated = !!user;

  const login = async (email: string, password: string) => {
    const tok = await apiLogin(email, password);
    localStorage.setItem(STORAGE.token, tok.access_token);
    const u = await apiMe(tok.access_token);
    localStorage.setItem(STORAGE.user, JSON.stringify(u));
    setUser(u);
  };

  const signup = async (email: string, password: string, nickname?: string) => {
    await apiSignup(email, password, nickname);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE.token);
    localStorage.removeItem(STORAGE.user);
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthenticated, login, signup, logout }), [user, isAuthenticated]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
