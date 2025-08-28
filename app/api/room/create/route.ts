import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { name, avatar, avatarFull } = await req.json();
    if (!name)
      return NextResponse.json({ error: "Missing name" }, { status: 400 });
    
    const { room, player } = await firebaseStore.createRoom(name, avatar, avatarFull);
    
    await pusherServer.trigger(`room-${room.id}`, "player-joined", {
      players: room.players,
    });
    
    return NextResponse.json({ roomId: room.id, playerId: player.id });
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
