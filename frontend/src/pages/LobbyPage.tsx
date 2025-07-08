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
import quizDojoLogo from '/logo-lockup.png';
import { useTranslation } from 'react-i18next';

export default function LobbyPage() {
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const { t } = useTranslation();

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
      <div className="min-h-screen bg-[#FDF0DC] flex items-center justify-center">
        <div className="bg-[#F7E2C0] rounded-2xl shadow-xl p-8 text-center border border-[#4E342E]/20">
          <div className="animate-spin w-12 h-12 border-4 border-[#10A3A2] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-[#6D4C41] text-lg">{t('Loading room...')}</p>
        </div>
      </div>
    );
  }

  // Difficulty display helper
  const getDifficultyDisplay = (difficulty: DifficultyLevel) => {
    const difficultyMap = {
      easy: { 
        label: t('easyTitle'), 
        time: t('easyTime'), 
        color: 'text-[#10A3A2] bg-[#10A3A2]/10 border-[#10A3A2]/30',
        iconColor: 'text-[#10A3A2]'
      },
      medium: { 
        label: t('mediumTitle'), 
        time: t('mediumTime'), 
        color: 'text-[#F6D35B] bg-[#F6D35B]/10 border-[#F6D35B]/30',
        iconColor: 'text-[#F6D35B]'
      },
      hard: { 
        label: t('hardTitle'), 
        time: t('hardTime'), 
        color: 'text-[#F4B46D] bg-[#F4B46D]/10 border-[#F4B46D]/30',
        iconColor: 'text-[#F4B46D]'
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
    <div className="min-h-screen bg-[#FDF0DC]">
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-6">
              <img
                src={quizDojoLogo}
                alt="Quiz Dojo logo"
                className="h-12 sm:h-16 lg:h-20 w-auto"
              />
              <span className="dojo-title ml-3 text-3xl sm:text-4xl font-bold text-[#4E342E]" style={{ fontFamily: 'Baloo 2, cursive' }}>Quiz Dojo</span>
            </div>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <FaUsers className="text-xl sm:text-2xl text-[#10A3A2]" />
              <p className="text-lg sm:text-xl text-[#6D4C41]">{t('Waiting for players to join...', 'Waiting for players to join...')}</p>
            </div>
          </div>

          {/* Room Info Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {/* Room Code */}
            <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-4 sm:p-6 text-center border border-[#4E342E]/20">
              <div className="flex items-center justify-center mb-3">
                <FaCopy className="text-xl sm:text-2xl text-[#10A3A2] mr-2" />
                <h3 className="text-base sm:text-lg font-bold text-[#4E342E] mb-3">{t('roomCode', 'Room Code')}</h3>
              </div>
              <div className="relative">
                <p className="text-2xl sm:text-3xl font-bold text-[#10A3A2] font-mono tracking-wider mb-3">
                  {room.roomCode}
                </p>
                <button
                  onClick={copyRoomCode}
                  className="bg-[#10A3A2]/20 hover:bg-[#10A3A2]/30 text-[#10A3A2] px-3 sm:px-4 py-2 rounded-lg 
                           transition-colors duration-300 flex items-center space-x-2 mx-auto text-sm sm:text-base border border-[#10A3A2]/30"
                >
                  {copiedCode ? (
                    <>
                      <FaCheckCircle className="text-[#F6D35B]" />
                      <span className="text-[#F6D35B]">Copied!</span>
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
            <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-4 sm:p-6 text-center border border-[#4E342E]/20">
              <div className="flex items-center justify-center mb-3">
                <MdTopic className="text-xl sm:text-2xl text-[#05717B] mr-2" />
                <h3 className="text-base sm:text-lg font-bold text-[#4E342E]">{t('quizTopic')}</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[#05717B] break-words">{room.topic}</p>
            </div>

            {/* Difficulty */}
            <div className={`bg-[#F7E2C0] rounded-2xl shadow-lg p-4 sm:p-6 text-center border border-[#4E342E]/20`}>
              <div className="flex items-center justify-center mb-3">
                {difficultyInfo.label === 'Easy' && <FaCheckCircle className="text-xl sm:text-2xl mr-2 text-[#10A3A2]" />}
                {difficultyInfo.label === 'Medium' && <FaClock className="text-xl sm:text-2xl mr-2 text-[#05717B]" />}
                {difficultyInfo.label === 'Hard' && <FaRocket className="text-xl sm:text-2xl mr-2 text-[#F4B46D]" />}
                <h3 className="text-base sm:text-lg font-bold text-[#4E342E]">{t('difficulty')}</h3>
              </div>
              <div className="space-y-1">
                <p className={`text-xl sm:text-2xl font-bold ${
                  difficultyInfo.label === 'Easy' ? 'text-[#10A3A2]' :
                  difficultyInfo.label === 'Medium' ? 'text-[#05717B]' :
                  'text-[#F4B46D]'
                }`}>{difficultyInfo.label}</p>
                <p className="text-xs sm:text-sm text-[#6D4C41]">{difficultyInfo.time}</p>
              </div>
            </div>
          </div>

          {/* Questions Count */}
          <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-[#4E342E]/20">
            <div className="flex items-center justify-center space-x-3">
              <FaQuestionCircle className="text-2xl sm:text-3xl text-[#F4B46D]" />
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-[#4E342E]">{room.totalQuestions} {t('numberOfQuestions')}</p>
                <p className="text-sm sm:text-base text-[#6D4C41]">{t('Ready to challenge you')}</p>
              </div>
            </div>
          </div>

          {/* Players Section */}
          <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8 border border-[#4E342E]/20">
            <div className="flex items-center mb-4 sm:mb-6">
              <FaUsers className="text-xl sm:text-2xl text-[#10A3A2] mr-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-[#4E342E]">
                {t('Players')} ({Object.keys(room.players).length})
              </h3>
            </div>
            
            <div className="grid gap-3 sm:gap-4">
              {Object.values(room.players).map((roomPlayer: Player) => (
                <div 
                  key={roomPlayer.id}
                  className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                    roomPlayer.isHost 
                      ? 'bg-[#F4B46D]/30 border-[#F4B46D]/60 shadow-md' 
                      : 'bg-[#FDF0DC] border-[#4E342E]/30 hover:border-[#4E342E]/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      roomPlayer.isHost ? 'bg-[#F4B46D]/40' : 'bg-[#10A3A2]/20'
                    }`}>
                      {roomPlayer.isHost ? (
                        <FaCrown className="text-lg sm:text-2xl text-[#F4B46D]" />
                      ) : (
                        <FaUser className="text-lg sm:text-2xl text-[#10A3A2]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-base sm:text-lg font-bold text-[#4E342E] block truncate">
                        {roomPlayer.nickname}
                      </span>
                      {roomPlayer.id === player?.id && (
                        <span className="text-[#10A3A2] font-medium text-sm">(You)</span>
                      )}
                    </div>
                  </div>
                  {roomPlayer.isHost && (
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <div className="bg-[#F4B46D]/50 text-[#4E342E] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center space-x-1 border border-[#F4B46D]/70">
                        <FaCrown className="text-xs" />
                        <span className="hidden sm:inline">{t('Host')}</span>
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
                <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-6 sm:p-8 border border-[#4E342E]/20">
                  <div className="flex items-center justify-center mb-4">
                    <IoSparklesSharp className="text-2xl sm:text-3xl text-[#F4B46D] mr-2" />
                    <h3 className="text-xl sm:text-2xl font-bold text-[#4E342E]">{t('Ready to Start?')}</h3>
                  </div>
                  <p className="text-sm sm:text-base text-[#6D4C41] mb-4 sm:mb-6 px-4">
                    {t('All players are waiting for you to begin the quiz!')}
                  </p>
                  <button 
                    onClick={() => startGame(room.id)}
                    className="bg-[#10A3A2] hover:bg-[#05717B] 
                             text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-xl transition-all duration-300 
                             text-base sm:text-xl shadow-lg hover:shadow-xl transform hover:scale-105
                             flex items-center space-x-2 sm:space-x-3 mx-auto min-h-[48px] sm:min-h-[56px]"
                  >
                    <FaRocket className="text-lg sm:text-2xl" />
                    <span>{t('Start Quiz')}</span>
                  </button>
                  <p className="text-[#6D4C41] text-xs sm:text-sm mt-3">
                    {t('Only the host can start the quiz')}
                  </p>
                </div>
              )}

            {/* Waiting Message (Non-Host) */}
            {room &&
              player &&
              player.id !== room.hostId &&
              room.status === "waiting" && (
                <div className="bg-[#F7E2C0] rounded-2xl shadow-lg p-6 sm:p-8 border border-[#4E342E]/20">
                  <div className="flex items-center justify-center mb-4">
                    <MdAccessTime className="text-2xl sm:text-3xl text-[#10A3A2] mr-2 animate-pulse" />
                    <h3 className="text-xl sm:text-2xl font-bold text-[#4E342E]">Almost Ready!</h3>
                  </div>
                  <p className="text-sm sm:text-base text-[#6D4C41] text-lg mb-4">
                    {t('Waiting for the host to start the quiz...')}  
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-[#10A3A2]">
                    <div className="w-2 h-2 bg-[#10A3A2] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#10A3A2] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-[#10A3A2] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}