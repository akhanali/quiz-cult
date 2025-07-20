import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import { BACKEND_CONFIG, HEALTH_CONFIG, PERFORMANCE_THRESHOLDS, LOG_CONFIG, emergencyRollback } from '../config/environment';
import type { DifficultyLevel } from '../../../shared/types';

// Health monitoring state
interface HealthStatus {
  isHealthy: boolean;
  lastCheck: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastError?: string;
  responseTime?: number;
}

// Performance metrics
interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  averageResponseTime: number;
  lastResponseTime: number;
}

// API client class with health monitoring and fallback
class BackendAPIClient {
  private client: AxiosInstance;
  private healthStatus: HealthStatus = {
    isHealthy: true,
    lastCheck: 0,
    consecutiveFailures: 0,
    consecutiveSuccesses: 0,
  };
  private metrics: PerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    averageResponseTime: 0,
    lastResponseTime: 0,
  };
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_CONFIG.URL,
      timeout: BACKEND_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.startHealthChecking();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const startTime = Date.now();
        (config as any).startTime = startTime;
        
        if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
          console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        this.handleRequestError(error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        this.handleSuccessResponse(response);
        return response;
      },
      (error) => {
        this.handleErrorResponse(error);
        return Promise.reject(error);
      }
    );
  }

  private handleSuccessResponse(response: AxiosResponse) {
    const startTime = (response.config as any).startTime;
    const responseTime = Date.now() - startTime;

    // Update health status
    this.healthStatus.consecutiveFailures = 0;
    this.healthStatus.consecutiveSuccesses++;
    this.healthStatus.responseTime = responseTime;
    
    if (this.healthStatus.consecutiveSuccesses >= HEALTH_CONFIG.SUCCESS_THRESHOLD) {
      this.healthStatus.isHealthy = true;
    }

    // Update metrics
    this.updateMetrics(responseTime, true);

    if (LOG_CONFIG.ENABLE_PERFORMANCE_LOGS) {
      console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} (${responseTime}ms)`);
    }

    // Check performance thresholds
    if (responseTime > PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_ERROR) {
      console.warn(`⚠️ Slow API response: ${responseTime}ms (threshold: ${PERFORMANCE_THRESHOLDS.API_RESPONSE_TIME_ERROR}ms)`);
    }
  }

  private handleErrorResponse(error: any) {
    const startTime = (error.config as any)?.startTime;
    const responseTime = startTime ? Date.now() - startTime : 0;

    // Update health status
    this.healthStatus.consecutiveSuccesses = 0;
    this.healthStatus.consecutiveFailures++;
    this.healthStatus.lastError = error.message;
    
    if (this.healthStatus.consecutiveFailures >= HEALTH_CONFIG.FAILURE_THRESHOLD) {
      this.healthStatus.isHealthy = false;
      console.error(`🚨 Backend marked as unhealthy after ${this.healthStatus.consecutiveFailures} failures`);
    }

    // Update metrics
    this.updateMetrics(responseTime, false);

    if (LOG_CONFIG.ENABLE_ERROR_LOGS) {
      console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, error.response?.data || error.message);
    }

    // Check if we should trigger emergency rollback
    const successRate = this.getSuccessRate();
    if (successRate < PERFORMANCE_THRESHOLDS.SUCCESS_RATE_ERROR && this.metrics.totalRequests > 10) {
      emergencyRollback(`Low success rate: ${successRate}%`);
    }
  }

  private handleRequestError(error: any) {
    if (LOG_CONFIG.ENABLE_ERROR_LOGS) {
      console.error('❌ API Request Error:', error);
    }
  }

  private updateMetrics(responseTime: number, success: boolean) {
    this.metrics.totalRequests++;
    if (success) {
      this.metrics.successfulRequests++;
    }
    
    this.metrics.lastResponseTime = responseTime;
    
    // Update average response time (exponential moving average)
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime = (this.metrics.averageResponseTime * 0.9) + (responseTime * 0.1);
    }
  }

  private startHealthChecking() {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, HEALTH_CONFIG.CHECK_INTERVAL);

    // Initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<boolean> {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BACKEND_CONFIG.URL}/health`, {
        timeout: HEALTH_CONFIG.TIMEOUT,
      });
      
      const responseTime = Date.now() - startTime;
      this.healthStatus.lastCheck = Date.now();
      
      if (response.status === 200) {
        this.healthStatus.consecutiveFailures = 0;
        this.healthStatus.consecutiveSuccesses++;
        this.healthStatus.responseTime = responseTime;
        
        if (this.healthStatus.consecutiveSuccesses >= HEALTH_CONFIG.SUCCESS_THRESHOLD) {
          this.healthStatus.isHealthy = true;
        }
        
        if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
          console.log(`✅ Health check passed (${responseTime}ms)`);
        }
        
        return true;
      }
    } catch (error: any) {
      this.healthStatus.consecutiveSuccesses = 0;
      this.healthStatus.consecutiveFailures++;
      this.healthStatus.lastError = error.message;
      this.healthStatus.lastCheck = Date.now();
      
      if (this.healthStatus.consecutiveFailures >= HEALTH_CONFIG.FAILURE_THRESHOLD) {
        this.healthStatus.isHealthy = false;
      }
      
      if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
        console.warn(`⚠️ Health check failed:`, error.message);
      }
    }
    
    return false;
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempts: number = BACKEND_CONFIG.RETRY_ATTEMPTS
  ): Promise<T> {
    let lastError: any;
    
    for (let i = 0; i < attempts; i++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        
        if (i < attempts - 1) {
          const delay = Math.min(1000 * Math.pow(2, i), 5000); // Exponential backoff, max 5s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          if (LOG_CONFIG.ENABLE_DEBUG_LOGS) {
            console.log(`🔄 Retrying API request (attempt ${i + 2}/${attempts}) after ${delay}ms delay`);
          }
        }
      }
    }
    
    throw lastError;
  }

  // Public API methods

  async createRoom(data: {
    nickname: string;
    topic: string;
    difficulty: DifficultyLevel;
    questionCount: number;
    questions?: any[];
  }): Promise<{ roomId: string; playerId: string; aiGenerated: boolean; fallbackReason?: string }> {
    return this.retryRequest(() => 
      this.client.post('/api/rooms', data).then(response => response.data)
    );
  }

  async joinRoom(data: {
    roomCode: string;
    nickname: string;
  }): Promise<{ roomId: string; playerId: string; room: any }> {
    return this.retryRequest(() =>
      this.client.post('/api/rooms/join', data).then(response => response.data)
    );
  }

  async startGame(roomId: string, hostId: string): Promise<{ success: boolean; aiGenerated: boolean; fallbackReason?: string }> {
    return this.retryRequest(() =>
      this.client.post(`/api/rooms/${roomId}/start`, { hostId }).then(response => response.data)
    );
  }

  async getRoom(roomId: string): Promise<any> {
    return this.retryRequest(() =>
      this.client.get(`/api/rooms/${roomId}`).then(response => response.data)
    );
  }

  async getSampleQuestions(difficulty: DifficultyLevel): Promise<any[]> {
    return this.retryRequest(() =>
      this.client.get(`/api/questions/sample/${difficulty}`).then(response => response.data)
    );
  }

  async generateQuestions(data: {
    topic: string;
    difficulty: DifficultyLevel;
    count: number;
  }): Promise<{ questions: any[]; aiGenerated: boolean; fallbackReason?: string }> {
    return this.retryRequest(async () => {
      const response = await this.client.post('/questions/generate', data);
      return response.data;
    });
  }

  async kickPlayer(roomId: string, hostId: string, playerIdToKick: string): Promise<{ success: boolean; kickedPlayer: { id: string; nickname: string }; message: string }> {
    return this.retryRequest(async () => {
      const response = await this.client.post(`/api/rooms/${roomId}/kick-player`, {
        hostId,
        playerIdToKick
      });
      return response.data;
    });
  }

  // Health and monitoring methods

  isHealthy(): boolean {
    return this.healthStatus.isHealthy;
  }

  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getSuccessRate(): number {
    if (this.metrics.totalRequests === 0) return 100;
    return Math.round((this.metrics.successfulRequests / this.metrics.totalRequests) * 100);
  }

  // Lifecycle methods

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

// Create singleton instance
const apiClient = new BackendAPIClient();

// Export individual API functions for convenience
export const createRoom = apiClient.createRoom.bind(apiClient);
export const joinRoom = apiClient.joinRoom.bind(apiClient);
export const startGame = apiClient.startGame.bind(apiClient);
export const getRoom = apiClient.getRoom.bind(apiClient);
export const getSampleQuestions = apiClient.getSampleQuestions.bind(apiClient);
export const generateQuestions = apiClient.generateQuestions.bind(apiClient);
export const kickPlayer = apiClient.kickPlayer.bind(apiClient);

// Export health monitoring functions
export const isBackendHealthy = apiClient.isHealthy.bind(apiClient);
export const getBackendHealth = apiClient.getHealthStatus.bind(apiClient);
export const getBackendMetrics = apiClient.getMetrics.bind(apiClient);
export const getBackendSuccessRate = apiClient.getSuccessRate.bind(apiClient);

// Export the client instance
export default apiClient; 