import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { WORDS } from "@/lib/words";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId } = await req.json();
  if (!roomId)
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  try {
    const game = memory.newGame(roomId, (players) => {
      const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
      const impostor = players[Math.floor(Math.random() * players.length)].id;
      return { word: entry.word, hint: entry.hint, impostorId: impostor };
    });
    const room = memory.getRoom(roomId)!;
    await pusherServer.trigger(`room-${roomId}`, "game-started", {
      gameId: game.id,
      players: room.players,
    });
    return NextResponse.json({ ok: true, gameId: game.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
