import { MIGRATION_FLAGS } from "../config/environment";
import { kickPlayer as kickPlayerBackend, isBackendHealthy } from "../services/apiClient";
import socketClient  from "../services/socketClient";

export async function kickPlayer(roomId: string, hostId: string, playerIdToKick: string): Promise<{ success: boolean; message: string }> {
  
  // Dynamic feature flag check - check current flag value at runtime
  const useBackend = MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING && 
                    !MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK && 
                    !MIGRATION_FLAGS.DISABLE_BACKEND_COMPLETELY;

  // Feature flag check - try backend first if enabled
  if (useBackend) {
    try {
      console.log('🔄 Attempting to kick player via backend...');
      
      // Check backend health before attempting
      if (!isBackendHealthy()) {
        console.warn('⚠️ Backend not healthy, falling back to Firebase for kicking player');
        return await kickPlayerFirebase(roomId, hostId, playerIdToKick);
      }
      
      // Try backend kick player
      const result = await kickPlayerBackend(roomId, hostId, playerIdToKick);
      
      console.log('✅ Player kicked successfully via backend:', result);
      
      return {
        success: true,
        message: result.message
      };
      
    } catch (error: any) {
      console.warn('🔄 Backend kick player failed, falling back to Firebase:', error.message);
      
      // Automatic fallback to Firebase on any backend error
      return await kickPlayerFirebase(roomId, hostId, playerIdToKick);
    }
  }
  
  // Default: Use Firebase (original implementation)
  console.log('🔥 Kicking player via Firebase (default)');
  return await kickPlayerFirebase(roomId, hostId, playerIdToKick);
}

// Firebase implementation
async function kickPlayerFirebase(roomId: string, hostId: string, playerIdToKick: string): Promise<{ success: boolean; message: string }> {
  try {
    // Use socket connection to kick player
    if (socketClient.isConnected()) {
      socketClient.kickPlayer(roomId, hostId, playerIdToKick);
      return {
        success: true,
        message: 'Player kick initiated via socket'
      };
    } else {
      throw new Error('Socket connection not available');
    }
  } catch (error: any) {
    console.error('❌ Error kicking player via Firebase:', error);
    throw new Error(error.message || 'Failed to kick player');
  }
} 