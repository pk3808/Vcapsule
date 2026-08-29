"use client";

import { useState, useRef, useEffect, use, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Smile, Paperclip, Mic, Send, Image as ImageIcon, Video,
  Hash, Users, Copy, Check, CheckCheck, Share2, ArrowLeft, Square,
  ArrowDown, Sparkles, ChevronDown, Plus, X, Download,
  Volume2, VolumeX, Heart, Maximize2, Phone, PhoneCall, PhoneOff, ArrowRight, LogOut,
  Lock, KeyRound, Globe
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import EmojiPicker from "emoji-picker-react";
import imageCompression from "browser-image-compression";
import { VoiceNotePlayer } from "@/components/shared/VoiceNotePlayer";
import { VoiceCallModal } from "@/components/shared/VoiceCallModal";
import { AuthModal } from "@/components/shared/AuthModal";
import { useToast } from "@/components/shared/VibeToast";
import { playSendSound, playReceiveSound, playReactionSound } from "@/lib/soundFx";

export default function ChatPage({ params }) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.id;
  const { user, mounted } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();

  const [isReady, setIsReady] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [inviteRoom, setInviteRoom] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCallPickerOpen, setIsCallPickerOpen] = useState(false);
  
  // Private space passcode state
  const [isPasscodeLocked, setIsPasscodeLocked] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState("");
  const [isVerifyingPasscode, setIsVerifyingPasscode] = useState(false);

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Advanced features state
  const [typingUsers, setTypingUsers] = useState({});
  const [selectedLightboxImage, setSelectedLightboxImage] = useState(null);
  const [particles, setParticles] = useState([]);
  const [doubleClickedHeartId, setDoubleClickedHeartId] = useState(null);
  const [seenMessageIds, setSeenMessageIds] = useState(new Set());
  const [activeCallState, setActiveCallState] = useState(null);

  const [pendingFile, setPendingFile] = useState(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    const initializeRoom = async () => {
      if (!mounted || !isActive) return;

      try {
        // 1. Fetch Room Info
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", roomId)
          .single();

        if (roomError || !room) {
          console.error("Room not found:", roomError);
          if (isActive) {
            setInviteRoom(null);
            setIsReady(true);
          }
          return;
        }

        if (isActive) {
          setCurrentRoom({ 
            name: room.name, 
            purpose: "Vibe and chat room",
            is_private: room.is_private,
            passcode: room.passcode,
            category: room.category,
            max_members: room.max_members,
            created_by: room.created_by,
          });
          setInviteRoom(room);
        }

        // Check if user is already an accepted member or creator
        const isOwner = room.created_by === user?.id;
        let isAlreadyMember = isOwner;

        if (user && !isOwner) {
          const { data: mem } = await supabase
            .from("room_members")
            .select("id")
            .eq("room_id", roomId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (mem) isAlreadyMember = true;
        }

        // If room is Private and user is not yet verified -> Lock with passcode
        if (room.is_private && !isAlreadyMember) {
          if (isActive) {
            setIsPasscodeLocked(true);
            setIsReady(true);
          }
          return;
        }

        // If public room and not logged in -> Show invite preview
        if (!user) {
          if (isActive) setIsReady(true);
          return;
        }

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

        // 3. Auto-join user into room_members
        await supabase.from("room_members").upsert({
          room_id: roomId,
          user_id: user.id
        }, { onConflict: "room_id, user_id" });

        // 4. Fetch Participants
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

  // Realtime active presence members
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [realtimeChannel, setRealtimeChannel] = useState(null);

  // Reactions state with localStorage persistence
  const [reactions, setReactions] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);

  useEffect(() => {
    if (!roomId) return;
    try {
      const saved = localStorage.getItem(`vibe_reactions_${roomId}`);
      if (saved) {
        setReactions(JSON.parse(saved));
      }
      const savedSeen = localStorage.getItem(`vibe_seen_${roomId}`);
      if (savedSeen) {
        setSeenMessageIds(new Set(JSON.parse(savedSeen)));
      }
    } catch (e) {}
  }, [roomId]);

  const channelRef = useRef(null);

  // Spawn particle burst helper
  const triggerParticleBurst = (emoji) => {
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Math.random(),
      emoji,
      x: (Math.random() - 0.5) * 60,
      y: -20 - Math.random() * 40,
      scale: 0.8 + Math.random() * 0.5,
    }));
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 900);
  };

  const toggleReaction = useCallback((messageId, emoji) => {
    if (!user) return;

    if (soundEnabled) playReactionSound();
    triggerParticleBurst(emoji);

    setReactions(prev => {
      const msgReactions = prev[messageId] || {};
      const currentUsers = msgReactions[emoji] || [];
      const hasReacted = currentUsers.includes(user.id);

      const newUsers = hasReacted
        ? currentUsers.filter(id => id !== user.id)
        : [...currentUsers, user.id];

      const newMsgReactions = { ...msgReactions };
      if (newUsers.length > 0) {
        newMsgReactions[emoji] = newUsers;
      } else {
        delete newMsgReactions[emoji];
      }

      const updated = {
        ...prev,
        [messageId]: newMsgReactions
      };

      try {
        localStorage.setItem(`vibe_reactions_${roomId}`, JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'reaction',
        payload: { messageId, emoji, userId: user.id }
      });
    }
  }, [user, roomId, soundEnabled]);

  // Double click message to quick-heart
  const handleDoubleClickMessage = (msgId) => {
    setDoubleClickedHeartId(msgId);
    toggleReaction(msgId, '❤️');
    setTimeout(() => setDoubleClickedHeartId(null), 800);
  };

  const typingTimersRef = useRef({});
  const callSignalingHandlersRef = useRef({});

  // Realtime Channel (Messages, Reactions, Presence & Typing)
  useEffect(() => {
    if (!isReady || !roomId || !user || isPasscodeLocked) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        presence: { key: user.id },
        broadcast: { self: false }
      }
    });

    channelRef.current = channel;

    channel
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

          if (soundEnabled) playReceiveSound();

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

          // Automatically send seen acknowledgment back to sender
          channel.send({
            type: 'broadcast',
            event: 'seen',
            payload: { messageIds: [newMsg.id], seenBy: user.id }
          });
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const typingMap = {};
        const onlineMap = new Map();
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => {
            if (p.userId) {
              onlineMap.set(p.userId, {
                id: p.userId,
                name: p.username || "Friend",
                avatar: p.avatar,
                isOnline: true
              });
            }
            if (p.userId && p.userId !== user?.id && p.isTyping) {
              typingMap[p.userId] = p.username || "Someone";
            }
          });
        });
        setTypingUsers(typingMap);
        setOnlineMembers(Array.from(onlineMap.values()));
      })
      .on('broadcast', { event: 'typing' }, (response) => {
        const { userId, username, isTyping } = response.payload || {};
        if (!userId || userId === user?.id) return;

        if (typingTimersRef.current[userId]) {
          clearTimeout(typingTimersRef.current[userId]);
          delete typingTimersRef.current[userId];
        }

        if (isTyping) {
          setTypingUsers(prev => ({ ...prev, [userId]: username || "Someone" }));
          // Auto-expire after 2.5s watchdog
          typingTimersRef.current[userId] = setTimeout(() => {
            setTypingUsers(prev => {
              const updated = { ...prev };
              delete updated[userId];
              return updated;
            });
          }, 2500);
        } else {
          setTypingUsers(prev => {
            const updated = { ...prev };
            delete updated[userId];
            return updated;
          });
        }
      })
      .on('broadcast', { event: 'reaction' }, (response) => {
        const { messageId, emoji, userId } = response.payload || {};
        if (!messageId || !emoji || !userId || userId === user?.id) return;

        if (soundEnabled) playReactionSound();

        setReactions(prev => {
          const msgReactions = prev[messageId] || {};
          const currentUsers = msgReactions[emoji] || [];
          const hasReacted = currentUsers.includes(userId);

          const newUsers = hasReacted
            ? currentUsers.filter(id => id !== userId)
            : [...currentUsers, userId];

          const newMsgReactions = { ...msgReactions };
          if (newUsers.length > 0) {
            newMsgReactions[emoji] = newUsers;
          } else {
            delete newMsgReactions[emoji];
          }

          const updated = {
            ...prev,
            [messageId]: newMsgReactions
          };

          try {
            localStorage.setItem(`vibe_reactions_${roomId}`, JSON.stringify(updated));
          } catch (e) {}

          return updated;
        });
      })
      .on('broadcast', { event: 'seen' }, (response) => {
        const { messageIds, seenBy } = response.payload || {};
        if (!messageIds || seenBy === user?.id) return;

        setSeenMessageIds(prev => {
          const updated = new Set(prev);
          (Array.isArray(messageIds) ? messageIds : [messageIds]).forEach(id => updated.add(id));
          try {
            localStorage.setItem(`vibe_seen_${roomId}`, JSON.stringify(Array.from(updated)));
          } catch (e) {}
          return updated;
        });
      })
      .on('broadcast', { event: 'call:offer' }, (payload) => {
        callSignalingHandlersRef.current?.handleOffer?.(payload);
      })
      .on('broadcast', { event: 'call:answer' }, (payload) => {
        callSignalingHandlersRef.current?.handleAnswer?.(payload);
      })
      .on('broadcast', { event: 'call:ice-candidate' }, (payload) => {
        callSignalingHandlersRef.current?.handleIceCandidate?.(payload);
      })
      .on('broadcast', { event: 'call:hangup' }, (payload) => {
        callSignalingHandlersRef.current?.handleHangup?.(payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          setRealtimeChannel(channel);
          try {
            await channel.track({
              userId: user.id,
              username: user.name || "Friend",
              avatar: user.avatar,
              isTyping: false
            });
          } catch (err) {}
        }
      });

    return () => {
      channelRef.current = null;
      setRealtimeChannel(null);
      supabase.removeChannel(channel);
    };
  }, [isReady, roomId, user, isPasscodeLocked, soundEnabled]);

  // Automatically acknowledge seen messages on entering room
  useEffect(() => {
    if (!isReady || !user || !channelRef.current || messages.length === 0) return;

    const unreadFromOthers = messages
      .filter(m => m.sender.id !== user.id)
      .map(m => m.id);

    if (unreadFromOthers.length > 0) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'seen',
        payload: { messageIds: unreadFromOthers, seenBy: user.id }
      });
    }
  }, [messages.length, isReady, user]);

  // Handle typing broadcast via both Broadcast and Presence
  const handleInputChange = (e) => {
    setInputValue(e.target.value);

    if (!user || !roomId || !channelRef.current) return;

    // 1. Broadcast immediate packet
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, username: user.name || "Friend", isTyping: true }
    });

    // 2. Presence track sync
    channelRef.current.track({
      userId: user.id,
      username: user.name || "Friend",
      isTyping: true
    }).catch(() => {});

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, username: user.name || "Friend", isTyping: false }
      });
      channelRef.current?.track({
        userId: user.id,
        username: user.name || "Friend",
        isTyping: false
      }).catch(() => {});
    }, 1500);
  };

  const handleInputBlur = () => {
    if (!user || !roomId || !channelRef.current) return;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id, username: user.name || "Friend", isTyping: false }
    });
    channelRef.current.track({
      userId: user.id,
      username: user.name || "Friend",
      isTyping: false
    }).catch(() => {});
  };

  // Auto-scroll on mount & message updates
  useEffect(() => {
    if (!isReady) return;
    scrollToBottom("instant");
    const timer = setTimeout(() => {
      scrollToBottom("smooth");
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isReady, scrollToBottom]);

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
      } catch (err) {}
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

    if (soundEnabled) playSendSound();

    // Clear typing presence
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    channelRef.current?.track({
      userId: user.id,
      username: user.name || "Friend",
      isTyping: false
    }).catch(() => {});

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
        setMessages(prev => prev.filter(m => m.id !== optimisticId));
      } else if (data) {
        setMessages(prev => prev.map(m => m.id === optimisticId ? { ...m, id: data.id } : m));
      }
    } catch (err) {
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

        if (soundEnabled) playSendSound();

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
      showToast("Microphone access denied. Please allow microphone permissions in your browser.", "error");
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
    if (currentRoom?.is_private && currentRoom?.passcode) {
      const inviteText = `✦ Join my private space "${currentRoom?.name || "Vibe Space"}" on ChaTin!\n🔗 Link: ${link}\n🔑 Passcode: ${currentRoom.passcode}`;
      navigator.clipboard.writeText(inviteText);
      showToast(`Invite copied! Passcode is ${currentRoom.passcode}`, "success");
    } else {
      const inviteText = `✦ Join my space "${currentRoom?.name || "Vibe Space"}" on ChaTin!\n🔗 Link: ${link}`;
      navigator.clipboard.writeText(inviteText);
      showToast("Room invite link copied to clipboard! Share it with friends.", "success");
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getWhatsAppShareUrl = () => {
    if (typeof window === 'undefined') return '#';
    const link = `${window.location.origin}/chat/${roomId}`;
    const text = currentRoom?.is_private && currentRoom?.passcode
      ? `✦ Join my private space "${currentRoom?.name || "Vibe Space"}" on ChaTin!\n🔗 Link: ${link}\n🔑 Passcode: ${currentRoom.passcode}`
      : `✦ Join my space "${currentRoom?.name || "Vibe Space"}" on ChaTin!\n🔗 Link: ${link}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleUnlockPasscode = async (e) => {
    e.preventDefault();
    setPasscodeError("");

    if (!enteredPasscode.trim()) {
      setPasscodeError("Please enter the room passcode.");
      return;
    }

    if (enteredPasscode.trim() !== inviteRoom?.passcode?.trim()) {
      setPasscodeError("Incorrect passcode. Please check with the room host.");
      return;
    }

    // Passcode correct!
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsVerifyingPasscode(true);
    try {
      await supabase.from("room_members").upsert({
        room_id: roomId,
        user_id: user.id
      }, { onConflict: "room_id, user_id" });

      setIsPasscodeLocked(false);
      showToast("Passcode verified! Welcome to the private space ✨", "success");
    } catch (err) {
      setPasscodeError("Failed to enter room. Please try again.");
    } finally {
      setIsVerifyingPasscode(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return;
    setIsLeaving(true);
    try {
      // 1. Delete membership from database
      await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      // 2. Untrack presence
      if (channelRef.current) {
        try {
          await channelRef.current.untrack();
        } catch (e) {}
      }

      showToast(`You left ${currentRoom?.name || "the room"}`, "info");
      router.push("/");
    } catch (err) {
      console.error("Error leaving room:", err);
      showToast("Failed to leave room. Please try again.", "error");
    } finally {
      setIsLeaving(false);
      setIsLeaveModalOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  if (!mounted || !isReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-black border-t-[#ffd028] animate-spin mb-4" />
        <p className="font-bold text-sm text-[#18181b]">Opening your vibe space...</p>
      </div>
    );
  }

  // ── PRIVATE SPACE PASSCODE UNLOCK SCREEN ────────────────
  if (isPasscodeLocked && isReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-4.25rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="w-full max-w-md bg-[#faf6ef] border-2 border-black rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_0px_#18181b] flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Private Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#18181b] text-[#34d399] px-3.5 py-1 rounded-full text-xs font-black mb-5 shadow-sm border border-black">
            <Lock className="w-3.5 h-3.5" />
            <span>Private Space</span>
          </div>

          {/* Big Lock Icon */}
          <div className="w-20 h-20 rounded-3xl bg-[#34d399] border-2 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0px_#18181b] mb-4 rotate-[-2deg]">
            🔒
          </div>

          <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-1">
            Passcode Required
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black text-[#18181b] tracking-tight mb-2">
            {inviteRoom?.name || "Private Space"}
          </h1>
          <p className="text-xs text-stone-600 max-w-xs font-medium mb-6">
            This is a private space protected by the room host. Enter the passcode to unlock and enter.
          </p>

          <form onSubmit={handleUnlockPasscode} className="w-full space-y-3">
            {passcodeError && (
              <div className="p-3 text-xs font-bold text-red-600 bg-red-100 border border-red-300 rounded-xl">
                {passcodeError}
              </div>
            )}

            <div className="relative">
              <Input
                type="text"
                placeholder="Enter Room Passcode / PIN"
                value={enteredPasscode}
                onChange={(e) => setEnteredPasscode(e.target.value)}
                autoFocus
                className="bg-white border-2 border-black rounded-2xl h-12 text-center text-base font-mono font-black tracking-widest focus-visible:ring-2 focus-visible:ring-[#34d399]"
              />
            </div>

            <button
              type="submit"
              disabled={isVerifyingPasscode || !enteredPasscode.trim()}
              className="w-full py-4 px-6 rounded-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-black text-sm border-2 border-black shadow-[4px_4px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#18181b] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isVerifyingPasscode ? (
                <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Unlock & Enter Space</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <Link
            href="/"
            className="mt-4 text-xs font-bold text-stone-500 hover:text-black underline transition-colors"
          >
            Or return to home page
          </Link>
        </motion.div>

        <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      </div>
    );
  }

  // ── INVITATION LANDING SCREEN (WHEN NOT LOGGED IN) ─────────
  if (!user && isReady) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[calc(100vh-4.25rem)]">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="w-full max-w-md bg-[#faf6ef] border-2 border-black rounded-[2.5rem] p-6 sm:p-8 shadow-[8px_8px_0px_#18181b] flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Top Badge */}
          <div className="inline-flex items-center gap-1.5 bg-[#18181b] text-white px-3.5 py-1 rounded-full text-xs font-bold mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd028]" />
            <span>Room Invitation</span>
          </div>

          {/* Big Room Icon / Stamp */}
          <div className="w-20 h-20 rounded-3xl bg-[#ffd028] border-2 border-black flex items-center justify-center text-4xl shadow-[4px_4px_0px_#18181b] mb-4 rotate-[-3deg]">
            💬
          </div>

          {/* Invitation Heading */}
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-500 mb-1">
            You're invited to join
          </h2>
          <h1 className="text-2xl sm:text-3xl font-black text-[#18181b] tracking-tight mb-3">
            {inviteRoom?.name || "Vibe Space"}
          </h1>
          <p className="text-xs text-stone-600 max-w-xs font-medium mb-6">
            Hop in to start chatting, sharing photos & videos, sending voice notes, and hopping on voice calls!
          </p>

          {/* Room status card */}
          <div className="flex items-center gap-2 p-2.5 bg-white border-2 border-black rounded-2xl w-full justify-center mb-6 shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black text-[#18181b]">Active Chat Space · Free to Join</span>
          </div>

          {/* Yellow Pill CTA Button */}
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="w-full py-4 px-6 rounded-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-black text-sm border-2 border-black shadow-[4px_4px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_#18181b] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <span>Join & Start Chatting</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Back Home Link */}
          <Link
            href="/"
            className="mt-4 text-xs font-bold text-stone-500 hover:text-black underline transition-colors"
          >
            Or return to home page
          </Link>
        </motion.div>

        {/* Auth Modal Trigger */}
        <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      </div>
    );
  }

  if (!user) return null;

  const mergedMembersMap = new Map();
  mergedMembersMap.set(user.id, { id: user.id, name: user.name, avatar: user.avatar, isMe: true, isOnline: true });

  onlineMembers.forEach(m => {
    if (m.id !== user.id) {
      mergedMembersMap.set(m.id, { ...m, isMe: false, isOnline: true });
    }
  });

  participants.forEach(p => {
    if (!mergedMembersMap.has(p.id)) {
      mergedMembersMap.set(p.id, { ...p, isMe: p.id === user.id, isOnline: false });
    }
  });

  const allMembers = Array.from(mergedMembersMap.values());

  const activeTypingNames = Object.values(typingUsers);

  return (
    <div className="h-[calc(100vh-4.25rem)] w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col overflow-hidden relative">
      
      {/* ── TOP ACTION BAR ─────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2.5 px-1 shrink-0">
        {/* Left: Back & Room Pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#18181b] hover:bg-black text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95"
            title="Back to home"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="bg-white border-2 border-[#18181b] rounded-full px-3.5 sm:px-4 py-1.5 flex items-center gap-2 shadow-[2px_2px_0px_#18181b] text-xs sm:text-sm font-black text-[#18181b]">
            <span className="text-[#ffd028]">✦</span>
            <span className="truncate max-w-[110px] sm:max-w-[180px]">{currentRoom?.name || "Vibe Space"}</span>
          </div>

          {/* Dynamic Category Pill */}
          {currentRoom?.category && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-black bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full border border-stone-300 shadow-xs">
              {currentRoom.category}
            </span>
          )}

          {/* Passcode Badge for Private Space */}
          {currentRoom?.is_private && currentRoom?.passcode && (
            <div 
              onClick={() => {
                navigator.clipboard.writeText(currentRoom.passcode);
                showToast(`Passcode "${currentRoom.passcode}" copied!`, "success");
              }}
              className="bg-[#34d399] border-2 border-black rounded-full px-2.5 sm:px-3 py-1 flex items-center gap-1.5 shadow-[2px_2px_0px_#18181b] text-xs font-black text-black cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Click to copy passcode"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">PIN:</span>
              <span className="font-mono bg-white/90 px-1.5 py-0.5 rounded-md border border-black/20 font-bold">{currentRoom.passcode}</span>
            </div>
          )}
        </div>

        {/* Right: Voice Call, Sound Toggle, Mobile Sidebar Toggle & Invite */}
        <div className="flex items-center gap-2">
          {/* Clean Voice Call Button */}
          <button
            onClick={() => {
              const onlineOthers = allMembers.filter(m => !m.isMe && m.isOnline);
              if (onlineOthers.length === 0) {
                showToast("No other friends are online in this room right now! Share the link to invite them.", "warning");
                return;
              }
              if (onlineOthers.length === 1) {
                // Exactly 1 friend online -> Call immediately with zero extra popups
                setActiveCallState({
                  type: "OUTGOING",
                  targetUser: { id: onlineOthers[0].id, name: onlineOthers[0].name, avatar: onlineOthers[0].avatar }
                });
                return;
              }
              // 2+ friends online -> Open member picker
              setIsCallPickerOpen(true);
            }}
            className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-full bg-[#34d399] hover:bg-[#10b981] text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#18181b] transition-transform hover:scale-105 active:scale-95"
            title="Start Voice Call"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice Call</span>
            {allMembers.filter(m => !m.isMe && m.isOnline).length > 1 && (
              <span className="bg-black text-white text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                {allMembers.filter(m => !m.isMe && m.isOnline).length}
              </span>
            )}
          </button>

          {/* Multi-Member Call Picker Dialog (Only opens when 2+ friends online) */}
          <Dialog open={isCallPickerOpen} onOpenChange={setIsCallPickerOpen}>
            <DialogContent className="sm:max-w-[360px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-5">
              <DialogHeader className="space-y-1 pb-2 border-b border-stone-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <DialogTitle className="text-base font-black text-[#18181b]">
                    Who would you like to call?
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-stone-500">
                  Select an online member to start a voice call.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2 py-2 max-h-60 overflow-y-auto">
                {allMembers.filter(m => !m.isMe && m.isOnline).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      setIsCallPickerOpen(false);
                      setActiveCallState({
                        type: "OUTGOING",
                        targetUser: { id: member.id, name: member.name, avatar: member.avatar }
                      });
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white border-2 border-black/10 hover:border-black hover:bg-[#ffd028]/20 transition-all text-left group shadow-xs active:scale-98"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="w-8 h-8 border border-black shadow-xs">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[#fbcfe8] text-black font-black text-xs">
                          {(member.name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-xs text-[#18181b] truncate">{member.name}</span>
                    </div>
                    <div className="p-2 rounded-full bg-[#34d399] border border-black group-hover:scale-110 transition-transform">
                      <Phone className="w-3.5 h-3.5 text-black" />
                    </div>
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Sound FX Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold transition-all shadow-[2px_2px_0px_#18181b] ${
              soundEnabled ? "bg-[#fef08a] text-black" : "bg-white text-stone-400"
            }`}
            title={soundEnabled ? "Sound FX: ON" : "Sound FX: OFF"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Mobile toggle button */}
          <button
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border-2 border-black text-xs font-bold shadow-[2px_2px_0px_#18181b]"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{allMembers.length}</span>
          </button>

          {/* Share / Invite Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="h-9 sm:h-10 px-3.5 rounded-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-extrabold text-xs sm:text-sm flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#18181b] transition-transform hover:scale-105 active:scale-95">
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-4 bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h4 className="font-black text-xs text-[#18181b]">
                    {currentRoom?.is_private ? "Private Room Invite" : "Share Room Link"}
                  </h4>
                </div>
                {currentRoom?.is_private && (
                  <span className="text-[10px] font-black bg-[#34d399] text-black px-2 py-0.5 rounded-full border border-black flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>Private</span>
                  </span>
                )}
              </div>

              {/* Private Passcode Display Card */}
              {currentRoom?.is_private && currentRoom?.passcode && (
                <div className="p-2.5 bg-white border-2 border-black rounded-2xl flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-stone-500 block">Room Passcode</span>
                    <span className="text-base font-mono font-black tracking-widest text-[#18181b]">{currentRoom.passcode}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentRoom.passcode);
                      showToast(`Passcode "${currentRoom.passcode}" copied!`, "success");
                    }}
                    className="text-xs font-bold bg-[#ffd028] px-2.5 py-1 rounded-xl border border-black hover:scale-105 active:scale-95 transition-transform"
                  >
                    Copy PIN
                  </button>
                </div>
              )}

              {/* URL Link Box */}
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-stone-500">Room Link</span>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/chat/${roomId}` : ''}
                    className="h-9 bg-white border-2 border-black text-xs rounded-xl font-medium"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-[#ffd028] hover:bg-[#fcc200] text-black font-black px-3.5 rounded-xl border-2 border-black text-xs flex items-center justify-center shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
                    title="Copy full invite"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col gap-2">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-2xl bg-[#ffd028] hover:bg-[#fcc200] text-black font-black text-xs border-2 border-black shadow-[2px_2px_0px_#18181b] active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{currentRoom?.is_private ? "Copy Full Invite (Link + PIN)" : "Copy Invite Link"}</span>
                </button>

                <a
                  href={getWhatsAppShareUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_#18181b] active:scale-98 transition-all flex items-center justify-center gap-1.5 text-center"
                >
                  <span>Share via WhatsApp 💬</span>
                </a>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── MAIN FIXED-HEIGHT VIEWPORT (SIDEBAR + CHAT) ─────── */}
      <div className="flex-1 flex gap-3 sm:gap-4 overflow-hidden min-h-0 relative">
        
        {/* ── LEFT PARTICIPANTS SIDEBAR ───────────────────────── */}
        <div className={`
          ${isMobileSidebarOpen ? 'absolute inset-0 z-30 flex' : 'hidden md:flex'}
          w-full md:w-64 lg:w-72 h-full flex-col bg-white border-2 border-[#18181b] rounded-[1.75rem] p-3.5 sm:p-4 shadow-[4px_4px_0px_#18181b] overflow-hidden shrink-0
        `}>
          {/* Sidebar Header */}
          <div className="flex items-center justify-between pb-3 border-b-2 border-stone-100 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#ffd028] border border-black flex items-center justify-center text-xs font-black">
                👥
              </div>
              <h3 className="font-black text-sm text-[#18181b]">Participants</h3>
            </div>
            
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black bg-[#34d399] text-black px-2 py-0.5 rounded-full border border-black">
                {allMembers.filter(m => m.isOnline).length} active
              </span>
              {isMobileSidebarOpen && (
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="md:hidden w-6 h-6 rounded-full bg-stone-200 flex items-center justify-center text-black font-bold text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Members List (Scrollable Internally) */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 pr-1">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className={`flex items-center gap-3 p-2 rounded-2xl border transition-all ${
                  member.isMe
                    ? "bg-[#faf6ef] border-black/30 shadow-sm"
                    : member.isOnline
                    ? "bg-white border-transparent hover:border-stone-200 hover:bg-stone-50"
                    : "bg-stone-50/70 border-transparent opacity-75"
                }`}
              >
                <div className="relative">
                  <Avatar className="w-9 h-9 border-2 border-black shadow-sm">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-[#fbcfe8] text-black font-black text-xs">
                      {(member.name || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 border border-black rounded-full ${
                    member.isOnline ? "bg-emerald-500" : "bg-stone-400"
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs truncate ${member.isOnline ? "text-[#18181b]" : "text-stone-500"}`}>
                      {member.name}
                    </span>
                    {member.isMe ? (
                      <span className="text-[9px] font-black bg-[#ffd028] text-black px-1.5 py-0.2 rounded-full border border-black">
                        You
                      </span>
                    ) : member.isOnline ? (
                      <button
                        onClick={() => setActiveCallState({
                          type: "OUTGOING",
                          targetUser: { id: member.id, name: member.name, avatar: member.avatar }
                        })}
                        className="p-1 rounded-full bg-[#34d399] hover:bg-[#10b981] text-black border border-black transition-transform hover:scale-110"
                        title={`Call ${member.name}`}
                      >
                        <Phone className="w-2.5 h-2.5" />
                      </button>
                    ) : null}
                  </div>
                  <span className={`text-[10px] font-bold block ${member.isOnline ? "text-emerald-600" : "text-stone-400"}`}>
                    {member.isOnline ? "● In Room" : "○ Offline"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="pt-2 border-t-2 border-stone-100 shrink-0 space-y-1.5">
            <div className="bg-[#faf6ef] border border-stone-200 rounded-2xl p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="text-[9px] font-black uppercase text-stone-500">Space</span>
                {currentRoom?.category && (
                  <span className="text-[9px] font-bold bg-white px-1.5 py-0.2 rounded border border-stone-300 text-stone-600">
                    {currentRoom.category}
                  </span>
                )}
              </div>
              <p className="text-xs font-black text-[#18181b] truncate">{currentRoom?.name}</p>
            </div>

            {/* Leave Space Button */}
            <button
              onClick={() => setIsLeaveModalOpen(true)}
              className="w-full py-2 px-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="Leave this chat space"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Space</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT CHAT CANVAS ───────────────────────────────── */}
        <div className="flex-1 h-full flex flex-col bg-[#18181b] border-2 border-black rounded-[1.75rem] sm:rounded-[2rem] p-3 sm:p-4 shadow-[5px_5px_0px_rgba(24,24,27,0.15)] overflow-hidden min-w-0 relative">
          
          {/* Top Sub-Bar */}
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-stone-800 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[#ffd028] text-xs font-black">✦</span>
              <span className="text-xs font-bold text-stone-300 truncate">
                {currentRoom?.name}
              </span>
            </div>
            <span className="text-[10px] font-bold text-stone-400 flex items-center gap-1">
              <span>Double-click to ❤️</span>
            </span>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-hidden min-h-0 relative">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-stone-400">
                <div className="w-14 h-14 rounded-2xl bg-[#27272a] border border-stone-700 flex items-center justify-center text-2xl mb-2 shadow-inner">
                  👋
                </div>
                <h3 className="font-bold text-sm text-white mb-1">Welcome to {currentRoom?.name}!</h3>
                <p className="text-xs text-stone-400 max-w-xs">
                  Say hi, send a photo, or drop a voice note to start the vibe.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-full pr-3" ref={scrollRef} onScrollCapture={handleScroll}>
                <div className="flex flex-col gap-3.5 py-2">
                  {messages.map((msg) => {
                    const isMe = msg.sender.id === user.id;
                    const msgReactions = reactions[msg.id] || {};
                    const isHeartedJustNow = doubleClickedHeartId === msg.id;

                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        onMouseEnter={() => setHoveredMessageId(msg.id)}
                        onMouseLeave={() => setHoveredMessageId(null)}
                        onDoubleClick={() => handleDoubleClickMessage(msg.id)}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%] ${isMe ? "ml-auto" : "mr-auto"} relative group select-none`}
                      >
                        {/* Double-Click Heart Pop Splash Animation */}
                        <AnimatePresence>
                          {isHeartedJustNow && (
                            <motion.div
                              initial={{ scale: 0, opacity: 1, y: 0 }}
                              animate={{ scale: 1.8, opacity: 0, y: -25 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                            >
                              <Heart className="w-10 h-10 text-red-500 fill-red-500 drop-shadow-md" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hover Floating Emoji Reaction Toolbar */}
                        <AnimatePresence>
                          {hoveredMessageId === msg.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.85, y: 4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.85, y: 4 }}
                              className={`absolute -top-7 ${isMe ? 'right-0' : 'left-0'} z-20 bg-white border border-black rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-[2px_2px_0px_#18181b]`}
                            >
                              {['👍', '❤️', '🔥', '😂', '😮', '🎉'].map((emoji) => {
                                const hasReacted = (msgReactions[emoji] || []).includes(user?.id);
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleReaction(msg.id, emoji);
                                    }}
                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs hover:scale-125 transition-transform ${
                                      hasReacted ? 'bg-[#ffd028]' : 'hover:bg-stone-100'
                                    }`}
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Sender Name */}
                        {!isMe && (
                          <div className="flex items-center gap-1.5 mb-1 ml-1">
                            <span className="text-[9px] text-[#ffd028] font-black">✦</span>
                            <span className="text-xs font-bold text-stone-300">{msg.sender.name}</span>
                          </div>
                        )}

                        {/* Bubble */}
                        <div
                          className={`p-3 sm:p-3.5 text-sm transition-transform active:scale-[0.99] ${
                            isMe
                              ? "bg-white text-[#18181b] font-medium rounded-2xl rounded-tr-sm shadow-md"
                              : "bg-[#27272a] text-stone-100 rounded-2xl rounded-tl-sm border border-stone-800"
                          }`}
                        >
                          {/* Attachments */}
                          {msg.attachment && (
                            <div className="mb-2 rounded-xl overflow-hidden">
                              {/* Image with Lightbox zoom */}
                              {msg.attachment.type === 'image' && (
                                <div className="relative group/img cursor-pointer" onClick={() => setSelectedLightboxImage(msg.attachment.url)}>
                                  <img
                                    src={msg.attachment.url}
                                    alt="Attachment"
                                    onLoad={() => scrollToBottom("smooth")}
                                    className="max-h-72 max-w-xs sm:max-w-sm rounded-xl object-contain bg-black/20 group-hover/img:opacity-90 transition-opacity"
                                  />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                                    <div className="bg-black/60 text-white rounded-full p-2">
                                      <Maximize2 className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Video */}
                              {msg.attachment.type === 'video' && (
                                <video src={msg.attachment.url} controls className="max-h-72 max-w-xs sm:max-w-sm rounded-xl" />
                              )}

                              {/* Document/File */}
                              {msg.attachment.type === 'file' && (
                                <a href={msg.attachment.url} download={msg.attachment.name} className="flex items-center gap-2 p-2 bg-black/10 rounded-md text-xs font-bold underline">
                                  <Paperclip className="w-3.5 h-3.5" />
                                  {msg.attachment.name}
                                </a>
                              )}

                              {/* Custom Waveform Voice Note Player */}
                              {msg.attachment.type === 'audio' && (
                                <VoiceNotePlayer url={msg.attachment.url} isMe={isMe} />
                              )}
                            </div>
                          )}

                          {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                        </div>

                        {/* Active Reaction Pills Badge */}
                        {Object.keys(msgReactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {Object.entries(msgReactions).map(([emoji, userIds]) => {
                              if (!userIds || userIds.length === 0) return null;
                              const hasReacted = userIds.includes(user?.id);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleReaction(msg.id, emoji);
                                  }}
                                  className={`px-2 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 transition-all hover:scale-105 active:scale-95 ${
                                    hasReacted
                                      ? 'bg-[#ffd028] text-black border-black shadow-sm'
                                      : 'bg-[#27272a] text-stone-300 border-stone-700 hover:border-stone-500'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-[10px] font-bold">{userIds.length}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp & Read Receipt */}
                        <div className="flex items-center gap-1.5 mt-1 px-1 text-[9px] text-stone-500">
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <span className="inline-flex items-center ml-0.5">
                              {seenMessageIds.has(msg.id) ? (
                                <span className="text-[#ffd028] font-black text-[10px]">
                                  Seen
                                </span>
                              ) : (
                                <span className="text-stone-500 text-[9px]">
                                  Sent
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Bottom anchor for auto-scroll */}
                  <div ref={messagesEndRef} className="h-px w-full" />
                </div>
              </ScrollArea>
            )}

            {/* Scroll-to-bottom FAB */}
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => scrollToBottom("smooth")}
                  className="absolute bottom-2 right-3 w-8 h-8 rounded-full bg-[#ffd028] text-black font-bold flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-transform z-20 border border-black"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── REALTIME FLOATING TYPING INDICATOR ─────────────── */}
          <AnimatePresence>
            {activeTypingNames.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="flex items-center gap-2 px-3 py-1 bg-[#27272a] text-stone-200 rounded-full w-fit text-xs font-bold border border-stone-700 shadow-md mb-1.5 shrink-0"
              >
                <span className="text-[#ffd028]">✦</span>
                <span>{activeTypingNames.join(", ")} is typing</span>
                <div className="flex items-center gap-1 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd028] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd028] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ffd028] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── LIVE RECORDING VISUALIZER WITH EQUALIZER BARS ── */}
          {isRecording && (
            <div className="flex items-center justify-center gap-3 my-1.5 shrink-0">
              <div className="flex items-center gap-1 px-3 py-1 bg-red-950/80 border border-red-500 rounded-full">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping mr-1" />
                <span className="text-xs font-mono font-bold text-red-300">{formatTime(recordingTime)}</span>
                
                {/* 5 live pulsing equalizer bars */}
                <div className="flex items-center gap-1 ml-2 h-3">
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-2" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-4" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-2.5" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-red-400 rounded-full animate-pulse h-3.5" style={{ animationDelay: '50ms' }} />
                </div>
              </div>

              <button
                onClick={stopRecording}
                className="bg-[#ffd028] hover:bg-[#fcc200] text-black font-black text-xs px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md border border-black transition-transform active:scale-95"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Send Note</span>
              </button>
            </div>
          )}

          {/* ── FIXED BOTTOM INPUT BAR ───────────────────────── */}
          <div className="pt-2.5 border-t border-stone-800 shrink-0">
            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
            <input type="file" accept="image/*" ref={imageInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />
            <input type="file" accept="video/*" ref={videoInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'video')} />

            {/* File preview */}
            {pendingFile && (
              <div className="mb-2 p-1.5 bg-[#27272a] border border-stone-700 rounded-xl flex items-center justify-between text-xs text-stone-200">
                <span className="truncate max-w-[200px]">{pendingFile.name}</span>
                <button onClick={clearPendingFile} className="text-red-400 font-bold ml-2 px-1">✕</button>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              {/* White Pill Input */}
              <div className="flex-1 bg-white rounded-full flex items-center px-4 py-1 shadow-sm border border-stone-200 focus-within:ring-2 focus-within:ring-[#ffd028]">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="Type a message..."
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 bg-transparent text-black text-sm px-0 h-9 placeholder:text-stone-400"
                />

                {/* Emoji Popover */}
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

              {/* Mint Green Plus Button (Attachment Menu) */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#34d399] hover:bg-[#22c55e] text-[#18181b] font-black flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Plus className="w-5 h-5 stroke-[3]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-44 p-1.5 bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_#18181b]">
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
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#27272a] hover:bg-[#3f3f46] text-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0 border border-stone-700"
                  title="Hold to record voice"
                >
                  <Mic className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-bold flex items-center justify-center shadow-sm transition-transform hover:scale-105 active:scale-95 shrink-0 border border-black"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              )}
            </form>
          </div>

        </div>
      </div>

      {/* ── FLOATING EMOJI PARTICLES LAYER ───────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, x: window?.innerWidth ? window.innerWidth / 2 + p.x : p.x, y: window?.innerHeight ? window.innerHeight / 2 + p.y : p.y, scale: 0.5 }}
            animate={{ opacity: 0, y: (window?.innerHeight ? window.innerHeight / 2 + p.y : p.y) - 100, scale: p.scale }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="absolute text-2xl select-none"
          >
            {p.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── IMAGE LIGHTBOX MODAL ────────────────────────────── */}
      <AnimatePresence>
        {selectedLightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedLightboxImage}
                alt="Full View"
                className="max-h-[80vh] max-w-full rounded-2xl object-contain border-2 border-white/20 shadow-2xl"
              />
              <div className="flex items-center gap-3 mt-4">
                <a
                  href={selectedLightboxImage}
                  download="image.jpg"
                  className="bg-[#ffd028] text-black font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1.5 border border-black shadow-md hover:scale-105 transition-transform"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setSelectedLightboxImage(null)}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold text-xs px-4 py-2 rounded-full flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WEBRTC VOICE CALL MODAL & FLOATING PILL ───────── */}
      <VoiceCallModal
        channel={realtimeChannel || channelRef.current}
        callSignalingHandlersRef={callSignalingHandlersRef}
        currentUser={user}
        roomId={roomId}
        otherParticipants={allMembers.filter(m => !m.isMe)}
        activeCallState={activeCallState}
        setActiveCallState={setActiveCallState}
      />

      {/* ── LEAVE SPACE CONFIRMATION MODAL ────────────────── */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-6">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-red-100 border-2 border-black flex items-center justify-center text-2xl shadow-[2px_2px_0px_#18181b]">
              🚪
            </div>
            <DialogTitle className="text-xl font-black text-[#18181b]">
              Leave {currentRoom?.name || "this Space"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-600 font-medium leading-relaxed">
              You will be removed from the members list and the space will no longer appear in your active spaces. You'll need an invite link to rejoin.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setIsLeaveModalOpen(false)}
              className="flex-1 py-3 rounded-full bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border-2 border-black shadow-[2px_2px_0px_#18181b] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleLeaveRoom}
              disabled={isLeaving}
              className="flex-1 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs border-2 border-black shadow-[2px_2px_0px_#18181b] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isLeaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Leave Space</span>
                </>
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
