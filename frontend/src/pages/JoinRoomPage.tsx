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
import quizDojoLogo from '../assets/quiz-dojo-simple-logo.png';

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
      
      nav(`/lobby/${roomData.foundRoomId}`);
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
    <div className="min-h-screen bg-[#FDF0DC]">
      <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="max-w-md mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <img 
                src={quizDojoLogo} 
                alt="Quiz Dojo" 
                className="h-10 sm:h-12 w-auto"
              />
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FaUserFriends className="text-xl sm:text-2xl text-[#10A3A2]" />
              <h2 className="text-xl sm:text-2xl font-bold text-[#4E342E]">Join Room</h2>
            </div>
            <p className="text-sm sm:text-base text-[#6D4C41] px-4">
              Enter a room code to join an existing quiz
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-6 sm:p-8 mb-6 border border-[#4E342E]/20">
            {/* Error Message */}
            {error && (
              <div className="bg-[#F4B46D]/20 border border-[#F4B46D] text-[#4E342E] px-4 py-3 rounded-lg mb-6 flex items-center">
                <div className="flex-1">
                  <p className="font-medium text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              {/* Room Code Input */}
              <div>
                <label className="block text-sm font-semibold text-[#4E342E] mb-2 flex items-center">
                  <FaDoorOpen className="text-[#10A3A2] mr-2" />
                  Room Code
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit room code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-[#4E342E]/30 rounded-xl focus:border-[#10A3A2] 
                           focus:ring-2 focus:ring-[#10A3A2]/20 outline-none transition-all duration-300
                           text-center text-base sm:text-lg font-mono tracking-widest placeholder-[#6D4C41]/60
                           min-h-[48px] sm:min-h-[56px] bg-[#FDF0DC] text-[#4E342E]"
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-[#6D4C41] mt-1 text-center">
                  Room codes are 6 characters long
                </p>
              </div>

              {/* Nickname Input */}
              <div>
                <label className="block text-sm font-semibold text-[#4E342E] mb-2 flex items-center">
                  <FaUser className="text-[#F6D35B] mr-2" />
                  Your Nickname
                </label>
                <input
                  type="text"
                  placeholder="Enter your display name"
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-[#4E342E]/30 rounded-xl focus:border-[#10A3A2] 
                           focus:ring-2 focus:ring-[#10A3A2]/20 outline-none transition-all duration-300
                           placeholder-[#6D4C41]/60 text-base sm:text-lg min-h-[48px] sm:min-h-[56px] bg-[#FDF0DC] text-[#4E342E]"
                  disabled={isLoading}
                  maxLength={20}
                />
                <p className="text-xs text-[#6D4C41] mt-1">
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
                    ? 'bg-[#6D4C41] text-[#FDF0DC] cursor-not-allowed transform-none hover:scale-100 hover:shadow-lg' 
                    : 'bg-[#10A3A2] hover:bg-[#05717B] text-white'
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
          <div className="bg-[#F7E2C0] rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-[#4E342E]/20">
            <h3 className="text-base sm:text-lg font-bold text-[#4E342E] mb-3 flex items-center">
              <FaUserFriends className="text-[#10A3A2] mr-2" />
              How to Join
            </h3>
            <div className="space-y-2 text-[#6D4C41] text-sm sm:text-base">
              <div className="flex items-start">
                <span className="bg-[#10A3A2]/20 text-[#10A3A2] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                <p>Get a room code from the quiz host</p>
              </div>
              <div className="flex items-start">
                <span className="bg-[#F6D35B]/30 text-[#F6D35B] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <p>Enter the code and choose your nickname</p>
              </div>
              <div className="flex items-start">
                <span className="bg-[#F4B46D]/30 text-[#F4B46D] w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <p>Click "Join Quiz Room" to enter the lobby</p>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center space-x-2 text-[#6D4C41] hover:text-[#4E342E] 
                       transition-colors duration-300 font-medium text-sm sm:text-base py-2 px-4 rounded-lg hover:bg-[#F7E2C0]/50"
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