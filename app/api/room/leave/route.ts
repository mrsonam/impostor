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
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Remove player from room
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return NextResponse.json({ error: "Player not in room" }, { status: 404 });
    }

    const removedPlayer = room.players[playerIndex];
    
    // Use Firebase store to handle player leaving
    const updatedRoom = await firebaseStore.leaveRoom(roomId, playerId);
    
    if (!updatedRoom) {
      // Room was deleted (no players left)
      await pusherServer.trigger(`room-${roomId}`, "room-deleted", {});
      return NextResponse.json({ ok: true, roomDeleted: true });
    }

    // If the leaving player was the owner, assign ownership to the next player
    if (room.ownerId === playerId) {
      await firebaseStore.updateRoom(roomId, { ownerId: updatedRoom.players[0].id });
      updatedRoom.ownerId = updatedRoom.players[0].id;
    }

    // Notify other players about the leave
    await pusherServer.trigger(`room-${roomId}`, "player-left", {
      playerId: playerId,
      playerName: removedPlayer.name,
      players: updatedRoom.players,
      newOwnerId: updatedRoom.ownerId,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Error leaving room:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
