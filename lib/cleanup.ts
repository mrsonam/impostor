import { firebaseStore } from './firebase-store';

// Cleanup function to remove inactive rooms
export async function cleanupInactiveRooms() {
  try {
    console.log('Starting cleanup of inactive rooms...');
    await firebaseStore.cleanupInactiveRooms();
    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

// Function to be called when a player leaves to check if room should be deleted
export async function checkAndCleanupRoom(roomId: string) {
  try {
    const room = await firebaseStore.getRoom(roomId);
    if (!room) {
      // Room was already deleted
      return;
    }
    
    // If no players left, room will be automatically deleted by leaveRoom method
    if (room.players.length === 0) {
      console.log(`Room ${roomId} has no players, will be deleted`);
    }
  } catch (error) {
    console.error('Error checking room for cleanup:', error);
  }
}
