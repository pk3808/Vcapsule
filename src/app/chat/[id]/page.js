"use client";

import { useState, useRef, useEffect, use } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Smile, Paperclip, Mic, Send, Image as ImageIcon, Video,
  MoreVertical, Hash, Users, Copy, Check, Share2, Home, User as UserIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

const MOCK_MESSAGES = [
  { id: "1", text: "Welcome to the room!", sender: { name: "System", id: "sys" }, timestamp: new Date(Date.now() - 100000).toISOString() },
  { id: "2", text: "Hey everyone! 👋", sender: { name: "Alice", id: "usr_alice" }, timestamp: new Date(Date.now() - 80000).toISOString() },
  { id: "3", text: "Sup Alice, this new chat UI looks so clean.", sender: { name: "Bob", id: "usr_bob" }, timestamp: new Date(Date.now() - 60000).toISOString() },
];

const MOCK_USERS = [
  { id: "usr_alice", name: "Alice", isOnline: true },
  { id: "usr_bob", name: "Bob", isOnline: true },
  { id: "usr_charlie", name: "Charlie", isOnline: false },
];

export default function ChatPage({ params }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const { user, rooms } = useAuth();
  const router = useRouter();

  // Find local room if it exists, otherwise use mock defaults
  const currentRoom = rooms.find(r => r.id === roomId) || {
    name: "Late Night Beats",
    purpose: "Sharing cool tracks and vibes",
    passcode: "vibes"
  };

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Math.random().toString(),
      text: inputValue,
      sender: { name: user.name, id: user.id },
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/chat/${roomId}${currentRoom.passcode ? `?passcode=${currentRoom.passcode}` : ''}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-card/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-4">
            <div className="flex gap-1 border-r border-border/50 pr-4 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
                    <Link href="/">
                      <Home className="w-4 h-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10" asChild>
                    <Link href="/profile">
                      <UserIcon className="w-4 h-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Profile</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hash className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground leading-tight">{currentRoom.name}</h2>
                <p className="text-xs text-muted-foreground">{currentRoom.purpose}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger className="hidden sm:flex gap-2 rounded-full border border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors h-9 px-3 items-center text-sm font-medium">
                <Share2 className="w-4 h-4" />
                Invite
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4 bg-card border-border/50 shadow-xl rounded-xl">
                <h4 className="font-medium mb-2">Share Invite Link</h4>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={`${window.location.origin}/chat/${roomId}`}
                    className="h-9 bg-muted/50 border-border/50 text-xs"
                  />
                  <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleCopyLink}>
                    {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {currentRoom.passcode && (
                  <div className="mt-3 flex justify-between items-center bg-primary/5 p-2 rounded-md border border-primary/10">
                    <span className="text-xs text-muted-foreground">Passcode:</span>
                    <code className="text-sm font-mono font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">{currentRoom.passcode}</code>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4 sm:p-6" ref={scrollRef}>
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <AnimatePresence>
              {messages.map((msg, i) => {
                const isMe = msg.sender.id === user.id;
                const isSystem = msg.sender.id === "sys";

                if (isSystem) {
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={msg.id}
                      className="flex justify-center my-4"
                    >
                      <span className="text-xs font-medium px-3 py-1 bg-muted rounded-full text-muted-foreground">
                        {msg.text}
                      </span>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    key={msg.id}
                    className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    {!isMe && (
                      <Avatar className="w-8 h-8 mt-1 border border-border/50 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {msg.sender.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender.name}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border/40 text-card-foreground rounded-tl-sm"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="p-4 bg-background border-t border-border/50">
          <form
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 max-w-4xl mx-auto bg-card rounded-3xl border border-border/50 p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all"
          >
            <div className="flex gap-1 ml-1 pb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <ImageIcon className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-2 flex gap-2">
                   <Button variant="outline" size="sm" className="flex gap-2"><ImageIcon className="w-4 h-4"/> Image</Button>
                   <Button variant="outline" size="sm" className="flex gap-2"><Video className="w-4 h-4"/> Video</Button>
                </PopoverContent>
              </Popover>
            </div>

            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Message Late Night Beats..."
              className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent px-2 h-10 text-sm"
            />

            <div className="flex gap-1 pr-1 pb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Smile className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Emoji</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10">
                    <Mic className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Voice Note</TooltipContent>
              </Tooltip>
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim()}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar - Participants */}
      <div className="hidden lg:flex flex-col w-64 border-l border-border/50 bg-card/30">
        <div className="p-4 border-b border-border/50 flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Participants — {MOCK_USERS.length + 1}</h3>
        </div>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Online</p>
              <div className="space-y-3">
                {/* Me */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/20 text-primary">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                  </div>
                  <span className="text-sm font-medium">{user.name} (You)</span>
                </div>
                {/* Others */}
                {MOCK_USERS.filter(u => u.isOnline).map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-muted text-muted-foreground">{u.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>
                    <span className="text-sm text-muted-foreground">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Offline</p>
              <div className="space-y-3">
                {MOCK_USERS.filter(u => !u.isOnline).map(u => (
                  <div key={u.id} className="flex items-center gap-3 opacity-50">
                    <Avatar className="w-8 h-8 grayscale">
                      <AvatarFallback className="bg-muted text-muted-foreground">{u.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{u.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
