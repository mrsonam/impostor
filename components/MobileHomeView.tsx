"use client";
import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { showErrorToast } from "@/lib/toast-utils";

export type HomeAvatarOption = {
  src: string;
  alt: string;
  icon: string;
  full: string;
  characterName: string;
};

interface MobileHomeViewProps {
  name: string;
  setName: (v: string) => void;
  roomId: string;
  setRoomId: (v: string) => void;
  avatar: string;
  setAvatar: (v: string) => void;
  avatarFull: string;
  setAvatarFull: (v: string) => void;
  showHints: boolean;
  setShowHints: (v: boolean) => void;
  joinRoom: () => void;
  createRoom: () => void;
  busy: boolean;
  avatars: HomeAvatarOption[];
}

/**
 * A specialized mobile view for the Home Page.
 * Features:
 * 1. Vertical scrolling with snap-points for 'Join' vs 'Establish' sections.
 * 2. Horizontal carousel for avatar selection.
 */
export default function MobileHomeView({
  name,
  setName,
  roomId,
  setRoomId,
  avatar,
  setAvatar,
  avatarFull,
  setAvatarFull,
  showHints,
  setShowHints,
  joinRoom,
  createRoom,
  busy,
  avatars,
}: MobileHomeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Custom Avatar Carousel (Horizontal Swipe)
  function MobileAvatarCarousel() {
    return (
      <div className="flex gap-4 overflow-x-auto px-4 pb-4 no-scrollbar snap-x snap-mandatory">
        {avatars.map((a) => (
          <motion.button
            key={a.src}
            whileTap={{ scale: 0.9 }}
            className={`relative flex-shrink-0 w-24 aspect-square rounded-[2rem] overflow-hidden border-2 snap-center transition-all ${
              avatar === a.src ? "border-orange-500 scale-110 shadow-lg" : "border-white/10"
            }`}
            onClick={() => {
              setAvatar(a.src);
              setAvatarFull(a.full);
              setName(a.characterName);
            }}
          >
            <Image src={a.icon} alt={a.alt} fill className="object-cover" />
          </motion.button>
        ))}
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto snap-y snap-mandatory scroll-smooth no-scrollbar">
      {/* Section 1: Join Frequency */}
      <section className="h-full min-h-screen w-full flex flex-col p-6 snap-start">
        <div className="flex-1 flex flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-heading font-black tracking-tighter text-white">JOIN<br/>PROTOCOL</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em]">Initialize Tactical Link</p>
          </div>

          <div className="glass p-8 rounded-[3rem] flex flex-col gap-8 border-white/10">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Identity Variant</span>
                 <MobileAvatarCarousel />
              </div>

              <div className="space-y-4">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 outline-none focus:border-orange-500/50 transition-all font-medium"
                  placeholder="Infiltrator Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                />
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 outline-none focus:border-orange-500/50 transition-all font-heading font-black uppercase tracking-widest"
                  placeholder="Room Code"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  maxLength={8}
                />
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full py-5 rounded-2xl bg-orange-600 text-white font-heading font-black text-lg tracking-widest shadow-xl disabled:opacity-40"
              disabled={!name || !roomId || busy}
              onClick={joinRoom}
            >
              {busy ? "LINKING..." : "JOIN FREQUENCY"}
            </motion.button>
          </div>
        </div>

        <div className="py-8 flex flex-col items-center gap-2 opacity-40">
           <span className="text-[10px] font-black uppercase tracking-widest">Establish Room Below</span>
           <motion.div 
             animate={{ y: [0, 5, 0] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="w-1 h-4 bg-white/20 rounded-full"
           />
        </div>
      </section>

      {/* Section 2: Establish Room */}
      <section className="h-full min-h-screen w-full flex flex-col p-6 snap-start bg-[#640d14]/40">
        <div className="py-8 flex flex-col items-center gap-2 opacity-40">
           <motion.div 
             animate={{ y: [0, -5, 0] }}
             transition={{ duration: 2, repeat: Infinity }}
             className="w-1 h-4 bg-white/20 rounded-full"
           />
           <span className="text-[10px] font-black uppercase tracking-widest">Join Protocol Above</span>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-5xl font-heading font-black tracking-tighter text-white">HOST<br/>SERVER</h1>
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.4em]">Command Center Setup</p>
          </div>

          <div className="glass p-8 rounded-[3rem] flex flex-col gap-8 border-orange-500/20">
            <div className="space-y-6">
              <div className="flex flex-col gap-3">
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1">Commander Avatar</span>
                 <MobileAvatarCarousel />
              </div>

              <div className="space-y-4">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder-white/20 outline-none focus:border-orange-500/50 transition-all font-medium"
                  placeholder="Ambassador Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={16}
                />
                
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                   <div className="flex flex-col">
                      <span className="text-white text-xs font-black tracking-widest">GHOST HINTS</span>
                      <span className="text-white/30 text-[10px]">Extra clue for impostor</span>
                   </div>
                   <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${showHints ? "bg-orange-600" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showHints ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              className="w-full py-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-heading font-black text-lg tracking-widest shadow-xl disabled:opacity-40"
              disabled={!name || busy}
              onClick={createRoom}
            >
              {busy ? "GENERATING..." : "INITIALIZE TERMINAL"}
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  );
}
