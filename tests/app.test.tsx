import { describe, it, expect } from 'vitest';
import {
  detectCrisis,
  detectTriggers,
  isNegative,
  detectClientContradiction,
  extractTags,
  mergeTriggers,
  clamp,
  MOOD_SCORE_MAP,
} from '../src/lib/mindmirror';

// ============================================================
// Crisis Detection Tests
// ============================================================
describe('detectCrisis', () => {
  it('returns true for explicit suicidal ideation', () => {
    expect(detectCrisis('I want to kill myself')).toBe(true);
  });

  it('returns true for hopelessness keywords', () => {
    expect(detectCrisis('I want to end it all')).toBe(true);
    expect(detectCrisis("I can't go on anymore")).toBe(true);
    expect(detectCrisis('better off dead')).toBe(true);
  });

  it('returns false for normal distress without crisis language', () => {
    expect(detectCrisis("I'm feeling stressed about physics")).toBe(false);
    expect(detectCrisis("I don't want to study")).toBe(false);
    expect(detectCrisis('I hate mock tests')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(detectCrisis('I WANT TO END IT ALL')).toBe(true);
    expect(detectCrisis('Suicide thoughts')).toBe(true);
  });
});

// ============================================================
// Trigger Detection Tests
// ============================================================
describe('detectTriggers', () => {
  it('detects Physics trigger', () => {
    const triggers = detectTriggers('I am struggling with physics today');
    expect(triggers['Physics']).toBe(65);
  });

  it('detects multiple triggers simultaneously', () => {
    const triggers = detectTriggers('my parents want me to ace my mock test');
    expect(triggers['Parents']).toBe(65);
    expect(triggers['Mock Tests']).toBe(65);
  });

  it('returns empty object when no triggers present', () => {
    const triggers = detectTriggers('I feel okay today');
    expect(Object.keys(triggers).length).toBe(0);
  });

  it('detects Sleep trigger', () => {
    const triggers = detectTriggers("I can't sleep because of deadlines");
    expect(triggers['Sleep']).toBe(65);
  });

  it('detects Math trigger with variant spellings', () => {
    expect(detectTriggers('maths is hard')['Math']).toBe(65);
    expect(detectTriggers('calculus is killing me')['Math']).toBe(65);
  });
});

// ============================================================
// Negative Sentiment Detection Tests
// ============================================================
describe('isNegative', () => {
  it('returns true for stressed language', () => {
    expect(isNegative('I am so stressed today')).toBe(true);
    expect(isNegative("I'm overwhelmed with everything")).toBe(true);
    expect(isNegative('Feeling hopeless')).toBe(true);
  });

  it('returns false for positive language', () => {
    expect(isNegative('I feel great today!')).toBe(false);
    expect(isNegative("I'm ready for the exam")).toBe(false);
  });
});

// ============================================================
// Contradiction Detection Tests (Core Innovation)
// ============================================================
describe('detectClientContradiction', () => {
  it('detects contradiction: says fine but uses negative words', () => {
    expect(detectClientContradiction("I'm fine but I'm so stressed")).toBe(true);
    expect(detectClientContradiction("I'm fine, just exhausted")).toBe(true);
    expect(detectClientContradiction("It's fine I just can't do this")).toBe(true);
  });

  it('returns false when only saying fine without negative context', () => {
    expect(detectClientContradiction("I'm fine, feeling good")).toBe(false);
    expect(detectClientContradiction('Everything is fine')).toBe(false);
  });

  it('returns false for negative text without "fine"', () => {
    expect(detectClientContradiction("I'm really stressed today")).toBe(false);
  });
});

// ============================================================
// Tag Extraction Tests
// ============================================================
describe('extractTags', () => {
  it('extracts subject tags', () => {
    const tags = extractTags('Physics and Chemistry are hard for JEE');
    expect(tags).toContain('Physics');
    expect(tags).toContain('Chemistry');
    expect(tags).toContain('JEE');
  });

  it('extracts emotional tags', () => {
    const tags = extractTags('I am so stressed and anxious today');
    expect(tags).toContain('stress');
    expect(tags).toContain('anxiety');
  });

  it('extracts burnout and self-doubt tags', () => {
    const tags = extractTags('I am tired and want to give up');
    expect(tags).toContain('burnout');
    expect(tags).toContain('self-doubt');
  });

  it('limits to 4 tags maximum', () => {
    const tags = extractTags('Physics Chemistry Math Biology JEE NEET stressed anxious');
    expect(tags.length).toBeLessThanOrEqual(4);
  });
});

// ============================================================
// Trigger Merging Tests
// ============================================================
describe('mergeTriggers', () => {
  it('merges two maps keeping max values', () => {
    const existing = { Physics: 60, Chemistry: 40 };
    const incoming = { Physics: 80, Math: 65 };
    const merged = mergeTriggers(existing, incoming);
    expect(merged['Physics']).toBe(80); // max of 60 and 80
    expect(merged['Chemistry']).toBe(40);
    expect(merged['Math']).toBe(65);
  });

  it('respects maxEntries limit', () => {
    const existing = { A: 90, B: 80, C: 70, D: 60, E: 50 };
    const incoming = { F: 40, G: 30, H: 20 };
    const merged = mergeTriggers(existing, incoming, 5);
    expect(Object.keys(merged).length).toBeLessThanOrEqual(5);
  });

  it('sorts by intensity descending', () => {
    const merged = mergeTriggers({ B: 30 }, { A: 90, C: 60 });
    const keys = Object.keys(merged);
    expect(keys[0]).toBe('A'); // highest first
  });
});

// ============================================================
// Utility Tests
// ============================================================
describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-10, 0, 100)).toBe(0);
    expect(clamp(50, 0, 100)).toBe(50);
  });
});

describe('MOOD_SCORE_MAP', () => {
  it('maps positive moods to high scores', () => {
    expect(MOOD_SCORE_MAP['hopeful']).toBeGreaterThan(70);
    expect(MOOD_SCORE_MAP['calm']).toBeGreaterThan(70);
  });

  it('maps negative moods to low scores', () => {
    expect(MOOD_SCORE_MAP['overwhelmed']).toBeLessThan(30);
    expect(MOOD_SCORE_MAP['stressed']).toBeLessThan(30);
    expect(MOOD_SCORE_MAP['sad']).toBeLessThan(30);
  });
});
