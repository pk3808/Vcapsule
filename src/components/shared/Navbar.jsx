"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "./AuthModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, LogOut, ArrowRight, Waves } from "lucide-react";

export function Navbar() {
  const { user, mounted, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#f7f4eb]/90 backdrop-blur-md border-b border-black/[0.08]">
        {/* Full width stretching from extreme left to extreme right corners */}
        <div className="w-full px-4 sm:px-8 md:px-12 flex h-16 items-center justify-between">
          
          {/* Logo Badge (Jiyo with deep yellow wave icon) at far left corner */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="bg-[#18181b] text-white px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-[2px_2px_0px_#ffd028] group-hover:scale-105 transition-transform duration-200">
              <span className="font-black text-sm tracking-tight text-white pl-0.5">Jiyo</span>
              <Waves className="w-4 h-4 text-[#ffd028]" />
            </div>
          </Link>

          {/* Right Navigation at far right corner */}
          <nav className="flex items-center gap-3">
            {!mounted ? (
              <div className="h-10 w-24 rounded-full skeleton-warm" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-black/10 hover:border-black text-xs font-bold shadow-sm transition-all hover:scale-105"
                >
                  <span>My Spaces</span>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger className="relative h-10 w-10 rounded-full p-0 outline-none flex items-center justify-center overflow-hidden border-2 border-[#18181b] hover:scale-105 transition-transform shadow-[2px_2px_0px_#18181b]">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.avatar} alt={user.name || "User"} />
                      <AvatarFallback className="bg-[#ffd028] text-black font-bold text-sm">
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 bg-white rounded-2xl border-2 border-[#18181b] shadow-[4px_4px_0px_#18181b] p-2" align="end" forceMount>
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-sm font-bold text-black">{user.name}</p>
                          <p className="text-xs text-stone-500 truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator className="bg-stone-200 my-1" />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-xl hover:bg-stone-100 focus:bg-stone-100 font-medium text-xs">
                      <Link href="/profile" className="flex w-full items-center py-2 px-2">
                        <User className="mr-2 h-4 w-4 text-stone-600" />
                        <span>Profile & Rooms</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-stone-200 my-1" />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-xl text-red-600 hover:bg-red-50 focus:bg-red-50 font-medium text-xs py-2 px-2">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-[#ffd028] hover:bg-[#fcc200] text-[#18181b] font-bold text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2 rounded-full border-2 border-[#18181b] shadow-[2px_2px_0px_#18181b] hover:shadow-[1px_1px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-2"
              >
                <span>Sign In</span>
                <div className="w-5 h-5 rounded-full bg-[#18181b] text-white flex items-center justify-center">
                  <ArrowRight className="w-3 h-3" />
                </div>
              </button>
            )}
          </nav>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  );
}
