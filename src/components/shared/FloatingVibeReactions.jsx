"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Sparkles, Flame, Heart, Laugh, Skull, Waves } from "lucide-react";
import { playReactionSound } from "@/lib/soundFx";

const VIBE_EMOJIS = [
  { emoji: "🔥", label: "Fire", icon: Flame, color: "text-amber-500" },
  { emoji: "❤️", label: "Love", icon: Heart, color: "text-rose-500" },
  { emoji: "😂", label: "Laugh", icon: Laugh, color: "text-yellow-500" },
  { emoji: "💀", label: "Dead", icon: Skull, color: "text-stone-300" },
  { emoji: "✨", label: "Sparkles", icon: Sparkles, color: "text-amber-300" },
  { emoji: "🌊", label: "Wave", icon: Waves, color: "text-cyan-400" },
];

export function FloatingVibeReactions({ roomId, user, channel }) {
  const [particles, setParticles] = useState([]);

  // Spawn particle
  const spawnParticle = useCallback((emoji, senderName = "") => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const randomX = Math.floor(Math.random() * 80) + 10; // 10% to 90%
    const randomRotate = Math.floor(Math.random() * 60) - 30; // -30deg to +30deg
    const randomScale = 0.85 + Math.random() * 0.5; // 0.85 to 1.35
    const duration = 2.4 + Math.random() * 0.8; // 2.4s to 3.2s

    const newParticle = {
      id,
      emoji,
      senderName,
      x: randomX,
      rotate: randomRotate,
      scale: randomScale,
      duration,
    };

    setParticles((prev) => [...prev.slice(-25), newParticle]);

    // Auto-remove after animation
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, duration * 1000);
  }, []);

  // Listen for Supabase broadcast events
  useEffect(() => {
    if (!channel) return;

    const handleBroadcast = (payload) => {
      if (payload.event === "vibe_reaction") {
        const { emoji, senderName } = payload.payload || {};
        if (emoji) {
          spawnParticle(emoji, senderName);
          try {
            playReactionSound();
          } catch (e) {}
        }
      }
    };

    channel.on("broadcast", { event: "vibe_reaction" }, handleBroadcast);

    return () => {
      // Channel handles cleanup
    };
  }, [channel, spawnParticle]);

  // Send Vibe Reaction to channel
  const handleSendReaction = (emoji) => {
    // 1. Spawn locally immediately
    spawnParticle(emoji, user?.name || "You");
    try {
      playReactionSound();
    } catch (e) {}

    // 2. Broadcast to everyone in room
    if (channel) {
      channel.send({
        type: "broadcast",
        event: "vibe_reaction",
        payload: {
          emoji,
          senderName: user?.name || "Someone",
          userId: user?.id,
        },
      });
    }
  };

  return (
    <>
      {/* ── FLOATING PARTICLES CANVAS OVERLAY ───────────────── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                opacity: 0,
                scale: 0.3,
                bottom: "5%",
                left: `${p.x}%`,
                rotate: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0.8, 0],
                scale: [0.3, p.scale, p.scale * 1.1, p.scale * 0.9, 0.5],
                bottom: "95%",
                left: [`${p.x}%`, `${p.x + (p.rotate > 0 ? 4 : -4)}%`, `${p.x}%`],
                rotate: [0, p.rotate, -p.rotate / 2, p.rotate],
              }}
              transition={{
                duration: p.duration,
                ease: "easeOut",
              }}
              className="absolute flex flex-col items-center select-none"
            >
              <span className="text-3xl sm:text-4xl drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                {p.emoji}
              </span>
              {p.senderName && (
                <span className="text-[9px] font-black font-mono bg-black/80 text-[#ffd028] px-1.5 py-0.5 rounded-full border border-white/20 mt-1 whitespace-nowrap opacity-90 shadow-sm">
                  {p.senderName}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── FLOATING VIBE REACTION TRIGGER BAR ─────────────── */}
      <div className="absolute bottom-20 right-4 sm:right-6 z-30 flex items-center gap-1 bg-[#18181b]/90 backdrop-blur-md border-2 border-white/20 hover:border-[#ffd028] p-1.5 rounded-full shadow-[0_8px_20px_rgba(0,0,0,0.4)] transition-all">
        {VIBE_EMOJIS.map((item) => (
          <button
            key={item.emoji}
            onClick={() => handleSendReaction(item.emoji)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full hover:bg-white/15 active:scale-125 flex items-center justify-center text-lg sm:text-xl transition-transform hover:scale-110 active:transition-none"
            title={`Send ${item.label} vibe`}
          >
            {item.emoji}
          </button>
        ))}
      </div>
    </>
  );
}
