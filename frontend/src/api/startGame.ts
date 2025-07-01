import { ref, update } from "firebase/database";
import { db } from "../lib/firebase";

// New imports for hybrid functionality
import { MIGRATION_FLAGS } from "../config/environment";
import { startGame as startGameBackend, isBackendHealthy } from "../services/apiClient";

export async function startGame(roomId: string): Promise<void> {
  
  // Dynamic feature flag check - check current flag value at runtime
  const useBackend = MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START && 
                    !MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK && 
                    !MIGRATION_FLAGS.DISABLE_BACKEND_COMPLETELY;

  // Feature flag check - try backend first if enabled
  if (useBackend) {
    try {
      console.log('🔄 Attempting game start via backend...');
      
      // Check backend health before attempting
      if (!isBackendHealthy()) {
        console.warn('⚠️ Backend not healthy, falling back to Firebase for game start');
        return await startGameFirebase(roomId);
      }
      
      // Get host ID from localStorage
      const hostId = localStorage.getItem("userId");
      if (!hostId) {
        console.warn('⚠️ No host ID found, falling back to Firebase for game start');
        return await startGameFirebase(roomId);
      }
      
      // Try backend game starting
      const result = await startGameBackend(roomId, hostId);
      
      if (result.success) {
        console.log('✅ Game started successfully via backend');
        return;
      } else {
        console.warn('⚠️ Backend game start failed, falling back to Firebase');
        return await startGameFirebase(roomId);
      }
      
    } catch (error: any) {
      console.warn('🔄 Backend game start failed, falling back to Firebase:', error.message);
      
      // Automatic fallback to Firebase on any backend error
      return await startGameFirebase(roomId);
    }
  }
  
  // Default: Use Firebase (original implementation)
  console.log('🔥 Starting game via Firebase (default)');
  return await startGameFirebase(roomId);
}

// Original Firebase implementation (unchanged, moved to separate function)
async function startGameFirebase(roomId: string): Promise<void> {
  // Set room status to active - QuizPage will handle gameState initialization
  const roomRef = ref(db, `rooms/${roomId}`);
  await update(roomRef, {
    status: "active",
  });
}

// Export Firebase implementation for testing/debugging
export { startGameFirebase };
