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
  const [purpose, setPurpose] = useState("");
  const [passcode, setPasscode] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomName || !purpose) return;

    const newRoom = addRoom({
      name: roomName,
      purpose,
      passcode
    });

    onOpenChange(false);

    // Reset form
    setRoomName("");
    setPurpose("");
    setPasscode("");

    // Redirect to the new chat room
    router.push(`/chat/${newRoom.id}`);
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
          <div className="space-y-2">
            <Label htmlFor="purpose" className="flex items-center gap-2">
              Purpose
            </Label>
            <Input
              id="purpose"
              placeholder="What's this room about?"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              className="bg-background border-border/50 focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="passcode" className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              Passcode (Optional)
            </Label>
            <Input
              id="passcode"
              type="text"
              placeholder="Leave empty for public"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="bg-background border-border/50 focus-visible:ring-primary/30"
            />
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
