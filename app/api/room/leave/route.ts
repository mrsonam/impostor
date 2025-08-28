import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const { roomId, playerId } = await req.json();
  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Missing roomId or playerId" }, { status: 400 });
  }
  
  try {
    const room = memory.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Remove player from room
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return NextResponse.json({ error: "Player not in room" }, { status: 404 });
    }

    const removedPlayer = room.players[playerIndex];
    room.players.splice(playerIndex, 1);

    // If room is empty, delete it
    if (room.players.length === 0) {
      memory.rooms.delete(roomId);
      return NextResponse.json({ ok: true, roomDeleted: true });
    }

    // If the leaving player was the owner, assign ownership to the next player
    if (room.ownerId === playerId) {
      room.ownerId = room.players[0].id;
    }

    // Notify other players about the leave
    await pusherServer.trigger(`room-${roomId}`, "player-left", {
      playerId: playerId,
      playerName: removedPlayer.name,
      players: room.players,
      newOwnerId: room.ownerId,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
