"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCcw, ArrowRight, Waves } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthModal({ isOpen, onOpenChange }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [avatarSeed, setAvatarSeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generateRandomAvatar = () => {
    const random = Math.random().toString(36).substring(7);
    setAvatarSeed(random);
  };

  const getAvatarUrl = () => {
    const seed = avatarSeed || email || "default";
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(seed)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        const finalAvatar = getAvatarUrl();
        await register(email, password, username, finalAvatar);
      }
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-6">
        <DialogHeader className="space-y-1 mb-4">
          <div className="inline-flex items-center gap-1.5 bg-[#18181b] text-white px-3 py-1 rounded-full text-xs font-bold w-fit mb-2 shadow-[2px_2px_0px_#ffd028]">
            <span className="font-black">Jiyo</span>
            <Waves className="w-3.5 h-3.5 text-[#ffd028]" />
          </div>
          <DialogTitle className="text-2xl font-black text-[#18181b]">
            {isLogin ? "Welcome back! 👋" : "Join the club! ✨"}
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs font-medium">
            {isLogin
              ? "Sign in to jump straight back into your spaces."
              : "Create an account to start vibing with friends."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-red-600 bg-red-100 border border-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-3">
              {/* Avatar Preview Stamp */}
              <div className="flex flex-col items-center justify-center p-3 bg-white border-2 border-dashed border-black rounded-2xl">
                <span className="text-[10px] font-black uppercase text-stone-500 mb-2">Your Sticker Avatar</span>
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-black shadow-[2px_2px_0px_#18181b]">
                    <AvatarImage src={currentAvatarUrl} alt="Avatar" />
                    <AvatarFallback className="bg-[#fbcfe8] text-black font-black">
                      {(username || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={generateNewAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#ffd028] border border-black flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform"
                    title="Change avatar"
                  >
                    <RefreshCcw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs font-bold text-[#18181b]">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. vibe_master"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="bg-white border-2 border-black rounded-xl h-10 text-sm focus-visible:ring-2 focus-visible:ring-[#ffd028]"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs font-bold text-[#18181b]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-2 border-black rounded-xl h-10 text-sm focus-visible:ring-2 focus-visible:ring-[#ffd028]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs font-bold text-[#18181b]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white border-2 border-black rounded-xl h-10 text-sm focus-visible:ring-2 focus-visible:ring-[#ffd028]"
            />
          </div>

          {/* Yellow Pill Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-extrabold text-sm py-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#18181b] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{isLogin ? "Sign In" : "Create Account"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); }}
              className="text-xs font-bold text-stone-600 hover:text-black transition-colors underline"
            >
              {isLogin
                ? "Don't have an account? Sign up here"
                : "Already have an account? Sign in here"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
