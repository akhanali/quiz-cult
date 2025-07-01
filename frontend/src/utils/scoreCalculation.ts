/**
 * Score calculation utilities for quiz game
 */

// Constants for scoring
export const BASE_SCORE = 1000;
export const TIME_BONUS_DIVISOR = 10; // 1 point per 10ms saved

/**
 * Calculate time bonus based on how quickly the answer was submitted
 * @param timeUsedMs - Time taken to answer in milliseconds
 * @param timeLimitMs - Maximum time allowed in milliseconds
 * @returns Time bonus points (0 or positive)
 */
export function calculateTimeBonus(timeUsedMs: number, timeLimitMs: number): number {
  // Ensure we don't go below 0 or above the time limit
  const clampedTimeUsed = Math.max(0, Math.min(timeUsedMs, timeLimitMs));
  
  // Calculate time saved
  const timeSaved = Math.max(0, timeLimitMs - clampedTimeUsed);
  
  // Convert to bonus points (1 point per 10ms saved)
  return Math.round(timeSaved / TIME_BONUS_DIVISOR);
}

/**
 * Calculate total score for an answer
 * @param isCorrect - Whether the answer was correct
 * @param timeUsedMs - Time taken to answer in milliseconds
 * @param timeLimitSeconds - Question time limit in seconds
 * @returns Total score earned (0 for incorrect, base + bonus for correct)
 */
export function calculateScore(
  isCorrect: boolean, 
  timeUsedMs: number, 
  timeLimitSeconds: number
): number {
  if (!isCorrect) {
    return 0;
  }
  
  const timeLimitMs = timeLimitSeconds * 1000;
  const timeBonus = calculateTimeBonus(timeUsedMs, timeLimitMs);
  
  return BASE_SCORE + timeBonus;
}

/**
 * Calculate time used based on question start time
 * @param questionStartTime - Timestamp when question started (milliseconds)
 * @param currentTime - Current timestamp (milliseconds), defaults to Date.now()
 * @returns Time used in milliseconds
 */
export function calculateTimeUsed(
  questionStartTime: number, 
  currentTime: number = Date.now()
): number {
  return Math.max(0, currentTime - questionStartTime);
} 