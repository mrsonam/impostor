import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");
    const playerId = searchParams.get("playerId");
    
    if (!roomId || !playerId)
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    
    const view = await firebaseStore.getPrivateView(roomId, playerId);
    return NextResponse.json(view);
  } catch (e: any) {
    console.error("Error getting private view:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
