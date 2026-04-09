"use client";
import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import playerIcon from "@/app/assets/images/player.png";
import key from "@/app/assets/images/key.png";
import playersIcon from "@/app/assets/images/players.png";
import create from "@/app/assets/images/create.png";
import leave from "@/app/assets/images/leave.png";
import detective from "@/app/assets/images/detective.png";
import kick from "@/app/assets/images/kick.png";
import { toast } from "react-toastify";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { useConfirmationModal } from "@/lib/useConfirmationModal";
import ConfirmationModal from "@/components/ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/lib/useIsMobile";
import MobileOverlayCard from "@/components/MobileOverlayCard";

// Loader component
function Loader({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} text-yellow-300 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      ></path>
    </svg>
  );
}

// Custom hook for safely accessing sessionStorage
function useSessionStorage(key: string, defaultValue: string = "") {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        setValue(stored);
      }
    }
  }, [key]);

  const updateValue = useCallback(
    (newValue: string) => {
      setValue(newValue);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(key, newValue);
      }
    },
    [key]
  );

  const removeValue = useCallback(() => {
    setValue(defaultValue);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(key);
    }
  }, [key, defaultValue]);

  return [value, updateValue, removeValue] as const;
}

function useChannel(roomId: string, on: (type: string, payload: any) => void) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

    const script = document.createElement("script");
    script.src = "https://js.pusher.com/8.4/pusher.min.js";
    script.onload = () => {
      const p = new (window as any).Pusher(key, { cluster });
      const ch = p.subscribe(`room-${roomId}`);
      ch.bind("player-joined", (d: any) => on("player-joined", d));
      ch.bind("player-left", (d: any) => on("player-left", d));
      ch.bind("game-started", (d: any) => on("game-started", d));
      ch.bind("game-ended", (d: any) => on("game-ended", d));
      ch.bind("room-loaded", (d: any) => on("room-loaded", d));
      (window as any)._pusher = p;
    };
    document.body.appendChild(script);
    return () => {
      try {
        (window as any)._pusher?.disconnect?.();
      } catch {}
    };
  }, [roomId, on]);
}

