import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { name, avatar, avatarFull } = await req.json();
  if (!name)
    return NextResponse.json({ error: "Missing name" }, { status: 400 });
  const { room, player } = memory.createRoom(name, avatar, avatarFull);
  await pusherServer.trigger(`room-${room.id}`, "player-joined", {
    players: room.players,
  });
  
  return NextResponse.json({ roomId: room.id, playerId: player.id });
}
