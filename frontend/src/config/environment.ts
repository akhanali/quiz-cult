// Environment-based feature flags for migration control
// All flags start as FALSE to maintain existing Firebase functionality

// Development environment flags (can be overridden for testing)
const isDevelopment = import.meta.env.MODE === 'development';
const isStaging = import.meta.env.VITE_ENV === 'staging';
const isProduction = import.meta.env.VITE_ENV === 'production';

// Backend configuration
export const BACKEND_CONFIG = {
  URL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
  HEALTH_CHECK_INTERVAL: parseInt(import.meta.env.VITE_HEALTH_CHECK_INTERVAL || '30000'),
};

// Migration feature flags - START ALL AS FALSE for safety
export const MIGRATION_FLAGS: Record<string, any> = {
  // Core API migrations (Phase 1-3)
  USE_BACKEND_FOR_ROOM_CREATION: import.meta.env.VITE_USE_BACKEND_ROOM_CREATION === 'true' || true,
  USE_BACKEND_FOR_ROOM_JOINING: import.meta.env.VITE_USE_BACKEND_ROOM_JOINING === 'true' || true,
  USE_BACKEND_FOR_GAME_START: import.meta.env.VITE_USE_BACKEND_GAME_START === 'true' || false, // Temporarily disabled
  
  // Real-time migrations (Phase 4)
  USE_SOCKET_FOR_LOBBY: import.meta.env.VITE_USE_SOCKET_LOBBY === 'true' || false,
  USE_SOCKET_FOR_QUIZ: import.meta.env.VITE_USE_SOCKET_QUIZ === 'true' || false,
  
  // Testing and monitoring
  ENABLE_DUAL_MODE: import.meta.env.VITE_ENABLE_DUAL_MODE === 'true' || false,
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true' || true,
  ENABLE_ERROR_TRACKING: import.meta.env.VITE_ENABLE_ERROR_TRACKING === 'true' || true,
  
  // Rollout percentage (0-100)
  MIGRATION_PERCENTAGE: parseInt(import.meta.env.VITE_MIGRATION_PERCENTAGE || '10'),
  
  // Emergency controls
  FORCE_FIREBASE_FALLBACK: import.meta.env.VITE_FORCE_FIREBASE_FALLBACK === 'true' || false,
  DISABLE_BACKEND_COMPLETELY: import.meta.env.VITE_DISABLE_BACKEND_COMPLETELY === 'true' || false,
};

// Development overrides for testing
if (isDevelopment) {
  // In development, we can enable backend features for testing
  // But still default to false for safety
  //console.log('🛠️  Development mode: Migration flags available for testing');
  //console.log('📊 Current migration flags:', MIGRATION_FLAGS);
}

// A/B testing logic
export const shouldUseBackendFeature = (featureName: keyof typeof MIGRATION_FLAGS): boolean => {
  // Emergency override - always use Firebase
  if (MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK || MIGRATION_FLAGS.DISABLE_BACKEND_COMPLETELY) {
    return false;
  }
  
  // Check specific feature flag
  const featureEnabled = MIGRATION_FLAGS[featureName];
  if (typeof featureEnabled !== 'boolean') {
    return false;
  }
  
  if (!featureEnabled) {
    return false;
  }
  
  // Percentage-based rollout
  const migrationPercentage = MIGRATION_FLAGS.MIGRATION_PERCENTAGE;
  if (migrationPercentage === 0) {
    return false;
  }
  
  if (migrationPercentage === 100) {
    return true;
  }
  
  // Simple hash-based percentage rollout (consistent per user)
  const userId = localStorage.getItem('userId') || 'anonymous';
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const userPercentage = Math.abs(hash) % 100;
  return userPercentage < migrationPercentage;
};

// Health monitoring configuration
export const HEALTH_CONFIG = {
  CHECK_INTERVAL: BACKEND_CONFIG.HEALTH_CHECK_INTERVAL,
  FAILURE_THRESHOLD: 3, // Number of failures before marking unhealthy
  SUCCESS_THRESHOLD: 2, // Number of successes before marking healthy again
  TIMEOUT: 5000, // Health check timeout
};

// Performance monitoring thresholds
export const PERFORMANCE_THRESHOLDS = {
  API_RESPONSE_TIME_WARNING: 1000, // ms
  API_RESPONSE_TIME_ERROR: 3000, // ms
  SUCCESS_RATE_WARNING: 95, // %
  SUCCESS_RATE_ERROR: 90, // %
};

// Logging configuration
export const LOG_CONFIG = {
  ENABLE_DEBUG_LOGS: isDevelopment,
  ENABLE_PERFORMANCE_LOGS: MIGRATION_FLAGS.ENABLE_PERFORMANCE_MONITORING,
  ENABLE_ERROR_LOGS: MIGRATION_FLAGS.ENABLE_ERROR_TRACKING,
  LOG_TO_CONSOLE: isDevelopment,
  LOG_TO_BACKEND: isProduction,
};

// Emergency rollback function
export const emergencyRollback = (reason: string) => {
  console.error('🚨 EMERGENCY ROLLBACK TRIGGERED:', reason);
  
  // Override all migration flags to false
  Object.keys(MIGRATION_FLAGS).forEach(key => {
    if (key !== 'FORCE_FIREBASE_FALLBACK' && key !== 'ENABLE_ERROR_TRACKING') {
      (MIGRATION_FLAGS as any)[key] = false;
    }
  });
  
  MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK = true;
  
  // Log the rollback
  if (LOG_CONFIG.LOG_TO_BACKEND) {
    // TODO: Send rollback event to backend monitoring
  }
  
  console.log('✅ Emergency rollback complete - all features using Firebase');
};

// Export environment helpers
export const ENV = {
  isDevelopment,
  isStaging,
  isProduction,
  isBackendEnabled: !MIGRATION_FLAGS.DISABLE_BACKEND_COMPLETELY,
};

export default {
  BACKEND_CONFIG,
  MIGRATION_FLAGS,
  HEALTH_CONFIG,
  PERFORMANCE_THRESHOLDS,
  LOG_CONFIG,
  ENV,
  shouldUseBackendFeature,
  emergencyRollback,
}; 