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
import { CloseButtonProps, ToastContainer, toast } from "react-toastify";
import { showErrorToast, showSuccessToast } from "@/lib/toast-utils";
import { useConfirmationModal } from "@/lib/useConfirmationModal";
import ConfirmationModal from "@/components/ConfirmationModal";

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

  // Overlay state
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayY, setOverlayY] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  // Helper: is this player the room creator?
  const isOwner = ownerId && playerId && ownerId === playerId;

  // Overlay handlers
  function clampOverlayY(y: number) {
    // Only allow upward swipe (negative y), max -50% of window height, min 0 (no downward movement)
    const maxUp = -window.innerHeight * 0.4;
    return Math.max(maxUp, Math.min(0, y));
  }

  function handleOverlayTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 1) {
      draggingRef.current = true;
      startYRef.current = e.touches[0].clientY;
    }
  }
  function handleOverlayTouchMove(e: React.TouchEvent) {
    if (!draggingRef.current || startYRef.current === null) return;
    const deltaY = e.touches[0].clientY - startYRef.current;
    setOverlayY(clampOverlayY(deltaY));
  }
  function handleOverlayTouchEnd() {
    draggingRef.current = false;
    // Always reset to exactly 0, never allow positive overlayY
    setOverlayY(0);
  }
  function handleOverlayMouseDown(e: React.MouseEvent) {
    draggingRef.current = true;
    startYRef.current = e.clientY;
    window.addEventListener("mousemove", handleOverlayMouseMove);
    window.addEventListener("mouseup", handleOverlayMouseUp);
  }
  function handleOverlayMouseMove(e: MouseEvent) {
    if (!draggingRef.current || startYRef.current === null) return;
    const deltaY = e.clientY - startYRef.current;
    // Only allow upward swipe (negative deltaY), max -25% of window height, min 0 (no downward movement)
    const maxUp = -window.innerHeight * 0.4;
    const newY = Math.max(maxUp, Math.min(0, deltaY));
    setOverlayY(newY);
  }
  function handleOverlayMouseUp() {
    draggingRef.current = false;
    // Always reset to exactly 0, never allow positive overlayY
    setOverlayY(0);
    window.removeEventListener("mousemove", handleOverlayMouseMove);
    window.removeEventListener("mouseup", handleOverlayMouseUp);
  }

  // Prevent overlayY from ever being positive (below the bottom) even if set programmatically
  useEffect(() => {
    if (overlayY > 0) setOverlayY(0);
  }, [overlayY]);

  // When overlay is shown, reset to 0
  useEffect(() => {
    if (showOverlay) {
      setOverlayY(0);
    }
  }, [showOverlay]);

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
          toast(`${latestPlayer.name} joined the room`, { toastId });
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
            // Only show overlay if there's an active game
            setShowOverlay(data.phase === "round" && data.game?.hasActiveGame);
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
      });
      setPlayers(payload.players);
      if (payload.players && payload.players.length > 0) {
        setOwnerId(payload.players[0].id);
      }
      setPhase("round");
      setShowOverlay(true); // Show overlay on game start

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
      toast("Game ended! Ready for the next round?", { toastId: "end" });
      setPhase("end");
      setShowOverlay(false); // Hide overlay on end round
    }
    if (type === "hints-toggled") {
      setShowHints(payload.showHints);
      toast(
        `Hints ${payload.showHints ? "enabled" : "disabled"} for impostors`,
        {
          toastId: "hints-toggled",
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
            setShowOverlay(true);
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
          // Only show overlay if there's an active game
          setShowOverlay(data.phase === "round" && data.game?.hasActiveGame);
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
        setShowOverlay(true);
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
        setShowOverlay(false); // Hide overlay on end round
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
        body: JSON.stringify({ roomId }),
      });
      const data = await res.json();
      if (data.error) {
        showErrorToast("Failed to start new game: " + data.error);
      }
    } catch (error) {
      console.error("Error starting new game:", error);
      showErrorToast("Failed to start new game. Please try again.");
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
  const card =
    "rounded-lg border border-white/30 p-5 grid gap-4 bg-white/10 shadow-lg";
  const chip =
    "inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/20 px-3 py-1 text-sm text-white";
  const btn =
    "w-full py-2 rounded bg-gradient-to-r font-bold text-lg tracking-wide shadow-md transition-all disabled:opacity-40 mt-2 text-white";
  const btnStart =
    btn +
    " from-sky-500/80 to-yellow-400/80 hover:from-sky-400/90 hover:to-yellow-300/90";
  const btnEnd =
    btn +
    " from-yellow-500/80 to-pink-400/80 hover:from-yellow-400/90 hover:to-pink-300/90";
  const btnNew =
    btn +
    " from-violet-500/80 to-blue-400/80 hover:from-violet-400/90 hover:to-blue-300/90";

  // --- NEW: End Round button for overlay, only visible in round phase and owner ---
  const showOverlayEndRoundButton = showOverlay && phase === "round" && isOwner;

  // Get the current player's name in all caps for overlay
  const myPlayer = players.find((p) => p.id === playerId);
  const myPlayerNameCaps = myPlayer?.name
    ? String(myPlayer.name).toUpperCase()
    : "";

  // Memoize image sources to prevent reloading on state changes
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
    <main className="grid gap-4">
      {/* Overlay image for swipe up */}
      {showOverlay && (
        <div
          ref={overlayRef}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 1000,
            background: "rgba(0,0,0,0.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "none",
            transition: draggingRef.current
              ? "none"
              : "transform 0.3s cubic-bezier(.4,2,.6,1)",
            // Prevent overlay from ever going below the bottom (no positive overlayY)
            transform: `translateY(${Math.min(0, overlayY)}px)`,
            userSelect: "none",
            overflow: "hidden",
          }}
          onTouchStart={handleOverlayTouchStart}
          onTouchMove={handleOverlayTouchMove}
          onTouchEnd={handleOverlayTouchEnd}
          onMouseDown={handleOverlayMouseDown}
        >
          {/* Player name in all caps at the top of the image */}
          {myPlayerNameCaps && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100vw",
                zIndex: 11,
                display: "flex",
                justifyContent: "center",
                alignItems: "flex-start",
                pointerEvents: "none",
                paddingTop: "18px",
              }}
            >
              <span
                style={{
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "2.1rem",
                  letterSpacing: "0.12em",
                  textShadow: "0 2px 16px rgba(0,0,0,0.45)",
                  //   background: "rgba(0,0,0,0.18)",
                  borderRadius: "12px",
                  padding: "0.25em 1.2em",
                  maxWidth: "90vw",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  fontFamily: "inherit",
                  userSelect: "none",
                }}
              >
                {myPlayerNameCaps}
              </span>
            </div>
          )}
          <Image
            src={myAvatarSrc}
            alt="Swipe up"
            fill
            style={{
              objectFit: "cover",
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 1,
              pointerEvents: "none",
              userSelect: "none",
            }}
            priority
            sizes="100vw"
            draggable={false}
          />
          {/* End Round button on top of overlay image */}
          {showOverlayEndRoundButton && (
            <div
              style={{
                position: "absolute",
                bottom: 130,
                left: 0,
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                zIndex: 10,
                pointerEvents: "auto",
              }}
            >
              <button
                className="px-6 py-2 rounded bg-red-600 text-white font-bold shadow-lg text-base disabled:opacity-50"
                style={{
                  pointerEvents: "auto",
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
                }}
                onClick={endRound}
                disabled={isEndingGame}
                type="button"
              >
                {isEndingGame ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader size="sm" />
                    <span>Ending...</span>
                  </div>
                ) : (
                  "End Round"
                )}
              </button>
            </div>
          )}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              pointerEvents: "none",
              paddingBottom: "100px",
            }}
          >
            <div
              style={{
                width: 44,
                height: 4,
                background: "#e2e8f0",
                borderRadius: 4,
                margin: "0 auto",
                pointerEvents: "auto",
                cursor: "grab",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
              }}
            />
            {/* <div
              style={{
                borderRadius: 18,
                padding: "1rem 1.5rem",
                maxWidth: 340,
                width: "90vw",
                textAlign: "center",
                margin: "0 auto",
                pointerEvents: "auto",
              }}
            >
              <p style={{ color: "#fff", fontSize: 17, marginBottom: 1 }}>
                Swipe up to peek, then release to return to original position.
              </p>
            </div> */}
          </div>
        </div>
      )}

      {/* Room info card */}
      <div className={card}>
        <div className="flex items-center justify-between mb-2">
          <span className={chip}>
            <Image
              src={staticImages.key}
              alt="Room"
              className="inline w-5 h-5 mr-1"
              width={20}
              height={20}
            />
            <span className="tracking-widest font-mono text-base text-white">
              {roomId}
            </span>
          </span>
          <span className={chip}>
            <Image
              src={staticImages.leave}
              alt="Leave"
              className="inline w-5 h-5 mr-1"
              width={20}
              height={20}
            />
            <button
              type="button"
              className="flex items-center gap-1 px-[1px] py-1 transition-colors cursor-pointer"
              title="Leave room"
              style={{ pointerEvents: "auto" }}
              onClick={async () => {
                const confirmed = await openModal({
                  title: "Leave Room",
                  message:
                    "Are you sure you want to leave this room? You will need to rejoin if you want to play again.",
                  confirmText: "Leave Room",
                  cancelText: "Stay",
                  type: "warning",
                });

                if (confirmed) {
                  try {
                    const res = await fetch("/api/room/leave", {
                      method: "POST",
                      body: JSON.stringify({ roomId, playerId }),
                    });
                    const data = await res.json();
                    if (data.ok) {
                      // Clear session storage and redirect
                      removePlayerId();
                      window.location.href = "/";
                    } else {
                      toast.error(
                        "Failed to leave room: " +
                          (data.error || "Unknown error")
                      );
                    }
                  } catch (error) {
                    console.error("Error leaving room:", error);
                    toast.error("Failed to leave room. Please try again.");
                  }
                }
              }}
            >
              <span className="font-semibold text-white">Leave</span>
              {/* <span className="ml-1 text-xs text-white/60">(Leave)</span> */}
            </button>
          </span>
        </div>
        {/* Hint toggle for owner */}
        {isOwner && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/5 border border-white/20 mb-4">
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">
                Show hints for impostors
              </span>
              <span className="text-white/60 text-xs">
                (Helps impostors blend in)
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                // Optimistically update UI
                setShowHints((prev: boolean) => !prev);
                try {
                  await toggleHints();
                } catch (e) {
                  // Revert if failed
                  setShowHints((prev: boolean) => !prev);
                }
              }}
              disabled={isTogglingHints}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                showHints ? "bg-blue-500" : "bg-gray-400"
              } ${isTogglingHints ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ flexShrink: 0 }}
              aria-label="Toggle hints for impostors"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showHints ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}
        {/* Hide player list when game is ongoing (phase === "round") */}
        {phase !== "round" && (
          <div>
            <h3 className="text-white text-lg font-bold mb-2 flex items-center gap-2">
              <Image
                src={staticImages.playersIcon}
                alt="Players"
                className="inline w-6 h-6"
                width={24}
                height={24}
              />
              Players
              {isLoadingRoom && (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <span className="text-white/60 text-sm">Loading...</span>
                </div>
              )}
            </h3>
            <ul className="grid gap-2">
              {players.map((p: any, idx: number) => (
                <li
                  key={`${p.id}-${p.avatar}-${p.impostorCount}`}
                  className="flex items-center justify-between rounded-xl bg-white/10 border border-white/40 px-3 py-2"
                >
                  <span className="text-white font-semibold flex items-center gap-2">
                    <Image
                      src={
                        playerAvatarSrcs.find((avatar) => avatar.id === p.id)
                          ?.src || playerIcon.src
                      }
                      alt={p.name}
                      className="inline w-5 h-5 rounded-full"
                      width={20}
                      height={20}
                    />
                    {p.name}
                    {idx === 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-yellow-400/30 text-yellow-200 text-xs font-bold">
                        Creator
                      </span>
                    )}
                  </span>

                  <span className="text-white/70 text-xs font-mono">
                    {isOwner && p.id !== playerId && (
                      <button
                        onClick={() => kickPlayer(p.id, p.name)}
                        className="mr-10 px-2 py-1 text-xs text-white rounded transition-colors "
                        title={`Kick ${p.name} from the room`}
                        type="button"
                      >
                        <img
                          src={kick.src}
                          alt={"Detective"}
                          className="inline w-5 h-5 rounded-full"
                        />{" "}
                      </button>
                    )}
                    {p.id === playerId ? (
                      <>
                        <span className="font-bold text-yellow-300 mr-2">
                          You
                        </span>
                        <span className="text-orange-300 font-semibold">
                          <img
                            src={detective.src}
                            alt={"Detective"}
                            className="inline w-5 h-5 rounded-full"
                          />{" "}
                          {p.impostorCount || 0}
                        </span>
                      </>
                    ) : (
                      <span className="text-orange-300 font-semibold">
                        <img
                          src={detective.src}
                          alt={"Detective"}
                          className="inline w-5 h-5 rounded-full"
                        />{" "}
                        {p.impostorCount || 0}
                      </span>
                    )}
                  </span>
                  {/* Kick button for room owner (not visible for the owner themselves) */}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lobby phase */}
      {phase === "lobby" && (
        <div className={card + " bg-teal-100/10"}>
          <div className="flex items-center gap-2 mb-2">
            <Image
              src={staticImages.create}
              alt="Start"
              className="inline w-6 h-6"
              width={24}
              height={24}
            />
            <span className="text-white text-base font-semibold">
              {isLoadingRoom ? (
                <div className="flex items-center gap-2">
                  <Loader size="sm" />
                  <span>Loading room...</span>
                </div>
              ) : (
                "Waiting for players..."
              )}
            </span>
          </div>
          <p className="text-white/80 text-sm mb-2">
            At least <span className="font-bold text-white">3 players</span>{" "}
            required. Voting is done in person.
          </p>
          {isOwner && (
            <button
              className={btnStart}
              onClick={startGame}
              disabled={players.length < 3 || isStartingGame}
              type="button"
              title={
                players.length < 3 ? "At least 3 players required" : undefined
              }
            >
              {isStartingGame ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader size="sm" />
                  <span>Starting...</span>
                </div>
              ) : (
                "Start Game"
              )}
            </button>
          )}
        </div>
      )}

      {/* Round phase */}
      {/* Place this at the bottom of the screen so it is visible when the overlay image is swiped up */}
      {phase === "round" && (
        <div
          className="fixed bottom-0 left-0 w-full z-30 flex flex-col items-center justify-center py-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
          style={{
            minHeight: "22vh",
            pointerEvents: "none", // so overlay can be swiped
          }}
        >
          <div className="mb-2 text-white/80 text-lg font-semibold uppercase tracking-widest">
            {myRole === "impostor" ? "You are the Impostor" : "Your Word"}
          </div>
          <div
            className={`${
              myRole === "impostor" ? "text-red-400" : "text-[#FDF0D5]"
            } font-extrabold text-3xl sm:text-5xl text-center drop-shadow-lg select-none`}
            style={{
              letterSpacing: "0.08em",
              textShadow: "0 2px 12px rgba(0,0,0,0.25)",
              pointerEvents: "auto",
            }}
          >
            {myRole === "impostor"
              ? showHints && myHint
                ? `Hint: ${myHint}`
                : showHints
                ? "No hint available"
                : "Hints disabled"
              : myWord ||
                (isLoadingGameData ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader size="lg" />
                    <span className="text-2xl">Loading word...</span>
                  </div>
                ) : (
                  "Word not loaded"
                ))}
          </div>
          {/* Remove End Round button from here, now on overlay */}
        </div>
      )}

      {/* End phase */}
      {phase === "end" &&
        (isOwner ? (
          <div className={card + " bg-sky-100/10 text-center"}>
            <h2 className="text-xl font-extrabold text-white mb-2">
              Round Over
            </h2>
            <p className="text-white/80 text-sm mb-2">
              Start a new game to rotate the impostor and word.
            </p>
            <button
              className={btnNew}
              onClick={newGame}
              disabled={isStartingNewGame}
              type="button"
            >
              {isStartingNewGame ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader size="sm" />
                  <span>Starting...</span>
                </div>
              ) : (
                "New Game"
              )}
            </button>
          </div>
        ) : (
          <div className={card + " bg-teal-100/10"}>
            <div className="flex items-center gap-2 mb-2">
              <Image
                src={staticImages.create}
                alt="Start"
                className="inline w-6 h-6"
                width={24}
                height={24}
              />
              <span className="text-white text-base font-semibold">
                Waiting for players...
              </span>
            </div>
            <p className="text-white/80 text-sm mb-2">
              At least <span className="font-bold text-white">3 players</span>{" "}
              required. Voting is done in person.
            </p>
          </div>
        ))}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmationModal
          isOpen={isOpen}
          onClose={closeModal}
          onConfirm={handleConfirm}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          cancelText={modalConfig.cancelText}
          type={modalConfig.type}
        />
      )}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          maxWidth: "100vw",
          zIndex: 9999,
          pointerEvents: "none",
        }}
      >
        <ToastContainer
          position="bottom-center"
          autoClose={2000}
          closeButton={({ closeToast }: CloseButtonProps) => {
            return <button onClick={closeToast} className="absolute"></button>;
          }}
          hideProgressBar
          newestOnTop
          closeOnClick
          rtl={false}
          draggable
          toastClassName={() =>
            "rounded-lg border border-white/30 p-5 grid gap-4 bg-white/10 shadow-lg m-2"
          }
          className={() => "text-white text-base"}
          toastStyle={
            {
              "--toastify-icon-color-error": "#ef4444",
            } as React.CSSProperties
          }
        />
      </div>
    </main>
  );
}
