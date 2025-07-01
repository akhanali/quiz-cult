import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { joinRoom } from "../api/joinRoom";
import { presenceManager } from "../api/presenceManager";
import { 
  FaUserFriends, 
  FaDoorOpen, 
  FaUser, 
  FaGamepad,
  FaHome,
  FaSpinner
} from 'react-icons/fa';
import { MdQuiz } from 'react-icons/md';

export default function JoinRoomPage() {
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nav = useNavigate();

  async function handleJoin() {
    if (!roomCode.trim() || !nickname.trim()) {
      setError("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      const roomData = await joinRoom(roomCode, nickname);
      localStorage.setItem("userId", roomData.playerId);
      
      // Set up onDisconnect for the player immediately after joining
      presenceManager.setupDisconnectCleanup(roomData.foundRoomId, roomData.playerId, false);
      
      nav(`/room/${roomData.foundRoomId}`);
    } catch (err: unknown) {
      console.error("Error joining room:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to join room";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleJoin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <MdQuiz className="text-4xl sm:text-5xl text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">QuizCult</h1>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FaUserFriends className="text-xl sm:text-2xl text-purple-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Join Room</h2>
            </div>
            <p className="text-sm sm:text-base text-gray-600 px-4">
              Enter a room code to join an existing quiz
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              {/* Room Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FaDoorOpen className="text-blue-600 mr-2" />
                  Room Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit room code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 
                           focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-300
                           text-center text-base sm:text-lg font-mono tracking-widest placeholder-gray-400
                           min-h-[48px] sm:min-h-[56px]"
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Room codes are 6 characters long
                </p>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <FaUser className="text-green-600 mr-2" />
                  Your Nickname
                </label>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl focus:border-green-500 
                           focus:ring-2 focus:ring-green-100 outline-none transition-all duration-300
                           placeholder-gray-400 text-base sm:text-lg min-h-[48px] sm:min-h-[56px]"
                  disabled={isLoading}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is how other players will see you
                </p>
              </div>

              {/* Join Button */}
              <button 
                onClick={handleJoin} 
                disabled={isLoading || !roomCode.trim() || !nickname.trim()}
                className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 
                          flex items-center justify-center space-x-2 sm:space-x-3 shadow-lg hover:shadow-xl
                          transform hover:scale-105 min-h-[48px] sm:min-h-[56px] ${
                  isLoading || !roomCode.trim() || !nickname.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed transform-none hover:scale-100 hover:shadow-lg' 
                    : 'bg-gradient-to-r from-green-600 to-blue-600 text-white hover:from-green-700 hover:to-blue-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <FaSpinner className="text-lg sm:text-xl animate-spin" />
                    <span>Joining Room...</span>
                  </>
                ) : (
                  <>
                    <FaGamepad className="text-lg sm:text-xl" />
                    <span>Join Quiz Room</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 flex items-center">
              <FaUserFriends className="text-purple-600 mr-2" />
              How to Join
            </h3>
            <div className="space-y-2 text-gray-600 text-sm sm:text-base">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                <p>Get a room code from the quiz host</p>
              </div>
              <div className="flex items-start">
                <span className="bg-green-100 text-green-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <p>Enter the code and choose your nickname</p>
              </div>
              <div className="flex items-start">
                <span className="bg-purple-100 text-purple-600 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <p>Click "Join Quiz Room" to enter the lobby</p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 
                       transition-colors duration-300 font-medium text-sm sm:text-base py-2 px-4 rounded-lg hover:bg-white/50"
            >
              <FaHome className="text-base sm:text-lg" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
