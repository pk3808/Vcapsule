"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, 
  Minimize2, Maximize2, Sparkles, User
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  playRingtone, stopRingtone, playCallConnectedSound, playCallEndSound 
} from "@/lib/soundFx";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

export function VoiceCallModal({
  channel,
  callSignalingHandlersRef,
  currentUser,
  roomId,
  otherParticipants = [],
  activeCallState,
  setActiveCallState,
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const callTimerRef = useRef(null);
  const callInitiatedRef = useRef(false);
  const iceCandidateQueueRef = useRef([]);

  // Clean up all call streams and peer connection
  const cleanupCall = useCallback(() => {
    stopRingtone();
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setCallDuration(0);
    callInitiatedRef.current = false;
    iceCandidateQueueRef.current = [];

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    setActiveCallState(null);
  }, [setActiveCallState]);

  // Create or retrieve Peer Connection
  const createPeerConnection = useCallback((targetUserId) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && channel) {
        channel.send({
          type: "broadcast",
          event: "call:ice-candidate",
          payload: {
            candidate: event.candidate,
            senderId: currentUser?.id,
            targetId: targetUserId,
          },
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [channel, currentUser?.id]);

  // Start Call as Initiator
  const startCall = useCallback(async (targetUser) => {
    try {
      playRingtone();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = createPeerConnection(targetUser?.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "call:offer",
          payload: {
            offer,
            caller: {
              id: currentUser?.id,
              name: currentUser?.name || "Friend",
              avatar: currentUser?.avatar,
            },
            targetId: targetUser?.id,
          },
        });
      }
    } catch (err) {
      console.error("Failed to start voice call:", err);
      cleanupCall();
    }
  }, [channel, currentUser, createPeerConnection, cleanupCall]);

  // Auto-initiate call when activeCallState is OUTGOING
  useEffect(() => {
    if (activeCallState?.type === "OUTGOING" && activeCallState?.targetUser && !callInitiatedRef.current) {
      callInitiatedRef.current = true;
      startCall(activeCallState.targetUser);
    }
  }, [activeCallState, startCall]);

  // Accept Incoming Call
  const acceptCall = async () => {
    if (!activeCallState?.offer || !activeCallState?.caller) return;
    stopRingtone();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = createPeerConnection(activeCallState.caller.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(activeCallState.offer));

      // Drain any ICE candidates received prior to remote description
      while (iceCandidateQueueRef.current.length > 0) {
        const cand = iceCandidateQueueRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {}
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (channel) {
        channel.send({
          type: "broadcast",
          event: "call:answer",
          payload: {
            answer,
            responderId: currentUser?.id,
            targetId: activeCallState.caller.id,
          },
        });
      }

      playCallConnectedSound();
      setActiveCallState({
        type: "CONNECTED",
        user: activeCallState.caller,
      });

      // Start call timer
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to accept call:", err);
      cleanupCall();
    }
  };

  // Decline or End Call
  const endCall = () => {
    playCallEndSound();
    if (channel && activeCallState) {
      const targetId = activeCallState.targetUser?.id || activeCallState.caller?.id || activeCallState.user?.id;
      channel.send({
        type: "broadcast",
        event: "call:hangup",
        payload: {
          senderId: currentUser?.id,
          targetId,
        },
      });
    }
    cleanupCall();
  };

  // Toggle Mic Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Bind signaling handlers to the pre-subscribed channel
  useEffect(() => {
    const handleOffer = (data) => {
      const payload = data?.payload || data;
      const { offer, caller, targetId } = payload || {};
      
      if (targetId && currentUser?.id && targetId !== currentUser.id) return;
      if (caller?.id && currentUser?.id && caller.id === currentUser.id) return;

      playRingtone();
      setActiveCallState({
        type: "INCOMING",
        offer,
        caller,
      });
    };

    const handleAnswer = async (data) => {
      const payload = data?.payload || data;
      const { answer, responderId, targetId } = payload || {};

      if (targetId && currentUser?.id && targetId !== currentUser.id) return;
      if (responderId && currentUser?.id && responderId === currentUser.id) return;

      if (peerConnectionRef.current && answer) {
        try {
          stopRingtone();
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));

          // Drain queued ICE candidates
          while (iceCandidateQueueRef.current.length > 0) {
            const cand = iceCandidateQueueRef.current.shift();
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (e) {}
          }

          playCallConnectedSound();
          setActiveCallState((prev) => ({
            type: "CONNECTED",
            user: prev?.targetUser || { name: "Friend" },
          }));

          if (callTimerRef.current) clearInterval(callTimerRef.current);
          callTimerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
          }, 1000);
        } catch (err) {
          console.error("Error setting answer:", err);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      const payload = data?.payload || data;
      const { candidate, senderId, targetId } = payload || {};

      if (targetId && currentUser?.id && targetId !== currentUser.id) return;
      if (senderId && currentUser?.id && senderId === currentUser.id) return;

      if (candidate) {
        if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        } else {
          iceCandidateQueueRef.current.push(candidate);
        }
      }
    };

    const handleHangup = (data) => {
      const payload = data?.payload || data;
      const { senderId, targetId } = payload || {};

      if (senderId && currentUser?.id && senderId === currentUser.id) return;
      if (targetId && currentUser?.id && targetId !== currentUser.id) return;

      playCallEndSound();
      cleanupCall();
    };

    if (callSignalingHandlersRef) {
      callSignalingHandlersRef.current = {
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        handleHangup,
      };
    }

    return () => {
      if (callSignalingHandlersRef) {
        callSignalingHandlersRef.current = {};
      }
    };
  }, [currentUser?.id, callSignalingHandlersRef, cleanupCall, setActiveCallState]);

  const formatCallTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!activeCallState) return null;

  const otherPerson =
    activeCallState.targetUser || activeCallState.caller || activeCallState.user || { name: "Friend" };

  return (
    <>
      {/* Hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <AnimatePresence>
        {/* ── MINIMIZED FLOATING PILL ── */}
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-20 right-6 z-50 bg-[#18181b] border-2 border-black rounded-full p-2 pl-3 shadow-[4px_4px_0px_#ffd028] flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-black text-white">{otherPerson.name}</span>
              <span className="text-xs font-mono font-bold text-[#ffd028]">{formatCallTime(callDuration)}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className={`p-1.5 rounded-full ${isMuted ? "bg-red-500 text-white" : "bg-stone-800 text-stone-300"}`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={endCall}
                className="p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── FULLSCREEN / MODAL VOICE CALL UI ── */}
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#18181b] border-2 border-black rounded-[2.5rem] p-6 sm:p-8 w-full max-w-sm shadow-[8px_8px_0px_#ffd028] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Minimize action button */}
              {activeCallState.type === "CONNECTED" && (
                <button
                  onClick={() => setIsMinimized(true)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors"
                  title="Minimize call"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              )}

              {/* Status Header */}
              <div className="flex items-center gap-1.5 mb-6 bg-[#27272a] px-3.5 py-1 rounded-full border border-stone-700">
                <Sparkles className="w-3.5 h-3.5 text-[#ffd028]" />
                <span className="text-xs font-black uppercase tracking-wider text-stone-300">
                  {activeCallState.type === "INCOMING" && "Incoming Voice Call"}
                  {activeCallState.type === "OUTGOING" && "Calling..."}
                  {activeCallState.type === "CONNECTED" && "Voice Call Active"}
                </span>
              </div>

              {/* Pulsing Avatar Visualizer */}
              <div className="relative my-4">
                {/* Ripple rings */}
                <motion.div
                  animate={{
                    scale: activeCallState.type === "CONNECTED" ? [1, 1.3, 1] : [1, 1.4, 1],
                    opacity: [0.6, 0.1, 0.6],
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -inset-4 rounded-full bg-[#ffd028]/20"
                />
                <motion.div
                  animate={{
                    scale: activeCallState.type === "CONNECTED" ? [1, 1.6, 1] : [1, 1.8, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.3 }}
                  className="absolute -inset-8 rounded-full bg-[#ffd028]/10"
                />

                <Avatar className="w-24 h-24 border-4 border-black shadow-[4px_4px_0px_#ffd028] bg-stone-800 relative z-10">
                  <AvatarImage src={otherPerson.avatar} />
                  <AvatarFallback className="text-2xl font-black bg-[#ffd028] text-black">
                    {otherPerson.name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Caller Name & Timer */}
              <h2 className="text-xl font-black text-white mt-3 truncate max-w-xs">{otherPerson.name}</h2>
              
              {activeCallState.type === "CONNECTED" ? (
                <div className="flex items-center gap-2 mt-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-sm font-mono font-bold text-[#ffd028]">{formatCallTime(callDuration)}</p>
                </div>
              ) : (
                <p className="text-xs text-stone-400 mt-1 font-bold">
                  {activeCallState.type === "INCOMING" ? "wants to chat over voice" : "Waiting for friend to answer..."}
                </p>
              )}

              {/* Live Waveform visualizer bars */}
              {activeCallState.type === "CONNECTED" && (
                <div className="flex items-center justify-center gap-1.5 h-6 my-6">
                  {[12, 24, 16, 28, 18, 22, 14, 26, 10, 20].map((h, i) => (
                    <motion.span
                      key={i}
                      animate={{ height: isMuted ? 4 : [6, h, 6] }}
                      transition={{ repeat: Infinity, duration: 0.8 + (i % 4) * 0.2, ease: "easeInOut" }}
                      className="w-1 bg-[#ffd028] rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* ── CALL ACTIONS BUTTONS ── */}
              <div className="mt-8 flex items-center justify-center gap-4 w-full">
                {/* Incoming Call: Accept / Decline */}
                {activeCallState.type === "INCOMING" && (
                  <>
                    <button
                      onClick={endCall}
                      className="flex-1 py-3 px-4 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>Decline</span>
                    </button>

                    <button
                      onClick={acceptCall}
                      className="flex-1 py-3 px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Accept</span>
                    </button>
                  </>
                )}

                {/* Outgoing Call: Cancel Call */}
                {activeCallState.type === "OUTGOING" && (
                  <button
                    onClick={endCall}
                    className="py-3 px-8 rounded-full bg-red-600 hover:bg-red-700 text-white font-black text-xs flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                )}

                {/* Connected Call: Mute / End Call */}
                {activeCallState.type === "CONNECTED" && (
                  <>
                    <button
                      onClick={toggleMute}
                      className={`p-4 rounded-full border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform ${
                        isMuted ? "bg-red-500 text-white" : "bg-stone-800 text-stone-200 hover:bg-stone-700"
                      }`}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={endCall}
                      className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white border-2 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition-transform"
                      title="End Call"
                    >
                      <PhoneOff className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
