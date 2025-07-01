export type Answer = {
  option: string;
  isCorrect: boolean;
  timeToAnswer: number;
  scoreEarned?: number; // Optional for backward compatibility with existing data
};

export type Player = {
  id: string;
  nickname: string;
  isHost: boolean;
  score: number;
  joinedAt: number;
  answers: Record<number, Answer>;
};

// Difficulty level for questions and rooms
export type DifficultyLevel = "easy" | "medium" | "hard";

export type Question = {
  text: string;
  options: string[];
  correctOption: string;
  timeLimit: number;
  difficulty?: DifficultyLevel; // Optional: for tracking question difficulty
  timeReasoning?: string; // Optional: AI explanation for time limit
};

// Game phase for question state management
export type QuestionPhase = "answering" | "showing-answer" | "showing-scoreboard" | "waiting-next";

// Game timing and state tracking
export type GameState = {
  phase: QuestionPhase;
  questionStartTime: number; // When current question started
  questionEndTime?: number; // When current question should/did end
  allPlayersAnswered: boolean; // Whether all players have submitted answers
  resultsShownAt?: number; // When results were displayed
  autoAdvanceAt?: number; // When to auto-advance to next question
  awaitingHostAction?: "show-scoreboard" | "next-question"; // NEW: Host action required
};

export type Room = {
  id: string;
  roomCode: string;
  topic: string;
  difficulty: DifficultyLevel; // NEW: Room difficulty level
  questionCount: number;
  status: "waiting" | "active" | "finished";
  hostId: string;
  createdAt: number;
  currentQuestionIndex: number;
  players: Record<string, Player>;
  questions: Question[];
  
  // Enhanced game state management
  gameState?: GameState; // Game timing and phase information
  startedAt?: number; // When the quiz game actually started
  finishedAt?: number; // When the quiz game ended
  totalQuestions: number; // Total number of questions in this quiz
  isGameComplete: boolean; // Whether all questions have been completed
};
