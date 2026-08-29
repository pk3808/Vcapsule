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
          .maybeSingle();

        setUser({
          id: session.user.id,
          email: session.user.email,
          name: profile?.username || session.user.user_metadata?.username || "Friend",
          avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
        });

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
        if ((event === "SIGNED_IN" || event === "USER_UPDATED" || event === "INITIAL_SESSION") && session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            email: session.user.email,
            name: profile?.username || session.user.user_metadata?.username || "Friend",
            avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${session.user.id}`,
          });

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

     if (data?.user) {
       const { data: profile } = await supabase
         .from("profiles")
         .select("*")
         .eq("id", data.user.id)
         .maybeSingle();

       setUser({
         id: data.user.id,
         email: data.user.email,
         name: profile?.username || data.user.user_metadata?.username || "Friend",
         avatar: profile?.avatar_url || data.user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.id}`,
       });
     }

     return data;
  };

  const register = async (email, password, username, avatar) => {
    const finalAvatar = avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username || email)}`;

    // 1. Create user in Supabase Auth
    const { data, error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         data: {
           username,
           avatar_url: finalAvatar
         }
       }
    });

    if (error) throw error;

    // 2. Set instant React state so Navbar updates in real-time
    if (data.user) {
       setUser({
         id: data.user.id,
         email: data.user.email,
         name: username,
         avatar: finalAvatar,
       });

       // 3. Upsert profile in Supabase table
       try {
         await supabase
           .from("profiles")
           .upsert([
              { id: data.user.id, username, avatar_url: finalAvatar }
           ], { onConflict: "id" });
       } catch (err) {
         console.warn("Profile table update notice:", err);
       }
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
          created_by: user?.id,
          is_private: roomData.is_private || false,
          passcode: roomData.passcode || null,
          max_members: roomData.max_members || null,
          category: roomData.category || "General",
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

  const deleteRoom = async (roomId) => {
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', roomId);

    if (error) throw error;

    setRooms(prev => prev.filter(r => r.id !== roomId));
  };

  return (
    <AuthContext.Provider value={{ user, rooms, mounted, login, register, logout, addRoom, deleteRoom }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
