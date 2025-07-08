import { useState, useEffect } from 'react';
import { FaUsers, FaChartLine, FaEye, FaClock, FaTrophy, FaGlobe } from 'react-icons/fa';
import { getCurrentUserId, getCurrentSessionId } from '../utils/analytics';

interface AnalyticsData {
  totalUsers: number;
  activeSessions: number;
  quizCompletions: number;
  averageSessionTime: number;
}

export default function AnalyticsDashboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeSessions: 0,
    quizCompletions: 0,
    averageSessionTime: 0
  });

  // Mock data - in a real implementation, you'd fetch this from your backend
  useEffect(() => {
    // Simulate loading analytics data
    setAnalyticsData({
      totalUsers: 1250,
      activeSessions: 45,
      quizCompletions: 890,
      averageSessionTime: 8.5
    });
  }, []);

  const openGoogleAnalytics = () => {
    window.open('https://analytics.google.com/analytics/web/#/p407123456/reports/intelligenthome', '_blank');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-all duration-200"
        title="Analytics Dashboard"
      >
        <FaChartLine className="text-xl" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">Analytics Dashboard</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
          <div className="flex items-center space-x-2">
            <FaUsers className="text-blue-600" />
            <span className="text-sm font-medium text-gray-700">Total Users</span>
          </div>
          <span className="text-lg font-bold text-blue-600">{analyticsData.totalUsers.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-green-50 rounded">
          <div className="flex items-center space-x-2">
            <FaEye className="text-green-600" />
            <span className="text-sm font-medium text-gray-700">Active Sessions</span>
          </div>
          <span className="text-lg font-bold text-green-600">{analyticsData.activeSessions}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
          <div className="flex items-center space-x-2">
            <FaTrophy className="text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Quiz Completions</span>
          </div>
          <span className="text-lg font-bold text-purple-600">{analyticsData.quizCompletions.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
          <div className="flex items-center space-x-2">
            <FaClock className="text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Avg Session Time</span>
          </div>
          <span className="text-lg font-bold text-orange-600">{analyticsData.averageSessionTime}m</span>
        </div>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <div className="flex items-center space-x-2">
          <FaGlobe className="text-gray-400" />
          <span>User ID: {getCurrentUserId().substring(0, 12)}...</span>
        </div>
        <div className="flex items-center space-x-2">
          <FaChartLine className="text-gray-400" />
          <span>Session: {getCurrentSessionId().substring(0, 12)}...</span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <button
          onClick={openGoogleAnalytics}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors duration-200"
        >
          Open Google Analytics
        </button>
        <p className="text-xs text-gray-500 text-center">
          Click to view detailed analytics in Google Analytics dashboard
        </p>
      </div>
    </div>
  );
} 