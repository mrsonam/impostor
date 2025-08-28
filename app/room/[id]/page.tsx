"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import player from "@/app/assets/images/player.png";
import key from "@/app/assets/images/key.png";
import playersIcon from "@/app/assets/images/players.png";
import create from "@/app/assets/images/create.png";
import leave from "@/app/assets/images/leave.png";
import detective from "@/app/assets/images/detective.png";
import { CloseButtonProps, ToastContainer, toast } from "react-toastify";

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
  const playerId = useMemo(() => sessionStorage.getItem("playerId") || "", []);
  const [players, setPlayers] = useState<any[]>([]);
  const [phase, setPhase] = useState<"lobby" | "round" | "end">("lobby");
  const [myRole, setMyRole] = useState<null | "impostor" | "civilian">(null);
  const [myWord, setMyWord] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [myHint, setMyHint] = useState<string | null>(null);

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
      fetch("/api/room/loaded", {
        method: "POST",
        body: JSON.stringify({ roomId, playerId }),
      }).catch(() => {});
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
        sessionStorage.removeItem("playerId");
        sessionStorage.removeItem("playerName");
        sessionStorage.removeItem("playerAvatar");
        sessionStorage.removeItem("playerAvatarFull");
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
      fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
        .then((r) => r.json())
        .then((d) => {
          setMyRole(d.role);
          setMyWord(d.word);
          setMyHint(d.hint ?? null);
        });
    }
    if (type === "game-ended") {
      toast("Game ended! Ready for the next round?", { toastId: "end" });
      setPhase("end");
      setShowOverlay(false); // Hide overlay on end round
    }
  });

  useEffect(() => {
    fetch(`/api/game/private-view?roomId=${roomId}&playerId=${playerId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.role) {
          setPhase("round");
          setMyRole(d.role);
          setMyWord(d.word);
          setMyHint(d.hint ?? null);
        }
      });
  }, [roomId, playerId]);

  // On initial mount, fetch room info to get ownerId if not already set
  useEffect(() => {
    if (!ownerId) {
      fetch(`/api/room/loaded`, {
        method: "POST",
        body: JSON.stringify({ roomId, playerId }),
      })
        .then((r) => r.json())
        .then((d) => {
          // d.players is returned by /api/room/loaded
          if (d.players && d.players.length > 0) {
            setOwnerId(d.players[0].id);
          }
        })
        .catch(() => {});
    }
  }, [roomId, playerId, ownerId]);

  async function startGame() {
    await fetch("/api/game/start", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
    setShowOverlay(true);
  }

  async function endRound() {
    await fetch("/api/game/end", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
    setShowOverlay(false); // Hide overlay on end round
  }

  async function newGame() {
    await fetch("/api/game/new", {
      method: "POST",
      body: JSON.stringify({ roomId }),
    });
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
            src={
              players.find((p) => p.id === playerId)?.avatarFull ||
              players.find((p) => p.id === playerId)?.avatar ||
              player.src
            }
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
                className="px-6 py-2 rounded bg-red-600 text-white font-bold shadow-lg text-base"
                style={{
                  pointerEvents: "auto",
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
                }}
                onClick={endRound}
                type="button"
              >
                End Round
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
            <Image src={key} alt="Room" className="inline w-5 h-5 mr-1" width={20} height={20} />
            <span className="tracking-widest font-mono text-base text-white">
              {roomId}
            </span>
          </span>
          <span className={chip}>
            <Image src={leave} alt="Leave" className="inline w-5 h-5 mr-1" width={20} height={20} />
            <button
              type="button"
              className="flex items-center gap-1 px-[1px] py-1 transition-colors cursor-pointer"
              title="Leave room"
              style={{ pointerEvents: "auto" }}
              onClick={async () => {
                if (window.confirm("Leave the room?")) {
                  try {
                    const res = await fetch("/api/room/leave", {
                      method: "POST",
                      body: JSON.stringify({ roomId, playerId }),
                    });
                    const data = await res.json();
                    if (data.ok) {
                      // Clear session storage and redirect
                      sessionStorage.removeItem("playerId");
                      sessionStorage.removeItem("playerName");
                      sessionStorage.removeItem("playerAvatar");
                      sessionStorage.removeItem("playerAvatarFull");
                      window.location.href = "/";
                    } else {
                      alert(
                        "Failed to leave room: " +
                          (data.error || "Unknown error")
                      );
                    }
                  } catch (error) {
                    console.error("Error leaving room:", error);
                    alert("Failed to leave room. Please try again.");
                  }
                }
              }}
            >
              <span className="font-semibold text-white">Leave</span>
              {/* <span className="ml-1 text-xs text-white/60">(Leave)</span> */}
            </button>
          </span>
        </div>
        {/* Hide player list when game is ongoing (phase === "round") */}
        {phase !== "round" && (
          <div>
            <h3 className="text-white text-lg font-bold mb-2 flex items-center gap-2">
              <Image
                src={playersIcon}
                alt="Players"
                className="inline w-6 h-6"
                width={24}
                height={24}
              />
              Players
            </h3>
            <ul className="grid gap-2">
              {players.map((p: any, idx: number) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-white/10 border border-white/40 px-3 py-2"
                >
                  <span className="text-white font-semibold flex items-center gap-2">
                    <Image
                      src={p.avatar || player.src}
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
                    {p.id === playerId ? (
                      <>
                        <span className="font-bold text-yellow-300 mr-2">You</span>
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
            <Image src={create} alt="Start" className="inline w-6 h-6" width={24} height={24} />
            <span className="text-white text-base font-semibold">
              Waiting for players...
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
              disabled={players.length < 3}
              type="button"
              title={
                players.length < 3 ? "At least 3 players required" : undefined
              }
            >
              Start Game
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
              ? myHint
                ? `Hint: ${myHint}`
                : "No hint"
              : myWord}
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
            <button className={btnNew} onClick={newGame} type="button">
              New Game
            </button>
          </div>
        ) : (
          <div className={card + " bg-teal-100/10"}>
            <div className="flex items-center gap-2 mb-2">
              <img src={create.src} alt="Start" className="inline w-6 h-6" />
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
        />
      </div>
    </main>
  );
}
