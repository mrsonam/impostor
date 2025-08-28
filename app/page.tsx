"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OverlayCard from "@/components/OverlayCard";
import Image from "next/image";
import door from "@/app/assets/images/door.png";
import create from "@/app/assets/images/create.png";
import player from "@/app/assets/images/player.png";
import key from "@/app/assets/images/key.png";
// Example avatar icons (add more as needed)
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
  { src: player.src, alt: "", icon: player.src, full: player.src },
  { src: sonamIcon.src, alt: "Sonam", icon: sonamIcon.src, full: sonam.src },
  {
    src: tseringIcon.src,
    alt: "Tsering",
    icon: tseringIcon.src,
    full: tsering.src,
  },
  { src: saimaIcon.src, alt: "Saima", icon: saimaIcon.src, full: saima.src },
  {
    src: nikashIcon.src,
    alt: "Nikash",
    icon: nikashIcon.src,
    full: nikash.src,
  },
  {
    src: shirishIcon.src,
    alt: "Shirish",
    icon: shirishIcon.src,
    full: shirish.src,
  },
  { src: ranjuIcon.src, alt: "Ranju", icon: ranjuIcon.src, full: ranju.src },
  { src: rajuIcon.src, alt: "Raju", icon: rajuIcon.src, full: raju.src },
];

