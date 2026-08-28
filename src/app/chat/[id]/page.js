"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Smile, Paperclip, Mic, Send, Image as ImageIcon, Video,
  Hash, Users, Copy, Check, Share2, ArrowLeft, MoreHorizontal, Square,
  ArrowDown, Sparkles, ChevronDown, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import imageCompression from "browser-image-compression";

export default function ChatPage({ params }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const { user, mounted } = useAuth();
  const router = useRouter();

  const [isReady, setIsReady] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

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

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const initializeRoom = async () => {
      if (!mounted || !isActive) return;

      if (!user) {
        router.replace("/");
        return;
      }

      try {
        // 1. Fetch Room Info
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError || !room) {
          console.error("Room not found:", roomError);
          router.replace("/");
          return;
        }

        if (isActive) setCurrentRoom({ name: room.name, purpose: "Vibe and chat room" });

        // 2. Fetch Initial Messages
        const { data: initialMessages, error: msgError } = await supabase
          .from("messages")
          .select(`
            id,
            content,
            media_url,
            media_type,
            created_at,
            user_id,
            profiles (username, avatar_url)
          `)
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (!msgError && initialMessages && isActive) {
          const formattedMessages = initialMessages.map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: {
              id: msg.user_id,
              name: msg.profiles?.username || "Friend",
              avatar: msg.profiles?.avatar_url
            },
            timestamp: msg.created_at,
            attachment: msg.media_url ? { url: msg.media_url, type: msg.media_type, name: "Attachment" } : null
          }));
          setMessages(formattedMessages);
        }

        // 3. Fetch Participants
        const { data: membersData } = await supabase
          .from("room_members")
          .select("user_id, profiles (id, username, avatar_url)")
          .eq("room_id", roomId);

        if (membersData && isActive) {
          const memberList = membersData
            .filter(m => m.profiles)
            .map(m => ({
              id: m.user_id,
              name: m.profiles.username || "Member",
              avatar: m.profiles.avatar_url
            }));
          setParticipants(memberList);
        }

        if (isActive) setIsReady(true);

      } catch (err) {
        console.error(err);
      }
    };

    initializeRoom();

    return () => {
      isActive = false;
    };
  }, [user, mounted, router, roomId]);

  // Realtime Subscription
  useEffect(() => {
    if (!isReady || !roomId) return;

    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          const newMsg = payload.new;
          if (newMsg.user_id === user?.id) return;

          const { data: profile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", newMsg.user_id)
            .single();

          const formattedMsg = {
            id: newMsg.id,
            text: newMsg.content,
            sender: {
              id: newMsg.user_id,
              name: profile?.username || "Friend",
              avatar: profile?.avatar_url
            },
            timestamp: newMsg.created_at,
            attachment: newMsg.media_url ? { url: newMsg.media_url, type: newMsg.media_type, name: "Attachment" } : null
          };

          setMessages(prev => [...prev, formattedMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isReady, roomId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 200);
  }, []);

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

  const uploadMedia = async (file, type) => {
    let fileToUpload = file;
    let fileName = `${Date.now()}_${file.name}`;

    if (type === 'image') {
      try {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(file, options);
        fileName = `${Date.now()}_compressed.jpg`;
      } catch (err) {
        console.warn("Image compression failed", err);
      }
    }

    const { data, error } = await supabase.storage
      .from("chat-media")
      .upload(`public/${fileName}`, fileToUpload, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from("chat-media")
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() && !pendingFile) return;

    const optimisticId = Math.random().toString();
    const newMessage = {
      id: optimisticId,
      text: inputValue,
      sender: { name: user.name, id: user.id, avatar: user.avatar },
      timestamp: new Date().toISOString(),
      attachment: pendingFile ? { url: pendingFile.url, type: pendingFile.type, name: pendingFile.name, isUploading: true } : null
    };

    setMessages(prev => [...prev, newMessage]);
    const currentInput = inputValue;
    const currentFile = pendingFile;

    setInputValue("");
    setPendingFile(null);

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (currentFile) {
        mediaUrl = await uploadMedia(currentFile.file, currentFile.type);
        mediaType = currentFile.type;

        setMessages(prev => prev.map(m => m.id === optimisticId ? {
          ...m,
          attachment: { ...m.attachment, url: mediaUrl, isUploading: false }
        } : m));
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            room_id: roomId,
            user_id: user.id,
            content: currentInput,
            media_url: mediaUrl,
            media_type: mediaType
          }
        ])
        .select()
        .single();

      if (error) {
        console.error("Failed to send:", error);
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id } : m));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
    }
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], `voice_note.webm`, { type: "audio/webm" });
        const optimisticId = Math.random().toString();
        const localUrl = URL.createObjectURL(audioBlob);

        const newMessage = {
          id: optimisticId,
          text: "",
          sender: { name: user.name, id: user.id, avatar: user.avatar },
          timestamp: new Date().toISOString(),
          attachment: { url: localUrl, type: "audio", name: "Voice Note", isUploading: true }
        };
        setMessages(prev => [...prev, newMessage]);
        stream.getTracks().forEach(track => track.stop());

        try {
          const mediaUrl = await uploadMedia(audioFile, 'audio');

          setMessages(prev => prev.map(m => m.id === optimisticId ? {
            ...m,
            attachment: { ...m.attachment, url: mediaUrl, isUploading: false }
          } : m));

          const { data, error } = await supabase
            .from('messages')
            .insert([
              {
                room_id: roomId,
                user_id: user.id,
                content: "",
                media_url: mediaUrl,
                media_type: 'audio'
              }
            ])
            .select()
            .single();

          if (error) throw error;
          if (data) {
            setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id } : m));
          }
        } catch (err) {
          console.error("Failed to send voice note:", err);
          setMessages(prev => prev.filter(m => m.id !== optimisticId));
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied.");
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
    const link = `${window.location.origin}/chat/${roomId}`;
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!mounted || !isReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-black border-t-[#ffd028] animate-spin mb-4" />
        <p className="font-bold text-sm text-[#18181b]">Loading the vibe space...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 h-[calc(100vh-4rem)]">
      
      {/* ── SCREEN 3 TOP BAR (ChaTin Style) ───────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        {/* Back / Navigation button */}
        <Link href="/" className="w-10 h-10 rounded-full bg-[#18181b] hover:bg-black text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        {/* Center Pill Selector (e.g. "ChaTin 1.4 ∨") */}
        <div className="bg-white border-2 border-[#18181b] rounded-full px-4 py-1.5 flex items-center gap-2 shadow-[2px_2px_0px_#18181b] text-xs sm:text-sm font-bold text-[#18181b]">
          <span>{currentRoom?.name || "Vibe Space"}</span>
          <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
        </div>

        {/* Right Action button (Invite / Share) */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="w-10 h-10 rounded-full bg-[#18181b] hover:bg-black text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95">
              <Share2 className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-3 bg-white border-2 border-[#18181b] rounded-2xl shadow-[4px_4px_0px_#18181b]">
            <h4 className="font-bold text-xs mb-2">Share Room Link</h4>
            <div className="flex gap-2">
              <Input
                readOnly
                value={typeof window !== 'undefined' ? `${window.location.origin}/chat/${roomId}` : ''}
                className="h-8 bg-stone-100 border border-stone-300 text-xs rounded-xl"
              />
              <button
                onClick={handleCopyLink}
                className="bg-[#ffd028] text-black font-bold px-3 rounded-xl border border-black text-xs flex items-center justify-center shadow-sm"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* ── ROOM TITLE HEADING ─────────────────────────────── */}
      <div className="mb-3 px-1">
        <h1 className="text-xl sm:text-2xl font-black text-[#18181b] tracking-tight">
          {currentRoom?.name}
        </h1>
      </div>

      {/* ── SCREEN 3: FLOATING DARK CHAT CANVAS ────────────── */}
      <div className="flex-1 bg-[#18181b] border-2 border-black rounded-[2rem] p-4 sm:p-5 shadow-[6px_6px_0px_rgba(24,24,27,0.15)] flex flex-col overflow-hidden min-h-0 relative">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-hidden relative">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-400">
              <div className="w-16 h-16 rounded-2xl bg-[#27272a] border border-stone-700 flex items-center justify-center text-3xl mb-3 shadow-inner">
                👋
              </div>
              <h3 className="font-bold text-base text-white mb-1">Welcome to {currentRoom?.name}!</h3>
              <p className="text-xs text-stone-400 max-w-xs">
                No messages yet. Send the first text, voice note, or photo to get the vibe rolling.
              </p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-3" ref={scrollRef} onScrollCapture={handleScroll}>
              <div className="flex flex-col gap-4 py-2">
                {messages.map((msg, i) => {
                  const isMe = msg.sender.id === user.id;

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%] ${isMe ? "ml-auto" : "mr-auto"}`}
                    >
                      {/* Sender tag for others */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1.5 ml-1">
                          <span className="text-[10px] text-[#ffd028] font-black">✦</span>
                          <span className="text-xs font-bold text-stone-300">{msg.sender.name}</span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        className={`p-3.5 sm:p-4 text-sm ${
                          isMe
                            ? "bg-white text-[#18181b] font-medium rounded-2xl rounded-tr-sm shadow-md"
                            : "bg-[#27272a] text-stone-100 rounded-2xl rounded-tl-sm border border-stone-800"
                        }`}
                      >
                        {/* Attachments */}
                        {msg.attachment && (
                          <div className="mb-2 rounded-xl overflow-hidden">
                            {msg.attachment.type === 'image' && (
                              <img src={msg.attachment.url} alt="Attachment" className="max-w-xs sm:max-w-sm rounded-lg object-cover" />
                            )}
                            {msg.attachment.type === 'video' && (
                              <video src={msg.attachment.url} controls className="max-w-xs sm:max-w-sm rounded-lg" />
                            )}
                            {msg.attachment.type === 'file' && (
                              <a href={msg.attachment.url} download={msg.attachment.name} className="flex items-center gap-2 p-2 bg-black/10 rounded-md text-xs font-bold underline">
                                <Paperclip className="w-3.5 h-3.5" />
                                {msg.attachment.name}
                              </a>
                            )}
                            {msg.attachment.type === 'audio' && (
                              <div className="flex items-center gap-2 p-2 bg-black/10 rounded-lg">
                                <Mic className="w-4 h-4 text-amber-500" />
                                <audio src={msg.attachment.url} controls className="h-8 w-44 sm:w-56" />
                              </div>
                            )}
                          </div>
                        )}

                        {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      </div>

                      {/* Time */}
                      <span className="text-[10px] text-stone-500 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Floating Scroll-to-bottom */}
          <AnimatePresence>
            {showScrollBtn && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={scrollToBottom}
                className="absolute bottom-3 right-4 w-9 h-9 rounded-full bg-[#ffd028] text-black font-bold flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-20 border border-black"
              >
                <ArrowDown className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ── RECORDING PILL (ChaTin "Stop generate" style) ─── */}
        {isRecording && (
          <div className="flex justify-center my-2">
            <button
              onClick={stopRecording}
              className="bg-[#ffd028] hover:bg-[#fcc200] text-black font-bold text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-md border border-black animate-pulse"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
              <span>Stop & Send ({formatTime(recordingTime)})</span>
            </button>
          </div>
        )}

        {/* ── INPUT BAR (ChaTin White Pill with Green Plus) ── */}
        <div className="pt-3">
          <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
          <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
          <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />

          {/* File selected preview */}
          {pendingFile && (
            <div className="mb-2 p-2 bg-[#27272a] border border-stone-700 rounded-xl flex items-center justify-between text-xs text-stone-200">
              <span className="truncate max-w-[200px]">{pendingFile.name}</span>
              <button onClick={clearPendingFile} className="text-red-400 font-bold ml-2">✕</button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* White Pill Input Container */}
            <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1.5 shadow-sm border border-stone-200 focus-within:ring-2 focus-within:ring-[#ffd028]">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type here..."
                className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent text-black text-sm px-0 h-9 placeholder:text-stone-400"
              />

              {/* Emoji Picker Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="text-stone-400 hover:text-stone-700 transition-colors p-1">
                    <Smile className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="p-0 border-0 shadow-none bg-transparent">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => setInputValue(prev => prev + emojiData.emoji)}
                    theme="light"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Mint Green Plus Button (Attachment Menu from reference) */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 rounded-full bg-[#34d399] hover:bg-[#22c55e] text-[#18181b] font-black flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" align="end" className="w-48 p-2 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_#18181b]">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  Photo / Image
                </button>
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <Video className="w-4 h-4 text-purple-600" />
                  Video
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-black hover:bg-stone-100 rounded-xl transition-colors"
                >
                  <Paperclip className="w-4 h-4 text-amber-600" />
                  Document
                </button>
              </PopoverContent>
            </Popover>

            {/* Mic / Send Button */}
            {!inputValue.trim() && !pendingFile ? (
              <button
                type="button"
                onPointerDown={startRecording}
                className="w-10 h-10 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0 border border-stone-700"
                title="Hold to record voice"
              >
                <Mic className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-bold flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0 border border-black"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
