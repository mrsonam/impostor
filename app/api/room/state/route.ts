import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  
  if (!roomId) {
    return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
  }
  
  try {
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    // Determine the current phase
    let phase: "lobby" | "round" | "end" = "lobby";
    if (room.game) {
      if (room.game.endedAt) {
        phase = "end";
      } else {
        phase = "round";
      }
    }

    return NextResponse.json({
      phase,
      players: room.players,
      ownerId: room.ownerId,
      showHints: room.showHints,
      game: room.game ? {
        id: room.game.id,
        startedAt: room.game.startedAt,
        endedAt: room.game.endedAt,
        hasActiveGame: !room.game.endedAt
      } : null
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
