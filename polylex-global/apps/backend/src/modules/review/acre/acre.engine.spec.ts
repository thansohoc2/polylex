import { calculateAcre } from './acre.engine';
import { AcreInput, LEECH_THRESHOLD } from '@polylex/shared-types';

function makeInput(overrides: Partial<AcreInput> = {}): AcreInput {
  return {
    recallQuality: 4,
    responseTimeMs: 1800,
    confidenceLevel: 4,
    memoryStrength: 0.5,
    leechScore: 0,
    difficultyUser: 0.3,
    reviewMode: 'flashcard',
    reviewCount: 3,
    currentIntervalDays: 4,
    ...overrides,
  };
}

describe('ACRE Engine', () => {
  // Test 1: Good recall increases memory strength
  it('increases memoryStrength on good recall (quality=4)', () => {
    const input = makeInput({ memoryStrength: 0.5, recallQuality: 4 });
    const out = calculateAcre(input);
    expect(out.newMemoryStrength).toBeGreaterThan(0.5);
  });

  // Test 2: Failed recall decreases memory strength
  it('decreases memoryStrength on failed recall (quality=0)', () => {
    const input = makeInput({ memoryStrength: 0.6, recallQuality: 0 });
    const out = calculateAcre(input);
    expect(out.newMemoryStrength).toBeLessThan(0.6);
  });

  // Test 3: Memory strength stays in [0, 1]
  it('clamps newMemoryStrength to [0, 1]', () => {
    const perfect = makeInput({ memoryStrength: 0.99, recallQuality: 5, confidenceLevel: 5 });
    const fail = makeInput({ memoryStrength: 0.01, recallQuality: 0, confidenceLevel: 1 });
    expect(calculateAcre(perfect).newMemoryStrength).toBeLessThanOrEqual(1.0);
    expect(calculateAcre(fail).newMemoryStrength).toBeGreaterThanOrEqual(0.0);
  });

  // Test 4: Leech score increments on failure
  it('increments leechScore on quality < 2', () => {
    const input = makeInput({ leechScore: 5, recallQuality: 1 });
    const out = calculateAcre(input);
    expect(out.newLeechScore).toBe(6);
  });

  // Test 5: Leech flag triggers at threshold
  it('marks isLeech=true when newLeechScore >= LEECH_THRESHOLD', () => {
    const input = makeInput({ leechScore: LEECH_THRESHOLD - 1, recallQuality: 0 });
    const out = calculateAcre(input);
    expect(out.isLeech).toBe(true);
    expect(out.newLeechScore).toBeGreaterThanOrEqual(LEECH_THRESHOLD);
  });

  // Test 6: Again (quality=0) resets interval very short
  it('resets interval to near-zero on quality=0', () => {
    const input = makeInput({ recallQuality: 0, currentIntervalDays: 30 });
    const out = calculateAcre(input);
    expect(out.intervalDays).toBeLessThan(1);
  });

  // Test 7: recommendedMode escalates with high strength
  it('recommends sentence mode for near-mastered words (strength ≥ 0.80)', () => {
    const input = makeInput({ memoryStrength: 0.90, recallQuality: 5, confidenceLevel: 5 });
    const out = calculateAcre(input);
    expect(out.recommendedMode).toBe('sentence');
  });

  // Test 8: nextReview is a future date
  it('always returns a future nextReview date', () => {
    const input = makeInput();
    const out = calculateAcre(input);
    expect(out.nextReview.getTime()).toBeGreaterThan(Date.now());
  });
});
