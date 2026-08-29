"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { AuthModal } from "@/components/shared/AuthModal";
import { CreateRoomModal } from "@/components/shared/CreateRoomModal";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, Plus, Hash, Flame, Music, Film, BookOpen, Coffee, Smile, Users, Globe, Loader2 } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const PAGE_SIZE = 6;
  const [publicRooms, setPublicRooms] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [pendingCreateRoom, setPendingCreateRoom] = useState(false);
  const [initialPromptText, setInitialPromptText] = useState("");
  const [initialCategoryVal, setInitialCategoryVal] = useState("🔥 Trending");

  const categories = [
    "All",
    "🔥 Trending",
    "🎵 Music",
    "💻 Devs",
    "🍣 Chill & Chat",
    "🎨 Creative",
    "📚 Study",
    "🎮 Gaming",
  ];

  const fetchRooms = async (pageToFetch = 0) => {
    if (pageToFetch === 0) {
      setIsLoadingRooms(true);
      // Auto-cleanup stale inactive public rooms in database
      supabase.rpc('cleanup_inactive_public_rooms').then(() => {}).catch(() => {});
    } else {
      setIsLoadingMore(true);
    }

    try {
      const from = pageToFetch * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("rooms")
        .select("id, name, category, max_members, created_at, room_members(count)", { count: "exact" })
        .eq("is_private", false)
        .order("created_at", { ascending: false });

      if (selectedCategory !== "All") {
        const cleanCat = selectedCategory.replace(/[^a-zA-Z]/g, '').toLowerCase();
        query = query.ilike("category", `%${cleanCat}%`);
      }

      const { data, count, error } = await query.range(from, to);

      if (!error && data) {
        if (pageToFetch === 0) {
          setPublicRooms(data);
        } else {
          setPublicRooms((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newRooms = data.filter((r) => !existingIds.has(r.id));
            return [...prev, ...newRooms];
          });
        }
        if (count !== null) setTotalCount(count);
        setHasMore(data.length === PAGE_SIZE && (count === null || (from + data.length) < count));
        setPage(pageToFetch);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingRooms(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchRooms(0);
  }, [selectedCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRooms && !isLoadingMore) {
          fetchRooms(page + 1);
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
  }, [hasMore, isLoadingRooms, isLoadingMore, page]);

  const handleCreateRoomClick = (prompt = "", cat = "") => {
    setInitialPromptText(typeof prompt === "string" ? prompt : "");
    if (typeof cat === "string" && cat) {
      setInitialCategoryVal(cat);
    } else if (selectedCategory !== "All") {
      setInitialCategoryVal(selectedCategory);
    } else {
      setInitialCategoryVal("🔥 Trending");
    }

    if (user) {
      setIsCreateRoomModalOpen(true);
    } else {
      setPendingCreateRoom(true);
      setIsAuthModalOpen(true);
    }
  };

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
          {/* Top Tag & Social Proof Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="bg-[#18181b] text-white px-3.5 py-1.5 rounded-full inline-flex items-center gap-2 text-xs font-black shadow-[3px_3px_0px_#ffd028]">
              <span className="text-[#ffd028]">✦</span>
              <span>ChaTin Spaces</span>
              <span className="w-2 h-2 rounded-full bg-[#34d399] animate-pulse"></span>
            </div>

            {/* Live Social Proof Pill */}
            <div className="bg-white border-2 border-[#18181b] rounded-full px-3 py-1 flex items-center gap-2 shadow-[3px_3px_0px_#18181b]">
              <div className="flex -space-x-1.5">
                <span className="w-5 h-5 rounded-full bg-[#ffd028] border border-black flex items-center justify-center text-[10px]">😎</span>
                <span className="w-5 h-5 rounded-full bg-[#fbcfe8] border border-black flex items-center justify-center text-[10px]">🎧</span>
                <span className="w-5 h-5 rounded-full bg-[#34d399] border border-black flex items-center justify-center text-[10px]">✨</span>
              </div>
              <span className="text-[11px] font-black text-[#18181b]">2.4k vibing live</span>
            </div>
          </div>

          {/* Huge Punchy Title with High-Impact Highlight Stamp & Italic Serif */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-[#18181b] tracking-tight leading-[1.04] mb-6">
            The hangout{" "}
            <span className="relative inline-block px-3 py-0.5 mx-1">
              <span className="relative z-10 text-white">spaces</span>
              <span className="absolute inset-0 bg-[#18181b] -rotate-1 rounded-2xl -z-0 shadow-[4px_4px_0px_#ffd028]" />
            </span>{" "}
            where friends{" "}
            <span className="font-serif italic font-normal text-amber-600 sm:text-[1.08em] tracking-normal inline-block underline decoration-[#ffd028] decoration-wavy decoration-2 underline-offset-8">
              actually vibe.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-stone-600 font-medium max-w-xl mb-6 leading-relaxed">
            A playful place for live voice calls, audio notes, instant photos, videos, and endless conversation with friends. No algorithms, just pure vibes.
          </p>

          {/* Micro Feature Stamps */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="bg-white border-2 border-black text-[#18181b] text-xs font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5">
              🎙️ 1-Tap Voice Calls
            </span>
            <span className="bg-[#fbcfe8] border-2 border-black text-[#18181b] text-xs font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5">
              📻 Audio Notes
            </span>
            <span className="bg-[#34d399] border-2 border-black text-[#18181b] text-xs font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_#18181b] flex items-center gap-1.5">
              🔒 Private PIN Gates
            </span>
          </div>

          {/* Big Yellow Pill CTA Button */}
          <div className="w-full sm:w-auto min-w-[280px] sm:min-w-[340px]">
            <button
              onClick={handleCreateRoomClick}
              className="w-full bg-[#ffd028] hover:bg-[#fcc200] text-[#18181b] font-extrabold text-base sm:text-lg px-7 py-4 rounded-full border-2 border-[#18181b] shadow-[5px_5px_0px_#18181b] hover:shadow-[2px_2px_0px_#18181b] hover:translate-x-[3px] hover:translate-y-[3px] active:translate-x-[5px] active:translate-y-[5px] active:shadow-none transition-all flex items-center justify-between group"
            >
              <span>Start a Vibe Space</span>
              <div className="w-10 h-10 rounded-full bg-[#18181b] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Right Column: Creative Interactive Hangout Canvas (5 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="lg:col-span-5 relative w-full min-h-[420px] sm:min-h-[460px] flex items-center justify-center select-none"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute w-72 h-72 bg-amber-200/40 rounded-full blur-3xl pointer-events-none -z-10" />

          {/* Floating Sparkles & Emojis */}
          <motion.div
            animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute top-1 left-4 text-2xl z-20 pointer-events-none"
          >
            ✨
          </motion.div>
          <motion.div
            animate={{ y: [0, 8, 0], rotate: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 0.5 }}
            className="absolute bottom-2 right-6 text-2xl z-20 pointer-events-none"
          >
            🌸
          </motion.div>

          {/* ── CARD 1: Central Live Voice & Vibe Room Widget ──── */}
          <motion.div
            whileHover={{ y: -4, rotate: 0 }}
            className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] bg-white border-2 border-black rounded-[2rem] p-5 shadow-[6px_6px_0px_#18181b] -rotate-1 transition-transform cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            {/* Header: Room Name & Live Badge */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-100 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#ffd028] border border-black flex items-center justify-center text-sm font-black shadow-xs">
                  🎧
                </div>
                <div>
                  <h4 className="font-black text-xs text-[#18181b]">Late Night Beats</h4>
                  <span className="text-[10px] font-bold text-stone-500">Music & Lo-Fi Space</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 bg-[#34d399] text-black text-[10px] font-black px-2.5 py-0.5 rounded-full border border-black shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                <span>Live Voice</span>
              </span>
            </div>

            {/* Live Audio Waveform Simulation */}
            <div className="bg-[#faf6ef] border-2 border-black/10 rounded-2xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black text-stone-500 uppercase">Live Frequency</span>
                <span className="text-[10px] font-bold font-mono text-emerald-600">● 3 connected</span>
              </div>
              <div className="flex items-end justify-center gap-1 h-8 pt-1">
                {[40, 75, 55, 95, 60, 85, 45, 90, 70, 100, 65, 80, 50, 90, 75, 40].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8 + (i % 5) * 0.15,
                      ease: "easeInOut",
                    }}
                    className="w-1.5 bg-[#18181b] rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Live Message & Reaction Capsule */}
            <div className="flex items-center justify-between bg-white border border-stone-200 rounded-xl p-2 shadow-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-[#fbcfe8] border border-black flex items-center justify-center text-[10px] font-black shrink-0">
                  B
                </div>
                <p className="text-[11px] font-bold text-stone-800 truncate">
                  "This lo-fi synth mix is fire 🔥"
                </p>
              </div>
              <span className="bg-[#ffd028] text-black text-[10px] font-black px-2 py-0.5 rounded-full border border-black shadow-xs shrink-0">
                ❤️ 5
              </span>
            </div>
          </motion.div>

          {/* ── CARD 2: Floating Voice Note Capsule (Top Right) ── */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            whileHover={{ scale: 1.06, rotate: 2, zIndex: 30 }}
            className="absolute -top-3 -right-2 sm:right-0 z-20 bg-white border-2 border-black rounded-2xl p-2.5 shadow-[4px_4px_0px_#18181b] rotate-3 cursor-pointer flex items-center gap-2.5 max-w-[200px]"
            onClick={handleCreateRoomClick}
          >
            <div className="w-7 h-7 rounded-full bg-[#ffd028] border border-black flex items-center justify-center text-xs font-black shadow-xs shrink-0">
              ▶
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-black text-black">Voice Note</span>
                <span className="text-[9px] font-mono font-bold text-stone-400">0:18</span>
              </div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[4, 8, 12, 6, 14, 10, 5, 12, 7, 10, 4].map((bar, i) => (
                  <div key={i} style={{ height: `${bar}px` }} className="w-1 bg-[#18181b] rounded-full" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── CARD 3: Floating Private Space PIN Capsule (Bottom Left) ── */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: 0.3 }}
            whileHover={{ scale: 1.06, rotate: -3, zIndex: 30 }}
            className="absolute -bottom-4 -left-2 sm:left-0 z-20 bg-white border-2 border-black rounded-2xl p-2.5 shadow-[4px_4px_0px_#18181b] -rotate-4 cursor-pointer flex items-center gap-2"
            onClick={handleCreateRoomClick}
          >
            <div className="w-7 h-7 rounded-full bg-[#34d399] border border-black flex items-center justify-center text-xs font-black shrink-0">
              🔒
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-stone-500 block">Private PIN</span>
              <span className="text-xs font-mono font-black text-black">PIN: 7842</span>
            </div>
          </motion.div>

          {/* ── STICKER: Interactive Join Pill ───────────────── */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 0 }}
            className="absolute bottom-1 right-2 z-20 bg-[#18181b] text-white border-2 border-black px-3.5 py-1.5 rounded-full shadow-[3px_3px_0px_#18181b] rotate-2 text-[11px] font-black flex items-center gap-1.5 cursor-pointer"
            onClick={handleCreateRoomClick}
          >
            <span className="text-[#ffd028]">✦</span>
            <span>Join Hangout →</span>
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
                onClick={() => handleCreateRoomClick("Explain about Sushi Roll recipe & Maki secrets 🍣", "🍣 Chill & Chat")}
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
                onClick={() => handleCreateRoomClick("Give the best resolution & goals for 2026 ✨", "🎨 Creative")}
                className="bg-white hover:bg-stone-50 text-[#18181b] font-extrabold text-xs sm:text-sm px-6 py-3 rounded-full border-2 border-[#18181b] shadow-[3px_3px_0px_#18181b] hover:shadow-[1px_1px_0px_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
              >
                <span>Use this prompt</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>

        </div>

        {/* ── LIVE VIBE BOARD ──────────────────────────────────────── */}
        <div id="public-spaces-section" className="pt-6 scroll-mt-20">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <span className="relative flex">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-60" />
                <span className="relative w-3 h-3 rounded-full bg-red-500" />
              </span>
              <h3 className="text-2xl font-black text-[#18181b] tracking-tight">Live Right Now</h3>
              <span className="text-xs font-black text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                {publicRooms.length} spaces
              </span>
            </div>
            <button
              onClick={handleCreateRoomClick}
              className="group flex items-center gap-2 bg-[#18181b] hover:bg-stone-700 text-white font-bold text-xs px-4 py-2.5 rounded-full transition-all shadow-[2px_2px_0px_#ffd028] hover:shadow-[1px_1px_0px_#ffd028] hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
              <span>Start a Space</span>
            </button>
          </div>

          {/* Category Filter Bar */}
          <div className="flex flex-wrap gap-2 items-center mb-6">
            {categories.map((cat, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-full transition-all duration-200 ${
                  selectedCategory === cat
                    ? "bg-[#18181b] text-[#ffd028] border-2 border-[#18181b] shadow-[3px_3px_0px_#ffd028] font-black scale-105"
                    : "bg-white text-stone-600 border-2 border-stone-200 hover:border-stone-400 hover:text-stone-900 hover:bg-stone-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Vibe Board Grid */}
          {(() => {
            const filtered = selectedCategory === "All"
              ? publicRooms
              : publicRooms.filter(r => r.category === selectedCategory || (r.category && catMatches(r.category, selectedCategory)));

            function catMatches(a, b) {
              const cleanA = a.replace(/[^a-zA-Z]/g, '').toLowerCase();
              const cleanB = b.replace(/[^a-zA-Z]/g, '').toLowerCase();
              return cleanA.includes(cleanB) || cleanB.includes(cleanA);
            }

            function getCatStyle(cat) {
              if (!cat) return { emoji: "🔥", color: "#ffd028" };
              const c = cat.toLowerCase();
              if (c.includes("music")) return { emoji: "🎵", color: "#a855f7" };
              if (c.includes("dev") || c.includes("tech")) return { emoji: "💻", color: "#3b82f6" };
              if (c.includes("creative") || c.includes("art")) return { emoji: "🎨", color: "#f97316" };
              if (c.includes("study") || c.includes("book")) return { emoji: "📚", color: "#22c55e" };
              if (c.includes("gaming") || c.includes("game")) return { emoji: "🎮", color: "#6366f1" };
              if (c.includes("chill") || c.includes("chat")) return { emoji: "☕", color: "#ec4899" };
              if (c.includes("trend")) return { emoji: "🔥", color: "#ef4444" };
              return { emoji: "✦", color: "#ffd028" };
            }

            const avatarColors = ["#ffd028","#34d399","#fbcfe8","#c7d2fe","#f97316","#a5f3fc"];

            if (filtered.length === 0) {
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border-2 border-dashed border-stone-300 rounded-3xl p-10 text-center"
                >
                  <span className="text-4xl mb-3 block">🛸</span>
                  <p className="text-base font-black text-[#18181b] mb-1">
                    No spaces in {selectedCategory === "All" ? "here" : selectedCategory} yet.
                  </p>
                  <p className="text-sm text-stone-500 mb-5">Be the first to start a vibe!</p>
                  <button
                    onClick={handleCreateRoomClick}
                    className="bg-[#ffd028] text-black font-black text-sm px-6 py-3 rounded-full border-2 border-black shadow-[3px_3px_0px_#18181b] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_#18181b] transition-all"
                  >
                    Launch Space ✦
                  </button>
                </motion.div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {filtered.map((room, idx) => {
                  const memberCount = room.room_members?.[0]?.count || 1;
                  const capacity = room.max_members || null;
                  const s = getCatStyle(room.category);
                  const waveHeights = [0.45, 0.9, 0.55, 1, 0.65, 0.8, 0.4];
                  const fillPct = capacity ? Math.min((memberCount / capacity) * 100, 100) : null;

                  return (
                    <Link href={`/chat/${room.id}`} key={room.id}>
                      <motion.div
                        whileHover={{ y: -6 }}
                        transition={{ type: "spring", stiffness: 280, damping: 22 }}
                        className="group relative bg-[#1a1a1e] border border-white/[0.08] rounded-2xl overflow-hidden cursor-pointer flex flex-col"
                        style={{ boxShadow: `5px 5px 0px ${s.color}` }}
                      >
                        {/* Background glow in corner */}
                        <div
                          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-[0.07] blur-3xl pointer-events-none group-hover:opacity-[0.15] transition-opacity duration-500"
                          style={{ backgroundColor: s.color }}
                        />

                        {/* Large watermark emoji */}
                        <span
                          className="absolute -bottom-3 -right-2 text-[80px] leading-none select-none pointer-events-none opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500"
                        >
                          {s.emoji}
                        </span>

                        {/* Category color top stripe */}
                        <div className="h-1 w-full shrink-0" style={{ backgroundColor: s.color }} />

                        <div className="relative flex flex-col flex-1 p-5">

                          {/* Category label */}
                          <span className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: s.color }}>
                            {room.category || "General"}
                          </span>

                          {/* Room name */}
                          <h4 className="font-black text-[17px] text-white leading-snug mb-3 group-hover:text-white/80 transition-colors line-clamp-2">
                            {room.name}
                          </h4>

                          {/* Member row: live dot + avatars + count */}
                          <div className="flex items-center gap-2.5 mb-4">
                            {/* Live ping */}
                            <span className="relative flex shrink-0">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: s.color }} />
                              <span className="relative w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                            </span>

                            {/* Avatar stack */}
                            <div className="flex -space-x-1.5">
                              {Array.from({ length: Math.min(memberCount, 3) }).map((_, i) => (
                                <div
                                  key={i}
                                  className="w-6 h-6 rounded-full border-[1.5px] border-[#1a1a1e] flex items-center justify-center text-[10px]"
                                  style={{ backgroundColor: avatarColors[i % avatarColors.length] }}
                                >
                                  {String.fromCodePoint(0x1F600 + ((idx * 11 + i * 7) % 40))}
                                </div>
                              ))}
                              {memberCount > 3 && (
                                <div className="w-6 h-6 rounded-full border-[1.5px] border-[#1a1a1e] bg-white/10 flex items-center justify-center text-[9px] font-black text-white/50">
                                  +{memberCount - 3}
                                </div>
                              )}
                            </div>

                            {/* Count text */}
                            <span className="text-[11px] font-bold text-white/35">
                              {memberCount}{capacity ? `/${capacity}` : ""} in
                            </span>
                          </div>

                          {/* Capacity progress bar (only if capacity is set) */}
                          {fillPct !== null && (
                            <div className="w-full h-1 rounded-full bg-white/[0.06] mb-4 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${fillPct}%`, backgroundColor: s.color, opacity: 0.5 }}
                              />
                            </div>
                          )}

                          {/* Bottom: animated soundwave + join pill */}
                          <div className="flex items-end justify-between mt-auto pt-1">
                            <div className="flex items-end gap-[3px] h-6">
                              {waveHeights.map((h, i) => (
                                <motion.div
                                  key={i}
                                  className="w-[4px] rounded-[2px]"
                                  style={{ backgroundColor: s.color, height: "100%", opacity: 0.6 }}
                                  animate={{ scaleY: [h, 1, h * 0.35, 0.85, h] }}
                                  transition={{
                                    duration: 0.9 + i * 0.1,
                                    repeat: Infinity,
                                    delay: i * 0.12,
                                    ease: "easeInOut",
                                  }}
                                  initial={{ originY: 1 }}
                                />
                              ))}
                            </div>

                            <div
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-extrabold transition-all group-hover:scale-105 group-hover:shadow-lg"
                              style={{
                                backgroundColor: s.color,
                                color: "#18181b",
                                boxShadow: `0 0 0px transparent`,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.boxShadow = `0 0 16px ${s.color}50`}
                              onMouseLeave={(e) => e.currentTarget.style.boxShadow = `0 0 0px transparent`}
                            >
                              <span>Join Space</span>
                              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            );
          })()}

          {/* Infinite Scroll Trigger & Load More */}
          <div ref={observerTarget} className="mt-8 flex flex-col items-center justify-center py-4">
            {isLoadingMore && (
              <div className="flex items-center gap-2 bg-[#18181b] text-white px-5 py-2.5 rounded-full text-xs font-black shadow-md">
                <Loader2 className="w-4 h-4 animate-spin text-[#ffd028]" />
                <span>Loading more vibe spaces...</span>
              </div>
            )}
            {!hasMore && publicRooms.length > 0 && !isLoadingRooms && (
              <p className="text-xs font-bold text-stone-400 bg-stone-100 px-4 py-1.5 rounded-full border border-stone-200">
                ✨ You're all caught up with all live spaces!
              </p>
            )}
          </div>
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
        initialCategory={initialCategoryVal || (selectedCategory === "All" ? "🔥 Trending" : selectedCategory)}
        initialPrompt={initialPromptText}
      />
    </div>
  );
}
