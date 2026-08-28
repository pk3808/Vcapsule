"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Hash, Lock } from "lucide-react";

export function CreateRoomModal({ isOpen, onOpenChange }) {
  const router = useRouter();
  const { addRoom } = useAuth();
  const [roomName, setRoomName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!roomName) return;

    try {
      const newRoom = await addRoom({
        name: roomName,
      });

      onOpenChange(false);

      // Reset form
      setRoomName("");

      // Redirect to the new chat room
      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create room");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Create a New Space
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up a fresh room to vibe and chat with others.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {errorMsg && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {errorMsg}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="roomName" className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Room Name
            </Label>
            <Input
              id="roomName"
              placeholder="e.g. Late Night Beats"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="bg-background border-border/50 focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2 mb-2">
            <p className="text-xs text-muted-foreground">
              Passcodes and room purposes will be coming in a future database update.
            </p>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all px-8">
              Create Room
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
