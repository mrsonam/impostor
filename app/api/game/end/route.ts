import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId } = await req.json();
  if (!roomId)
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  try {
    const game = memory.endRound(roomId);
    await pusherServer.trigger(`room-${roomId}`, "game-ended", {
      gameId: game.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
