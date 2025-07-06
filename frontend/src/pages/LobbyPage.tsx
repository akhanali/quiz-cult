import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../lib/firebase";
import { onValue, ref } from "firebase/database";
import type { Room, Player, DifficultyLevel } from "../../../shared/types";
import { startGame } from "../api/startGame";
import { useNavigate } from "react-router-dom";
import { presenceManager } from "../api/presenceManager";
import { 
  FaUsers, 
  FaCrown, 
  FaUser, 
  FaClock, 
  FaRocket,
  FaQuestionCircle,
  FaCopy,
  FaCheckCircle
} from 'react-icons/fa';
import { 
  MdQuiz, 
  MdTopic,
  MdAccessTime 
} from 'react-icons/md';
import { 
  IoSparklesSharp 
} from 'react-icons/io5';

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    if (room?.status === "active") {
      // Clear disconnect handlers before navigating to quiz
      presenceManager.clearDisconnectHandlers();
      navigate(`/quiz/${room.id}`);
    }
  }, [room?.status, room?.id, navigate]);

  useEffect(() => {
    if (!id) return;

    const roomRef = ref(db, `rooms/${id}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRoom(data);
        const playerId = localStorage.getItem("userId");
        if (playerId && data.players && playerId in data.players) {
          const currentPlayer = data.players[playerId];
          setPlayer(currentPlayer);
          
          // Set up onDisconnect cleanup for this user
          presenceManager.setupDisconnectCleanup(id, playerId, currentPlayer.isHost);
        }
      } else {
        // Room was deleted (probably host disconnected)
        console.log("Room no longer exists, redirecting to home");
        navigate("/");
      }
    });

    return () => {
      unsubscribe();
      // Don't clear disconnect handlers here - only clear when legitimately navigating
    };
  }, [id, navigate]);

  // Cleanup on component unmount (but not on legitimate navigation)
  useEffect(() => {
    return () => {
      // Only clear if we're not navigating to quiz (legitimate navigation)
      if (!room || room.status !== "active") {
        presenceManager.clearDisconnectHandlers();
      }
    };
  }, [room]);
  
  // Add validation for the room ID with better debugging - AFTER all hooks
  if (!id) {
    return <div className="p-4 text-red-500">No room ID provided in URL.</div>;
  }
  
  if (typeof id !== 'string') {
    console.error("Room ID is not a string:", typeof id, id);
    return <div className="p-4 text-red-500">Invalid room ID type. Please check your URL.</div>;
  }
  
  if (id === '[object Object]' || id.includes('[object') || id.includes('undefined')) {
    console.error("Room ID appears to be an object or undefined:", id);
    return <div className="p-4 text-red-500">Invalid room ID format. Please try creating or joining the room again.</div>;
  }
  
  console.log("Room ID from useParams:", id);

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading room...</p>
        </div>
      </div>
    );
  }

  // Difficulty display helper
  const getDifficultyDisplay = (difficulty: DifficultyLevel) => {
    const difficultyMap = {
      easy: { 
        label: 'Easy', 
        time: '10-15s per question', 
        color: 'text-green-600 bg-green-50 border-green-200',
        iconColor: 'text-green-600'
      },
      medium: { 
        label: 'Medium', 
        time: '15-25s per question', 
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        iconColor: 'text-yellow-600'
      },
      hard: { 
        label: 'Hard', 
        time: '30+ per question', 
        color: 'text-red-600 bg-red-50 border-red-200',
        iconColor: 'text-red-600'
      }
    };
    return difficultyMap[difficulty];
  };

  const difficultyInfo = getDifficultyDisplay(room.difficulty);

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy room code:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-4">
              <MdQuiz className="text-4xl sm:text-5xl text-blue-600 mr-2 sm:mr-3" />
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">Quiz Lobby</h1>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FaUsers className="text-xl sm:text-2xl text-purple-600" />
              <p className="text-lg sm:text-xl text-gray-600">Waiting for players to join...</p>
            </div>
          </div>

          {/* Room Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Room Code */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center border border-blue-100">
              <div className="flex items-center justify-center mb-3">
                <FaCopy className="text-xl sm:text-2xl text-blue-600 mr-2" />
                <h3 className="text-base sm:text-lg font-bold text-blue-800">Room Code</h3>
              </div>
              <div className="relative">
                <p className="text-2xl sm:text-3xl font-bold text-blue-600 font-mono tracking-wider mb-3">
                  {room.roomCode}
                </p>
                <button
                  onClick={copyRoomCode}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 sm:px-4 py-2 rounded-lg 
                           transition-colors duration-300 flex items-center space-x-2 mx-auto text-sm sm:text-base"
                >
                  {copiedCode ? (
                    <>
                      <FaCheckCircle className="text-green-600" />
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <FaCopy />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Topic */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center border border-purple-100">
              <div className="flex items-center justify-center mb-3">
                <MdTopic className="text-xl sm:text-2xl text-purple-600 mr-2" />
                <h3 className="text-base sm:text-lg font-bold text-purple-800">Topic</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 break-words">{room.topic}</p>
            </div>

            {/* Difficulty */}
            <div className={`bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center border ${
              difficultyInfo.color.includes('green') ? 'border-green-100' : 
              difficultyInfo.color.includes('yellow') ? 'border-yellow-100' : 'border-red-100'
            }`}>
              <div className="flex items-center justify-center mb-3">
                {difficultyInfo.label === 'Easy' && <FaCheckCircle className={`text-xl sm:text-2xl mr-2 ${difficultyInfo.iconColor}`} />}
                {difficultyInfo.label === 'Medium' && <FaClock className={`text-xl sm:text-2xl mr-2 ${difficultyInfo.iconColor}`} />}
                {difficultyInfo.label === 'Hard' && <FaRocket className={`text-xl sm:text-2xl mr-2 ${difficultyInfo.iconColor}`} />}
                <h3 className="text-base sm:text-lg font-bold">Difficulty</h3>
              </div>
              <div className="space-y-1">
                <p className="text-xl sm:text-2xl font-bold">{difficultyInfo.label}</p>
                <p className="text-xs sm:text-sm opacity-75">{difficultyInfo.time}</p>
              </div>
            </div>
          </div>

          {/* Questions Count */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center justify-center space-x-3">
              <FaQuestionCircle className="text-2xl sm:text-3xl text-gray-600" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{room.totalQuestions} Questions</p>
                <p className="text-sm sm:text-base text-gray-600">Ready to challenge you</p>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-100">
            <div className="flex items-center mb-4 sm:mb-6">
              <FaUsers className="text-xl sm:text-2xl text-gray-700 mr-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                Players ({Object.keys(room.players).length})
              </h3>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {Object.values(room.players).map((roomPlayer: Player) => (
                <div 
                  key={roomPlayer.id}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                    roomPlayer.isHost 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 shadow-md' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      roomPlayer.isHost ? 'bg-yellow-200' : 'bg-blue-100'
                    }`}>
                      {roomPlayer.isHost ? (
                        <FaCrown className="text-lg sm:text-2xl text-yellow-600" />
                      ) : (
                        <FaUser className="text-lg sm:text-2xl text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-base sm:text-lg font-bold text-gray-800 block truncate">
                        {roomPlayer.nickname}
                      </span>
                      {roomPlayer.id === player?.id && (
                        <span className="text-blue-600 font-medium text-sm">(You)</span>
                      )}
                    </div>
                  </div>
                  {roomPlayer.isHost && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="bg-yellow-200 text-yellow-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1">
                        <FaCrown className="text-xs" />
                        <span className="hidden sm:inline">Host</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Section */}
          <div className="text-center">
            {/* Start Game Button (Host Only) */}
            {room &&
              player &&
              player.id === room.hostId &&
              room.status === "waiting" && (
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-green-100">
                  <div className="flex items-center justify-center mb-4">
                    <IoSparklesSharp className="text-2xl sm:text-3xl text-green-600 mr-2" />
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Ready to Start?</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
                    All players are waiting for you to begin the quiz!
                  </p>
                  <button 
                    onClick={() => startGame(room.id)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 
                             text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 
                             text-base sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105
                             flex items-center space-x-2 sm:space-x-3 mx-auto min-h-[48px] sm:min-h-[56px]"
                  >
                    <FaRocket className="text-lg sm:text-2xl" />
                    <span>Start Quiz</span>
                  </button>
                  <p className="text-gray-500 text-xs sm:text-sm mt-3">
                    Only the host can start the quiz
                  </p>
                </div>
              )}

            {/* Waiting Message (Non-Host) */}
            {room &&
              player &&
              player.id !== room.hostId &&
              room.status === "waiting" && (
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-blue-100">
                  <div className="flex items-center justify-center mb-4">
                    <MdAccessTime className="text-2xl sm:text-3xl text-blue-600 mr-2 animate-pulse" />
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800">Almost Ready!</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600 text-lg mb-4">
                    Waiting for the host to start the quiz...
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-blue-600">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}