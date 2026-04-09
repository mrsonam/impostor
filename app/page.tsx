"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import door from "@/app/assets/images/door.png";
import create from "@/app/assets/images/create.png";
import player from "@/app/assets/images/player.png";
import key from "@/app/assets/images/key.png";
import { showErrorToast } from "@/lib/toast-utils";
import { useConfirmationModal } from "@/lib/useConfirmationModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/useIsMobile";
import MobileHomeView from "@/components/MobileHomeView";

// Example avatar icons
import sonamIcon from "@/app/assets/images/sonam-icon.png";
import tseringIcon from "@/app/assets/images/tsering-icon.png";
import saimaIcon from "@/app/assets/images/saima-icon.png";
import nikashIcon from "@/app/assets/images/nikash-icon.png";
import shirishIcon from "@/app/assets/images/shirish-icon.png";
import ranjuIcon from "@/app/assets/images/ranju-icon.png";
import rajuIcon from "@/app/assets/images/raju-icon.png";

import sonam from "@/app/assets/images/sonam.png";
import tsering from "@/app/assets/images/tsering.png";
import saima from "@/app/assets/images/saima.png";
import nikash from "@/app/assets/images/nikash.png";
import shirish from "@/app/assets/images/shirish.png";
import ranju from "@/app/assets/images/ranju.png";
import raju from "@/app/assets/images/raju.png";

const AVATARS = [
  { src: player.src, alt: "Default character", icon: player.src, full: player.src, characterName: "Player" },
  { src: sonamIcon.src, alt: "Sonam", icon: sonamIcon.src, full: sonam.src, characterName: "Sonam" },
  { src: tseringIcon.src, alt: "Tsering", icon: tseringIcon.src, full: tsering.src, characterName: "Tsering" },
  { src: saimaIcon.src, alt: "Saima", icon: saimaIcon.src, full: saima.src, characterName: "Saima" },
  { src: nikashIcon.src, alt: "Nikash", icon: nikashIcon.src, full: nikash.src, characterName: "Nikash" },
  { src: shirishIcon.src, alt: "Shirish", icon: shirishIcon.src, full: shirish.src, characterName: "Shirish" },
  { src: ranjuIcon.src, alt: "Ranju", icon: ranjuIcon.src, full: ranju.src, characterName: "Ranju" },
  { src: rajuIcon.src, alt: "Raju", icon: rajuIcon.src, full: raju.src, characterName: "Raju" },
];

