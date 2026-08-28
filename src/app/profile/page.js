"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Hash, LogOut, Settings, User } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const MOCK_ROOMS = [
  { id: "rm_1", name: "Late Night Beats", purpose: "Sharing cool tracks and vibes", members: 12 },
  { id: "rm_2", name: "Next.js Devs", purpose: "Discussing App Router & Tailwind", members: 156 },
  { id: "rm_3", name: "Book Club", purpose: "Sci-Fi and Fantasy reads", members: 8 },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex-1 bg-background p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-card p-6 sm:p-8 rounded-3xl border border-border/50 shadow-sm relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/10 to-transparent"></div>

          <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-background shadow-md z-10">
            <AvatarFallback className="bg-primary/5 text-primary text-4xl sm:text-5xl font-medium">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left z-10 mt-2">
            <h1 className="text-3xl font-bold tracking-tight mb-1">{user.name}</h1>
            <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-2 mb-4">
              <User className="w-4 h-4" />
              {user.email}
            </p>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button variant="outline" size="sm" className="rounded-full">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent shadow-none"
                onClick={() => { logout(); router.push("/"); }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Groups / Rooms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Spaces</h2>
              <p className="text-muted-foreground text-sm">Rooms you are currently a part of.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_ROOMS.map((room) => (
              <Link href={`/chat/${room.id}`} key={room.id}>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full group bg-card shadow-sm hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Hash className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                      </div>
                      <span className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                        {room.members} members
                      </span>
                    </div>
                    <CardTitle className="mt-4 text-lg">{room.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{room.purpose}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}

            {/* Create New Room Card */}
            <Card className="border-dashed border-2 bg-transparent hover:bg-primary/5 hover:border-primary/50 transition-colors cursor-pointer h-full min-h-[160px] flex items-center justify-center">
              <CardContent className="flex flex-col items-center justify-center pt-6 pb-6 text-muted-foreground hover:text-primary transition-colors">
                <div className="p-3 bg-muted rounded-full mb-3">
                  <Hash className="w-6 h-6" />
                </div>
                <p className="font-medium">Join or Create Room</p>
                <p className="text-xs mt-1 opacity-70">Head to home to start</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
