import { NextRequest, NextResponse } from "next/server";
import { firebaseStore } from "@/lib/firebase-store";
import { WORDS } from "@/lib/words";
import { pusherServer } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  try {
    const { roomId } = await req.json();
    if (!roomId)
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    
    // Get the room first to check used words
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    
    const game = await firebaseStore.newGame(roomId, (players) => {
      // Get used words from the room
      const usedWords = room.usedWords || [];
      
      // Filter out words that have already been used
      const availableWords = WORDS.filter(entry => !usedWords.includes(entry.word));
      
      console.log(`Room ${roomId}: ${usedWords.length} words used, ${availableWords.length} words available`);
      
      // If all words have been used, reset the used words list and start fresh
      if (availableWords.length === 0) {
        console.log(`Room ${roomId}: All words used, resetting word pool`);
        // Update the room to clear used words
        firebaseStore.updateRoom(roomId, { usedWords: [] });
        // Now all words are available again
        const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
        const impostor = players[Math.floor(Math.random() * players.length)].id;
        console.log(`Room ${roomId}: Selected word "${entry.word}" after reset`);
        return { word: entry.word, hint: entry.hint, impostorId: impostor };
      }
      
      // Select from available words
      const entry = availableWords[Math.floor(Math.random() * availableWords.length)];
      const impostor = players[Math.floor(Math.random() * players.length)].id;
      console.log(`Room ${roomId}: Selected word "${entry.word}" from ${availableWords.length} available words`);
      return { word: entry.word, hint: entry.hint, impostorId: impostor };
    });
    
    // Trigger game-started event with complete game data
    await pusherServer.trigger(`room-${roomId}`, "game-started", {
      gameId: game.id,
      players: room.players,
      game: {
        id: game.id,
        startedAt: game.startedAt,
        hasActiveGame: true
      }
    });
    
    return NextResponse.json({ ok: true, gameId: game.id });
  } catch (e: any) {
    console.error("Error starting new game:", e);
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
