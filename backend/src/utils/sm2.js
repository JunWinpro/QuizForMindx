/**
 * SM-2 Spaced Repetition Algorithm
 *
 * quality: 0-5
 *   0 = complete blackout (không nhớ gì)
 *   1 = incorrect, but after seeing the answer it was easy to remember
 *   2 = incorrect, but the answer seemed easy to recall
 *   3 = correct, but required significant difficulty (biên giới)
 *   4 = correct, after a hesitation
 *   5 = perfect response
 *
 * Returns:
 *   newInterval      – days until next review (integer >= 1)
 *   newEaseFactor    – updated EF (float >= 1.3)
 *   newRepetitions   – consecutive correct streak
 *   nextReviewDate   – JS Date object
 */

const MIN_EASE_FACTOR = 1.3;

/**
 * @param {number} quality       0-5
 * @param {number} interval      current interval in days (>= 1)
 * @param {number} easeFactor    current EF (>= 1.3)
 * @param {number} repetitions   consecutive correct answers so far
 * @returns {{ newInterval: number, newEaseFactor: number, newRepetitions: number, nextReviewDate: Date }}
 */
const calculateSM2 = (quality, interval, easeFactor, repetitions) => {
  if (quality < 0 || quality > 5) {
    throw new RangeError('quality must be between 0 and 5');
  }

  // ── Tính EF mới ──────────────────────────────────────────────────────────
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  let newEaseFactor = easeFactor + delta;
  if (newEaseFactor < MIN_EASE_FACTOR) newEaseFactor = MIN_EASE_FACTOR;

  // ── Tính interval và repetitions mới ─────────────────────────────────────
  let newInterval;
  let newRepetitions;

  if (quality < 3) {
    // Câu trả lời sai hoặc quá khó → reset về đầu
    newInterval = 1;
    newRepetitions = 0;
  } else {
    // Câu trả lời đúng (quality >= 3)
    newRepetitions = repetitions + 1;

    if (repetitions === 0) {
      // Lần đúng đầu tiên
      newInterval = 1;
    } else if (repetitions === 1) {
      // Lần đúng thứ hai
      newInterval = 6;
    } else {
      // Các lần tiếp theo: interval * EF (dùng EF cũ theo spec SM-2 gốc)
      newInterval = Math.round(interval * easeFactor);
    }
  }

  // ── Tính ngày ôn tiếp theo ────────────────────────────────────────────────
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  // Reset về 00:00:00 để so sánh theo ngày
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    newInterval,
    newEaseFactor: parseFloat(newEaseFactor.toFixed(4)),
    newRepetitions,
    nextReviewDate,
  };
};

module.exports = { calculateSM2, MIN_EASE_FACTOR };