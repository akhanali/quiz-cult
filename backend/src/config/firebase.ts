import admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK
 * Supports both environment variable and service account file methods
 */
const initializeFirebase = () => {
  // Prevent multiple initializations
  if (admin.apps.length > 0) {
    console.log('🔥 Firebase Admin already initialized');
    return admin.database();
  }

  try {
    let credential;

    // Method 1: Service account from environment variable (preferred for production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      console.log('🔥 Initializing Firebase Admin with environment service account');
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } 
    // Method 2: Service account from file (for development)
    else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('🔥 Initializing Firebase Admin with service account file');
      credential = admin.credential.applicationDefault();
    }
    // Method 3: Local development with service account file
    else {
      try {
        console.log('🔥 Initializing Firebase Admin with local service account file');
        const serviceAccount = require('../../serviceAccountKey.json');
        credential = admin.credential.cert(serviceAccount);
      } catch (error) {
        console.error('❌ No Firebase credentials found');
        console.error('Please set up Firebase credentials using one of these methods:');
        console.error('1. Set FIREBASE_SERVICE_ACCOUNT environment variable with JSON string');
        console.error('2. Set GOOGLE_APPLICATION_CREDENTIALS environment variable with file path');
        console.error('3. Place serviceAccountKey.json in backend/ directory');
        
        // In development, allow server to start without Firebase for API testing
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.warn('⚠️ DEVELOPMENT MODE: Starting without Firebase Admin SDK');
          console.warn('🔧 API routes will be testable but database operations will fail');
          return null; // Return null instead of throwing
        }
        
        throw new Error('Firebase credentials not configured');
      }
    }

    // Initialize Firebase Admin
    admin.initializeApp({
      credential,
      databaseURL: process.env.VITE_FIREBASE_DATABASE_URL || 'https://quiz-cult-default-rtdb.europe-west1.firebasedatabase.app'
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    console.log(`📊 Database URL: ${process.env.VITE_FIREBASE_DATABASE_URL || 'https://quiz-cult-default-rtdb.europe-west1.firebasedatabase.app'}`);

  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    
    // In development, allow server to start without Firebase for API testing
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.warn('⚠️ DEVELOPMENT MODE: Starting without Firebase Admin SDK');
      console.warn('🔧 API routes will be testable but database operations will fail');
      return null; // Return null instead of throwing
    }
    
    throw error;
  }

  return admin.database();
};

// Initialize and export database instance
export const db = initializeFirebase();

// Export admin for other Firebase services if needed
export { admin };

// Helper functions for common database operations
export const dbHelpers = {
  /**
   * Generate a new unique key for a database reference
   */
  generateKey: (path: string) => {
    if (!db) throw new Error('Firebase not initialized');
    return db.ref(path).push().key;
  },

  /**
   * Check if a room exists
   */
  roomExists: async (roomId: string): Promise<boolean> => {
    if (!db) throw new Error('Firebase not initialized');
    const snapshot = await db.ref(`rooms/${roomId}`).once('value');
    return snapshot.exists();
  },

  /**
   * Get room by room code
   */
  getRoomByCode: async (roomCode: string) => {
    if (!db) throw new Error('Firebase not initialized');
    const snapshot = await db.ref('rooms')
      .orderByChild('roomCode')
      .equalTo(roomCode)
      .limitToFirst(1)
      .once('value');
    
    const rooms = snapshot.val();
    if (!rooms) return null;
    
    const roomId = Object.keys(rooms)[0];
    return { id: roomId, ...rooms[roomId] };
  },

  /**
   * Delete a room and all its data
   */
  deleteRoom: async (roomId: string): Promise<void> => {
    if (!db) throw new Error('Firebase not initialized');
    await db.ref(`rooms/${roomId}`).remove();
    console.log(`🗑️ Room ${roomId} deleted from database`);
  },

  /**
   * Update room status
   */
  updateRoomStatus: async (roomId: string, status: 'waiting' | 'active' | 'finished'): Promise<void> => {
    if (!db) throw new Error('Firebase not initialized');
    await db.ref(`rooms/${roomId}/status`).set(status);
    console.log(`📊 Room ${roomId} status updated to: ${status}`);
  }
}; 