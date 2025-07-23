import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../lib/firebase";
import { get, ref, remove } from "firebase/database";
import type { Room } from "../../../shared/types";
import { presenceManager } from "../api/presenceManager";
import LeaderboardChart from "../components/LeaderboardChart";
import { 
  FaTrophy, 
  FaCrown, 
  FaChartLine, 
  FaUsers, 
  FaHome,
  FaAward,
  FaClock,
  FaStar,
  FaSpinner,
  FaChartBar,
  FaList,
  FaPlus,
  FaUserFriends,
  FaLightbulb,
  FaCheckCircle,
  FaRocket
} from 'react-icons/fa';
import { 
  MdCelebration 
} from 'react-icons/md';
import { 
  IoSparklesSharp 
} from 'react-icons/io5';
import quizDojoLogo from "/logo-lockup.png";
import { useTranslation } from 'react-i18next';

export default function ResultsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [viewMode, setViewMode] = useState<'chart' | 'list'>('chart');
  const navigate = useNavigate();
  const { t } = useTranslation();

  const playerId = localStorage.getItem("userId");

  // Add CSS for confetti animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes confetti-fall {
        0% { opacity: 0; transform: translateY(-40px) rotate(0deg); }
        10% { opacity: 1; }
        100% { opacity: 0.7; transform: translateY(260px) rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch room data (one-time fetch, no listener)
  useEffect(() => {
    const fetchRoomData = async () => {
    if (!roomId) return;

      try {
    const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        const data = snapshot.val();
        
      if (data) {
        setRoom(data);
        } else {
          // Room doesn't exist, redirect to home
          navigate("/");
        }
      } catch (error) {
        console.error('❌ Error fetching room data:', error);
        navigate("/");
      }
    };

    fetchRoomData();
  }, [roomId, navigate]);

  // Enhanced navigation handler with proper cleanup
  const handleBackToHome = async () => {
    if (isLeaving) return; // Prevent double-clicks
    setIsLeaving(true);

    try {
      if (!playerId || !roomId || !room) {
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
        await remove(ref(db, `rooms/${roomId}`));
      } else {
        // Player: Remove only themselves
        await remove(ref(db, `rooms/${roomId}/players/${playerId}`));
      }
      
    } catch (error) {
      // Still navigate to prevent user being stuck
    } finally {
      // Navigate after cleanup (or on error)
      navigate("/");
    }
  };

  if (!room) return <div className="p-4">{t('Loading results...')}</div>;

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
  const maxScore = Math.max(...sortedPlayers.map(p => p.score));

  return (
    <div className="min-h-screen bg-[#FDF0DC] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Winner Celebration Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative">
            <div className="flex items-center justify-center mb-4">
              <MdCelebration className="text-3xl sm:text-4xl lg:text-5xl text-yellow-400 mr-2 sm:mr-3" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4E342E]">{t('Quiz Complete!')}</h1>
              <MdCelebration className="text-3xl sm:text-4xl lg:text-5xl text-yellow-400 ml-2 sm:ml-3" />
            </div>

            {/* Elegant Winner Card */}
            <div className="bg-[#F7E2C0] text-[#4E342E] p-4 sm:p-6 lg:p-8 rounded-2xl shadow-xl mb-4 sm:mb-6 relative overflow-hidden border-2 border-[#4E342E]">
              {/* Confetti is now inside the main card only */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {[...Array(24)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      left: `${Math.random() * 95}%`,
                      top: `${-10 + Math.random() * 10}px`,
                      width: `${10 + Math.random() * 16}px`,
                      height: `${3 + Math.random() * 5}px`,
                      backgroundColor: ['#F6D35B', '#F4B46D', '#F6D35B', '#F4B46D', '#F6D35B', '#F4B46D', '#F6D35B', '#F4B46D', '#F6D35B'][Math.floor(Math.random() * 9)],
                      borderRadius: '2px',
                      position: 'absolute',
                      opacity: 0.85,
                      animation: `confetti-fall ${1.8 + Math.random() * 1.8}s linear ${Math.random() * 1.5}s infinite`,
                      zIndex: 10,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-20">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <FaCrown className="text-4xl sm:text-5xl lg:text-6xl mb-3 sm:mb-4 text-yellow-600 animate-pulse" />
                </div>
                
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-3 sm:mb-4 text-center text-[#4E342E]">{t('Champion')}: {winner.nickname}</h2>
                
                <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
                  <FaTrophy className="text-2xl sm:text-3xl lg:text-4xl text-[#F6D35B]" />
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4E342E]">{winner.score} {t('points')}</p>
                </div>

                {/* Readable Statistics Grid (now with dojo colors) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white bg-opacity-90 p-2 sm:p-3 rounded-lg border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200 text-[#4E342E] font-semibold">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaAward className="text-sm sm:text-base text-[#F6D35B]" />
                      <span className="text-xs sm:text-sm font-semibold">{t('resultsAccuracy')}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{winner.accuracy}%</div>
                  </div>
                  <div className="bg-white bg-opacity-90 p-2 sm:p-3 rounded-lg border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200 text-[#4E342E] font-semibold">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaClock className="text-sm sm:text-base text-[#F6D35B]" />
                      <span className="text-xs sm:text-sm font-semibold">{t('resultsAvgTime')}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{winner.avgResponseTime}s</div>
                  </div>
                  <div className="bg-white bg-opacity-90 p-2 sm:p-3 rounded-lg border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200 text-[#4E342E] font-semibold">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaStar className="text-sm sm:text-base text-[#F6D35B]" />
                      <span className="text-xs sm:text-sm font-semibold">{t('resultsCorrect')}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{winner.correctAnswers}/{winner.totalAnswers}</div>
                  </div>
                  <div className="bg-white bg-opacity-90 p-2 sm:p-3 rounded-lg border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200 text-[#4E342E] font-semibold">
                    <div className="flex items-center justify-center space-x-1 mb-1">
                      <FaChartLine className="text-sm sm:text-base text-[#F6D35B]" />
                      <span className="text-xs sm:text-sm font-semibold">{t('resultsPosition')}</span>
                    </div>
                    <div className="text-lg sm:text-xl font-bold">{t('resultsFirstPlace')}</div>
                  </div>
                </div>

                {/* Readable Performance Highlights (same style, dojo colors) */}
                <div className="bg-white bg-opacity-90 p-3 sm:p-4 rounded-xl border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-[1.02] hover:shadow-lg transition-all duration-200 text-[#4E342E] font-semibold">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <IoSparklesSharp className="text-lg sm:text-xl text-[#F6D35B]" />
                    <span className="text-sm sm:text-base font-semibold">{t('resultsPerformanceHighlights')}</span>
                    <IoSparklesSharp className="text-lg sm:text-xl text-[#F6D35B]" />
                  </div>
                  <div className="text-xs sm:text-sm opacity-90 text-center">
                    {winner.accuracy >= 90 ? t('resultsPerfectAccuracy') : winner.accuracy >= 80 ? t('resultsExcellentAccuracy') : t('resultsGoodAccuracy')}
                    {winner.avgResponseTime <= 5 ? t('resultsLightningFast') : winner.avgResponseTime <= 10 ? t('resultsQuickThinking') : t('resultsSteadyPerformance')}
                    {winner.correctAnswers === winner.totalAnswers ? t('resultsFlawlessVictory') : winner.correctAnswers >= winner.totalAnswers * 0.8 ? t('resultsOutstandingPerformance') : t('resultsGreatEffort')}
                  </div>
                </div>
              </div>
            </div>

            {/* Runner-up Recognition */}
            {sortedPlayers.length > 1 && (
              <div className="bg-[#F7E2C0] p-3 sm:p-4 rounded-xl mb-4 border-2 border-[#6D4C41]">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <FaAward className="text-lg sm:text-xl text-[#6D4C41]" />
                  <span className="text-sm sm:text-base font-semibold text-[#4E342E]">{t('resultsRunnerUp')}: {sortedPlayers[1].nickname}</span>
                  <FaAward className="text-lg sm:text-xl text-[#6D4C41]" />
                </div>
                <div className="text-xs sm:text-sm text-[#6D4C41]">
                  {sortedPlayers[1].score} {t('points')} • {sortedPlayers[1].accuracy}% {t('resultsAccuracyLower')} • {sortedPlayers[1].avgResponseTime}s {t('resultsAvgTimeLower')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard with Toggle */}
        <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-[#4E342E]">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center mb-4 sm:mb-0">
              <FaChartLine className="text-2xl sm:text-3xl text-[#10A3A2] mr-2 sm:mr-3" />
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E]">{t('Final Leaderboard')}</h2>
            </div>
            
            {/* View Toggle */}
            <div className="flex bg-white rounded-lg p-1 border border-[#6D4C41]">
              <button
                onClick={() => setViewMode('chart')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'chart'
                    ? 'bg-[#10A3A2] text-white shadow-sm'
                    : 'text-[#6D4C41] hover:text-[#4E342E]'
                }`}
              >
                <FaChartBar className="text-sm" />
                <span>{t('resultsChart')}</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-[#10A3A2] text-white shadow-sm'
                    : 'text-[#6D4C41] hover:text-[#4E342E]'
                }`}
              >
                <FaList className="text-sm" />
                <span>{t('resultsList')}</span>
              </button>
            </div>
          </div>

          {/* Chart View */}
          <div className="relative ">
            <div className={`transition-all duration-500 ease-in-out ${viewMode === 'chart' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-4 absolute'}`}>
              {viewMode === 'chart' && (
                <LeaderboardChart
                  players={sortedPlayers}
                  currentPlayerId={playerId}
                  maxScore={maxScore}
                />
              )}
            </div>

            {/* List View (Original) */}
            <div className={`transition-all duration-500 ease-in-out ${viewMode === 'list' ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform -translate-x-4 absolute'}`}>
              {viewMode === 'list' && (
                <div className="space-y-2">
                  {sortedPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-lg border-2 transition-all duration-300 ${
                        index === 0
                          ? "bg-[#F6D35B] border-[#F4B46D] shadow-lg"
                          : index === 1
                          ? "bg-white border-[#6D4C41] shadow-md"
                          : index === 2
                          ? "bg-[#F4B46D] border-[#F6D35B] shadow-md"
                          : "bg-white border-[#6D4C41]"
                      } ${player.id === playerId ? "ring-2 ring-[#10A3A2]" : ""}`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4E342E] text-white font-bold text-sm flex-shrink-0">
                          {index === 0 ? (
                            <FaCrown className="text-[#F6D35B]" />
                          ) : index === 1 ? (
                            <FaAward className="text-[#6D4C41]" />
                          ) : index === 2 ? (
                            <FaStar className="text-[#F4B46D]" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-semibold truncate ${
                              player.id === playerId ? 'text-[#4E342E]' : 'text-[#4E342E]'
                            }`}>
                              {player.nickname}
                              {player.id === playerId && (
                                <span className="font-medium ml-1 text-[#10A3A2]">{t('(You)')}</span>
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-[#6D4C41]">
                            <span>{player.correctAnswers}/{player.totalAnswers} {t('resultsCorrectLower')}</span>
                            <span>{player.accuracy}% {t('resultsAccuracyLower')}</span>
                            <span>{player.avgResponseTime}s {t('resultsAvgTimeLower')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="flex items-center space-x-1">
                          <FaTrophy className="text-[#F6D35B] text-xs" />
                          <span className="text-sm font-bold text-[#4E342E]">{player.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Statistics */}
        <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8 border-2 border-[#4E342E]">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <FaUsers className="text-2xl sm:text-3xl text-[#10A3A2] mr-2 sm:mr-3" />
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E]">{t('Game Statistics')}</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-xl text-center border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E] mb-1">
                {room.questions.length}
              </div>
              <div className="text-xs sm:text-sm text-[#6D4C41] group-hover:text-[#4E342E] transition-colors duration-300">{t('resultsQuestions')}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl text-center border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E] mb-1">
                {Object.keys(room.players).length}
              </div>
              <div className="text-xs sm:text-sm text-[#6D4C41] group-hover:text-[#4E342E] transition-colors duration-300">{t('Players')}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl text-center border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E] mb-1 capitalize">
                {room.difficulty}
              </div>
              <div className="text-xs sm:text-sm text-[#6D4C41] group-hover:text-[#4E342E] transition-colors duration-300">{t('difficulty')}</div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-xl text-center border-2 border-[#6D4C41] hover:bg-opacity-100 hover:scale-105 hover:shadow-lg transition-all duration-200">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#4E342E] mb-1 ">
                {Math.round(
                  Object.values(room.players).reduce(
                    (sum, p) => sum + (Object.values(p.answers || {}).reduce((s, a) => s + a.timeToAnswer, 0) / Object.values(p.answers || {}).length || 0),
                    0
                  ) / Object.keys(room.players).length / 1000 * 10
                ) / 10}s
              </div>
              <div className="text-xs sm:text-sm text-[#6D4C41] group-hover:text-[#4E342E] transition-colors duration-300">{t('resultsAvgTime')}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <button
              onClick={handleBackToHome}
              disabled={isLeaving}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg 
                         transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 
                         shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] sm:min-h-[56px] ${
                isLeaving 
                  ? "bg-[#6D4C41] text-[#F7E2C0] cursor-not-allowed"
                  : "bg-[#10A3A2] text-white hover:bg-[#05717B]"
              }`}
            >
              {isLeaving ? (
                <>
                  <FaSpinner className="text-lg sm:text-xl animate-spin" />
                  <span>{t('Leaving...')}</span>
                </>
              ) : (
                <>
                  <FaHome className="text-lg sm:text-xl" />
                  <span>{t('backToHome')}</span>
                </>
              )}
            </button>
            
            <Link
              to="/create-room"
              className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg 
                       transition-all duration-300 flex items-center justify-center space-x-2 sm:space-x-3 
                       shadow-lg hover:shadow-xl transform hover:scale-105 min-h-[48px] sm:min-h-[56px]
                       bg-[#F4B46D] text-[#4E342E] hover:bg-[#F6D35B] cursor-pointer"
            >
              <FaRocket className="text-lg sm:text-xl" />
              <span>{t('New Quiz')}</span>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-[#6D4C41] px-4">
            {t('Thanks for playing! Create another room to play again.')}
          </p>
        </div>
      </div>
    </div>
  );
}