import { createContext, useContext, useState, useCallback } from "react";
import api from "../api/axios";

interface User {
  _id: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  role?: string;
  googleId?: string;   // có nếu đăng nhập Google
  stats?: {
    streak: number;
    longestStreak: number;
    lastStudyDate?: string;
  };
  settings?: {
    dailyGoal: number;
    defaultLanguage: string;
    notificationsEnabled: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>; // tải lại user từ server
  updateUser: (updates: Partial<User>) => void; // cập nhật local state
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: any) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Tải lại user mới nhất từ server (sau khi cập nhật profile)
  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      if (res.data?.success) {
        const freshUser = res.data.user;
        setUser(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      }
    } catch {
      // Silent — không logout nếu refresh thất bại
    }
  }, []);

  // Cập nhật user local state (không cần server round-trip)
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};