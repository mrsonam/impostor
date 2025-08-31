import { nanoid } from "nanoid";
import { firebaseHelpers } from "./firebase";

export type Player = {
  id: string;
  name: string;
  avatar?: string;
  avatarFull?: string;
  impostorCount: number;
  joinedAt: number;
};

export type Clue = { 
  id: string; 
  playerId: string; 
  text: string; 
  ts: number 
};

export type GameState = {
  id: string;
  word: string;
  hint: string;
  impostorId: string;
  startedAt: number;
  endedAt?: number;
  clues: Clue[];
};

export type Room = {
  id: string;
  ownerId: string;
  players: Player[];
  game?: GameState;
  createdAt: number;
  lastActivity: number; // Track last activity for cleanup
  showHints: boolean; // whether to show hints for impostors
};

class FirebaseStore {
  private generateRoomId(): string {
    const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ"; // no I/O
    let id = "";
    for (let i = 0; i < 5; i++) {
      id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
  }

  async createRoom(ownerName: string, avatar?: string, avatarFull?: string, showHints: boolean = true) {
    let roomId: string;
    let roomExists = true;
    
    // Generate unique room ID
    do {
      roomId = this.generateRoomId();
      roomExists = await firebaseHelpers.roomExists(roomId);
    } while (roomExists);

    const owner: Player = {
      id: nanoid(10),
      name: ownerName,
      avatar,
      avatarFull,
      impostorCount: 0,
      joinedAt: Date.now(),
    };

    const room: Room = {
      id: roomId,
      ownerId: owner.id,
      players: [owner],
      createdAt: Date.now(),
      lastActivity: Date.now(),
      showHints,
    };

    await firebaseHelpers.setRoom(roomId, room);
    return { room, player: owner };
  }

  async joinRoom(roomId: string, name: string, avatar?: string, avatarFull?: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
    const player: Player = {
      id: nanoid(10),
      name,
      avatar,
      avatarFull,
      impostorCount: 0,
      joinedAt: Date.now(),
    };

    room.players.push(player);
    room.lastActivity = Date.now();

    await firebaseHelpers.updateRoom(roomId, {
      players: room.players,
      lastActivity: room.lastActivity
    });

    return { room, player };
  }

  async startGame(
    roomId: string,
    picker: (players: Player[]) => {
      word: string;
      hint: string;
      impostorId: string;
    }
  ) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
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
    room.lastActivity = Date.now();

    await firebaseHelpers.updateRoom(roomId, {
      game: room.game,
      players: room.players,
      lastActivity: room.lastActivity
    });

    return game;
  }

  async submitClue(roomId: string, playerId: string, text: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
    if (!room.game) throw new Error("Game not active");

    const clue: Clue = { 
      id: nanoid(8), 
      playerId, 
      text, 
      ts: Date.now() 
    };

    room.game.clues.push(clue);
    room.lastActivity = Date.now();

    await firebaseHelpers.updateRoom(roomId, {
      game: room.game,
      lastActivity: room.lastActivity
    });

    return clue;
  }

  async endRound(roomId: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
    if (!room.game) throw new Error("Game not active");

    room.game.endedAt = Date.now();
    room.lastActivity = Date.now();

    await firebaseHelpers.updateRoom(roomId, {
      game: room.game,
      lastActivity: room.lastActivity
    });

    return room.game;
  }

  async newGame(
    roomId: string,
    picker: (players: Player[]) => {
      word: string;
      hint: string;
      impostorId: string;
    }
  ) {
    return this.startGame(roomId, picker);
  }

  async getRoom(roomId: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    return roomData as Room | null;
  }

  async getPrivateView(roomId: string, playerId: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
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

  async leaveRoom(roomId: string, playerId: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
    room.players = room.players.filter(p => p.id !== playerId);
    room.lastActivity = Date.now();

    if (room.players.length === 0) {
      // Delete room if no players left
      await firebaseHelpers.deleteRoom(roomId);
      return null;
    } else {
      // Update room with remaining players
      await firebaseHelpers.updateRoom(roomId, {
        players: room.players,
        lastActivity: room.lastActivity
      });
      return room;
    }
  }

  async updateRoom(roomId: string, updates: any) {
    await firebaseHelpers.updateRoom(roomId, updates);
  }

  async updateLastActivity(roomId: string) {
    await firebaseHelpers.updateRoom(roomId, {
      lastActivity: Date.now()
    });
  }

  async toggleHints(roomId: string) {
    const roomData = await firebaseHelpers.getRoom(roomId);
    if (!roomData) throw new Error("Room not found");

    const room = roomData as Room;
    room.showHints = !room.showHints;
    room.lastActivity = Date.now();

    await firebaseHelpers.updateRoom(roomId, {
      showHints: room.showHints,
      lastActivity: room.lastActivity
    });

    return room.showHints;
  }

  // Cleanup function to remove old/inactive rooms
  async cleanupInactiveRooms(maxInactiveTime: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const rooms = await firebaseHelpers.getAllRooms();
    const now = Date.now();
    
    for (const room of rooms) {
      const roomData = room as any;
      if (roomData.lastActivity && (now - roomData.lastActivity) > maxInactiveTime) {
        await firebaseHelpers.deleteRoom(room.id);
      }
    }
  }
}

export const firebaseStore = new FirebaseStore();
