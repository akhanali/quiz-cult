import { ref, get, update, child } from "firebase/database";
import { db } from "../lib/firebase";
import type { Player } from "../../../shared/types";

// New imports for hybrid functionality
import { MIGRATION_FLAGS } from "../config/environment";
import { joinRoom as joinRoomBackend, isBackendHealthy } from "../services/apiClient";

export async function joinRoom(roomCode: string, nickname: string): Promise<{foundRoomId: string, playerId: string}> {
  
  // Dynamic feature flag check - check current flag value at runtime
  const useBackend = MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING && 
                    !MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK && 
                    !MIGRATION_FLAGS.DISABLE_BACKEND_COMPLETELY;

  // Feature flag check - try backend first if enabled
  if (useBackend) {
    try {
      console.log('🔄 Attempting room joining via backend...');
      
      // Check backend health before attempting
      if (!isBackendHealthy()) {
        console.warn('⚠️ Backend not healthy, falling back to Firebase for room joining');
        return await joinRoomFirebase(roomCode, nickname);
      }
      
      // Try backend room joining
      const result = await joinRoomBackend({
        roomCode: roomCode.trim(),
        nickname: nickname.trim()
      });
      
      console.log('✅ Room joined successfully via backend:', result.roomId);
      
      // Store player ID in localStorage for consistency with Firebase approach
      localStorage.setItem("userId", result.playerId);
      
      return {
        foundRoomId: result.roomId,
        playerId: result.playerId
      };
      
    } catch (error: any) {
      console.warn('🔄 Backend room joining failed, falling back to Firebase:', error.message);
      
      // Automatic fallback to Firebase on any backend error
      return await joinRoomFirebase(roomCode, nickname);
    }
  }
  
  // Default: Use Firebase (original implementation)
  console.log('🔥 Joining room via Firebase (default)');
  return await joinRoomFirebase(roomCode, nickname);
}

// Original Firebase implementation (unchanged, moved to separate function)
async function joinRoomFirebase(roomCode: string, nickname: string): Promise<{foundRoomId: string, playerId: string}> {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, "rooms"));

  let foundRoomId: string | null = null;
  let roomPlayersPath = "";

  snapshot.forEach(childSnap => {
    if (childSnap.val().roomCode === roomCode) {
      foundRoomId = childSnap.key!;
      roomPlayersPath = `rooms/${foundRoomId}/players`;
    }
  });

  if (!foundRoomId) {
    throw new Error("Room not found");
  }

  const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const newPlayer: Player = {
    id: playerId,
    nickname,
    isHost: false,
    score: 0,
    joinedAt: Date.now(),
    answers: {}
  };

  await update(ref(db, `${roomPlayersPath}/${playerId}`), newPlayer);
  return {foundRoomId, playerId};
}

// Export Firebase implementation for testing/debugging
export { joinRoomFirebase };