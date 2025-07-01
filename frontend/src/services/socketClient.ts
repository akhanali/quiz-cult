import { io, Socket } from 'socket.io-client';
import { BACKEND_CONFIG, LOG_CONFIG, emergencyRollback } from '../config/environment';
import type { Room, Player, Question, Answer, GameState } from '../../../shared/types';

// Socket event types for type safety
interface ServerToClientEvents {
  // Connection events
  'room-joined': (data: { success: boolean; room: Room; playerId: string }) => void;
  'room-left': (data: { playerId: string; reason: string }) => void;
  'error': (data: { message: string; code?: string }) => void;
  
  // Player events
  'player-connected': (data: { player: Player; room: Room }) => void;
  'player-disconnected': (data: { playerId: string; room: Room; reason: string }) => void;
  'player-answered': (data: { playerId: string; hasAnswered: boolean; room: Room }) => void;
  
  // Game events
  'next-question': (data: { questionIndex: number; question: Question; gameState: GameState; room: Room }) => void;
  'show-results': (data: { questionIndex: number; results: any; gameState: GameState; room: Room }) => void;
  'all-players-answered': (data: { room: Room }) => void;
  'game-ended': (data: { finalResults: any; winner: Player; room: Room }) => void;
  'game-state-updated': (data: { gameState: GameState; room: Room }) => void;
  
  // Room events
  'room-updated': (data: { room: Room }) => void;
  'room-deleted': (data: { roomId: string; reason: string }) => void;
  
  // Answer events
  'answer-submitted': (data: { playerId: string; answer: Answer; newScore: number; room: Room }) => void;
  
  // Health events
  'ping': () => void;
}

interface ClientToServerEvents {
  // Connection events
  'join-room': (data: { roomId: string; playerId: string; nickname: string }) => void;
  'leave-room': (data: { roomId: string; playerId: string }) => void;
  
  // Game events
  'submit-answer': (data: { 
    roomId: string; 
    playerId: string; 
    questionIndex: number; 
    selectedOption: string; 
    timeToAnswer: number 
  }) => void;
  'game-state-change': (data: { 
    roomId: string; 
    hostId: string; 
    action: string; 
    gameState?: Partial<GameState> 
  }) => void;
  
  // Health events
  'pong': () => void;
}

// Connection state
interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnected: number;
  connectionAttempts: number;
  lastError?: string;
  latency: number;
}

// Event listener management
type EventListener<T = any> = (data: T) => void;
interface EventListeners {
  [event: string]: EventListener[];
}

class SocketIOClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    lastConnected: 0,
    connectionAttempts: 0,
    latency: 0,
  };
  private eventListeners: EventListeners = {};
  private reconnectTimer?: NodeJS.Timeout;
  private pingTimer?: NodeJS.Timeout;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.setupConnection();
  }

  private setupConnection() {
    if (this.socket || this.connectionState.isConnecting) {
      return;
    }

    this.connectionState.isConnecting = true;
    this.connectionState.connectionAttempts++;

    if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
      console.log(`🔌 Connecting to Socket.io server... (attempt ${this.connectionState.connectionAttempts})`);
    }

    this.socket = io(BACKEND_CONFIG.URL, {
      transports: ['websocket', 'polling'],
      timeout: 5000,
      reconnection: false, // We handle reconnection manually
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      this.connectionState.isConnected = true;
      this.connectionState.isConnecting = false;
      this.connectionState.lastConnected = Date.now();
      this.connectionState.connectionAttempts = 0;
      this.connectionState.lastError = undefined;

      if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
        console.log('✅ Socket.io connected');
      }

      this.startPingMonitoring();
      this.clearReconnectTimer();
    });

    this.socket.on('disconnect', (reason) => {
      this.connectionState.isConnected = false;
      this.connectionState.isConnecting = false;
      this.connectionState.lastError = reason;

      if (LOG_CONFIG.ENABLE_ERROR_LOGS) {
        console.warn('⚠️ Socket.io disconnected:', reason);
      }

      this.stopPingMonitoring();
      this.scheduleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      this.connectionState.isConnecting = false;
      this.connectionState.lastError = error.message;

      if (LOG_CONFIG.ENABLE_ERROR_LOGS) {
        console.error('❌ Socket.io connection error:', error);
      }

      this.scheduleReconnect();
    });

    // Health monitoring
    this.socket.on('ping', () => {
      const pingTime = Date.now();
      this.socket!.emit('pong');
      this.connectionState.latency = Date.now() - pingTime;
    });

    // Forward all server events to registered listeners
    this.setupEventForwarding();
  }

  private setupEventForwarding() {
    if (!this.socket) return;

    // List of all server events we want to forward
    const serverEvents: (keyof ServerToClientEvents)[] = [
      'room-joined',
      'room-left',
      'error',
      'player-connected',
      'player-disconnected',
      'player-answered',
      'next-question',
      'show-results',
      'all-players-answered',
      'game-ended',
      'game-state-updated',
      'room-updated',
      'room-deleted',
      'answer-submitted',
    ];

    serverEvents.forEach(event => {
      this.socket!.on(event, (data: any) => {
        if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
          console.log(`📨 Socket event received: ${event}`, data);
        }
        this.notifyListeners(event, data);
      });
    });
  }

  private notifyListeners(event: string, data: any) {
    const listeners = this.eventListeners[event] || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.connectionState.connectionAttempts >= this.maxReconnectAttempts) {
      if (this.connectionState.connectionAttempts >= this.maxReconnectAttempts) {
        console.error('🚨 Max reconnection attempts reached, triggering emergency rollback');
        emergencyRollback('Socket.io max reconnection attempts reached');
      }
      return;
    }

    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.connectionState.connectionAttempts), 30000);
    
    if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
      console.log(`🔄 Scheduling reconnect in ${delay}ms`);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.reconnect();
    }, delay);
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  private startPingMonitoring() {
    this.stopPingMonitoring();
    this.pingTimer = setInterval(() => {
      if (this.socket && this.connectionState.isConnected) {
        const pingTime = Date.now();
        this.socket.emit('pong');
        this.connectionState.latency = Date.now() - pingTime;
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingMonitoring() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = undefined;
    }
  }

  // Public API methods

  connect(): void {
    if (!this.connectionState.isConnected && !this.connectionState.isConnecting) {
      this.setupConnection();
    }
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.stopPingMonitoring();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
  }

  reconnect(): void {
    this.disconnect();
    this.setupConnection();
  }

  // Event subscription
  on<K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(listener as EventListener);
  }

  off<K extends keyof ServerToClientEvents>(event: K, listener: ServerToClientEvents[K]): void {
    if (!this.eventListeners[event]) return;
    
    const index = this.eventListeners[event].indexOf(listener as EventListener);
    if (index > -1) {
      this.eventListeners[event].splice(index, 1);
    }
  }

  // Event emission
  emit<K extends keyof ClientToServerEvents>(event: K, data: Parameters<ClientToServerEvents[K]>[0]): void {
    if (!this.socket || !this.connectionState.isConnected) {
      console.warn(`Cannot emit ${event}: Socket not connected`);
      return;
    }

    if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
      console.log(`📤 Socket emit: ${event}`, data);
    }

    (this.socket as any).emit(event, data);
  }

  // Convenience methods for common operations
  joinRoom(roomId: string, playerId: string, nickname: string): void {
    this.emit('join-room', { roomId, playerId, nickname });
  }

  leaveRoom(roomId: string, playerId: string): void {
    this.emit('leave-room', { roomId, playerId });
  }

  submitAnswer(roomId: string, playerId: string, questionIndex: number, selectedOption: string, timeToAnswer: number): void {
    this.emit('submit-answer', { roomId, playerId, questionIndex, selectedOption, timeToAnswer });
  }

  updateGameState(roomId: string, hostId: string, action: string, gameState?: Partial<GameState>): void {
    this.emit('game-state-change', { roomId, hostId, action, gameState });
  }

  // State getters
  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  isConnecting(): boolean {
    return this.connectionState.isConnecting;
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  getLatency(): number {
    return this.connectionState.latency;
  }

  // Cleanup
  destroy(): void {
    this.clearReconnectTimer();
    this.stopPingMonitoring();
    this.disconnect();
    this.eventListeners = {};
  }
}

// Create singleton instance
const socketClient = new SocketIOClient();

// Export convenience functions
export const connectSocket = () => socketClient.connect();
export const disconnectSocket = () => socketClient.disconnect();
export const isSocketConnected = () => socketClient.isConnected();
export const getSocketState = () => socketClient.getConnectionState();
export const getSocketLatency = () => socketClient.getLatency();

// Export event handling functions
export const onSocketEvent = socketClient.on.bind(socketClient);
export const offSocketEvent = socketClient.off.bind(socketClient);
export const emitSocketEvent = socketClient.emit.bind(socketClient);

// Export convenience methods
export const joinRoom = socketClient.joinRoom.bind(socketClient);
export const leaveRoom = socketClient.leaveRoom.bind(socketClient);
export const submitAnswer = socketClient.submitAnswer.bind(socketClient);
export const updateGameState = socketClient.updateGameState.bind(socketClient);

// Export the client instance
export default socketClient; 