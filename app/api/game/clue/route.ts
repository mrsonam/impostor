import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerId, text } = await req.json();
    if (!roomId || !playerId || !text)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    
    const clue = await firebaseStore.submitClue(roomId, playerId, text);
    await pusherServer.trigger(`room-${roomId}`, "clue", clue);
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error submitting clue:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
