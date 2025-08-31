// lib/store.ts

import { nanoid } from "nanoid";

export type Player = {
  id: string;
  name: string;
  avatar?: string; // small icon
  avatarFull?: string; // full-size avatar art
  impostorCount: number; // how many times this player has been impostor
  joinedAt: number;
};
export type Clue = { id: string; playerId: string; text: string; ts: number };

export type GameState = {
  id: string; // changes each New Game
  word: string; // secret word (never broadcast)
  hint: string; // single hint for impostor
  impostorId: string; // one impostor
  startedAt: number;
  endedAt?: number;
  clues: Clue[];
};

export type Room = {
  id: string; // 5-letter code
  ownerId: string;
  players: Player[];
  game?: GameState;
  createdAt: number;
  showHints: boolean; // whether to show hints for impostors
};

class Memory {
  rooms = new Map<string, Room>();

  createRoom(ownerName: string, avatar?: string, avatarFull?: string, showHints: boolean = true) {
    const id = this.code();
    const owner: Player = {
      id: nanoid(10),
      name: ownerName,
      avatar,
      avatarFull,
      impostorCount: 0,
      joinedAt: Date.now(),
    };
    const room: Room = {
      id,
      ownerId: owner.id,
      players: [owner],
      createdAt: Date.now(),
      showHints,
    };
    this.rooms.set(id, room);
    return { room, player: owner };
  }

  joinRoom(roomId: string, name: string, avatar?: string, avatarFull?: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    const player: Player = {
      id: nanoid(10),
      name,
      avatar,
      avatarFull,
      impostorCount: 0,
      joinedAt: Date.now(),
    };
    room.players.push(player);
    return { room, player };
  }
  startGame(
    roomId: string,
    picker: (players: Player[]) => {
      word: string;
      hint: string;
      impostorId: string;
    }
  ) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    if (room.players.length < 3) throw new Error("Need at least 3 players");
    const { word, hint, impostorId } = picker(room.players);
    
    // Increment impostor count for the selected impostor
    const impostor = room.players.find(p => p.id === impostorId);
    if (impostor) {
      impostor.impostorCount++;
    }
    
    const game: GameState = {
      id: nanoid(8),
      word,
      hint,
      impostorId,
      startedAt: Date.now(),
      clues: [],
    };
    room.game = game;
    return game;
  }

  submitClue(roomId: string, playerId: string, text: string) {
    const room = this.rooms.get(roomId);
    if (!room?.game) throw new Error("Game not active");
    const clue: Clue = { id: nanoid(8), playerId, text, ts: Date.now() };
    room.game.clues.push(clue);
    return clue;
  }

  endRound(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room?.game) throw new Error("Game not active");
    room.game.endedAt = Date.now();
    return room.game;
  }

  newGame(
    roomId: string,
    picker: (players: Player[]) => {
      word: string;
      hint: string;
      impostorId: string;
    }
  ) {
    // Clear any existing game state before starting a new one
    const room = this.rooms.get(roomId);
    if (room) {
      room.game = undefined;
    }
    return this.startGame(roomId, picker);
  }

  clearGame(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.game = undefined;
    }
  }

  toggleHints(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.showHints = !room.showHints;
      return room.showHints;
    }
    return false;
  }

  getRoom(roomId: string) {
    console.log("getRoom", roomId, this.rooms.get(roomId));
    return this.rooms.get(roomId);
  }

  getPrivateView(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Room not found");
    const me = room.players.find((p) => p.id === playerId);
    if (!me) throw new Error("Player not in room");
    const game = room.game;
    if (!game) return { role: null, word: null, isActive: false };
    
    // Check if the game is still active (not ended)
    const isActive = !game.endedAt;
    
    const role = game.impostorId === playerId ? "impostor" : "civilian";
    const word = role === "impostor" ? "IMPOSTOR" : game.word;
    // Only show hint if hints are enabled for this room
    const hint = role === "impostor" && room.showHints ? game.hint : null;
    return { role, word, hint, isActive };
  }

  private code(): string {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I/O
    let id = "";
    for (let i = 0; i < 5; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    if (this.rooms.has(id)) return this.code();
    return id;
  }
}

// Legacy export for backward compatibility
// The memory store has been replaced with Firebase Firestore
// Use firebaseStore from './firebase-store' instead
export const memory = new Memory();

// Export Firebase store as the primary store
export { firebaseStore } from './firebase-store';
