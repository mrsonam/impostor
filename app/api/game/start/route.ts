import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { WORDS } from "@/lib/words";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (!roomId)
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    
    const game = await firebaseStore.startGame(roomId, (players) => {
      const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
      const impostor = players[Math.floor(Math.random() * players.length)].id;
      return { word: entry.word, hint: entry.hint, impostorId: impostor };
    });
    
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    await pusherServer.trigger(`room-${roomId}`, "game-started", {
      gameId: game.id,
      players: room.players,
    });
    
    return NextResponse.json({ gameId: game.id });
  } catch (e: any) {
    console.error("Error starting game:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
