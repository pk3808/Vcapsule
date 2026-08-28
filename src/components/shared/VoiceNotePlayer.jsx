"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Mic } from "lucide-react";

export function VoiceNotePlayer({ url, isMe }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const barHeights = [20, 45, 80, 55, 30, 70, 95, 60, 40, 85, 100, 75, 45, 65, 35, 50, 90, 60, 30, 45];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().catch(console.error);
      setIsPlaying(true);
    }
  };

  const handleSeek = (index) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const targetTime = (index / barHeights.length) * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatSeconds = (sec) => {
    if (!sec || isNaN(sec)) return "0:00";
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressRatio = duration ? currentTime / duration : 0;

  return (
    <div className={`flex items-center gap-2.5 p-2 rounded-2xl ${isMe ? 'bg-stone-100' : 'bg-[#202024]'} min-w-[200px] sm:min-w-[240px]`}>
      <audio ref={audioRef} src={url} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
          isMe
            ? "bg-[#ffd028] text-black border border-black shadow-sm"
            : "bg-[#ffd028] text-black shadow-sm"
        }`}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5 fill-current" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
        )}
      </button>

      {/* Waveform Equalizer Bars */}
      <div className="flex-1 flex items-center gap-[2.5px] h-6 cursor-pointer py-1" title="Click to seek">
        {barHeights.map((height, i) => {
          const barRatio = i / barHeights.length;
          const isActive = barRatio <= progressRatio;

          return (
            <div
              key={i}
              onClick={() => handleSeek(i)}
              style={{ height: `${Math.max(15, height)}%` }}
              className={`w-[3px] rounded-full transition-all duration-150 ${
                isActive
                  ? isMe ? "bg-black" : "bg-[#ffd028]"
                  : isMe ? "bg-stone-300" : "bg-stone-600"
              } ${isPlaying ? "animate-pulse" : ""}`}
            />
          );
        })}
      </div>

      {/* Duration / Elapsed */}
      <span className={`text-[10px] font-mono font-bold shrink-0 ${isMe ? 'text-stone-700' : 'text-stone-400'}`}>
        {formatSeconds(isPlaying ? currentTime : duration || currentTime)}
      </span>
    </div>
  );
}
