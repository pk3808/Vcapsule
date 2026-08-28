"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/shared/AuthModal";
import { CreateRoomModal } from "@/components/shared/CreateRoomModal";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Plus, Hash, Flame, Music, Film, BookOpen, Coffee, Smile } from "lucide-react";

export default function Home() {
  const { user, rooms } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [pendingCreateRoom, setPendingCreateRoom] = useState(false);

  const handleCreateRoomClick = () => {
    if (user) {
      setIsCreateRoomModalOpen(true);
    } else {
      setPendingCreateRoom(true);
      setIsAuthModalOpen(true);
    }
  };

  const trendingTopics = [
    { name: "Late Night Beats", emoji: "🎵" },
    { name: "Next.js Devs", emoji: "💻" },
    { name: "Sushi Lovers", emoji: "🍣" },
    { name: "UI/UX Doodles", emoji: "🎨" },
    { name: "Book Club", emoji: "📚" },
    { name: "Chill Cafe", emoji: "☕" },
  ];

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 py-6 sm:py-10 flex flex-col justify-between">
      
      {/* ── ASYMMETRICAL TWO-COLUMN HERO ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-14 sm:mb-20">
        
        {/* Left Column: Bold Typography & Action (7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 flex flex-col items-start text-left"
        >
          {/* Top Tag Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="bg-[#18181b] text-white px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-bold shadow-sm">
              <span className="text-[#ffd028]">✦</span>
              <span>ChaTin 1.4 Concept</span>
            </div>
            <div className="bg-[#34d399] text-black border-2 border-black px-3 py-1 rounded-full text-xs font-bold shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-800 animate-pulse"></span>
              <span>Active Spaces</span>
            </div>
          </div>

          {/* Huge Punchy Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#18181b] tracking-tight leading-[1.02] mb-6">
            The best chat spaces in the world with a fun vibe.
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 font-medium max-w-xl mb-8 leading-relaxed">
            A playful place for live voice notes, instant photos, videos, and endless conversation with friends. No algorithms, just pure vibes.
          </p>

          {/* Big Yellow Pill CTA Button */}
          <div className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px] mb-8">
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-[#ffd028] hover:bg-[#fcc200] text-[#18181b] font-extrabold text-base sm:text-lg px-7 py-4 rounded-full border-2 border-[#18181b] shadow-[5px_5px_0px_#18181b] hover:shadow-[2px_2px_0px_#18181b] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all flex items-center justify-between group"
            >
              <span>Let's chat now</span>
              <div className="w-10 h-10 rounded-full bg-[#18181b] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>

          {/* Quick Trending Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-black text-stone-500 mr-1">Trending:</span>
            {trendingTopics.slice(0, 4).map((topic, i) => (
              <button
                key={i}
                onClick={handleCreateRoomClick}
                className="bg-white hover:bg-stone-100 text-black border border-black/20 hover:border-black text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-all hover:scale-105"
              >
                <span>{topic.emoji} {topic.name}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Right Column: Layered Tactile Sticker / Stamp Collage Canvas (5 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-5 relative w-full min-h-[380px] sm:min-h-[420px] flex items-center justify-center"
        >
          {/* Decorative Background Doodles */}
          <div className="absolute top-2 right-4 text-3xl select-none opacity-80 animate-bounce-soft">✨</div>
          <div className="absolute bottom-4 left-6 text-2xl select-none opacity-80">🌸</div>
          <div className="absolute top-1/2 left-2 text-[#ffd028] text-4xl font-black select-none opacity-70">✦</div>

          {/* Stamp 1: Cool Cat Stamp (Center Main - tilted -3deg) */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
            className="absolute z-10 w-48 sm:w-56 bg-white border-2 border-dashed border-[#18181b] rounded-3xl p-4 shadow-[5px_5px_0px_#18181b] -rotate-3 transition-transform cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            <div className="w-full h-24 bg-emerald-100 border border-emerald-300 rounded-2xl flex items-center justify-center text-4xl mb-3 shadow-inner">
              🕶️
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-[#18181b] block">Cool Cats Space</span>
                <span className="text-[10px] text-stone-500 font-bold">100% pure vibe</span>
              </div>
              <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 rounded-full">Active</span>
            </div>
          </motion.div>

          {/* Stamp 2: Late Beats Vinyl (Top Right - tilted +6deg) */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
            className="absolute top-2 right-2 sm:right-6 z-0 w-40 sm:w-44 bg-[#fef08a] border-2 border-[#18181b] rounded-3xl p-3.5 shadow-[4px_4px_0px_#18181b] rotate-6 transition-transform cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🎵</span>
              <span className="text-xs font-black text-black">Late Beats</span>
            </div>
            <p className="text-[10px] text-stone-800 font-semibold line-clamp-2">
              Live lo-fi & synth tracks shared 24/7
            </p>
          </motion.div>

          {/* Stamp 3: Watch Party Slate (Bottom Left - tilted -8deg) */}
          <motion.div
            whileHover={{ scale: 1.05, rotate: 0, zIndex: 30 }}
            className="absolute bottom-2 left-2 sm:left-4 z-20 w-44 sm:w-48 bg-[#fbcfe8] border-2 border-[#18181b] rounded-3xl p-3.5 shadow-[4px_4px_0px_#18181b] -rotate-6 transition-transform cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xl">🎬</span>
              <span className="text-xs font-black text-black">Watch Party</span>
            </div>
            <p className="text-[10px] text-pink-950 font-bold">
              Discuss cinema & live reaction clips
            </p>
          </motion.div>

          {/* Floating Sticker Pill: "New Chat →" */}
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="absolute -bottom-2 right-4 z-20 bg-[#18181b] text-white border-2 border-white px-4 py-2 rounded-full shadow-[3px_3px_0px_#18181b] rotate-3 text-xs font-black flex items-center gap-1.5 cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            <span className="text-[#ffd028]">✦</span>
            <span>Join Now →</span>
          </motion.div>
        </motion.div>
      </div>

      {/* ── POPULAR PROMPTS & SPACES (BENTO ASYMMETRICAL LAYOUT) ─ */}
      <div className="w-full pt-10 border-t-2 border-black/[0.08] space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#ffd028] text-black px-3 py-0.5 rounded-full text-xs font-black border border-black mb-2 shadow-sm">
              <span>Featured Prompts</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#18181b] tracking-tight">
              Popular Spaces & Conversations
            </h2>
          </div>
          <span className="text-xs font-extrabold text-stone-500 hover:text-black cursor-pointer underline">
            Explore All Vibes →
          </span>
        </div>

        {/* Dynamic Asymmetrical Bento Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Card 1 (Pastel Pink - 7 columns) */}
          <motion.div
            whileHover={{ y: -4 }}
            className="md:col-span-7 bg-[#fbcfe8] border-2 border-[#18181b] rounded-3xl p-6 sm:p-7 shadow-[5px_5px_0px_#18181b] relative overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute top-4 right-4 text-pink-700 text-2xl font-bold">✦</div>
            <div className="absolute bottom-16 right-6 w-20 h-10 border-b-4 border-pink-500 rounded-full rotate-12 opacity-60 pointer-events-none"></div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-pink-900 bg-pink-200/80 px-2.5 py-1 rounded-full border border-pink-300">
                Culinary & Food
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-[#18181b] leading-tight mt-3 mb-2 max-w-[85%]">
                Explain about Sushi Roll recipe & Maki secrets 🍣
              </h3>
              <p className="text-xs font-bold text-pink-900/80">
                Created by Kanny.low ✦ 48 members chatting
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={handleCreateRoomClick}
                className="bg-white hover:bg-stone-50 text-[#18181b] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b] hover:shadow-[1px_1px_0px_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                <span>Use this prompt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-black text-pink-900/70 hidden sm:inline">Live Room</span>
            </div>
          </motion.div>

          {/* Card 2 (Mint Green - 5 columns) */}
          <motion.div
            whileHover={{ y: -4 }}
            className="md:col-span-5 bg-[#34d399] border-2 border-[#18181b] rounded-3xl p-6 sm:p-7 shadow-[5px_5px_0px_#18181b] relative overflow-hidden flex flex-col justify-between min-h-[220px]"
          >
            <div className="absolute top-4 right-4 text-emerald-950 text-2xl font-bold">✧</div>
            <div className="absolute bottom-4 right-4 text-4xl opacity-80 pointer-events-none">🌸</div>

            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 bg-emerald-200 px-2.5 py-1 rounded-full border border-emerald-300">
                Inspiration
              </span>
              <h3 className="text-2xl font-black text-[#18181b] leading-tight mt-3 mb-2">
                Give the best resolution & goals for 2026 ✨
              </h3>
              <p className="text-xs font-bold text-emerald-950/80">
                Created by Jon Jenny ✦ Tech & Life
              </p>
            </div>

            <div className="mt-6">
              <button
                onClick={handleCreateRoomClick}
                className="bg-white hover:bg-stone-50 text-[#18181b] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b] hover:shadow-[1px_1px_0px_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                <span>Use this prompt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* Real User Rooms (if any created) */}
        {Array.isArray(rooms) && rooms.length > 0 && (
          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-[#18181b]">Your Active Spaces</h3>
              <Link href="/profile" className="text-xs font-bold text-stone-500 hover:text-black">View all →</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <Link href={`/chat/${room.id}`} key={room.id}>
                  <div className="bg-white border-2 border-[#18181b] rounded-2xl p-4 shadow-[3px_3px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#18181b] transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#ffd028] border border-black flex items-center justify-center font-bold text-xs">
                        #
                      </div>
                      <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <h4 className="font-bold text-sm text-[#18181b] group-hover:text-amber-600 transition-colors truncate">{room.name}</h4>
                    <p className="text-xs text-stone-500 mt-0.5">Click to chat →</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Pill Cloud */}
        <div className="pt-2 flex flex-wrap gap-2.5 items-center">
          <span className="text-xs font-black text-stone-500">Categories:</span>
          {["🔥 Late Night Beats", "💻 Next.js Devs", "🍣 Sushi Lovers", "🎨 UI/UX Illustrators", "📚 Sci-Fi Reads", "🎮 Indie Game Devs", "☕ Chill Cafe", "🎧 Podcast Studio"].map((cat, i) => (
            <button
              key={i}
              onClick={handleCreateRoomClick}
              className="bg-[#18181b] hover:bg-[#27272a] text-white text-xs font-semibold px-4 py-2 rounded-full transition-all hover:scale-105 active:scale-95 shadow-sm"
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        onOpenChange={(open) => {
          setIsAuthModalOpen(open);
          if (!open && pendingCreateRoom) {
            setIsCreateRoomModalOpen(true);
            setPendingCreateRoom(false);
          }
        }}
      />

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onOpenChange={setIsCreateRoomModalOpen}
      />
    </div>
  );
}
