"use client";
import React from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "framer-motion";

interface MobileOverlayCardProps {
  isVisible: boolean;
  avatarSrc: string;
  playerName: string;
  myRole: string | null;
  myWord: string | null;
  myHint: string | null;
  showHints: boolean;
  isOwner: boolean;
  isEndingGame: boolean;
  endRound: () => void;
  isLoadingGameData: boolean;
}

/**
 * A premium, tactile swipe-up overlay for the Room Page on mobile devices.
 * Features springy physics and a 'Reveal' mechanic for secret roles/words.
 */
export default function MobileOverlayCard({
  isVisible,
  avatarSrc,
  playerName,
  myRole,
  myWord,
  myHint,
  showHints,
  isOwner,
  isEndingGame,
  endRound,
  isLoadingGameData,
}: MobileOverlayCardProps) {
  const y = useMotionValue(0);

  // All motion hooks must run every render (no hooks in JSX or after early returns).
  const bgOpacity = useTransform(y, [-300, 0], [0.5, 1]);
  const bgScale = useTransform(y, [-300, 0], [1.1, 1]);
  const wordLabelOpacity = useTransform(y, [-200, -50], [1, 0]);
  const secretOpacity = useTransform(y, [-250, -100], [1, 0]);
  const secretScale = useTransform(y, [-250, -100], [1, 0.8]);

  if (!isVisible) return null;

  const myPlayerNameCaps = playerName.toUpperCase();

  return (
    <div className="fixed inset-0 z-[1000] bg-black/95 overflow-hidden touch-none select-none">
      {/* Background decoration */}
      <motion.div 
        style={{ scale: bgScale, opacity: bgOpacity }}
        className="absolute inset-0 z-0"
      >
        <Image
          src={avatarSrc}
          alt={playerName}
          fill
          className="object-cover opacity-60 blur-sm"
          priority
        />
      </motion.div>

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 pt-12 flex flex-col items-center z-10 pointer-events-none">
        <motion.span 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-heading font-black text-4xl tracking-widest drop-shadow-2xl"
        >
          {myPlayerNameCaps}
        </motion.span>
      </div>

      {/* Draggable Role Card */}
      <motion.div
        drag="y"
        dragConstraints={{ top: -window.innerHeight * 0.45, bottom: 0 }}
        dragSnapToOrigin
        dragElastic={0.1}
        style={{ y }}
        className="absolute inset-0 flex flex-col items-center justify-end pb-32 z-20"
      >
        {/* The Secret Content (Visible when swiped up) */}
        <div className="flex flex-col items-center text-center gap-6 mb-12">
            {myRole !== 'impostor' && (
              <motion.div 
                style={{ opacity: wordLabelOpacity }}
                className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md"
              >
                <span className="text-white/60 text-[11px] font-black tracking-[0.3em] uppercase">
                  Your Word
                </span>
              </motion.div>
            )}

            <motion.div
               style={{ 
                 opacity: secretOpacity,
                 scale: secretScale
               }}
            >
              {myRole === 'impostor' ? (
                <div className="flex flex-col items-center gap-4">
                  <span className="px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.4em]">
                    Infiltrator Detected
                  </span>
                  
                  {showHints && myHint && (
                    <div className="mt-2 glass p-6 rounded-3xl border border-red-500/20 flex flex-col gap-3 min-w-[240px] shadow-[0_0_30px_rgba(239,68,68,0.1)]">
                      <div className="text-2xl font-heading font-black text-white tracking-tight leading-none bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        "{myHint}"
                      </div>
                    </div>
                  )}

                  <h2 className="mt-4 text-white/20 text-xs font-black uppercase tracking-[0.5em]">
                    IMPOSTOR NODE
                  </h2>
                </div>
              ) : (
                <h2 className="text-5xl md:text-6xl font-heading font-black tracking-tighter drop-shadow-2xl text-white">
                  {myWord || "ANALYZING..."}
                </h2>
              )}
            </motion.div>
        </div>

        {/* Swipe Handle & Visual Cue */}
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1.5 opacity-60">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: [0, 1, 0], y: [5, 0, -5] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
                className="w-4 h-1 rounded-full bg-white/40"
              />
            ))}
          </div>
          <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.6em] animate-pulse">
            Swipe up to reveal
          </span>
        </div>
      </motion.div>

      {/* Owner Actions (Sticky bottom) */}
      {isOwner && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[1100] px-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-5 rounded-2xl bg-red-600/90 backdrop-blur-md text-white font-heading font-black text-lg tracking-widest shadow-[0_10px_30px_rgba(220,38,38,0.3)] border border-red-500/50 flex items-center justify-center gap-3"
            onClick={endRound}
            disabled={isEndingGame}
          >
            {isEndingGame ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>TERMINATING...</span>
              </>
            ) : (
              "TERMINATE ROUND"
            )}
          </motion.button>
        </div>
      )}
    </div>
  );
}
