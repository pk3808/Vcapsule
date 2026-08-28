"use client";

import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = (email) => {
    // Mock login
    setUser({ email, name: email.split("@")[0], id: "usr_123" });
  };

  const register = (email) => {
    // Mock register
    setUser({ email, name: email.split("@")[0], id: "usr_123" });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
