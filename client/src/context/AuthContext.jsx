import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("optiguard_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("optiguard_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifyAuth() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.data.user);
          localStorage.setItem("optiguard_user", JSON.stringify(res.data.user));
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setLoading(false);
    }

    verifyAuth();

    const handleAutoLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener("optiguard:logout", handleAutoLogout);
    return () => window.removeEventListener("optiguard:logout", handleAutoLogout);
  }, [token]);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("optiguard_token", receivedToken);
    localStorage.setItem("optiguard_user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { token: receivedToken, user: receivedUser } = res.data;
    localStorage.setItem("optiguard_token", receivedToken);
    localStorage.setItem("optiguard_user", JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const updateProfile = async (updates) => {
    const res = await authApi.updateProfile(updates);
    const updated = res.data.user;
    setUser(updated);
    localStorage.setItem("optiguard_user", JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    localStorage.removeItem("optiguard_token");
    localStorage.removeItem("optiguard_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

