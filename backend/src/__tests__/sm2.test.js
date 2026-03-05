/**
 * Unit tests for SM-2 algorithm
 * Min 15 test cases theo yêu cầu Stage 6
 */

const { calculateSM2, MIN_EASE_FACTOR } = require('../utils/sm2');

// Helper: ngày hôm nay dạng YYYY-MM-DD
const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

// Helper: ngày hôm nay + N ngày dạng YYYY-MM-DD
const futureStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// ──────────────────────────────────────────────────────────────────────────────
// Nhóm 1: Quality 0 — blackout hoàn toàn
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 0 — complete blackout', () => {
  test('TC01: reset interval về 1', () => {
    const result = calculateSM2(0, 10, 2.5, 5);
    expect(result.newInterval).toBe(1);
  });

  test('TC02: reset repetitions về 0', () => {
    const result = calculateSM2(0, 10, 2.5, 5);
    expect(result.newRepetitions).toBe(0);
  });

  test('TC03: EF giảm mạnh nhưng không xuống dưới 1.3 (EF ban đầu = 1.3)', () => {
    const result = calculateSM2(0, 1, 1.3, 0);
    expect(result.newEaseFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
  });

  test('TC04: EF giảm từ 2.5 xuống đúng công thức', () => {
    // delta = 0.1 - (5-0)*(0.08+(5-0)*0.02) = 0.1 - 5*(0.08+0.1) = 0.1 - 0.9 = -0.8
    const result = calculateSM2(0, 1, 2.5, 0);
    expect(result.newEaseFactor).toBeCloseTo(1.7, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Nhóm 2: Quality 1-2 — sai, review lại sớm
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 1-2 — incorrect response, review early', () => {
  test('TC05: q=1 → interval=1, repetitions=0', () => {
    const result = calculateSM2(1, 4, 2.5, 3);
    expect(result.newInterval).toBe(1);
    expect(result.newRepetitions).toBe(0);
  });

  test('TC06: q=2 → interval=1, repetitions=0', () => {
    const result = calculateSM2(2, 6, 2.5, 2);
    expect(result.newInterval).toBe(1);
    expect(result.newRepetitions).toBe(0);
  });

  test('TC07: q=1 → EF giảm nhưng không xuống dưới 1.3', () => {
    const result = calculateSM2(1, 1, 1.4, 0);
    expect(result.newEaseFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
  });

  test('TC08: q=2 → EF giảm chính xác theo công thức', () => {
    // delta = 0.1 - (5-2)*(0.08+(5-2)*0.02) = 0.1 - 3*(0.08+0.06) = 0.1 - 0.42 = -0.32
    const result = calculateSM2(2, 1, 2.5, 0);
    expect(result.newEaseFactor).toBeCloseTo(2.18, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Nhóm 3: Quality 3 — biên giới (đúng nhưng khó)
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 3 — correct but difficult (boundary)', () => {
  test('TC09: q=3 → repetitions tăng lên 1', () => {
    const result = calculateSM2(3, 1, 2.5, 0);
    expect(result.newRepetitions).toBe(1);
  });

  test('TC10: q=3, lần đầu đúng → interval=1', () => {
    const result = calculateSM2(3, 1, 2.5, 0);
    expect(result.newInterval).toBe(1);
  });

  test('TC11: q=3 → EF thay đổi đúng (delta = 0.1 - 2*(0.08+0.04) = -0.14)', () => {
    const result = calculateSM2(3, 1, 2.5, 0);
    expect(result.newEaseFactor).toBeCloseTo(2.36, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Nhóm 4: Quality 4-5 — đúng, tăng interval
// ──────────────────────────────────────────────────────────────────────────────
describe('Quality 4-5 — correct response, interval increases', () => {
  test('TC12: q=5, lần đầu tiên (rep=0) → interval=1', () => {
    const result = calculateSM2(5, 1, 2.5, 0);
    expect(result.newInterval).toBe(1);
  });

  test('TC13: q=5, lần thứ 2 (rep=1) → interval=6', () => {
    const result = calculateSM2(5, 1, 2.5, 1);
    expect(result.newInterval).toBe(6);
  });

  test('TC14: q=4, lần thứ 3 (rep=2) → interval = round(interval * EF)', () => {
    // interval=6, EF=2.5 → 6 * 2.5 = 15
    const result = calculateSM2(4, 6, 2.5, 2);
    expect(result.newInterval).toBe(15);
  });

  test('TC15: q=5 → EF tăng đúng công thức (delta = 0.1)', () => {
    // delta = 0.1 - (5-5)*(0.08+(5-5)*0.02) = 0.1 - 0 = 0.1
    const result = calculateSM2(5, 1, 2.5, 0);
    expect(result.newEaseFactor).toBeCloseTo(2.6, 2);
  });

  test('TC16: q=4 → EF gần như không đổi (delta = 0.1 - 1*(0.08+0.02) = 0.0)', () => {
    // delta = 0.1 - 1*(0.08+0.02) = 0
    const result = calculateSM2(4, 1, 2.5, 0);
    expect(result.newEaseFactor).toBeCloseTo(2.5, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Nhóm 5: Edge cases
// ──────────────────────────────────────────────────────────────────────────────
describe('Edge cases', () => {
  test('TC17: EF không bao giờ xuống dưới MIN_EASE_FACTOR = 1.3', () => {
    // Gọi liên tục q=0 nhiều lần
    let ef = 2.5;
    let interval = 1;
    let reps = 0;
    for (let i = 0; i < 10; i++) {
      const r = calculateSM2(0, interval, ef, reps);
      ef = r.newEaseFactor;
      interval = r.newInterval;
      reps = r.newRepetitions;
    }
    expect(ef).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
  });

  test('TC18: nextReviewDate là instance của Date', () => {
    const result = calculateSM2(4, 1, 2.5, 0);
    expect(result.nextReviewDate).toBeInstanceOf(Date);
  });

  test('TC19: nextReviewDate khi interval=1 → ngày mai hoặc hôm nay', () => {
    const result = calculateSM2(4, 1, 2.5, 0);
    const dateStr = result.nextReviewDate.toISOString().slice(0, 10);
    // interval=1 → ngày mai
    expect(dateStr).toBe(futureStr(1));
  });

  test('TC20: interval lớn → nextReviewDate đúng', () => {
    const result = calculateSM2(5, 6, 2.5, 1); // interval = 6
    const dateStr = result.nextReviewDate.toISOString().slice(0, 10);
    expect(dateStr).toBe(futureStr(6));
  });

  test('TC21: quality ngoài range 0-5 → throw RangeError', () => {
    expect(() => calculateSM2(6, 1, 2.5, 0)).toThrow(RangeError);
    expect(() => calculateSM2(-1, 1, 2.5, 0)).toThrow(RangeError);
  });

  test('TC22: q=3 với rep >= 2 → interval tăng theo EF', () => {
    // interval=6, EF=2.0, rep=2 → 6 * 2.0 = 12
    const result = calculateSM2(3, 6, 2.0, 2);
    expect(result.newInterval).toBe(12);
  });

  test('TC23: chuỗi học tập dài: 5 lần q=5 liên tiếp → interval tăng dần', () => {
    let state = { interval: 1, easeFactor: 2.5, repetitions: 0 };
    const intervals = [];
    for (let i = 0; i < 5; i++) {
      const r = calculateSM2(5, state.interval, state.easeFactor, state.repetitions);
      state = { interval: r.newInterval, easeFactor: r.newEaseFactor, repetitions: r.newRepetitions };
      intervals.push(r.newInterval);
    }
    // Interval phải tăng dần (hoặc ít nhất không giảm)
    for (let i = 1; i < intervals.length; i++) {
      expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
    }
  });
});