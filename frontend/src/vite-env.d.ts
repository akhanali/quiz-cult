/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Backend configuration
  readonly VITE_BACKEND_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_API_RETRY_ATTEMPTS?: string
  readonly VITE_HEALTH_CHECK_INTERVAL?: string
  
  // Environment
  readonly VITE_ENV?: string
  
  // Migration feature flags
  readonly VITE_USE_BACKEND_ROOM_CREATION?: string
  readonly VITE_USE_BACKEND_ROOM_JOINING?: string
  readonly VITE_USE_BACKEND_GAME_START?: string
  readonly VITE_USE_SOCKET_LOBBY?: string
  readonly VITE_USE_SOCKET_QUIZ?: string
  readonly VITE_ENABLE_DUAL_MODE?: string
  readonly VITE_ENABLE_PERFORMANCE_MONITORING?: string
  readonly VITE_ENABLE_ERROR_TRACKING?: string
  readonly VITE_MIGRATION_PERCENTAGE?: string
  readonly VITE_FORCE_FIREBASE_FALLBACK?: string
  readonly VITE_DISABLE_BACKEND_COMPLETELY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
