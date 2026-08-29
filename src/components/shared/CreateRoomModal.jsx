"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Sparkles, Lock, Globe, Dices, Users, Tag, ChevronDown, Check } from "lucide-react";

function CustomCapacitySelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: null, label: "Unlimited Capacity (Open)", emoji: "🌐" },
    { value: 10, label: "10 people (Max limit)", emoji: "🔟" },
    { value: 9, label: "9 people", emoji: "👥" },
    { value: 8, label: "8 people", emoji: "👥" },
    { value: 7, label: "7 people", emoji: "👥" },
    { value: 6, label: "6 people", emoji: "👥" },
    { value: 5, label: "5 people", emoji: "✋" },
    { value: 4, label: "4 people (Squad)", emoji: "🍀" },
    { value: 3, label: "3 people (Trio)", emoji: "⚡" },
    { value: 2, label: "2 people (1-on-1 Duo)", emoji: "🤝" },
  ];

  const currentOption = options.find((o) => o.value === value) || options[0];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full bg-white hover:bg-stone-50 border-2 border-black rounded-xl h-10 px-3 flex items-center justify-between text-xs font-black text-[#18181b] shadow-xs active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">{currentOption.emoji}</span>
            <span>{currentOption.label}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-stone-600 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-1.5 bg-[#faf6ef] border-2 border-black rounded-2xl shadow-[4px_4px_0px_#18181b] max-h-56 overflow-y-auto space-y-1 z-[9999]"
      >
        {options.map((opt) => {
          const isSelected = opt.value === value;
          return (
            <button
              key={opt.value === null ? "unlimited" : opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left ${
                isSelected
                  ? "bg-[#ffd028] text-black font-black border border-black shadow-xs"
                  : "hover:bg-white text-stone-700 font-bold"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-black" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function CreateRoomModal({ isOpen, onOpenChange, initialCategory = "🔥 Trending", initialPrompt = "" }) {
  const router = useRouter();
  const { addRoom } = useAuth();
  
  const [roomName, setRoomName] = useState(initialPrompt || "");
  const [isPrivate, setIsPrivate] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [category, setCategory] = useState(initialCategory || "🔥 Trending");
  const [maxMembers, setMaxMembers] = useState(null); // null means unlimited
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync state whenever the modal opens with a new prompt or category
  useEffect(() => {
    if (isOpen) {
      setRoomName(initialPrompt || "");
      if (initialCategory) {
        setCategory(initialCategory);
      }
      setErrorMsg("");
    }
  }, [isOpen, initialPrompt, initialCategory]);

  const categories = [
    "🔥 Trending",
    "🎵 Music",
    "💻 Devs",
    "🍣 Chill & Chat",
    "🎨 Creative",
    "📚 Study",
    "🎮 Gaming",
  ];

  const generatePasscode = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPasscode(randomPin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!roomName.trim()) return;

    if (isPrivate && !passcode.trim()) {
      setErrorMsg("Please enter or generate a passcode for your private space.");
      return;
    }

    setIsLoading(true);
    try {
      const newRoom = await addRoom({
        name: roomName.trim(),
        is_private: isPrivate,
        passcode: isPrivate ? passcode.trim() : null,
        max_members: isPrivate ? null : maxMembers,
        category: category || "General",
      });

      onOpenChange(false);
      setRoomName("");
      setPasscode("");
      setIsPrivate(false);
      router.push(`/chat/${newRoom.id}`);
    } catch (err) {
      setErrorMsg(err.message || "Failed to create space");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[#faf6ef] border-2 border-[#18181b] rounded-3xl shadow-[6px_6px_0px_#18181b] p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 mb-2">
          <div className="inline-flex items-center gap-1.5 bg-[#ffd028] text-black px-3 py-1 rounded-full text-xs font-black border border-black w-fit mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>New Vibe Space</span>
          </div>
          <DialogTitle className="text-2xl font-black text-[#18181b]">
            Create a Space
          </DialogTitle>
          <DialogDescription className="text-stone-500 text-xs font-medium">
            Customize your room privacy, capacity, and vibe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-bold text-red-600 bg-red-100 border border-red-300 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Space Name */}
          <div className="space-y-1.5">
            <Label htmlFor="roomName" className="text-xs font-black text-[#18181b]">Space Name</Label>
            <Input
              id="roomName"
              placeholder="e.g. Late Night Beats 🎵"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              className="bg-white border-2 border-black rounded-xl h-11 text-sm focus-visible:ring-2 focus-visible:ring-[#ffd028]"
            />
          </div>

          {/* Privacy Toggle: Public vs Private */}
          <div className="space-y-1.5">
            <Label className="text-xs font-black text-[#18181b]">Space Privacy</Label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { setIsPrivate(false); setPasscode(""); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-left transition-all ${
                  !isPrivate
                    ? "bg-[#ffd028] border-black shadow-[3px_3px_0px_#18181b]"
                    : "bg-white border-stone-200 text-stone-600 hover:border-black"
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-black">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Space</span>
                </div>
                <span className="text-[10px] text-stone-700 font-medium">Visible on Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsPrivate(true);
                  if (!passcode) generatePasscode();
                }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center gap-1 text-left transition-all ${
                  isPrivate
                    ? "bg-[#34d399] border-black shadow-[3px_3px_0px_#18181b]"
                    : "bg-white border-stone-200 text-stone-600 hover:border-black"
                }`}
              >
                <div className="flex items-center gap-1.5 font-black text-xs text-black">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Space</span>
                </div>
                <span className="text-[10px] text-stone-800 font-medium">Passcode Protected</span>
              </button>
            </div>
          </div>

          {/* If Private: Passcode Field + Generator */}
          {isPrivate ? (
            <div className="p-3.5 bg-white border-2 border-black rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="passcode" className="text-xs font-black text-[#18181b] flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>Room Passcode / PIN</span>
                </Label>
                <button
                  type="button"
                  onClick={generatePasscode}
                  className="text-[11px] font-black bg-[#ffd028] text-black border border-black px-2 py-0.5 rounded-full flex items-center gap-1 hover:scale-105 transition-transform"
                >
                  <Dices className="w-3 h-3" />
                  <span>Generate PIN</span>
                </button>
              </div>
              <Input
                id="passcode"
                placeholder="Enter or generate 4-6 digit passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                required={isPrivate}
                className="bg-stone-50 border-2 border-black rounded-xl h-10 text-sm font-mono font-bold tracking-widest text-center focus-visible:ring-2 focus-visible:ring-[#34d399]"
              />
              <p className="text-[10px] text-stone-500 font-medium text-center">
                Friends will need this passcode to unlock and enter your room.
              </p>

              {/* Max Members Limit Dropdown for Private Space */}
              <div className="space-y-1.5 pt-1 border-t border-stone-200">
                <Label className="text-xs font-black text-[#18181b] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" />
                    <span>Max Member Capacity</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-bold">2 to 10 people</span>
                </Label>
                <CustomCapacitySelect value={maxMembers} onChange={setMaxMembers} />
              </div>
            </div>
          ) : (
            /* If Public: Category & Member Limit */
            <div className="space-y-3 p-3.5 bg-white border-2 border-black rounded-2xl">
              {/* Category */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-[#18181b] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-500" />
                  <span>Category</span>
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        category === cat
                          ? "bg-[#18181b] text-white border-black"
                          : "bg-stone-100 text-stone-700 border-stone-300 hover:border-black"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Members Limit Dropdown (2 to 10 max people) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-black text-[#18181b] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-emerald-600" />
                    <span>Max Member Capacity</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-bold">2 to 10 people</span>
                </Label>
                <CustomCapacitySelect value={maxMembers} onChange={setMaxMembers} />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !roomName.trim()}
            className="w-full bg-[#ffd028] hover:bg-[#fcc200] text-black font-extrabold text-sm py-3.5 rounded-full border-2 border-black shadow-[3px_3px_0px_#18181b] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_#18181b] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-black border-t-transparent animate-spin" />
            ) : (
              <>
                <span>Launch {isPrivate ? "Private" : "Public"} Space</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
