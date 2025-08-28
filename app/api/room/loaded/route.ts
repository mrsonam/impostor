import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId, playerId } = await req.json();
    if (!roomId || !playerId) {
      return NextResponse.json({ error: "Missing roomId or playerId" }, { status: 400 });
    }
    
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      console.log("Room not found", roomId);
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    // Update last activity when room is loaded
    await firebaseStore.updateLastActivity(roomId);
    
    // Optionally, you could check if the room exists, but just trigger for now
    await pusherServer.trigger(`room-${roomId}`, "room-loaded", {
      players: room.players,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error loading room:", error);
    return NextResponse.json({ error: "Failed to load room" }, { status: 500 });
  }
}