export default function Home() {
  const r = useRouter();
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"join" | "create">("join");
  const [avatar, setAvatar] = useState(AVATARS[0].src);
  const [avatarFull, setAvatarFull] = useState(AVATARS[0].full);

  // For solid color bg for first 2 seconds
  const [showSolidBg, setShowSolidBg] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShowSolidBg(false), 2000);
    return () => clearTimeout(t);
  }, []);

  // Find the selected avatar object for icon and alt
  const selectedAvatar = AVATARS.find((a) => a.src === avatar) || AVATARS[0];

  async function createRoom() {
    setBusy(true);
    const res = await fetch("/api/room/create", {
      method: "POST",
      body: JSON.stringify({ name, avatar, avatarFull }),
    });
    const data = await res.json();
    setBusy(false);
    if (data.roomId && data.playerId) {
      sessionStorage.setItem("playerId", data.playerId);
      sessionStorage.setItem("playerName", name);
      sessionStorage.setItem("playerAvatar", avatar);
      sessionStorage.setItem("playerAvatarFull", avatarFull);
      r.push(`/room/${data.roomId}`);
    } else alert(data.error || "Failed");
  }

  async function joinRoom() {
    setBusy(true);
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
    } else alert(data.error || "Failed");
  }

  const inputCls =
    "w-full rounded-xl border border-white/60 bg-white/80 backdrop-blur px-3 py-3 text-slate-800 placeholder-slate-400 shadow-soft";
  const btn =
    "inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold shadow-soft disabled:opacity-60 transition-colors duration-150 cursor-pointer";

  // Avatar selection component
  function AvatarSelector() {
    return (
      <div className="flex items-center gap-3 mt-2 mb-2 flex-wrap">
        {/* <span className="text-white/70 text-sm mr-2">Avatar:</span> */}
        {AVATARS.map((a) => (
          <button
            key={a.src}
            type="button"
            className={`rounded-lg border border-white/30 p-1 bg-white/10 shadow-lg mr-1 flex items-center justify-center ${
              avatar === a.src ? "border-yellow-400 ring-2 ring-yellow-300" : ""
            }`}
            style={{ width: 40, height: 40 }}
            onClick={() => {
              setAvatar(a.src);
              setAvatarFull(a.full);
              setName(a.alt);
            }}
            aria-label={a.alt}
          >
            <img
              src={a.src}
              alt={a.alt}
              className="w-[26px] h-[26px] rounded-full mx-auto"
              draggable={false}
            />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative" }}>
      {/* Overlay image card that disappears on swipe up - always loads */}
      {typeof window !== "undefined" && <OverlayCard />}
      {/* Solid color background overlay for first 2 seconds */}
      {showSolidBg && (
        <div
          style={{
            background: "#640d14",
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            transition: "opacity 0.4s",
            opacity: showSolidBg ? 1 : 0,
            pointerEvents: "none",
          }}
        />
      )}
      <main
        className="grid gap-4"
        style={showSolidBg ? { pointerEvents: "none" } : {}}
      >
        <div>
          {/* Minimal, gamified tabs */}
          <div className="flex mb-4 gap-2">
            <button
              className={`flex-1 py-1 border-b-2 transition-colors tracking-wide uppercase ${
                tab === "join"
                  ? "border-white text-white font-bold"
                  : "border-transparent text-white/50"
              }`}
              onClick={() => setTab("join")}
              type="button"
              aria-selected={tab === "join"}
            >
              <Image src={door} alt="Enter" className="inline w-6 h-6 mr-1 align-text-bottom" width={24} height={24} />{" "}
              Join
            </button>
            <button
              className={`flex-1 py-1 border-b-2 transition-colors tracking-wide uppercase ${
                tab === "create"
                  ? "border-white text-white font-bold"
                  : "border-transparent text-white/50"
              }`}
              onClick={() => setTab("create")}
              type="button"
              aria-selected={tab === "create"}
            >
              <Image src={create} alt="Enter" className="inline w-6 h-6 mr-1 align-text-bottom" width={24} height={24} />{" "}
              Create
            </button>
          </div>
          {/* Gamified panel */}
          <div className="rounded-lg border border-white/30 p-5 grid gap-4 bg-white/10 shadow-lg">
            {tab === "join" && (
              <>
                <AvatarSelector />
                <div className="flex items-center gap-2">
                  <Image src={selectedAvatar.icon} alt={selectedAvatar.alt} className="inline w-6 h-6 mr-1 align-text-bottom" width={24} height={24} />
                  <input
                    className="flex-1 border-b border-white/40 bg-transparent px-2 py-2 text-white placeholder-white/60 outline-none text-lg"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    maxLength={16}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Image src={key} alt="Enter" className="inline w-6 h-6 mr-1 align-text-bottom" width={24} height={24} />

                  <input
                    className="flex-1 border-b border-white/40 bg-transparent px-2 py-2 text-white placeholder-white/60 outline-none text-lg tracking-widest uppercase"
                    placeholder="Room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    autoComplete="off"
                    maxLength={8}
                  />
                </div>
                <button
                  className="w-full py-2 rounded bg-gradient-to-r from-pink-500/80 to-yellow-400/80 text-white font-bold text-lg tracking-wide shadow-md hover:from-pink-400/90 hover:to-yellow-300/90 transition-all disabled:opacity-40 mt-2"
                  disabled={!name || !roomId || busy}
                  onClick={joinRoom}
                  type="button"
                >
                  Join Game
                </button>
              </>
            )}
            {tab === "create" && (
              <>
                <AvatarSelector />
                <div className="flex items-center gap-2">
                  <Image src={selectedAvatar.icon} alt={selectedAvatar.alt} className="inline w-6 h-6 mr-1 align-text-bottom" width={24} height={24} />
                  <input
                    className="flex-1 border-b border-white/40 bg-transparent px-2 py-2 text-white placeholder-white/60 outline-none text-lg"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                    maxLength={16}
                  />
                </div>
                <button
                  className="w-full py-2 rounded bg-gradient-to-r from-violet-500/80 to-blue-400/80 text-white font-bold text-lg tracking-wide shadow-md hover:from-violet-400/90 hover:to-blue-300/90 transition-all disabled:opacity-40 mt-2"
                  disabled={!name || busy}
                  onClick={createRoom}
                  type="button"
                >
                  Create Game
                </button>
              </>
            )}
            <div className="text-center text-xs text-white/40 mt-2">
              {tab === "join"
                ? "Enter your name and the room code to join a game."
                : "Create a new game and invite your friends!"}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
