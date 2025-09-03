import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId, kickerId, targetPlayerId } = await req.json();
    
    if (!roomId || !kickerId || !targetPlayerId) {
      return NextResponse.json({ 
        error: "Missing required fields: roomId, kickerId, targetPlayerId" 
      }, { status: 400 });
    }
    
    // Kick the player
    const result = await firebaseStore.kickPlayer(roomId, kickerId, targetPlayerId);
    
    if (!result) {
      return NextResponse.json({ error: "Failed to kick player" }, { status: 500 });
    }
    
    const { room, kickedPlayer } = result;
    
    // Trigger player-left event to notify all players
    await pusherServer.trigger(`room-${roomId}`, "player-left", {
      playerId: targetPlayerId,
      playerName: kickedPlayer.name,
      players: room.players,
      newOwnerId: null, // No ownership change when kicking
      reason: "kicked"
    });
    
    // If there was an active game and the kicked player was the impostor, end the game
    if (room.game && room.game.endedAt && room.game.impostorId === targetPlayerId) {
      await pusherServer.trigger(`room-${roomId}`, "game-ended", {
        reason: "impostor_kicked"
      });
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: `${kickedPlayer.name} has been kicked from the room`,
      room: room
    });
    
  } catch (e: any) {
    console.error("Error kicking player:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
