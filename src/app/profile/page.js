"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Hash, LogOut, Settings, User, MessageSquare, ArrowRight, Sparkles, Plus, Lock, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function ProfilePage() {
  const { user, rooms, mounted, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !user) {
      router.push("/");
    }
  }, [user, mounted, router]);

  if (!mounted || !user) return null;

  const roomCount = Array.isArray(rooms) ? rooms.length : 0;

  return (
    <div className="flex-1 px-4 py-8 sm:py-12 max-w-4xl mx-auto w-full">
      
      {/* ── PROFILE HEADER (ChaTin Stamp & Pill Style) ───── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-2 border-[#18181b] rounded-3xl p-6 sm:p-8 shadow-[5px_5px_0px_#18181b] mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden"
      >
        {/* Decorative corner tag */}
        <div className="absolute top-4 right-4 bg-[#ffd028] text-black font-extrabold text-[10px] uppercase px-3 py-1 rounded-full border border-black shadow-[1px_1px_0px_#18181b]">
          Viber
        </div>

        {/* User Avatar with border */}
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

          {/* Stat Badges */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-5">
            <span className="bg-[#18181b] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
              {roomCount} Spaces Created
            </span>
            <span className="bg-[#34d399] text-black text-xs font-bold px-3.5 py-1.5 rounded-full border border-black">
              ✦ Online Now
            </span>
          </div>

          {/* Actions */}
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-black text-[#18181b]">Your Spaces</h2>
          <span className="text-xs font-bold text-stone-500">{roomCount} total</span>
        </div>

        {roomCount === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#18181b] rounded-3xl p-8 sm:p-12 text-center shadow-[4px_4px_0px_rgba(24,24,27,0.08)]">
            <div className="w-16 h-16 rounded-2xl bg-[#ffd028] border-2 border-black flex items-center justify-center text-2xl mx-auto mb-3 shadow-[2px_2px_0px_#18181b]">
              🚀
            </div>
            <h3 className="text-lg font-bold text-[#18181b] mb-1">No spaces created yet</h3>
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
            {rooms.map((room, i) => {
              // Alternate pastel background colors
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
                        {/* Privacy Tag */}
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border border-black flex items-center gap-1 ${
                          room.is_private ? "bg-[#18181b] text-[#34d399]" : "bg-white text-black"
                        }`}>
                          {room.is_private ? "🔒 Private" : "🌐 Public"}
                        </span>

                        {/* Owner / Member Tag */}
                        <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">
                          {isOwner ? "Owner" : "Member"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <h4 className="font-black text-base text-[#18181b] leading-tight line-clamp-2">{room.name}</h4>
                      
                      {/* Passcode display for private spaces */}
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
      </div>

    </div>
  );
}
