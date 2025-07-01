import React, { useState, useEffect } from 'react';
import { ENV, MIGRATION_FLAGS } from '../config/environment';
import { getBackendHealth, getBackendMetrics, getBackendSuccessRate } from '../services/apiClient';
import { getSocketState } from '../services/socketClient';

interface HealthMonitorProps {
  className?: string;
}

const HealthMonitor: React.FC<HealthMonitorProps> = ({ className = '' }) => {
  const [backendHealth, setBackendHealth] = useState<any>(null);
  const [backendMetrics, setBackendMetrics] = useState<any>(null);
  const [socketState, setSocketState] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development mode
  if (!ENV.isDevelopment) {
    return null;
  }

  useEffect(() => {
    const updateHealth = () => {
      setBackendHealth(getBackendHealth());
      setBackendMetrics(getBackendMetrics());
      setSocketState(getSocketState());
    };

    updateHealth();
    const interval = setInterval(updateHealth, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? '✅' : '❌';
  };

  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          🔧 Health Monitor
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-w-md w-80">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
          <h3 className="font-semibold text-sm">🔧 System Health Monitor</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Migration Flags Status */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🚩 Migration Flags</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Room Creation:</span>
                <span className={`px-2 py-1 rounded ${MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_CREATION ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_CREATION ? 'Backend' : 'Firebase'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Room Joining:</span>
                <span className={`px-2 py-1 rounded ${MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING ? 'Backend' : 'Firebase'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Game Starting:</span>
                <span className={`px-2 py-1 rounded ${MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START ? 'Backend' : 'Firebase'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Rollout %:</span>
                <span className="px-2 py-1 rounded bg-purple-100 text-purple-800">
                  {MIGRATION_FLAGS.MIGRATION_PERCENTAGE}%
                </span>
              </div>
            </div>
          </div>

          {/* Backend Health */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🖥️ Backend Status</h4>
            {backendHealth ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Health:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(backendHealth.isHealthy)}`}>
                    {getStatusIcon(backendHealth.isHealthy)} {backendHealth.isHealthy ? 'Healthy' : 'Unhealthy'}
                  </span>
                </div>
                {backendHealth.responseTime && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Response Time:</span>
                    <span className="text-xs font-mono">{backendHealth.responseTime}ms</span>
                  </div>
                )}
                {backendHealth.consecutiveFailures > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Failures:</span>
                    <span className="text-xs text-red-600">{backendHealth.consecutiveFailures}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Loading...</div>
            )}
          </div>

          {/* Backend Metrics */}
          {backendMetrics && backendMetrics.totalRequests > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">📊 Backend Metrics</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Success Rate:</span>
                  <span className={`font-mono ${getBackendSuccessRate() >= 95 ? 'text-green-600' : 'text-red-600'}`}>
                    {getBackendSuccessRate()}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Requests:</span>
                  <span className="font-mono">{backendMetrics.totalRequests}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Response:</span>
                  <span className="font-mono">{Math.round(backendMetrics.averageResponseTime)}ms</span>
                </div>
              </div>
            </div>
          )}

          {/* Socket.io Status */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🔌 Socket.io Status</h4>
            {socketState ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Connection:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(socketState.isConnected)}`}>
                    {getStatusIcon(socketState.isConnected)} {socketState.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                {socketState.latency > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Latency:</span>
                    <span className="text-xs font-mono">{socketState.latency}ms</span>
                  </div>
                )}
                {socketState.connectionAttempts > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Attempts:</span>
                    <span className="text-xs">{socketState.connectionAttempts}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-gray-500">Loading...</div>
            )}
          </div>

          {/* Emergency Controls */}
          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-2">🚨 Emergency Controls</h4>
            <div className="space-y-2">
              <button
                onClick={() => {
                  MIGRATION_FLAGS.FORCE_FIREBASE_FALLBACK = true;
                  alert('Emergency rollback activated - all features using Firebase');
                }}
                className="w-full bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors"
              >
                Emergency Rollback
              </button>
              <button
                onClick={() => {
                  MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_CREATION = !MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_CREATION;
                  alert(`Room creation ${MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_CREATION ? 'enabled' : 'disabled'} for backend`);
                }}
                className="w-full bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
              >
                Toggle Room Creation Backend
              </button>
              <button
                onClick={() => {
                  MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING = !MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING;
                  alert(`Room joining ${MIGRATION_FLAGS.USE_BACKEND_FOR_ROOM_JOINING ? 'enabled' : 'disabled'} for backend`);
                }}
                className="w-full bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
              >
                Toggle Room Joining Backend
              </button>
              <button
                onClick={() => {
                  MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START = !MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START;
                  alert(`Game starting ${MIGRATION_FLAGS.USE_BACKEND_FOR_GAME_START ? 'enabled' : 'disabled'} for backend`);
                }}
                className="w-full bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition-colors"
              >
                Toggle Game Starting Backend
              </button>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-center border-t pt-2">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthMonitor; 