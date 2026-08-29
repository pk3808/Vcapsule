"use client";

import { useState, useRef, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Music, Play, Pause, Volume2, VolumeX, Disc, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const AMBIENT_STREAMS = [
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    emoji: "🎧",
    desc: "Chill Lo-Fi beats to study & vibe",
    url: "https://coderadio-admin-v2.freecodecamp.org/listen/coderadio/radio.mp3",
  },
  {
    id: "groove",
    name: "Cozy Chillout",
    emoji: "☕",
    desc: "Downtempo ambient & jazz",
    url: "https://ice1.somafm.com/groovesalad-128-mp3",
  },
  {
    id: "rain",
    name: "Night Ambient",
    emoji: "🌧️",
    desc: "Deep space & calming rain waves",
    url: "https://ice1.somafm.com/dronezone-128-mp3",
  },
  {
    id: "synth",
    name: "Retro Synthwave",
    emoji: "🌌",
    desc: "80s synth lounge & chillwave",
    url: "https://ice1.somafm.com/vaporwaves-128-mp3",
  },
];

export function RoomJukebox() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(AMBIENT_STREAMS[0]);
  const [volume, setVolume] = useState(0.6);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn("Autoplay / audio stream error:", err);
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  const handleSelectTrack = (track) => {
    setCurrentTrack(track);
    setIsLoading(true);
    
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setIsLoading(false);
        });
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Native HTML5 Audio Element for rock-solid playback */}
      <audio
        ref={audioRef}
        src={currentTrack.url}
        preload="none"
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
        }}
        onWaiting={() => setIsLoading(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => {
          setIsLoading(false);
          setIsPlaying(false);
        }}
      />

      <Popover>
        <PopoverTrigger asChild>
          <button
            className={`h-9 sm:h-10 px-3 rounded-full border-2 border-black flex items-center gap-2 text-xs font-bold transition-all shadow-[2px_2px_0px_#18181b] active:scale-95 ${
              isPlaying
                ? "bg-[#fed7aa] text-black shadow-[2px_2px_0px_#18181b]"
                : "bg-white hover:bg-stone-100 text-stone-800"
            }`}
            title="Room Ambient Jukebox"
          >
            {isPlaying ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs">💿</span>
                {/* Equalizer animation */}
                <div className="flex items-end gap-0.5 h-3">
                  <motion.span
                    animate={{ height: ["4px", "12px", "6px", "10px", "4px"] }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    className="w-0.5 bg-black rounded-full"
                  />
                  <motion.span
                    animate={{ height: ["10px", "4px", "12px", "5px", "10px"] }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                    className="w-0.5 bg-black rounded-full"
                  />
                  <motion.span
                    animate={{ height: ["6px", "12px", "4px", "11px", "6px"] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                    className="w-0.5 bg-black rounded-full"
                  />
                </div>
                <span className="hidden md:inline font-mono text-[11px] font-black">{currentTrack.emoji} {currentTrack.name}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Jukebox</span>
              </div>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 p-4 bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <Disc className={`w-4 h-4 text-amber-600 ${isPlaying ? "animate-spin" : ""}`} />
              <h4 className="font-black text-xs text-[#18181b]">Vibe Jukebox</h4>
            </div>
            <span className="text-[10px] font-mono font-bold bg-[#ffd028] px-2 py-0.5 rounded-full border border-black text-black">
              {isPlaying ? "LIVE" : "PAUSED"}
            </span>
          </div>

          {/* Track Selector List */}
          <div className="space-y-1.5">
            {AMBIENT_STREAMS.map((track) => {
              const isSelected = currentTrack.id === track.id;
              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => handleSelectTrack(track)}
                  className={`w-full text-left p-2.5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#18181b] text-white border-black shadow-[2px_2px_0px_#ffd028]"
                      : "bg-white text-black border-black/10 hover:border-black hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{track.emoji}</span>
                    <div>
                      <p className={`text-xs font-black leading-tight ${isSelected ? "text-white" : "text-black"}`}>
                        {track.name}
                      </p>
                      <p className={`text-[10px] ${isSelected ? "text-stone-300" : "text-stone-500"}`}>
                        {track.desc}
                      </p>
                    </div>
                  </div>

                  {isSelected && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-[#34d399] animate-ping mr-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Play/Pause & Volume Controls */}
          <div className="pt-2 flex items-center gap-3 border-t border-stone-200">
            <button
              type="button"
              onClick={togglePlay}
              className="w-10 h-10 rounded-2xl bg-[#ffd028] hover:bg-[#fcc200] text-black border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#18181b] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-black" />
              ) : (
                <Play className="w-4 h-4 fill-black ml-0.5" />
              )}
            </button>

            <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-black/10">
              <button type="button" onClick={toggleMute} className="text-stone-600 hover:text-black">
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
              <input
                type="range"
                value={isMuted ? 0 : volume}
                min="0"
                max="1"
                step="0.05"
                onChange={handleVolumeChange}
                className="flex-1 accent-[#ffd028] cursor-pointer h-1.5 bg-stone-200 rounded-lg"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
