import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (!roomId)
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    
    const game = await firebaseStore.endRound(roomId);
    await pusherServer.trigger(`room-${roomId}`, "game-ended", {
      gameId: game.id,
    });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error ending game:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
