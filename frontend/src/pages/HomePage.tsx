import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { presenceManager } from '../api/presenceManager';
import { 
  FaPlus, 
  FaUserFriends, 
  FaRobot, 
  FaChartLine, 
  FaClock, 
  FaTrophy,
  FaGamepad,
  FaLightbulb
} from 'react-icons/fa';
import { IoSparklesSharp } from 'react-icons/io5';
import { MdQuiz } from 'react-icons/md';

export default function HomePage() {
  // Clear any existing disconnect handlers when returning to home page
  useEffect(() => {
    presenceManager.clearDisconnectHandlers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Main Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="flex items-center justify-center mb-4">
              <MdQuiz className="text-4xl sm:text-5xl lg:text-6xl text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800">
                QuizCult
              </h1>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-2 px-4">
              The Ultimate AI-Powered Quiz Experience
            </p>
            <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto px-4">
              Create custom quizzes on any topic, compete with friends in real-time, 
              and track your performance with detailed analytics
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 px-4">
            <Link 
              to="/create-room" 
              className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl 
                         shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 
                         flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold
                         min-h-[48px] sm:min-h-[56px]"
            >
              <FaPlus className="text-lg sm:text-xl group-hover:rotate-90 transition-transform duration-300" />
              <span>Create Room</span>
            </Link>
            
            <Link 
              to="/join-room" 
              className="group bg-white text-blue-600 border-2 border-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl 
                         shadow-lg hover:shadow-xl hover:bg-blue-50 transform hover:scale-105 
                         transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 text-base sm:text-lg font-semibold
                         min-h-[48px] sm:min-h-[56px]"
            >
              <FaUserFriends className="text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300" />
              <span>Join Room</span>
            </Link>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12 sm:mb-16 px-4">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-blue-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaRobot className="text-2xl sm:text-3xl text-blue-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">AI-Powered</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Generate unique questions on any topic using advanced AI technology
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-green-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaGamepad className="text-2xl sm:text-3xl text-green-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Real-Time</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Compete with friends in live multiplayer quiz sessions
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-yellow-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaLightbulb className="text-2xl sm:text-3xl text-yellow-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Smart Difficulty</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Choose from Easy, Medium, or Hard difficulty levels
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center hover:shadow-xl transition-shadow duration-300">
              <div className="bg-purple-100 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <FaChartLine className="text-2xl sm:text-3xl text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Analytics</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track performance with detailed stats and leaderboards
              </p>
            </div>
          </div>

          {/* Key Benefits Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 sm:mb-12 mx-4">
            <div className="text-center mb-6 sm:mb-8">
              <div className="flex items-center justify-center mb-4">
                <IoSparklesSharp className="text-3xl sm:text-4xl text-purple-600 mr-2" />
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Why Choose QuizCult?</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaClock className="text-3xl sm:text-4xl text-blue-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Host Control</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Full control over quiz pacing with mid-game scoreboards and dynamic timing
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTrophy className="text-3xl sm:text-4xl text-green-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Competitive</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Time-based scoring system with live leaderboards and celebration animations
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-50 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaUserFriends className="text-3xl sm:text-4xl text-purple-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">Social</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Easy room sharing with codes, multiplayer support, and engaging gameplay
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Footer */}
          <div className="text-center px-4">
            <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white rounded-xl p-4 sm:p-6 inline-block">
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
                <div className="flex items-center space-x-2">
                  <FaRobot className="text-blue-400" />
                  <span>AI Questions</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaGamepad className="text-green-400" />
                  <span>Real-time Play</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaChartLine className="text-purple-400" />
                  <span>Performance Tracking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaTrophy className="text-yellow-400" />
                  <span>Competitive Scoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}