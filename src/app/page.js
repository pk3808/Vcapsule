"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCirclePlus } from "lucide-react";
import { AuthModal } from "@/components/shared/AuthModal";
import { CreateRoomModal } from "@/components/shared/CreateRoomModal";
import { motion } from "framer-motion";

export default function Home() {
  const { user } = useAuth();
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

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Soft background accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center text-center z-10 max-w-2xl"
      >
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-8 shadow-sm">
          <MessageCirclePlus className="w-10 h-10 text-primary" />
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-6 text-foreground">
          Vibe, Connect, & <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
            Chat instantly.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-xl leading-relaxed">
          A premium space for text, voice notes, images, and videos.
          Create a room, share the passcode, and start connecting without the noise.
        </p>

        <Button
          onClick={handleCreateRoomClick}
          size="lg"
          className="rounded-full px-8 py-7 text-lg shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground transform hover:-translate-y-1"
        >
          <MessageCirclePlus className="mr-2 w-5 h-5" />
          Create a New Room
        </Button>
      </motion.main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onOpenChange={(open) => {
          setIsAuthModalOpen(open);
          // Only open create room if they explicitly wanted to create a room before logging in
          // We don't check `user` here directly because of closure staleness,
          // we rely on AuthModal to handle the login and closing properly.
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
