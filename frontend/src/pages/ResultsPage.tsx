import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { onValue, ref, remove } from "firebase/database";
import type { Room } from "../../../shared/types";
import { presenceManager } from "../api/presenceManager";
import { 
  FaTrophy, 
  FaCrown, 
  FaChartLine, 
  FaUsers, 
  FaHome,
  FaAward,
  FaClock,
  FaStar,
  FaSpinner
} from 'react-icons/fa';
import { 
  MdCelebration 
} from 'react-icons/md';
import { 
  IoSparklesSharp 
} from 'react-icons/io5';

export default function ResultsPage() {
  console.log('🚨 ResultsPage component is rendering!');
  
  const { id } = useParams<{ id: string }>();
  console.log('🔍 useParams id:', id, 'type:', typeof id);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const navigate = useNavigate();

  const playerId = localStorage.getItem("userId");
  console.log('🔍 playerId from localStorage:', playerId);

  // Fetch room data
  useEffect(() => {
    console.log('🔍 useEffect running with id:', id, 'playerId:', playerId);
    if (!id) {
      console.log('❌ No id provided, returning early');
      return;
    }

    console.log('🔍 ResultsPage: Setting up Firebase listener for room:', id);
    console.log('🔍 Firebase db object:', db);
    console.log('🔍 PlayerId:', playerId);
    
    const roomRef = ref(db, `rooms/${id}`);
    console.log('🔍 Room reference created:', roomRef);
    
    const unsub = onValue(roomRef, (snap) => {
      console.log('🔍 Firebase listener callback triggered');
      const data = snap.val();
      console.log('🔍 Firebase data received:', data);
      if (data) {
        console.log('✅ Setting room data:', Object.keys(data));
        setRoom(data);
        
        // Set up onDisconnect cleanup when room data loads (same pattern as LobbyPage/QuizPage)
        if (playerId && data.players && playerId in data.players) {
          console.log('🔍 Setting up presence manager (inside Firebase callback)');
          const currentPlayer = data.players[playerId];
          presenceManager.setupDisconnectCleanup(id, playerId, currentPlayer.isHost);
        }
      } else {
        console.log('❌ No room data - redirecting to home');
        // Room doesn't exist, redirect to home
        navigate("/");
      }
    }, (error) => {
      console.error('❌ Firebase listener error:', error);
    });

    console.log('🔍 Firebase listener setup complete');
    return () => {
      console.log('🔍 Cleaning up Firebase listener');
      unsub();
    };
  }, [id, playerId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      presenceManager.clearDisconnectHandlers();
    };
  }, []);

  // Enhanced navigation handler with proper cleanup
  const handleBackToHome = async () => {
    if (isLeaving) return; // Prevent double-clicks
    setIsLeaving(true);

    try {
      if (!playerId || !id || !room) {
        navigate("/");
        return;
      }
      
      const currentPlayer = room.players[playerId];
      if (!currentPlayer) {
        navigate("/");
        return;
      }

      if (currentPlayer.isHost) {
        // Host: Delete entire room
        console.log("🗑️ Host leaving results - deleting room", id);
        await remove(ref(db, `rooms/${id}`));
        console.log("✅ Room deleted successfully");
      } else {
        // Player: Remove only themselves
        console.log("👋 Player leaving results - removing from room", id);
        await remove(ref(db, `rooms/${id}/players/${playerId}`));
        console.log("✅ Player removed successfully");
      }
      
      // Clear onDisconnect handlers to prevent double-cleanup
      presenceManager.clearDisconnectHandlers();
      
    } catch (error) {
      console.error("❌ Error during cleanup:", error);
      // Still navigate to prevent user being stuck
    } finally {
      // Navigate after cleanup (or on error)
      navigate("/");
    }
  };

  if (!room) return <div className="p-4">Loading results...</div>;

  // Calculate player statistics
  const playersWithStats = Object.values(room.players).map((player) => {
    const answers = Object.values(player.answers || {});
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const totalAnswers = answers.length;
    const accuracy =
      totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Calculate average response time
    const totalResponseTime = answers.reduce(
      (sum, answer) => sum + answer.timeToAnswer,
      0
    );
    const avgResponseTime =
      totalAnswers > 0
        ? Math.round((totalResponseTime / totalAnswers / 1000) * 10) / 10
        : 0;

    return {
      ...player,
      correctAnswers,
      totalAnswers,
      accuracy,
      avgResponseTime,
    };
  });

  // Sort players by score (highest first)
  const sortedPlayers = [...playersWithStats].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isCurrentPlayerWinner = winner?.id === playerId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Winner Celebration Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative">
            {/* Celebration Animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className={`absolute w-1 h-1 sm:w-2 sm:h-2 bg-yellow-400 rounded-full animate-bounce`}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center justify-center mb-4">
              <MdCelebration className="text-3xl sm:text-4xl lg:text-5xl text-yellow-600 mr-2 sm:mr-3 animate-pulse" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">Quiz Complete!</h1>
              <MdCelebration className="text-3xl sm:text-4xl lg:text-5xl text-yellow-600 ml-2 sm:ml-3 animate-pulse" />
            </div>

            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 sm:p-6 rounded-2xl shadow-xl mb-4 sm:mb-6 transform hover:scale-105 transition-transform">
              <FaCrown className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 mx-auto animate-bounce" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Winner: {winner.nickname}</h2>
              <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3">
                <FaTrophy className="text-lg sm:text-xl lg:text-2xl" />
                <p className="text-lg sm:text-xl lg:text-2xl font-bold">{winner.score} points</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm opacity-90">
                <div className="flex items-center space-x-1">
                  <FaAward />
                  <span>{winner.accuracy}% accuracy</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FaClock />
                  <span>{winner.avgResponseTime}s avg response</span>
                </div>
              </div>
            </div>

            {isCurrentPlayerWinner && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 sm:px-6 py-3 sm:py-4 rounded-xl mb-4 animate-bounce">
                <div className="flex items-center justify-center space-x-2">
                  <IoSparklesSharp className="text-lg sm:text-xl lg:text-2xl" />
                  <span className="text-sm sm:text-base lg:text-lg font-bold">Congratulations! You won!</span>
                  <IoSparklesSharp className="text-lg sm:text-xl lg:text-2xl" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <FaChartLine className="text-2xl sm:text-3xl text-blue-600 mr-2 sm:mr-3" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Final Leaderboard</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-lg"
                    : index === 1
                    ? "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 shadow-md"
                    : index === 2
                    ? "bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-300 shadow-md"
                    : "bg-gray-50 border-gray-200"
                } ${player.id === playerId ? "ring-2 ring-blue-400" : ""}`}
                >
                <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                  <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-800 text-white font-bold text-sm sm:text-lg flex-shrink-0">
                    {index === 0 ? (
                      <FaCrown className="text-yellow-400" />
                    ) : index === 1 ? (
                      <FaAward className="text-gray-400" />
                    ) : index === 2 ? (
                      <FaStar className="text-orange-400" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base lg:text-lg font-bold text-gray-800 truncate">
                      {player.nickname}
                      {player.id === playerId && (
                        <span className="text-blue-600 font-medium text-xs sm:text-sm ml-1">(You)</span>
                      )}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-gray-600">
                      <span>{player.correctAnswers}/{player.totalAnswers} correct</span>
                      <span>{player.accuracy}% accuracy</span>
                      <span>{player.avgResponseTime}s avg</span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                    {player.score}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <FaUsers className="text-2xl sm:text-3xl text-green-600 mr-2 sm:mr-3" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Game Statistics</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 p-3 sm:p-4 rounded-xl text-center border border-blue-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600 mb-1">
                {room.questions.length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Questions</div>
            </div>
            <div className="bg-green-50 p-3 sm:p-4 rounded-xl text-center border border-green-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">
                {Object.keys(room.players).length}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Players</div>
            </div>
            <div className="bg-purple-50 p-3 sm:p-4 rounded-xl text-center border border-purple-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1 capitalize">
                {room.difficulty}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Difficulty</div>
            </div>
            <div className="bg-yellow-50 p-3 sm:p-4 rounded-xl text-center border border-yellow-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600 mb-1">
                {Math.round(
                  Object.values(room.players).reduce(
                    (sum, p) => sum + (Object.values(p.answers || {}).reduce((s, a) => s + a.timeToAnswer, 0) / Object.values(p.answers || {}).length || 0),
                    0
                  ) / Object.keys(room.players).length / 1000 * 10
                ) / 10}s
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Avg Time</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-3 sm:space-y-4">
          <button
            onClick={handleBackToHome}
            disabled={isLeaving}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg 
                       transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 
                       shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] sm:min-h-[56px] ${
              isLeaving 
                ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
            }`}
          >
            {isLeaving ? (
              <>
                <FaSpinner className="text-lg sm:text-xl animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <>
                <FaHome className="text-lg sm:text-xl" />
                <span>Back to Home</span>
              </>
            )}
          </button>

          <p className="text-xs sm:text-sm text-gray-500 px-4">
            Thanks for playing! Create another room to play again.
          </p>
        </div>
      </div>
    </div>
  );
}