import { NextRequest, NextResponse } from "next/server";
import { memory } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get("roomId");
  const playerId = searchParams.get("playerId");
  if (!roomId || !playerId)
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  try {
    const view = memory.getPrivateView(roomId, playerId);
    return NextResponse.json(view);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