export default function RoomPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const [playerId, setPlayerId, removePlayerId] = useSessionStorage(
    "playerId",
    ""
  );
  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<"lobby" | "round" | "end">("lobby");
  const [myRole, setMyRole] = useState<null | "impostor" | "civilian">(null);
  const [myWord, setMyWord] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [myHint, setMyHint] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(true);
  const [isLoadingGameData, setIsLoadingGameData] = useState(false);
  const [isStartingGame, setIsStartingGame] = useState(false);
  const [isEndingGame, setIsEndingGame] = useState(false);
  const [isStartingNewGame, setIsStartingNewGame] = useState(false);
  const [isTogglingHints, setIsTogglingHints] = useState(false);
  const [isLoadingRoom, setIsLoadingRoom] = useState(false);

  // Confirmation modal
  const { isOpen, openModal, closeModal, modalConfig, handleConfirm } =
    useConfirmationModal();


  // Helper: is this player the room creator?
  const isOwner = Boolean(ownerId && playerId && ownerId === playerId);


  useChannel(roomId, (type, payload) => {
    console.log(type, payload);
    if (type === "player-joined") {
      if (
        payload.players &&
        payload.players.some((p: any) => p.id !== playerId)
      ) {
        const prevIds = players.map((p: any) => p.id);
        const latestPlayer = payload.players.find(
          (p: any) => !prevIds.includes(p.id)
        );
        // Don't show toast for owner
        if (
          latestPlayer &&
          latestPlayer.id !== playerId &&
          latestPlayer.id !== payload.players[0]?.id // owner is always first in list
        ) {
          const toastId = latestPlayer.id;
          toast(`${latestPlayer.name} joined the room`, {
            toastId,
            icon: false,
          });
        }
      }
      setPlayers(payload.players);
      // Try to get ownerId from the first player in the list (should be up to date)
      if (payload.players && payload.players.length > 0) {
        setOwnerId(payload.players[0].id);
      }
      // Get the current room state to sync the UI properly for new players
      fetch(`/api/room/state?roomId=${roomId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.phase) {
            setPhase(data.phase);
          }
          if (data.showHints !== undefined) {
            setShowHints(data.showHints);
          }
        })
        .catch((error) => {
          console.error("Error fetching room state:", error);
        });
    }
    if (type === "player-left") {
      // Only show a toast if the player who left is not the current player
      if (payload.playerId !== playerId) {
        toast(`${payload.playerName || "A player"} left the room`, {
          toastId: payload.playerId,
          icon: false,
        });
      }
      setPlayers(payload.players);
      if (payload.newOwnerId) {
        setOwnerId(payload.newOwnerId);
      }
      // If the current player left, redirect to home
      if (payload.playerId === playerId) {
        removePlayerId();
        window.location.href = "/";
      }
    }
    if (type === "room-loaded") {
      setPlayers(payload.players);
      if (payload.players && payload.players.length > 0) {
        setOwnerId(payload.players[0].id);
      }
    }
    if (type === "game-started") {
      toast("The game has begun! Good luck finding the impostor!", {
        toastId: "start",
        icon: false,
      });
      setPlayers(payload.players);
      if (payload.players && payload.players.length > 0) {
        setOwnerId(payload.players[0].id);
      }
      setPhase("round");

      // Set loading state and fetch game data
      setIsLoadingGameData(true);
      fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
        .then((r) => r.json())
        .then((d) => {
          setMyRole(d.role);
          setMyWord(d.word);
          setMyHint(d.hint ?? null);
          setIsLoadingGameData(false);
        })
        .catch((error) => {
          console.error("Error fetching game private view:", error);
          setIsLoadingGameData(false);
          // Silently retry after a short delay
          setTimeout(() => {
            setIsLoadingGameData(true);
            fetch(
              `/api/game/private-view?roomId=${roomId}&playerId=${playerId}`
            )
              .then((r) => r.json())
              .then((d) => {
                setMyRole(d.role);
                setMyWord(d.word);
                setMyHint(d.hint ?? null);
                setIsLoadingGameData(false);
              })
              .catch((retryError) => {
                console.error("Retry failed:", retryError);
                setIsLoadingGameData(false);
                showErrorToast(
                  "Failed to load game role. Please refresh the page."
                );
              });
          }, 1000);
        });
    }
    if (type === "game-ended") {
      toast("Game ended! Ready for the next round?", {
        toastId: "end",
        icon: false,
      });
      setPhase("end");
    }
    if (type === "hints-toggled") {
      setShowHints(payload.showHints);
      toast(
        `Hints ${payload.showHints ? "enabled" : "disabled"} for impostors`,
        {
          toastId: "hints-toggled",
          icon: false,
        }
      );

      // If hints were enabled and there's an active game, refresh the private view to get the hint
      if (payload.showHints && phase === "round" && myRole === "impostor") {
        fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.hint) {
              setMyHint(d.hint);
            }
          })
          .catch((error) => {
            console.error(
              "Error refreshing private view after hint toggle:",
              error
            );
          });
      }
    }
  });

  useEffect(() => {
    if (playerId) {
      setIsLoadingGameData(true);
      fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.role && d.isActive) {
            setMyRole(d.role);
            setMyWord(d.word);
            setMyHint(d.hint ?? null);

            // Only set phase to round and show overlay if the game is actually active
            setPhase("round");
          } else {
            // Clear any old game state if the game is not active
            setMyRole(null);
            setMyWord(null);
            setMyHint(null);
          }
          setIsLoadingGameData(false);
        })
        .catch((error) => {
          console.error("Error fetching private view:", error);
          setIsLoadingGameData(false);
          showErrorToast("Failed to load game state. Please refresh the page.");
        });
    }
  }, [roomId, playerId]);

  // On initial mount, fetch room info to get ownerId and sync state
  useEffect(() => {
    setIsLoadingRoom(true);
    fetch(`/api/room/state?roomId=${roomId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.players && data.players.length > 0) {
          setPlayers(data.players);
          setOwnerId(data.players[0].id);
        }
        if (data.phase) {
          setPhase(data.phase);
        }
        if (data.showHints !== undefined) {
          setShowHints(data.showHints);
        }
        setIsLoadingRoom(false);
      })
      .catch((error) => {
        console.error("Error loading room state:", error);
        setIsLoadingRoom(false);
        showErrorToast(
          "Failed to load room information. Please refresh the page."
        );
      });
  }, [roomId]);

  // Refresh private view when showHints changes to ensure hints are displayed correctly
  useEffect(() => {
    if (showHints && phase === "round" && myRole === "impostor") {
      fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.hint) {
            setMyHint(d.hint);
          }
        })
        .catch((error) => {
          console.error(
            "Error refreshing private view after hint change:",
            error
          );
        });
    }
  }, [showHints, phase, myRole, roomId, playerId]);

  // Silent background retry for missing game data
  useEffect(() => {
    if (phase === "round" && (!myRole || !myWord)) {
      const timer = setTimeout(() => {
        // Silently retry loading game data
        fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.role && d.isActive) {
              setMyRole(d.role);
              setMyWord(d.word);
              setMyHint(d.hint ?? null);
            }
          })
          .catch((error) => {
            console.error("Background retry failed:", error);
          });
      }, 2000); // Wait 2 seconds before retrying

      return () => clearTimeout(timer);
    }
  }, [phase, myRole, myWord, roomId, playerId]);

  async function startGame() {
    setIsStartingGame(true);
    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Failed to start game: " + data.error);
      } else {
      }
    } catch (error) {
      console.error("Error starting game:", error);
      showErrorToast("Failed to start game. Please try again.");
    } finally {
      setIsStartingGame(false);
    }
  }

  async function endRound() {
    setIsEndingGame(true);
    try {
      const res = await fetch("/api/game/end", {
        method: "POST",
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Failed to end game: " + data.error);
      } else {
      }
    } catch (error) {
      console.error("Error ending game:", error);
      showErrorToast("Failed to end game. Please try again.");
    } finally {
      setIsEndingGame(false);
    }
  }

  async function newGame() {
    setIsStartingNewGame(true);
    try {
      const res = await fetch("/api/game/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
      const raw = await res.text();
      let data: { ok?: boolean; error?: string; gameId?: string } = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        showErrorToast("Invalid response from server. Please try again.");
        return;
      }
      if (!res.ok || data.error) {
        showErrorToast(
          data.error || `Could not start a new round (${res.status}).`
        );
        return;
      }
    } catch (error) {
      console.error("Error starting new game:", error);
      const isNetwork =
        error instanceof TypeError &&
        String((error as Error).message).includes("fetch");
      showErrorToast(
        isNetwork
          ? "Network error — check your connection and try again."
          : "Failed to start new game. Please try again."
      );
    } finally {
      setIsStartingNewGame(false);
    }
  }

  async function toggleHints() {
    setIsTogglingHints(true);
    try {
      const res = await fetch("/api/room/toggle-hints", {
        method: "POST",
        body: JSON.stringify({ roomId, playerId }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Failed to toggle hints: " + data.error);
      }
    } catch (error) {
      console.error("Error toggling hints:", error);
      showErrorToast("Failed to toggle hints. Please try again.");
    } finally {
      setIsTogglingHints(false);
    }
  }

  async function kickPlayer(playerIdToKick: string, playerName: string) {
    const confirmed = await openModal({
      title: "Kick Player",
      message: `Are you sure you want to kick ${playerName} from the room? This action cannot be undone.`,
      confirmText: "Kick Player",
      cancelText: "Cancel",
      type: "warning",
    });

    if (confirmed) {
      try {
        const res = await fetch("/api/room/kick", {
          method: "POST",
          body: JSON.stringify({
            roomId,
            kickerId: playerId,
            targetPlayerId: playerIdToKick,
          }),
        });
        const data = await res.json();

        if (data.ok) {
          showSuccessToast(`${playerName} has been kicked from the room`);
        } else {
          showErrorToast(
            "Failed to kick player: " + (data.error || "Unknown error")
          );
        }
      } catch (error) {
        console.error("Error kicking player:", error);
        showErrorToast("Failed to kick player. Please try again.");
      }
    }
  }

  // Styles to match the home page, but with white text
  const card = "glass p-6 rounded-[2.5rem] grid gap-5 relative overflow-hidden";
  const chip = "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/80 shadow-sm transition-all hover:bg-white/10";
  const btn = "w-full py-4 rounded-2xl font-heading font-extrabold text-lg tracking-widest shadow-xl transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2";
  const btnStart = btn + " bg-gradient-to-br from-orange-600 to-red-600 shadow-orange-900/20 hover:shadow-orange-600/30";
  const btnEnd = btn + " bg-gradient-to-br from-red-600 to-pink-700 shadow-red-900/20 hover:shadow-red-600/30";
  const btnNew = btn + " bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-900/20 hover:shadow-blue-600/30";

  const isMobile = useIsMobile();
  const [isRevealed, setIsRevealed] = useState(false);

  // Memoize image sources to prevent reloading on state changes
  const myPlayerName = useMemo(() => {
    const player = players.find((p) => p.id === playerId);
    return player?.name || "Player";
  }, [players, playerId]);

  const myAvatarSrc = useMemo(() => {
    const player = players.find((p) => p.id === playerId);
    return player?.avatarFull || player?.avatar || playerIcon.src;
  }, [players, playerId]);

  const playerAvatarSrcs = useMemo(() => {
    return players.map((p) => ({
      id: p.id,
      src: p.avatar || playerIcon.src,
    }));
  }, [players]);

  // Memoize static image sources to prevent unnecessary re-renders
  const staticImages = useMemo(
    () => ({
      key: key.src,
      leave: leave.src,
      playersIcon: playersIcon.src,
      create: create.src,
      player: playerIcon.src,
      detective: detective.src,
    }),
    []
  );

  return (
    <div className="relative min-h-full w-full max-w-7xl mx-auto px-6 py-6 md:py-12 flex flex-col gap-8">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="font-heading font-black text-2xl tracking-tighter text-white">ROOM TERMINAL</h1>
          </div>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Sector: {roomId}</p>
        </div>

        <div className="flex items-center gap-4">
           {/* Room Code with copy functionality */}
           <button 
             onClick={() => {
               navigator.clipboard.writeText(roomId);
               toast.success("Room code copied!", { icon: false });
             }}
             className="flex items-center gap-4 rounded-2xl bg-white/5 border border-white/10 px-6 py-3 transition-all hover:bg-white/10 group active:scale-95 shadow-lg"
           >
              <Image src={staticImages.key} alt="Room" className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" width={20} height={20} />
              <span className="tracking-[0.25em] font-heading font-black text-xl text-white">
                {roomId}
              </span>
           </button>

           <button
            type="button"
            className="group flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-3 transition-all hover:bg-red-500/20 hover:border-red-500/40 hover:scale-105 active:scale-95 shadow-lg"
            onClick={async () => {
              const confirmed = await openModal({
                title: "Leave Room",
                message: "Are you sure you want to leave? Your progress in this room will be lost.",
                confirmText: "Leave Room",
                cancelText: "Stay",
                type: "warning",
              });

              if (confirmed) {
                try {
                  const currentPlayerId = playerId || sessionStorage.getItem("playerId");
                  const res = await fetch("/api/room/leave", {
                    method: "POST",
                    body: JSON.stringify({ roomId, playerId: currentPlayerId }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    removePlayerId();
                    window.location.href = "/";
                  }
                } catch (error) {
                  toast.error("Failed to leave room.", { icon: false });
                }
              }
            }}
          >
            <Image src={staticImages.leave} alt="Leave" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" width={20} height={20} />
            <span className="font-heading font-bold text-sm text-white/80 group-hover:text-white">Exit</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: The Circle */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass p-8 rounded-[3rem] relative overflow-hidden flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/20 shadow-inner">
                  <Image src={staticImages.playersIcon} alt="Players" width={20} height={20} className="opacity-80" />
                </div>
                <h3 className="text-white font-heading font-black text-lg tracking-tight uppercase">The Circle</h3>
              </div>
              <div className="text-[10px] font-black tracking-widest text-white/40 uppercase">
                {players.length} Agents
              </div>
            </div>

            {isLoadingRoom ? (
               <div className="flex flex-col items-center justify-center gap-3 py-10 opacity-40">
                 <Loader size="md" />
                 <span className="text-[10px] uppercase tracking-widest">Syncing Identity...</span>
               </div>
            ) : (
              <ul className="flex flex-col gap-3">
                <AnimatePresence>
                  {players.map((p: any, idx: number) => (
                    <motion.li
                      key={p.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        p.id === playerId 
                          ? "bg-white/10 border-white/20 shadow-lg" 
                          : "bg-white/5 border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Image
                            src={playerAvatarSrcs.find(a => a.id === p.id)?.src || playerIcon.src}
                            alt={p.name}
                            width={36}
                            height={36}
                            className={`rounded-xl border ${p.id === playerId ? "border-yellow-400" : "border-white/10"}`}
                          />
                          {idx === 0 && <span className="absolute -top-1.5 -left-1.5 text-[10px]">👑</span>}
                        </div>
                        <div className="flex flex-col">
                          <span className={`text-sm font-bold truncate max-w-[120px] ${p.id === playerId ? "text-yellow-400" : "text-white"}`}>
                            {p.name}
                          </span>
                          {p.id === playerId && <span className="text-[8px] font-black uppercase text-white/40">You</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-black/20">
                         <span className="text-[10px] font-heading font-black text-orange-400">{p.impostorCount || 0}</span>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </aside>

        {/* Main Interface */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          <AnimatePresence mode="wait">
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col gap-6"
            >
              {/* Lobby Phase Dashboard */}
              {phase === "lobby" && (
                <div className="glass p-10 rounded-[3rem] flex flex-col gap-8 relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-teal-500/20 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                      <Image src={staticImages.create} alt="Start" className="w-8 h-8" width={32} height={32} />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="text-2xl font-heading font-black tracking-tight text-white uppercase">Lobby Status: Open</h2>
                      <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Sector Synchronization in Progress</span>
                    </div>
                  </div>

                  <p className="text-white/60 text-base leading-relaxed max-w-xl">
                    The protocol requires a minimum of <span className="font-black text-yellow-400">3 agents</span> to initialize. 
                    Ensure all tactical communication is conducted in person or via secure voice frequency.
                  </p>

                  <div className="flex flex-col gap-6 p-6 rounded-3xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-white text-sm font-black tracking-widest uppercase">Ghost hints</span>
                        <span className="text-white/40 text-xs">Gives the impostor an extra clue to blend in</span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setShowHints(prev => !prev);
                          try { await toggleHints(); } catch { setShowHints(prev => !prev); }
                        }}
                        disabled={!isOwner || isTogglingHints}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 ${
                          showHints ? "bg-orange-600" : "bg-white/10"
                        } ${!isOwner ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${showHints ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                  </div>

                  {isOwner && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={btnStart + " py-6 text-xl"}
                      onClick={startGame}
                      disabled={players.length < 3 || isStartingGame}
                      type="button"
                    >
                      {isStartingGame ? <Loader size="sm" /> : "INITIALIZE ROUND"}
                    </motion.button>
                  )}
                </div>
              )}

              {/* Round Phase: Adaptive Interaction */}
              {phase === "round" && (
                <>
                  {isMobile ? (
                    <MobileOverlayCard
                      isVisible={true}
                      avatarSrc={myAvatarSrc}
                      playerName={myPlayerName}
                      myRole={myRole}
                      myWord={myWord}
                      myHint={myHint}
                      showHints={showHints}
                      isOwner={isOwner}
                      isEndingGame={isEndingGame}
                      endRound={endRound}
                      isLoadingGameData={isLoadingGameData}
                    />
                  ) : (
                    <div className="flex flex-col gap-8 items-center justify-center min-h-[400px]">
                      <h2 className="text-white/40 text-xs font-black uppercase tracking-[0.5em] mb-4">Transmission Reveal</h2>
                      
                      <motion.div 
                        onClick={() => setIsRevealed(!isRevealed)}
                        className="relative w-full max-w-md aspect-[4/5] perspective-1000 cursor-pointer group"
                      >
                        <motion.div 
                          className="relative w-full h-full transform-style-3d transition-transform duration-700"
                          animate={{ rotateY: isRevealed ? 180 : 0 }}
                        >
                          {/* Front: Privacy Shield */}
                          <div className="absolute inset-0 backface-hidden glass rounded-[3rem] border-2 border-white/20 flex flex-col items-center justify-center p-12 text-center group-hover:border-white/40 transition-colors">
                            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-inner">
                               <Image src={staticImages.key} alt="Secure" width={40} height={40} className="opacity-30 group-hover:opacity-100 transition-all group-hover:scale-110 duration-500" />
                            </div>
                            <h3 className="text-white font-heading font-black text-2xl tracking-tighter mb-2">IDENTITY SHIELDED</h3>
                            <p className="text-white/40 text-sm font-medium">Click or hover to reveal your tactical objective.</p>
                            
                            <div className="mt-8 flex gap-1">
                              {[1,2,3].map(i => (
                                <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500/40 animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />
                              ))}
                            </div>
                          </div>

                          {/* Back: The Reveal */}
                          <div className="absolute inset-0 backface-hidden glass rounded-[3rem] border-2 border-orange-500/50 flex flex-col items-center justify-center p-12 text-center [transform:rotateY(180deg)] bg-gradient-to-br from-orange-600/20 to-transparent">
                            <span className="text-orange-400 text-xs font-black uppercase tracking-[0.4em] mb-4">
                              {myRole === "impostor" ? "Infiltrator Identified" : "Crew"}
                            </span>
                            
                            <div className="flex flex-col gap-2">
                              <h3 className={`text-4xl md:text-5xl font-heading font-black tracking-tight drop-shadow-2xl ${myRole === "impostor" ? "text-red-500" : "text-white"}`}>
                                {myRole === "impostor" ? "IMPOSTOR" : (myWord || "LOADING...")}
                              </h3>
                              {myRole === "impostor" && showHints && myHint && (
                                <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 italic text-white/80">
                                   "Hint: {myHint}"
                                </div>
                              )}
                            </div>

                          </div>
                        </motion.div>
                      </motion.div>

                      {isOwner && (
                        <button
                          className={btnEnd + " max-w-xs mt-8"}
                          onClick={endRound}
                          disabled={isEndingGame}
                          type="button"
                        >
                          {isEndingGame ? <Loader size="sm" /> : "TERMINATE ROUND"}
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* End Phase */}
              {phase === "end" && (
                <div className="glass p-12 rounded-[3rem] text-center flex flex-col items-center gap-6 border-orange-500/20">
                  <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mb-2">
                     <span className="text-4xl">🏁</span>
                  </div>
                  <h2 className="text-4xl font-heading font-black tracking-tighter text-white">ROUND CONCLUDED</h2>
                  <p className="text-white/60 text-lg max-w-md">The circle has spoken. Analyze the results and prepare for the next deployment.</p>
                  
                  {isOwner ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={btnNew + " max-w-sm py-5 mt-4"}
                      onClick={newGame}
                      disabled={isStartingNewGame}
                      type="button"
                    >
                      {isStartingNewGame ? <Loader size="sm" /> : "START NEW DEPLOYMENT"}
                    </motion.button>
                  ) : (
                    <div className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-sm font-bold uppercase tracking-widest shadow-inner">
                      Awaiting New Round Initialization...
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

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
