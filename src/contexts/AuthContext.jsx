"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const storedUser = localStorage.getItem("vibe_user");
      const storedRooms = localStorage.getItem("vibe_rooms");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedRooms) setRooms(JSON.parse(storedRooms));
    } catch (e) {
      console.error("Failed to parse local storage", e);
    }
  }, []);

  const login = (email, username, avatar) => {
    const newUser = {
      email,
      name: username || email.split("@")[0],
      avatar: avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${email}`,
      id: `usr_${Math.random().toString(36).substring(7)}`
    };
    setUser(newUser);
    localStorage.setItem("vibe_user", JSON.stringify(newUser));
  };

  const register = (email, username, avatar) => {
    // For now, login and register do the same thing locally
    login(email, username, avatar);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("vibe_user");
  };

  const addRoom = (roomData) => {
    const newRoom = {
      ...roomData,
      id: `rm_${Math.random().toString(36).substring(7)}`,
      creatorId: user?.id,
      members: 1, // Start with 1 member (the creator)
      createdAt: new Date().toISOString()
    };

    const updatedRooms = [...rooms, newRoom];
    setRooms(updatedRooms);
    localStorage.setItem("vibe_rooms", JSON.stringify(updatedRooms));
    return newRoom;
  };

  return (
    <AuthContext.Provider value={{ user, rooms, mounted, login, register, logout, addRoom }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
