import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { onValue, ref, update } from "firebase/database";
import type { Room, Question, Answer, GameState, DifficultyLevel } from "../../../shared/types";
import { presenceManager } from "../api/presenceManager";
import { calculateScore, calculateTimeUsed } from "../utils/scoreCalculation";
import { 
  FaCheckCircle, 
  FaClock, 
  FaRocket, 
  FaChartLine, 
  FaArrowRight,
  FaUsers,
  FaTrophy,
  FaArrowLeft,
  FaFlag,
  FaSpinner,
  FaStop,
  FaTimesCircle,
  FaLock
} from 'react-icons/fa';
import { 
  MdQuiz, 
  MdTopic,
  MdAccessTime 
} from 'react-icons/md';
import { 
  IoSparklesSharp 
} from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { trackQuizEvent } from '../utils/analytics';

export default function QuizPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const [room, setRoom] = useState<Room | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const navigate = useNavigate();

  const playerId = localStorage.getItem("userId");
  const isHost = room?.players[playerId || ""]?.isHost || false;

  // Fetch room and handle game completion
  useEffect(() => {
    if (!id) return;

    const roomRef = ref(db, `rooms/${id}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data) {
        setRoom(data);
        
        // Check if game is finished
        if (data.status === "finished") {
          navigate(`/results/${id}`); // Go to results page when game ends
        }
        
        // Set up onDisconnect cleanup when room data loads
        if (playerId && data.players && playerId in data.players) {
          const currentPlayer = data.players[playerId];
          presenceManager.setupDisconnectCleanup(id, playerId, currentPlayer.isHost);
        }
      } else {
        // Room was deleted (probably host disconnected)
        console.log("Room no longer exists during quiz, redirecting to home");
        navigate("/");
      }
    });

    return () => unsub();
  }, [id, playerId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      presenceManager.clearDisconnectHandlers();
    };
  }, []);

  // Synchronized timer based on Firebase gameState
  useEffect(() => {
    if (!room || !room.gameState) return;

    const interval = setInterval(() => {
      const now = Date.now(); // Get current timestamp in milliseconds
      const gameState = room.gameState!; // Get game state from room data
      
      // Only run timer logic if:
      // 1. We are in the "answering" phase where players can submit answers
      // 2. We have a questionEndTime set (when the question should end)
      if (gameState.phase === "answering" && gameState.questionEndTime) {
        // Calculate remaining time in seconds by:
        // 1. Taking difference between end time and current time
        // 2. Converting milliseconds to seconds by dividing by 1000
        // 3. Using Math.max to ensure we don't go below 0
        // 4. Using Math.floor to round down to nearest second
        const remaining = Math.max(0, Math.floor((gameState.questionEndTime - now) / 1000));
        
        // Update the timeLeft state with remaining seconds
        setTimeLeft(remaining);
        
        // Check if all players have answered (auto-advance logic)
        if (isHost && !gameState.allPlayersAnswered) {
          const allAnswered = Object.values(room.players).every(player => 
            player.answers && player.answers[room.currentQuestionIndex]
          );
          
          if (allAnswered) {
            // Auto-advance when all players have answered
            endCurrentQuestion();
          }
        }
        
        // If time has run out (remaining = 0) and this client is the host
        // Then trigger the end of the current question
        if (remaining === 0 && isHost) {
          endCurrentQuestion();
        }
      }
    }, 100); // Run every 100ms for a smooth countdown display

    return () => clearInterval(interval);
  }, [room?.gameState, isHost, room?.players, room?.currentQuestionIndex]);

  // Reset answer state when question changes
  useEffect(() => {
    setHasAnswered(false);
    setSelectedOption(null);
  }, [room?.currentQuestionIndex]);

  // Initialize game state when host enters quiz page
  useEffect(() => {
    if (isHost && room && !room.gameState) {
      console.log('🎮 Host initializing game state...');
      initializeQuestion();
    }
  }, [isHost, room, room?.gameState]);

  // Initialize game state when starting quiz (host only)
  const initializeQuestion = async () => {
    if (!room || !isHost) return;
    
    const now = Date.now();
    const currentQuestion = room.questions[room.currentQuestionIndex];
    
    const gameState: GameState = {
      phase: "answering",
      questionStartTime: now,
      questionEndTime: now + (currentQuestion.timeLimit * 1000),
      allPlayersAnswered: false,
    };

    await update(ref(db, `rooms/${id}/gameState`), gameState);
  };

  // End current question and show results (host only)
  const endCurrentQuestion = async () => {
    if (!room || !isHost) return;

    const gameState: GameState = {
      ...room.gameState!,
      phase: "showing-answer",
      questionEndTime: Date.now(),
      awaitingHostAction: "next-question"
    };

    await update(ref(db, `rooms/${id}/gameState`), gameState);
  };

  // Show mid-quiz scoreboard (host only)
  const showScoreboard = async () => {
    if (!room || !isHost) return;

    const gameState: GameState = {
      ...room.gameState!,
      phase: "showing-scoreboard",
      awaitingHostAction: "next-question"
    };

    await update(ref(db, `rooms/${id}/gameState`), gameState);
  };

  // Hide scoreboard and return to answer view (host only)
  const hideScoreboard = async () => {
    if (!room || !isHost) return;

    const gameState: GameState = {
      ...room.gameState!,
      phase: "showing-answer",
      awaitingHostAction: "next-question"
    };

    await update(ref(db, `rooms/${id}/gameState`), gameState);
  };

  // Advance to next question (host only)
  const nextQuestion = async () => {
    if (!room || !isHost) return;

    const nextIndex = room.currentQuestionIndex + 1;
    
    if (nextIndex >= room.questions.length) {
      // End game - track quiz completion
      const playerCount = Object.keys(room.players).length;
      const questionsAnswered = room.questions.length;
      trackQuizEvent.quizCompleted(room.roomCode, playerCount, questionsAnswered);
      
      await update(ref(db, `rooms/${room.id}`), { 
        status: "finished",
        finishedAt: Date.now() 
      });
    } else {
      // Start next question
      const now = Date.now();
      const nextQ = room.questions[nextIndex];
      
      const gameState: GameState = {
        phase: "answering",
        questionStartTime: now,
        questionEndTime: now + (nextQ.timeLimit * 1000),
        allPlayersAnswered: false,
      };

      await update(ref(db, `rooms/${room.id}`), {
        currentQuestionIndex: nextIndex,
        gameState
      });
    }
  };

  // Submit answer
  const submitAnswer = (option: string, isCorrect: boolean) => {
    // Don't submit answer if:
    // - Room data isn't loaded yet
    // - Player ID isn't set
    // - Player already answered this question
    // - No active question exists
    // - No game state exists
    if (!room || !playerId || hasAnswered || !question || !room.gameState) return;

    // Calculate precise time used based on game state
    const timeUsedMs = calculateTimeUsed(room.gameState.questionStartTime);
    
    // Calculate score using centralized utility
    const scoreEarned = calculateScore(isCorrect, timeUsedMs, question.timeLimit);

    // Track question answered event
    trackQuizEvent.questionAnswered(isCorrect, timeUsedMs);

    const answer: Answer = {
      option,
      isCorrect,
      timeToAnswer: timeUsedMs,
      scoreEarned, // Store the calculated score
    };

    const currentPlayer = room.players[playerId];
    const newScore = currentPlayer.score + scoreEarned;

    const updates: Record<string, Answer | number> = {};
    updates[`rooms/${room.id}/players/${playerId}/answers/${room.currentQuestionIndex}`] = answer;
    updates[`rooms/${room.id}/players/${playerId}/score`] = newScore;

    update(ref(db), updates);
    setSelectedOption(option);
    setHasAnswered(true);
  };

  // Check if all players have answered the current question
  const allPlayersAnswered = () => {
    if (!room) return false;
    return Object.values(room.players).every(player => 
      player.answers && player.answers[room.currentQuestionIndex]
    );
  };

  // Get count of players who have answered
  const getAnsweredCount = () => {
    if (!room) return 0;
    return Object.values(room.players).filter(player => 
      player.answers && player.answers[room.currentQuestionIndex]
    ).length;
  };

  if (!room) return <div>{t('Loading quiz...')}</div>;

  const qIndex = room.currentQuestionIndex;
  const question: Question | undefined = room.questions[qIndex];
  const gameState = room.gameState;
  const currentPhase = gameState?.phase || "answering";

  if (!question) return <div>{t('No question found.')}</div>;

  // Initialize game state if host and no game state exists
  if (isHost && !gameState) {
    return <div>{t('Initializing game...')}</div>;
  }

  // Difficulty display helper
  const getDifficultyDisplay = (difficulty: DifficultyLevel) => {
    const difficultyMap = {
      easy: { 
        icon: FaCheckCircle, 
        label: t('easyTitle'), 
        color: 'text-teal-600',
        bgColor: 'bg-teal-50',
        borderColor: 'border-teal-200'
      },
      medium: { 
        icon: FaClock, 
        label: t('mediumTitle'), 
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      },
      hard: { 
        icon: FaRocket, 
        label: t('hardTitle'), 
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      }
    };
    return difficultyMap[difficulty];
  };

  const difficultyInfo = getDifficultyDisplay(room.difficulty);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 mb-4 sm:mb-6 border border-amber-100">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-center mb-6 sm:mb-8 space-y-4 lg:space-y-0">
              <div className="text-center lg:text-left w-full lg:w-auto">
                <div className="flex items-center justify-center lg:justify-start mb-2">
                  <MdQuiz className="text-2xl sm:text-3xl text-amber-600 mr-2" />
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
                    {t('Question')} {qIndex + 1} {t('of')} {room.questions.length}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-4 mt-3">
                  <div className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-2 rounded-full ${difficultyInfo.bgColor} ${difficultyInfo.borderColor} border`}>
                    {difficultyInfo.label === 'Easy' && <FaCheckCircle className={`${difficultyInfo.color} text-sm sm:text-base`} />}
                    {difficultyInfo.label === 'Medium' && <FaClock className={`${difficultyInfo.color} text-sm sm:text-base`} />}
                    {difficultyInfo.label === 'Hard' && <FaRocket className={`${difficultyInfo.color} text-sm sm:text-base`} />}
                    <span className={`font-semibold text-xs sm:text-sm ${difficultyInfo.color}`}>{difficultyInfo.label}</span>
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2 text-gray-600">
                    <MdTopic className="text-sm sm:text-lg" />
                    <span className="font-semibold text-xs sm:text-sm truncate max-w-32 sm:max-w-none">{room.topic}</span>
                  </div>
                </div>
              </div>
              
              {/* Timer during answering phase, scores during other phases */}
              {currentPhase === "answering" ? (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3 sm:p-4 text-center border-2 border-orange-200 shadow-lg w-full sm:w-auto">
                  <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-2">
                    <MdAccessTime className={`text-2xl sm:text-3xl animate-pulse ${
                      timeLeft <= 10 ? 'text-red-600' : 
                      timeLeft <= 30 ? 'text-orange-600' : 
                      'text-amber-600'
                    }`} />
                    <p className={`text-xl sm:text-2xl font-bold ${
                      timeLeft <= 10 ? 'text-red-700' : 
                      timeLeft <= 30 ? 'text-orange-700' : 
                      'text-amber-700'
                    }`}>
                      {timeLeft}s
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-medium">{t('Time Remaining')}</p>
                  
                  {/* Player answer status */}
                  <div className="mt-2 text-xs text-gray-600">
                    <p>{getAnsweredCount()}/{Object.keys(room.players).length} {t('players answered')}</p>
                  </div>
                  
                  {hasAnswered && (
                    <div className="mt-2 bg-teal-100 border border-teal-300 rounded-lg p-2">
                      <div className="flex items-center justify-center space-x-1">
                        <FaLock className="text-teal-600 text-xs sm:text-sm" />
                        <p className="text-teal-700 font-medium text-xs">{t('Answer Submitted!')}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Auto-advance notification */}
                  {allPlayersAnswered() && (
                    <div className="mt-2 bg-blue-100 border border-blue-300 rounded-lg p-2">
                      <div className="flex items-center justify-center space-x-1">
                        <FaRocket className="text-blue-600 text-xs sm:text-sm" />
                        <p className="text-blue-700 font-medium text-xs">{t('All players answered!')}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 sm:p-4 text-center lg:text-right border border-amber-200 w-full sm:w-auto">
                  <div className="flex items-center justify-center lg:justify-end space-x-1 sm:space-x-2 mb-1">
                    <FaTrophy className="text-amber-600 text-sm sm:text-base" />
                    <p className="text-xs sm:text-sm text-gray-600">{t('Your Score')}: <span className="font-bold text-amber-600">{room.players[playerId || ""]?.score || 0}</span></p>
                  </div>
                  <div className="flex items-center justify-center lg:justify-end space-x-1 sm:space-x-2">
                    <FaUsers className="text-teal-600 text-sm sm:text-base" />
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t('Leading')}: <span className="font-bold text-teal-600">{Math.max(...Object.values(room.players).map(p => p.score))}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Question Card */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 leading-relaxed">{question.text}</h2>
              
              <div className="grid gap-3 sm:gap-4">
                {question.options.map((opt) => {
                  let buttonClass = "w-full text-left p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 font-medium transform hover:scale-[1.02] text-sm sm:text-base ";
                  
                  if (currentPhase === "showing-answer") {
                    // Show results: highlight correct answer and user's selection
                    if (opt === question.correctOption) {
                      buttonClass += "bg-teal-100 border-teal-500 text-teal-800 shadow-lg"; // Correct answer in teal
                    } else if (opt === selectedOption) {
                      buttonClass += "bg-red-100 border-red-500 text-red-800 shadow-lg"; // Wrong selection in red
                    } else {
                      buttonClass += "bg-gray-100 border-gray-300 text-gray-600"; // Other options grayed out
                    }
                  } else {
                    // Answering phase: handle different states
                    if (hasAnswered) {
                      // After submission: lock selected answer, disable others
                      if (selectedOption === opt) {
                        buttonClass += "bg-amber-100 border-amber-500 text-amber-800 shadow-lg relative"; // Selected and locked
                      } else {
                        buttonClass += "bg-gray-100 border-gray-300 text-gray-400 opacity-50 cursor-not-allowed"; // Disabled options
                      }
                    } else {
                      // Before submission: normal interactive state
                    if (selectedOption === opt) {
                      buttonClass += "bg-amber-100 border-amber-500 text-amber-800 shadow-lg";
                    } else {
                      buttonClass += "bg-white border-gray-300 text-gray-800 hover:bg-amber-50 hover:border-amber-400 shadow-sm hover:shadow-md";
                      }
                    }
                  }

                  return (
                    <button
                      key={opt}
                      className={buttonClass}
                      disabled={hasAnswered || currentPhase !== "answering"} // Disable after answer or during results
                      onClick={() => {
                        if (!hasAnswered && currentPhase === "answering") {
                          const isCorrect = opt === question.correctOption;
                          submitAnswer(opt, isCorrect);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt}</span>
                        {/* Show lock icon for selected answer after submission */}
                        {hasAnswered && selectedOption === opt && currentPhase === "answering" && (
                          <FaLock className="text-amber-600 text-lg flex-shrink-0 ml-2" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Host End Question Button - Only show during answering phase */}
            {currentPhase === "answering" && isHost && (
              <div className="flex justify-center mb-6">
                <button 
                  onClick={endCurrentQuestion}
                  className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-6 py-3 rounded-xl 
                           hover:from-red-700 hover:to-orange-700 transition-all duration-300 
                           flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl
                           transform hover:scale-105 font-semibold"
                >
                  <FaStop className="text-lg" />
                  <span>{t('End Question')}</span>
                </button>
              </div>
            )}

            {/* Answer Reveal Phase - Show correct answer and host controls */}
            {currentPhase === "showing-answer" && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-amber-200">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <IoSparklesSharp className="text-2xl text-teal-600" />
                    <h3 className="text-2xl font-bold text-gray-800">{t('Correct Answer')}</h3>
                  </div>
                  <div className="bg-teal-100 border-2 border-teal-500 rounded-xl p-4 mb-6">
                    <p className="text-lg font-bold text-teal-800">{question.correctOption}</p>
                  </div>
                </div>
                
                {/* Show player's result */}
                {selectedOption && (
                  <div className="mb-6">
                    <div className={`p-4 rounded-xl border-2 ${
                      selectedOption === question.correctOption 
                        ? "bg-teal-50 border-teal-300" 
                        : "bg-red-50 border-red-300"
                    }`}>
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {selectedOption === question.correctOption ? (
                          <FaCheckCircle className="text-teal-600 text-xl" />
                        ) : (
                          <FaTimesCircle className="text-red-600 text-xl" />
                        )}
                        <p className={`font-bold text-lg ${
                          selectedOption === question.correctOption ? "text-teal-700" : "text-red-700"
                        }`}>
                          {t('Your answer is')} {selectedOption === question.correctOption ? t('Correct!') : t('Incorrect')}
                        </p>
                      </div>
                      {selectedOption === question.correctOption && (
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <FaTrophy className="text-amber-600" />
                            <p className="text-amber-700 font-semibold">
                              {t('Points earned')}: {(() => {
                                // Use stored score if available, fallback to calculation for backward compatibility
                                const playerAnswer = room.players[playerId || ""]?.answers?.[room.currentQuestionIndex];
                                if (playerAnswer?.scoreEarned !== undefined) {
                                  return playerAnswer.scoreEarned;
                                }
                                
                                // Fallback calculation for backward compatibility
                                const timeUsedMs = room.gameState?.questionStartTime 
                                  ? calculateTimeUsed(room.gameState.questionStartTime)
                                  : (question.timeLimit - timeLeft) * 1000;
                                return calculateScore(true, timeUsedMs, question.timeLimit);
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Host Controls */}
                {isHost && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={showScoreboard}
                      className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-6 py-3 rounded-xl 
                               hover:from-amber-700 hover:to-orange-700 transition-all duration-300 
                               flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl
                               transform hover:scale-105 font-semibold"
                    >
                      <FaChartLine className="text-lg" />
                      <span>{t('Show Scoreboard')}</span>
                    </button>
                    <button 
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-teal-600 to-amber-600 text-white px-6 py-3 rounded-xl 
                               hover:from-teal-700 hover:to-amber-700 transition-all duration-300 
                               flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl
                               transform hover:scale-105 font-semibold"
                    >
                      {qIndex + 1 >= room.questions.length ? (
                        <>
                          <FaFlag className="text-lg" />
                          <span>{t('End Quiz')}</span>
                        </>
                      ) : (
                        <>
                          <FaArrowRight className="text-lg" />
                          <span>{t('Next Question')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Non-host waiting message */}
                {!isHost && (
                  <div className="text-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <FaSpinner className="text-amber-600 animate-spin" />
                        <p className="text-amber-700 font-medium">{t('Waiting for host to continue...')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mid-Quiz Scoreboard Phase */}
            {currentPhase === "showing-scoreboard" && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-amber-200">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <FaTrophy className="text-3xl text-amber-600" />
                    <h3 className="text-3xl font-bold text-gray-800">{t('Current Scores')}</h3>
                  </div>
                </div>
                
                {/* Leaderboard */}
                <div className="space-y-3 mb-6">
                  {Object.values(room.players)
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div 
                        key={player.id}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-300 ${
                          player.id === playerId 
                            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-400 shadow-lg' 
                            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                            index === 0 ? 'bg-amber-200 text-amber-800' :
                            index === 1 ? 'bg-gray-200 text-gray-700' :
                            index === 2 ? 'bg-orange-200 text-orange-800' :
                            'bg-teal-100 text-teal-700'
                          }`}>
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                          </div>
                          <span className={`text-lg font-bold ${player.id === playerId ? 'text-amber-800' : 'text-gray-800'}`}>
                            {player.nickname}
                            {player.id === playerId && " (You)"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaTrophy className="text-amber-600" />
                          <span className="text-xl font-bold text-amber-600">
                            {player.score} {t('pts')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
                
                {/* Quiz Progress */}
                <div className="text-center mb-6">
                  <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center justify-center space-x-2">
                      <MdQuiz className="text-gray-600" />
                      <p className="text-gray-700 font-medium">
                        {t('Question')} {qIndex + 1} {t('of')} {room.questions.length}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Host Controls */}
                {isHost && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button 
                      onClick={hideScoreboard}
                      className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl 
                               hover:from-gray-700 hover:to-gray-800 transition-all duration-300 
                               flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl
                               transform hover:scale-105 font-semibold"
                    >
                      <FaArrowLeft className="text-lg" />
                      <span>{t('Back to Answer')}</span>
                    </button>
                    <button 
                      onClick={nextQuestion}
                      className="bg-gradient-to-r from-teal-600 to-amber-600 text-white px-6 py-3 rounded-xl 
                               hover:from-teal-700 hover:to-amber-700 transition-all duration-300 
                               flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl
                               transform hover:scale-105 font-semibold"
                    >
                      {qIndex + 1 >= room.questions.length ? (
                        <>
                          <FaFlag className="text-lg" />
                          <span>{t('End Quiz')}</span>
                        </>
                      ) : (
                        <>
                          <FaArrowRight className="text-lg" />
                          <span>{t('Next Question')}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
                
                {/* Non-host waiting message */}
                {!isHost && (
                  <div className="text-center">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <FaSpinner className="text-amber-600 animate-spin" />
                        <p className="text-amber-700 font-medium">{t('Waiting for host to continue...')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}