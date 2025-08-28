import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId, playerId, text } = await req.json();
  if (!roomId || !playerId || !text)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    const clue = memory.submitClue(roomId, playerId, text);
    await pusherServer.trigger(`room-${roomId}`, "clue", clue);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
