import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId, name, avatar, avatarFull } = await req.json();
  if (!roomId || !name)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  try {
    const { room, player } = memory.joinRoom(roomId, name, avatar, avatarFull);
    console.log("player-joined", room, player);
    await pusherServer.trigger(`room-${room.id}`, "player-joined", {
      players: room.players,
    });
    return NextResponse.json({ playerId: player.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
