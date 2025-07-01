import { ref, onDisconnect } from "firebase/database";
import type { OnDisconnect } from "firebase/database";
import { db } from "../lib/firebase";

class PresenceManager {
  private disconnectRefs: OnDisconnect[] = [];

  /**
   * Set up automatic cleanup when user disconnects
   * @param roomId - The room ID
   * @param playerId - The player ID  
   * @param isHost - Whether the player is the host
   */
  setupDisconnectCleanup(roomId: string, playerId: string, isHost: boolean) {
    // Clear any existing disconnect handlers
    this.clearDisconnectHandlers();

    if (isHost) {
      // If host disconnects, delete the entire room
      const roomRef = ref(db, `rooms/${roomId}`);
      const disconnectRef = onDisconnect(roomRef);
      disconnectRef.remove();
      this.disconnectRefs.push(disconnectRef);
      
      console.log(`Setup onDisconnect: Host will delete room ${roomId}`);
    } else {
      // If player disconnects, just remove their player data
      const playerRef = ref(db, `rooms/${roomId}/players/${playerId}`);
      const disconnectRef = onDisconnect(playerRef);
      disconnectRef.remove();
      this.disconnectRefs.push(disconnectRef);
      
      console.log(`Setup onDisconnect: Player ${playerId} will be removed from room ${roomId}`);
    }
  }

  /**
   * Cancel all disconnect handlers (call when user legitimately navigates)
   */
  clearDisconnectHandlers() {
    this.disconnectRefs.forEach(disconnectRef => {
      try {
        disconnectRef.cancel();
      } catch (error) {
        console.warn("Error canceling disconnect handler:", error);
      }
    });
    this.disconnectRefs = [];
    console.log("Cleared all onDisconnect handlers");
  }

  /**
   * Update disconnect handlers when user role changes (e.g., becomes host)
   */
  updateDisconnectCleanup(roomId: string, playerId: string, isHost: boolean) {
    this.setupDisconnectCleanup(roomId, playerId, isHost);
  }
}

// Export singleton instance
export const presenceManager = new PresenceManager(); 