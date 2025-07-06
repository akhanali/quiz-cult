import { useState } from 'react';
import { FaCrown, FaAward, FaStar, FaTrophy } from 'react-icons/fa';

interface Player {
  id: string;
  nickname: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  accuracy: number;
  avgResponseTime: number;
}

interface LeaderboardChartProps {
  players: Player[];
  currentPlayerId: string | null;
  maxScore: number;
}

export default function LeaderboardChart({ players, currentPlayerId, maxScore }: LeaderboardChartProps) {
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);

  const getPlayerBarStyle = (player: Player, index: number) => {
    const barWidth = maxScore > 0 ? (player.score / maxScore) * 100 : 0;
    
    let barColor = 'bg-gray-300';
    let borderColor = 'border-gray-400';
    
    if (player.id === currentPlayerId) {
      barColor = 'bg-blue-500';
      borderColor = 'border-blue-600';
    } else if (index === 0) {
      barColor = 'bg-gradient-to-r from-yellow-400 to-yellow-500';
      borderColor = 'border-yellow-600';
    } else if (index === 1) {
      barColor = 'bg-gradient-to-r from-gray-400 to-gray-500';
      borderColor = 'border-gray-600';
    } else if (index === 2) {
      barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';
      borderColor = 'border-orange-600';
    }

    return {
      width: `${barWidth}%`,
      backgroundColor: barColor,
      borderColor: borderColor
    };
  };

  const getPositionIcon = (index: number) => {
    if (index === 0) return <FaCrown className="text-yellow-500" />;
    if (index === 1) return <FaAward className="text-gray-500" />;
    if (index === 2) return <FaStar className="text-orange-500" />;
    return null;
  };

  return (
    <div className="space-y-2">
      {players.map((player, index) => (
        <div
          key={player.id}
          className="relative group"
          onMouseEnter={() => setHoveredPlayer(player.id)}
          onMouseLeave={() => setHoveredPlayer(null)}
        >
          <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
            
            {/* Position and Icon */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex-shrink-0">
              {getPositionIcon(index) || (
                <span className="text-sm font-bold text-gray-600">{index + 1}</span>
              )}
            </div>

            {/* Player Name */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold truncate ${
                  player.id === currentPlayerId ? 'text-[#4E342E]' : 'text-gray-800'
                }`}>
                  {player.nickname}
                  {player.id === currentPlayerId && (
                    <span className="font-medium ml-1 text-[#4E342E]">(You)</span>
                  )}
                </span>
              </div>
            </div>

            {/* Score Bar */}
            <div className="flex-1 max-w-xs">
              <div className="relative h-6 bg-gray-200 rounded-full border border-gray-300 overflow-hidden">
                <div
                  className="h-full rounded-full border-2 transition-all duration-300 ease-out"
                  style={getPlayerBarStyle(player, index)}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-800 drop-shadow-sm">
                    {player.score}
                  </span>
                </div>
              </div>
            </div>

            {/* Score Display */}
            <div className="text-right flex-shrink-0">
              <div className="flex items-center space-x-1">
                <FaTrophy className="text-yellow-500 text-xs" />
                <span className="text-sm font-bold text-gray-800">{player.score}</span>
              </div>
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredPlayer === player.id && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="font-semibold text-gray-600">Accuracy:</span>
                  <span className="ml-1 text-gray-800">{player.accuracy}%</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Correct:</span>
                  <span className="ml-1 text-gray-800">{player.correctAnswers}/{player.totalAnswers}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Avg Time:</span>
                  <span className="ml-1 text-gray-800">{player.avgResponseTime}s</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-600">Position:</span>
                  <span className="ml-1 text-gray-800">{index + 1} of {players.length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 