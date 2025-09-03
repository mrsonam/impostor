import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    
    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }
    
    const stats = await firebaseStore.getWordPoolStats(roomId);
    if (!stats) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, stats });
  } catch (e: any) {
    console.error("Error getting word pool stats:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
