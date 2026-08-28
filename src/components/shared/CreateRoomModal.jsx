"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Sparkles } from "lucide-react";

export function CreateRoomModal({ isOpen, onOpenChange }) {
  const router = useRouter();
  const { addRoom } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!roomName.trim()) return;

    setIsLoading(true);
    try {
      const newRoom = await addRoom({
        name: roomName.trim(),
      });

      onOpenChange(false);
      setRoomName("");
      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create space");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-6">
        <DialogHeader className="space-y-1 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-[#ffd028] text-black px-3 py-1 rounded-full text-xs font-black border border-black w-fit mb-2">
            <span>✨ New Space</span>
          </div>
          <DialogTitle className="text-2xl font-black text-[#18181b]">
            Create a Vibe Space
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs font-medium">
            Name your room and start chatting right away.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-red-600 bg-red-100 border border-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="roomName" className="text-xs font-bold text-[#18181b]">Space Name</Label>
            <Input
              id="roomName"
              placeholder="e.g. Late Night Beats 🎵"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="bg-white border-2 border-black rounded-xl h-11 text-sm focus-visible:ring-2 focus-visible:ring-[#ffd028]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !roomName.trim()}
            className="w-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-extrabold text-sm py-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#18181b] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Launch Space</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
