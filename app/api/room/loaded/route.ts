import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = await req.json();
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Missing roomId or playerId" }, { status: 400 });
  }
  const room = memory.getRoom(roomId)!;
  if (!room) {
    console.log("Room not found", roomId);
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }
  // Optionally, you could check if the room exists, but just trigger for now
  await pusherServer.trigger(`room-${roomId}`, "room-loaded", {
    players: room.players,
  });

  return NextResponse.json({ ok: true });
}
