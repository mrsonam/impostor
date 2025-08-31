import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = await req.json();
  
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Missing roomId or playerId" }, { status: 400 });
  }
  
  try {
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    // Only the owner can toggle hints
    if (room.ownerId !== playerId) {
      return NextResponse.json({ error: "Only the room owner can toggle hints" }, { status: 403 });
    }
    
    const newHintsState = await firebaseStore.toggleHints(roomId);
    
    // Notify all players in the room about the hint setting change
    await pusherServer.trigger(`room-${roomId}`, "hints-toggled", {
      showHints: newHintsState,
      toggledBy: playerId
    });
    
    return NextResponse.json({ 
      ok: true, 
      showHints: newHintsState 
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
