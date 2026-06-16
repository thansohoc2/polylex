import { AcreInput, AcreOutput, ReviewMode, LEECH_THRESHOLD } from '@polylex/shared-types';

/**
 * ACRE — Adaptive Cognitive Reinforcement Engine
 *
 * A pure function spaced-repetition algorithm that improves upon Anki's SM-2
 * by incorporating:
 *  - Ebbinghaus forgetting curve (exponential decay model)
 *  - Response time weighting  (fast recall = stronger memory)
 *  - Confidence-level weighting (explicit metacognition signal)
 *  - Leech detection (threshold = 8 consecutive failures)
 *  - Adaptive review mode recommendation
 *
 * NO side-effects. NO DI. Just math.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_INTERVAL = 0.25; // 6 hours minimum
const MAX_INTERVAL = 365;  // 1 year maximum
const BASE_EASE = 2.5;
const EASE_MIN = 1.3;
// Typical response time for a "fluent" recall (ms)
const FLUENT_RESPONSE_MS = 2_000;
const MAX_RESPONSE_MS = 30_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps recallQuality [0..5] → retention probability [0..1] */
function recallToRetention(q: number): number {
  return Math.max(0, Math.min(1, q / 5));
}

/**
 * Response-time factor: 1.0 if ≤ FLUENT_RESPONSE_MS,
 * declines linearly to 0.5 at MAX_RESPONSE_MS
 */
function responseTimeFactor(ms: number): number {
  if (ms <= FLUENT_RESPONSE_MS) return 1.0;
  const clamped = Math.min(ms, MAX_RESPONSE_MS);
  return 1.0 - 0.5 * ((clamped - FLUENT_RESPONSE_MS) / (MAX_RESPONSE_MS - FLUENT_RESPONSE_MS));
}

/**
 * Confidence weight: maps [1..5] → [0.7..1.15]
 * Low confidence slightly penalises, high confidence boosts
 */
function confidenceFactor(level: number): number {
  return 0.7 + 0.45 * ((level - 1) / 4);
}

/**
 * Ebbinghaus-inspired new memory strength:
 *   S' = S * retention * rt_factor * conf_factor
 * bounded to [0.0 .. 1.0]
 */
function computeNewMemoryStrength(
  currentStrength: number,
  retention: number,
  rtFactor: number,
  confFactor: number,
): number {
  if (retention < 0.4) {
    // Failed recall — decay towards zero
    return Math.max(0, currentStrength * 0.5 * retention);
  }
  const raw = currentStrength + (1 - currentStrength) * retention * rtFactor * confFactor;
  return Math.min(1.0, raw);
}

/**
 * Interval calculation based on memory strength and difficulty.
 * Inspired by SM-2 ease factor but continuous:
 *   interval = base_interval * ease * strength_multiplier
 */
function computeInterval(
  currentInterval: number,
  memoryStrength: number,
  difficultyUser: number,
  retention: number,
  reviewCount: number,
): number {
  if (retention < 0.2) {
    // Again: reset to 10 minutes
    return 1 / 144;
  }
  if (retention < 0.4) {
    // Hard: short interval
    return Math.max(MIN_INTERVAL, currentInterval * 0.5);
  }

  // Ease factor adjusted by difficulty
  const ease = Math.max(EASE_MIN, BASE_EASE - difficultyUser * 1.2);
  // Strength multiplier: high strength → longer intervals
  const strengthMul = 0.5 + memoryStrength * 1.5;

  let next: number;
  if (reviewCount <= 1) {
    next = 1;
  } else if (reviewCount === 2) {
    next = 4;
  } else {
    next = currentInterval * ease * strengthMul;
  }

  // Apply retention boost/penalty
  next *= 0.6 + retention * 0.8;

  return Math.max(MIN_INTERVAL, Math.min(MAX_INTERVAL, next));
}

/**
 * Recommend the next review mode based on strength and recall quality.
 *
 * Strategy:
 *  - Very weak (strength < 0.25): flashcard (easiest — just look)
 *  - Weak (strength < 0.45): reverse or listening
 *  - Medium (strength < 0.65): type_answer
 *  - Strong (strength < 0.80): context or sentence
 *  - Near-mastered (≥ 0.80): sentence (hardest — production)
 */
function recommendMode(memoryStrength: number, recallQuality: number): ReviewMode {
  if (memoryStrength < 0.25 || recallQuality < 2) return 'flashcard';
  if (memoryStrength < 0.45) return recallQuality < 3 ? 'listening' : 'reverse';
  if (memoryStrength < 0.65) return 'type_answer';
  if (memoryStrength < 0.80) return 'context';
  return 'sentence';
}

// ─── Main Export ─────────────────────────────────────────────────────────────

/**
 * Calculate next review schedule using ACRE algorithm.
 *
 * @param input - Current state + review result
 * @returns New state + scheduling info
 */
export function calculateAcre(input: AcreInput): AcreOutput {
  const {
    recallQuality,
    responseTimeMs,
    confidenceLevel,
    memoryStrength,
    leechScore,
    difficultyUser,
    reviewMode: _reviewMode,
    reviewCount,
    currentIntervalDays = 1,
  } = input;

  // ── Compute factors
  const retention = recallToRetention(recallQuality);
  const rtFactor = responseTimeFactor(responseTimeMs);
  const confFactor = confidenceFactor(confidenceLevel);

  // ── New memory strength
  const newMemoryStrength = computeNewMemoryStrength(
    memoryStrength,
    retention,
    rtFactor,
    confFactor,
  );

  // ── New interval
  const intervalDays = computeInterval(
    currentIntervalDays,
    newMemoryStrength,
    difficultyUser,
    retention,
    reviewCount + 1, // +1 for this review
  );

  // ── Next review date
  const nextReview = new Date();
  nextReview.setTime(nextReview.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  // ── Leech tracking: increment on failed recall (quality < 2)
  const failedRecall = recallQuality < 2;
  const newLeechScore = failedRecall ? leechScore + 1 : Math.max(0, leechScore - 1);
  const isLeech = newLeechScore >= LEECH_THRESHOLD;

  // ── Recommended mode for next session
  const recommendedMode = recommendMode(newMemoryStrength, recallQuality);

  return {
    newMemoryStrength,
    intervalDays,
    nextReview,
    newLeechScore,
    isLeech,
    recommendedMode,
  };
}
