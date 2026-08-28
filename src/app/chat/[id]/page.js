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
  MoreVertical, Hash, Users, Copy, Check, Share2, Home, User as UserIcon, Square
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";

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
  const { user, rooms, mounted } = useAuth();
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);

  // Find local room if it exists, otherwise use mock defaults
  const currentRoom = rooms.find(r => r.id === roomId) || {
    name: "Late Night Beats",
    purpose: "Sharing cool tracks and vibes",
    passcode: "vibes"
  };

  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const [pendingFile, setPendingFile] = useState(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    let isActive = true;
    if (mounted && isActive) {
      if (!user) {
        const timer = setTimeout(() => {
            if (isActive) router.replace("/");
        }, 0);
        return () => {
            isActive = false;
            clearTimeout(timer);
        };
      } else {
         const timer = setTimeout(() => {
            if (isActive) setIsReady(true);
        }, 0);
        return () => {
            isActive = false;
            clearTimeout(timer);
        };
      }
    }
    return () => {
      isActive = false;
    };
  }, [user, mounted, router]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPendingFile({ file, url, type, name: file.name });
    }
  };

  const clearPendingFile = () => {
    setPendingFile(null);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !pendingFile) return;

    const newMessage = {
      id: Math.random().toString(),
      text: inputValue,
      sender: { name: user.name, id: user.id },
      timestamp: new Date().toISOString(),
      attachment: pendingFile ? { url: pendingFile.url, type: pendingFile.type, name: pendingFile.name } : null
    };

    setMessages([...messages, newMessage]);
    setInputValue("");
    setPendingFile(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);

        // Send the audio message immediately
        const newMessage = {
          id: Math.random().toString(),
          text: "",
          sender: { name: user.name, id: user.id },
          timestamp: new Date().toISOString(),
          attachment: { url: audioUrl, type: "audio", name: "Voice Note" }
        };
        setMessages(prev => [...prev, newMessage]);

        // Cleanup stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/chat/${roomId}${currentRoom.passcode ? `?passcode=${currentRoom.passcode}` : ''}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!mounted || !isReady) {
    return (
      <div className="flex-1 bg-background flex items-center justify-center min-h-[50vh]">
         <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      </div>
    );
  }

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
                <TooltipTrigger className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Link href="/" className="flex items-center justify-center w-full h-full">
                    <Home className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Home</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <Link href="/profile" className="flex items-center justify-center w-full h-full">
                    <UserIcon className="w-4 h-4" />
                  </Link>
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
              <PopoverTrigger className="flex gap-2 rounded-full border border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors h-9 px-3 items-center text-sm font-medium">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Invite</span>
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
                    <div className={`flex flex-col max-w-full ${isMe ? "items-end" : "items-start"}`}>
                      {!isMe && <span className="text-xs text-muted-foreground ml-1 mb-1">{msg.sender.name}</span>}
                      <div className={`px-4 py-2.5 rounded-2xl shadow-sm overflow-hidden ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-card border border-border/40 text-card-foreground rounded-tl-sm"
                      }`}>
                        {msg.attachment && (
                          <div className="mb-2 rounded-lg overflow-hidden">
                            {msg.attachment.type === 'image' && (
                              <img src={msg.attachment.url} alt="Attachment" className="max-w-xs sm:max-w-sm rounded-md" />
                            )}
                            {msg.attachment.type === 'video' && (
                              <video src={msg.attachment.url} controls className="max-w-xs sm:max-w-sm rounded-md" />
                            )}
                            {msg.attachment.type === 'file' && (
                              <a href={msg.attachment.url} download={msg.attachment.name} className="flex items-center gap-2 p-2 bg-background/20 rounded-md hover:bg-background/40 transition-colors text-xs font-medium">
                                <Paperclip className="w-4 h-4" />
                                {msg.attachment.name}
                              </a>
                            )}
                            {msg.attachment.type === 'audio' && (
                              <div className="flex items-center gap-2 p-2 bg-background/20 rounded-md">
                                <Mic className="w-4 h-4 shrink-0" />
                                <audio src={msg.attachment.url} controls className="h-8 w-48 sm:w-64" />
                              </div>
                            )}
                          </div>
                        )}
                        {msg.text && <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>}
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
          <div className="max-w-4xl mx-auto">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
            <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />

            <AnimatePresence>
              {pendingFile && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mb-3 p-3 bg-muted/50 rounded-xl border border-border/50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded bg-background flex items-center justify-center shrink-0">
                      {pendingFile.type === 'image' && <ImageIcon className="w-5 h-5 text-primary" />}
                      {pendingFile.type === 'video' && <Video className="w-5 h-5 text-primary" />}
                      {pendingFile.type === 'file' && <Paperclip className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{pendingFile.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">Ready to send</p>
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={clearPendingFile} className="shrink-0 text-muted-foreground hover:text-destructive">
                    <span className="sr-only">Remove attachment</span>
                    ✕
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <form
              onSubmit={handleSendMessage}
              className="flex items-end gap-2 bg-card rounded-3xl border border-border/50 p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/30 transition-all"
            >
              <div className="flex gap-1 ml-1 pb-1">
                <Tooltip>
                  <TooltipTrigger type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <Paperclip className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent>Attach file</TooltipContent>
                </Tooltip>

                <Popover>
                  <PopoverTrigger className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                    <ImageIcon className="w-4 h-4" />
                  </PopoverTrigger>
                  <PopoverContent side="top" align="start" className="w-auto p-2 flex gap-2">
                     <Button type="button" onClick={() => imageInputRef.current?.click()} variant="outline" size="sm" className="flex gap-2"><ImageIcon className="w-4 h-4"/> Image</Button>
                     <Button type="button" onClick={() => videoInputRef.current?.click()} variant="outline" size="sm" className="flex gap-2"><Video className="w-4 h-4"/> Video</Button>
                  </PopoverContent>
                </Popover>
              </div>

              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Message ${currentRoom.name}...`}
                className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent px-2 h-10 text-sm"
              />

            <div className="flex gap-1 pr-1 pb-1">
              <Popover>
                <PopoverTrigger className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer" type="button" title="Emoji">
                  <Smile className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-full p-0 border-none shadow-none bg-transparent">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setInputValue(prev => prev + emojiData.emoji)}
                    theme="light"
                  />
                </PopoverContent>
              </Popover>
              {isRecording ? (
                <div className="flex items-center bg-destructive/10 text-destructive rounded-full px-3 h-8 animate-pulse">
                  <Square className="w-4 h-4 mr-2" />
                  <span className="text-xs font-medium">{formatTime(recordingTime)}</span>
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    className="flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    onPointerDown={startRecording}
                  >
                    <Mic className="w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent>Hold or click to record</TooltipContent>
                </Tooltip>
              )}
              {isRecording && (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-transform active:scale-95"
                  onClick={stopRecording}
                >
                  Stop & Send
                </Button>
              )}
              <Button
                type="submit"
                size="icon"
                disabled={!inputValue.trim() && !pendingFile}
                className="w-8 h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </Button>
            </div>
            </form>
          </div>
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
