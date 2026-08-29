"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Get initial session
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            name: profile.username,
            avatar: profile.avatar_url,
          });
        }

        // Fetch user's joined rooms
        const { data: userMemberships } = await supabase
          .from("room_members")
          .select("rooms (*)")
          .eq("user_id", session.user.id);

        if (userMemberships) {
          const userRooms = userMemberships
            .map(m => m.rooms)
            .filter(Boolean);
          setRooms(userRooms);
        }
      } else {
        setUser(null);
        setRooms([]);
      }
      setMounted(true);

      // 2. Setup auth listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: profile.username,
              avatar: profile.avatar_url,
            });
          }

          const { data: userMemberships } = await supabase
            .from("room_members")
            .select("rooms (*)")
            .eq("user_id", session.user.id);

          if (userMemberships) {
            const userRooms = userMemberships
              .map(m => m.rooms)
              .filter(Boolean);
            setRooms(userRooms);
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setRooms([]);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
     const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
     });
     if (error) throw error;
     return data;
  };

  const register = async (email, password, username, avatar) => {
    // 1. Create user
    const { data, error } = await supabase.auth.signUp({
       email,
       password,
    });

    if (error) throw error;

    // 2. Create profile
    if (data.user) {
       const { error: profileError } = await supabase
         .from("profiles")
         .insert([
            { id: data.user.id, username, avatar_url: avatar }
         ]);

       if (profileError) throw profileError;
    }

    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addRoom = async (roomData) => {
    // Insert into rooms table
    const { data: room, error } = await supabase
      .from('rooms')
      .insert([
        {
          name: roomData.name,
          created_by: user?.id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Insert creator into room_members
    const { error: memberError } = await supabase
      .from('room_members')
      .insert([
        {
          room_id: room.id,
          user_id: user?.id
        }
      ]);

    if (memberError) throw memberError;

    setRooms(prev => [room, ...prev]);
    return room;
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
