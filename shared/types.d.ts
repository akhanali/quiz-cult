export type Answer = {
    option: string;
    isCorrect: boolean;
    timeToAnswer: number;
    scoreEarned?: number;
};
export type Player = {
    id: string;
    nickname: string;
    isHost: boolean;
    score: number;
    joinedAt: number;
    answers: Record<number, Answer>;
};
export type DifficultyLevel = "easy" | "medium" | "hard";
export type Question = {
    text: string;
    options: string[];
    correctOption: string;
    timeLimit: number;
    difficulty?: DifficultyLevel;
    timeReasoning?: string;
};
export type QuestionPhase = "answering" | "showing-answer" | "showing-scoreboard" | "waiting-next";
export type GameState = {
    phase: QuestionPhase;
    questionStartTime: number;
    questionEndTime?: number;
    allPlayersAnswered: boolean;
    resultsShownAt?: number;
    autoAdvanceAt?: number;
    awaitingHostAction?: "show-scoreboard" | "next-question";
};
export type Room = {
    id: string;
    roomCode: string;
    topic: string;
    difficulty: DifficultyLevel;
    questionCount: number;
    status: "waiting" | "active" | "finished";
    hostId: string;
    createdAt: number;
    currentQuestionIndex: number;
    players: Record<string, Player>;
    questions: Question[];
    gameState?: GameState;
    startedAt?: number;
    finishedAt?: number;
    totalQuestions: number;
    isGameComplete: boolean;
};
export interface CreateRoomRequest {
    nickname: string;
    topic: string;
    difficulty: DifficultyLevel;
    questionCount: number;
}
export interface CreateRoomResponse {
    roomId: string;
    playerId: string;
    aiGenerated: boolean;
    fallbackReason?: string;
}
export interface JoinRoomRequest {
    roomCode: string;
    nickname: string;
}
export interface JoinRoomResponse {
    roomId: string;
    playerId: string;
    room: Room;
}
export interface StartGameRequest {
    hostId: string;
}
export interface StartGameResponse {
    success: boolean;
}
export interface SubmitAnswerRequest {
    roomId: string;
    playerId: string;
    questionIndex: number;
    selectedOption: string;
    timeToAnswer: number;
}
export interface SubmitAnswerResponse {
    success: boolean;
    isCorrect: boolean;
    scoreEarned: number;
    newTotalScore: number;
}
export interface QuestionGenerationParams {
    topic: string;
    difficulty: DifficultyLevel;
    count: number;
}
export interface QuestionGenerationResponse {
    questions: Question[];
    aiGenerated: boolean;
    fallbackReason?: string;
}
export interface SocketEvents {
    'join-room': (roomId: string) => void;
    'leave-room': (roomId: string) => void;
    'submit-answer': (data: SubmitAnswerRequest) => void;
    'game-state-change': (data: {
        roomId: string;
        gameState: GameState;
    }) => void;
    'player-joined': (data: {
        playerId: string;
        player: Player;
    }) => void;
    'player-left': (data: {
        playerId: string;
    }) => void;
    'answer-submitted': (data: {
        playerId: string;
        isCorrect: boolean;
    }) => void;
    'game-state-updated': (data: {
        gameState: GameState;
    }) => void;
    'room-updated': (data: {
        room: Room;
    }) => void;
}
export interface ErrorResponse {
    error: string;
    code?: string;
    details?: string | string[];
}
