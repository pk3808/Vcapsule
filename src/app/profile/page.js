"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Hash, LogOut, Settings, User, MessageSquare, ArrowRight, Sparkles, Plus, Lock, Globe, Loader2, Trash2, Waves } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const { user, mounted, logout, deleteRoom } = useAuth();
  const router = useRouter();

  const PAGE_SIZE = 6;
  const [userRooms, setUserRooms] = useState([]);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'private' | 'public'
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const observerTarget = useRef(null);

  useEffect(() => {
    if (mounted && !user) {
      router.push("/");
    }
  }, [user, mounted, router]);

  const fetchUserRooms = async (pageToFetch = 0) => {
    if (!user) return;

    if (pageToFetch === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const from = pageToFetch * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // 1. Fetch user's room memberships with range
      let query = supabase
        .from("room_members")
        .select("room_id, rooms (*)", { count: "exact" })
        .eq("user_id", user.id);

      const { data, count, error } = await query.range(from, to);

      if (!error && data) {
        const fetched = data.map((m) => m.rooms).filter(Boolean);
        if (pageToFetch === 0) {
          setUserRooms(fetched);
        } else {
          setUserRooms((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newRooms = fetched.filter((r) => !existingIds.has(r.id));
            return [...prev, ...newRooms];
          });
        }
        if (count !== null) setTotalCount(count);
        setHasMore(fetched.length === PAGE_SIZE && (count === null || (from + fetched.length) < count));
        setPage(pageToFetch);
      }
    } catch (err) {
      console.error("Error fetching user rooms:", err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (user) {
      setPage(0);
      setHasMore(true);
      fetchUserRooms(0);
    }
  }, [user]);

  // Infinite scroll trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchUserRooms(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, isLoadingMore, page]);

  const handleConfirmDelete = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRoom(roomToDelete.id);
      setUserRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setRoomToDelete(null);
    } catch (err) {
      console.error("Failed to delete space:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted || !user) return null;

  const filteredRooms = userRooms.filter((r) => {
    if (filterType === "private") return r.is_private;
    if (filterType === "public") return !r.is_private;
    return true;
  });

  return (
    <div className="flex-1 px-4 py-8 sm:py-12 max-w-4xl mx-auto w-full">
      
      {/* ── PROFILE HEADER ───── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#18181b] rounded-3xl p-6 sm:p-8 shadow-[5px_5px_0px_#18181b] mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden"
      >
        <div className="absolute top-4 right-4 bg-[#ffd028] text-black font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-black shadow-[1px_1px_0px_#18181b] flex items-center gap-1.5">
          <span>Jiyo Member</span>
          <Waves className="w-3 h-3 text-black" />
        </div>

        <div className="relative">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b]">
            <AvatarImage src={user.avatar} alt={user.name || "User"} className="object-cover" />
            <AvatarFallback className="bg-[#fbcfe8] text-[#18181b] text-3xl font-black">
              {(user.name || user.email || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-black text-[#18181b] tracking-tight mb-1">
            {user.name || "Vibe Explorer"}
          </h1>
          <p className="text-stone-500 text-xs sm:text-sm font-medium mb-4 flex items-center justify-center sm:justify-start gap-1">
            <User className="w-3.5 h-3.5" />
            {user.email || "No email"}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-5">
            <span className="bg-[#18181b] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
              {totalCount > 0 ? totalCount : userRooms.length} Spaces Joined
            </span>
            <span className="bg-[#34d399] text-black text-xs font-bold px-3.5 py-1.5 rounded-full border border-black">
              ✦ Online Now
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <Link href="/">
              <button className="bg-[#ffd028] hover:bg-[#fcc200] text-black font-bold text-xs sm:text-sm px-5 py-2.5 rounded-full border-2 border-black shadow-[2px_2px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#18181b] transition-all flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Create New Space</span>
              </button>
            </Link>

            <button
              onClick={() => { logout(); router.push("/"); }}
              className="bg-stone-100 hover:bg-red-50 text-red-600 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-full border-2 border-stone-300 hover:border-red-400 transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── SPACES SECTION ────────────────────────────────── */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-2xl font-black text-[#18181b]">Your Spaces</h2>
            <p className="text-xs text-stone-500 font-medium">Spaces you've created or joined</p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-full border border-stone-200 self-start sm:self-auto">
            {[
              { id: "all", label: "All" },
              { id: "public", label: "🌐 Public" },
              { id: "private", label: "🔒 Private" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-full transition-all ${
                  filterType === tab.id
                    ? "bg-[#18181b] text-white shadow-xs"
                    : "text-stone-600 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && userRooms.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-300 rounded-3xl p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#18181b] mb-2" />
            <p className="text-xs font-bold text-stone-500">Loading your spaces...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#18181b] rounded-3xl p-8 sm:p-12 text-center shadow-[4px_4px_0px_rgba(24,24,27,0.08)]">
            <div className="w-16 h-16 rounded-2xl bg-[#ffd028] border-2 border-black flex items-center justify-center text-2xl mx-auto mb-3 shadow-[2px_2px_0px_#18181b]">
              🚀
            </div>
            <h3 className="text-lg font-bold text-[#18181b] mb-1">No spaces found</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto mb-6">
              Create a room, invite your friends, and start chatting in seconds!
            </p>
            <Link href="/">
              <button className="bg-[#ffd028] hover:bg-[#fcc200] text-black font-bold text-xs sm:text-sm px-6 py-3 rounded-full border-2 border-black shadow-[3px_3px_0px_#18181b] transition-all">
                Create your first space
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredRooms.map((room, i) => {
              const bgClass = room.is_private 
                ? "bg-[#34d399]" 
                : (i % 2 === 0 ? "bg-[#fbcfe8]" : "bg-[#fed7aa]");
              const isOwner = room.created_by === user?.id;

              return (
                <Link href={`/chat/${room.id}`} key={room.id}>
                  <div className={`${bgClass} border-2 border-[#18181b] rounded-3xl p-5 shadow-[4px_4px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#18181b] transition-all flex flex-col justify-between min-h-[170px] group relative overflow-hidden`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center text-xs font-black shrink-0">
                        {room.is_private ? <Lock className="w-3.5 h-3.5 text-emerald-800" /> : <Globe className="w-3.5 h-3.5 text-stone-700" />}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black flex items-center gap-1 ${
                          room.is_private ? "bg-[#18181b] text-[#34d399]" : "bg-white text-black"
                        }`}>
                          {room.is_private ? "🔒 Private" : "🌐 Public"}
                        </span>

                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">
                          {isOwner ? "Owner" : "Member"}
                        </span>

                        {isOwner && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setRoomToDelete(room);
                            }}
                            className="w-6 h-6 rounded-full bg-white hover:bg-red-500 text-stone-600 hover:text-white border border-black flex items-center justify-center transition-colors shadow-xs"
                            title="Delete Space"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-black text-base text-[#18181b] leading-tight line-clamp-2">{room.name}</h4>
                      
                      {room.is_private && room.passcode && (
                        <div className="mt-1.5 inline-flex items-center gap-1 bg-black/10 px-2 py-0.5 rounded-md text-[11px] font-mono font-black text-black">
                          <span>PIN:</span>
                          <span>{room.passcode}</span>
                        </div>
                      )}

                      {!room.is_private && room.category && (
                        <span className="text-[10px] font-bold text-stone-700 block mt-1">
                          {room.category}
                        </span>
                      )}

                      <p className="text-[11px] font-bold text-black/70 mt-2">Tap to enter →</p>
                    </div>
                  </div>
                </Link>
              );
            })}

            {/* Create Room Box */}
            <Link href="/">
              <div className="bg-white border-2 border-dashed border-[#18181b] rounded-3xl p-5 shadow-[3px_3px_0px_#18181b] hover:bg-amber-50/50 transition-all flex flex-col items-center justify-center text-center min-h-[170px] cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-[#ffd028] border border-black flex items-center justify-center text-lg mb-2 shadow-sm">
                  +
                </div>
                <span className="font-bold text-sm text-[#18181b]">Create Space</span>
                <span className="text-[10px] text-stone-500">Start new vibe</span>
              </div>
            </Link>
          </div>
        )}

        {/* Infinite Scroll Trigger & Load More */}
        <div ref={observerTarget} className="mt-8 flex flex-col items-center justify-center py-4">
          {isLoadingMore && (
            <div className="flex items-center gap-2 bg-[#18181b] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-md">
              <Loader2 className="w-4 h-4 animate-spin text-[#ffd028]" />
              <span>Loading more of your spaces...</span>
            </div>
          )}
          {!hasMore && userRooms.length > 0 && !isLoading && (
            <p className="text-xs font-bold text-stone-400 bg-stone-100 px-4 py-1.5 rounded-full border border-stone-200">
              ✨ You've reached the end of your spaces!
            </p>
          )}
        </div>
      </div>

      {/* ── DELETE ROOM CONFIRMATION MODAL ───── */}
      <Dialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <DialogContent className="sm:max-w-[400px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-6">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border-2 border-red-400 text-red-600 flex items-center justify-center text-xl mb-1 shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-black text-[#18181b]">
              Delete "{roomToDelete?.name}"?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 font-medium">
              Are you sure you want to delete this space? All messages, voice notes, and media records will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-4">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setRoomToDelete(null)}
              className="px-4 py-2 rounded-full border-2 border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_#18181b] active:scale-95 transition-all flex items-center gap-1.5"
            >
              {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>{isDeleting ? "Deleting..." : "Delete Space"}</span>
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