export default function Home() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"join" | "create">("join");
  const [avatar, setAvatar] = useState(AVATARS[0].src);
  const [avatarFull, setAvatarFull] = useState(AVATARS[0].full);
  const [showHints, setShowHints] = useState(true);

  const [showSolidBg, setShowSolidBg] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSolidBg(false), 2000);
    return () => clearTimeout(t);
  }, []);

  async function createRoom() {
    setBusy(true);
    try {
      const res = await fetch("/api/room/create", {
        method: "POST",
        body: JSON.stringify({ name, avatar, avatarFull, showHints }),
      });
      const data = await res.json();
      setBusy(false);
      if (data.roomId && data.playerId) {
        sessionStorage.setItem("playerId", data.playerId);
        sessionStorage.setItem("playerName", name);
        sessionStorage.setItem("playerAvatar", avatar);
        sessionStorage.setItem("playerAvatarFull", avatarFull);
        r.push(`/room/${data.roomId}`);
      } else {
        showErrorToast(data.error || "Failed to create room");
      }
    } catch (e) {
      setBusy(false);
      showErrorToast("Connection error");
    }
  }

  async function joinRoom() {
    setBusy(true);
    try {
      const code = roomId.trim().toUpperCase();
      const res = await fetch("/api/room/join", {
        method: "POST",
        body: JSON.stringify({ roomId: code, name, avatar, avatarFull }),
      });
      const data = await res.json();
      setBusy(false);
      if (data.playerId) {
        sessionStorage.setItem("playerId", data.playerId);
        sessionStorage.setItem("playerName", name);
        sessionStorage.setItem("playerAvatar", avatar);
        sessionStorage.setItem("playerAvatarFull", avatarFull);
        r.push(`/room/${code}`);
      } else {
        showErrorToast(data.error || "Failed to join room");
      }
    } catch (e) {
      setBusy(false);
      showErrorToast("Connection error");
    }
  }

  function AvatarSelector() {
    return (
      <div className="grid grid-cols-4 gap-3 mb-2">
        {AVATARS.map((a) => (
          <button
            key={a.src}
            type="button"
            className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all duration-300 ${
              avatar === a.src 
                ? "border-orange-500 scale-105 shadow-lg shadow-orange-500/20" 
                : "border-white/10 hover:border-white/30"
            }`}
            onClick={() => {
              setAvatar(a.src);
              setAvatarFull(a.full);
              setName(a.characterName);
            }}
          >
            <Image src={a.icon} alt={a.alt} fill className="object-cover" />
          </button>
        ))}
      </div>
    );
  }

  const isMobile = useIsMobile();
  const { isOpen, openModal, closeModal, modalConfig, handleConfirm } = useConfirmationModal();

  return (
    <div className="relative min-h-full">
      <AnimatePresence>
        {showSolidBg && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-[1000] bg-[#640d14] pointer-events-none"
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {isMobile ? (
          <MobileHomeView
            name={name}
            setName={setName}
            roomId={roomId}
            setRoomId={setRoomId}
            avatar={avatar}
            setAvatar={setAvatar}
            avatarFull={avatarFull}
            setAvatarFull={setAvatarFull}
            showHints={showHints}
            setShowHints={setShowHints}
            joinRoom={joinRoom}
            createRoom={createRoom}
            busy={busy}
            avatars={AVATARS}
          />
        ) : (
          <main
            className="flex-1 w-full max-w-7xl mx-auto px-8 lg:px-16 relative z-20 flex flex-col justify-center"
            style={showSolidBg ? { pointerEvents: "none" } : {}}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]"
            >
              {/* Left Column: Branding */}
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-fit">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-white/60 text-xs font-black uppercase tracking-[0.3em]">Live Protocol</span>
                  </div>
                  <h1 className="text-7xl xl:text-8xl font-heading font-black tracking-tighter text-white leading-none">IMPOSTOR</h1>
                  <p className="text-white/50 text-lg leading-relaxed max-w-md">
                    A high-stakes game of social deduction. <span className="text-orange-400 font-semibold">Trust no one,</span> verify everyone.
                  </p>
                </div>

                <div className="glass p-8 rounded-[2rem] flex flex-col gap-5">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl">
                      <Image src={create.src} alt="Protocol" width={22} height={22} />
                    </div>
                    <h2 className="font-heading font-black text-base tracking-widest text-white/80 uppercase">Game Protocol</h2>
                  </div>
                  <ul className="text-white/50 text-sm flex flex-col gap-3 leading-relaxed">
                    <li className="flex items-start gap-3"><span className="text-orange-500 mt-0.5">→</span> Assemble at least <span className="text-white font-bold mx-1">3 agents</span>.</li>
                    <li className="flex items-start gap-3"><span className="text-orange-500 mt-0.5">→</span> The impostor receives a <span className="text-white font-bold mx-1">Secret Word</span>.</li>
                    <li className="flex items-start gap-3"><span className="text-orange-500 mt-0.5">→</span> Use interrogation to find the intruder.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Form */}
              <div className="flex flex-col gap-8">
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit">
                  <button
                    className={`px-8 py-3 rounded-xl transition-all duration-300 tracking-wider uppercase font-heading text-xs ${
                      tab === "join" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white/60"
                    }`}
                    onClick={() => setTab("join")}
                    type="button"
                  >
                    Join Room
                  </button>
                  <button
                    className={`px-8 py-3 rounded-xl transition-all duration-300 tracking-wider uppercase font-heading text-xs ${
                      tab === "create" ? "bg-white/10 text-white font-bold" : "text-white/40 hover:text-white/60"
                    }`}
                    onClick={() => setTab("create")}
                    type="button"
                  >
                    Host Room
                  </button>
                </div>

                <div className="glass p-10 rounded-[2.5rem] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="flex flex-col gap-8"
                    >
                      {tab === "join" ? (
                        <>
                          <AvatarSelector />
                          <div className="flex flex-col gap-6">
                            <div className="relative group">
                              <input
                                className="w-full border-b-2 border-white/10 bg-transparent px-1 py-4 text-white placeholder-white/20 outline-none text-2xl transition-all focus:border-orange-500/50"
                                placeholder="Your identity"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={16}
                              />
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
                            </div>
                            <div className="relative group">
                              <input
                                className="w-full border-b-2 border-white/10 bg-transparent px-1 py-4 text-white placeholder-white/20 outline-none text-2xl tracking-[0.3em] uppercase transition-all focus:border-orange-500/50"
                                placeholder="Room code"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                maxLength={8}
                              />
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 rounded-2xl bg-gradient-to-br from-orange-600 to-red-600 text-white font-heading font-extrabold text-xl tracking-[0.15em] shadow-2xl disabled:opacity-40"
                            disabled={!name || !roomId || busy}
                            onClick={joinRoom}
                            type="button"
                          >
                            {busy ? "Entering..." : "JOIN THE LOBBY"}
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <AvatarSelector />
                          <div className="flex flex-col gap-6">
                            <div className="relative group">
                              <input
                                className="w-full border-b-2 border-white/10 bg-transparent px-1 py-4 text-white placeholder-white/20 outline-none text-2xl transition-all focus:border-orange-500/50"
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={16}
                              />
                              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-focus-within:w-full" />
                            </div>
                            <div className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-white/5 border border-white/10">
                              <div className="flex flex-col">
                                <span className="text-white text-sm font-bold tracking-widest uppercase">Ghost Hints</span>
                                <span className="text-white/40 text-xs mt-0.5">Aids impostors</span>
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
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-6 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-heading font-extrabold text-xl tracking-[0.15em] shadow-2xl disabled:opacity-40"
                            disabled={!name || busy}
                            onClick={createRoom}
                            type="button"
                          >
                            {busy ? "Creating..." : "INITIALIZE ROOM"}
                          </motion.button>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </main>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isOpen}
        onConfirm={handleConfirm}
        onClose={closeModal}
        title={modalConfig?.title ?? ""}
        message={modalConfig?.message ?? ""}
        confirmText={modalConfig?.confirmText}
        cancelText={modalConfig?.cancelText}
        type={modalConfig?.type}
      />
    </div>
  );
}
