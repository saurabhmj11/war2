/**
 * MindMirror — Unit Tests for Utility Functions
 *
 * Tests all pure functions in lib/utils.ts
 * Run with: bun test
 */

import { describe, test, expect } from 'bun:test';
import {
  extractTags,
  detectCrisisKeywords,
  detectTriggers,
  hasNegativeSentiment,
  calculateBurnoutIncrement,
  formatMessageText,
  mergeTriggers,
  sanitizeInput,
  getBurnoutDisplay,
  generateClientInsight,
} from '../lib/utils';

// ===== extractTags =====
describe('extractTags', () => {
  test('extracts subject tags from text', () => {
    const result = extractTags('Physics is really hard and Chemistry too');
    expect(result).toContain('Physics');
    expect(result).toContain('Chemistry');
  });

  test('extracts emotional tags', () => {
    const result = extractTags('I am stressed and exhausted');
    expect(result).toContain('stress');
    expect(result).toContain('burnout');
  });

  test('extracts self-doubt tag', () => {
    const result = extractTags("I can't do this anymore, give up");
    expect(result).toContain('self-doubt');
  });

  test('returns empty array for neutral text', () => {
    const result = extractTags('The weather is nice today');
    expect(result).toHaveLength(0);
  });

  test('limits to 4 tags maximum', () => {
    const result = extractTags('Physics Chemistry Math Biology English stress burnout');
    expect(result.length).toBeLessThanOrEqual(4);
  });

  test('is case-insensitive for subjects', () => {
    const result = extractTags('physics is hard');
    expect(result).toContain('Physics');
  });
});

// ===== detectCrisisKeywords =====
describe('detectCrisisKeywords', () => {
  test('detects "give up on everything"', () => {
    expect(detectCrisisKeywords('I want to give up on everything')).toBe(true);
  });

  test('detects "end it all"', () => {
    expect(detectCrisisKeywords('I want to end it all')).toBe(true);
  });

  test('detects "suicide"', () => {
    expect(detectCrisisKeywords('suicide thoughts')).toBe(true);
  });

  test('does not flag normal text', () => {
    expect(detectCrisisKeywords('I am studying for my exams')).toBe(false);
  });

  test('is case-insensitive', () => {
    expect(detectCrisisKeywords('I Want To Die')).toBe(true);
  });
});

// ===== detectTriggers =====
describe('detectTriggers', () => {
  test('detects Physics trigger', () => {
    const result = detectTriggers('Physics is stressing me out');
    expect(result.Physics).toBe(65);
  });

  test('detects multiple triggers', () => {
    const result = detectTriggers('Physics and Chemistry are hard, parents are pressuring me');
    expect(result.Physics).toBeDefined();
    expect(result.Chemistry).toBeDefined();
    expect(result.Parents).toBeDefined();
  });

  test('detects Sleep trigger', () => {
    const result = detectTriggers("I can't sleep before exams");
    expect(result.Sleep).toBeDefined();
  });

  test('returns empty for neutral text', () => {
    const result = detectTriggers('The weather is nice');
    expect(Object.keys(result)).toHaveLength(0);
  });
});

// ===== hasNegativeSentiment =====
describe('hasNegativeSentiment', () => {
  test('detects stressed', () => {
    expect(hasNegativeSentiment('I am so stressed')).toBe(true);
  });

  test('detects anxious', () => {
    expect(hasNegativeSentiment('Feeling very anxious today')).toBe(true);
  });

  test('detects can\'t', () => {
    expect(hasNegativeSentiment("I can't do this")).toBe(true);
  });

  test('returns false for positive text', () => {
    expect(hasNegativeSentiment('I am feeling great today')).toBe(false);
  });
});

// ===== calculateBurnoutIncrement =====
describe('calculateBurnoutIncrement', () => {
  test('returns 8 for negative text', () => {
    expect(calculateBurnoutIncrement('I am stressed')).toBe(8);
  });

  test('returns 0 for neutral text', () => {
    expect(calculateBurnoutIncrement('The sky is blue')).toBe(0);
  });
});

// ===== formatMessageText =====
describe('formatMessageText', () => {
  test('converts **bold** to <strong>', () => {
    expect(formatMessageText('This is **bold** text')).toContain('<strong>bold</strong>');
  });

  test('converts newlines to <br>', () => {
    expect(formatMessageText('Line 1\nLine 2')).toContain('<br>');
  });

  test('handles plain text unchanged', () => {
    expect(formatMessageText('Hello world')).toBe('Hello world');
  });
});

// ===== mergeTriggers =====
describe('mergeTriggers', () => {
  test('merges new triggers into existing', () => {
    const existing = { Physics: 50 };
    const incoming = { Chemistry: 65 };
    const result = mergeTriggers(existing, incoming);
    expect(result.Physics).toBe(50);
    expect(result.Chemistry).toBe(65);
  });

  test('keeps maximum value for duplicate keys', () => {
    const existing = { Physics: 50 };
    const incoming = { Physics: 75 };
    const result = mergeTriggers(existing, incoming);
    expect(result.Physics).toBe(75);
  });

  test('limits to maxItems', () => {
    const existing = { A: 10, B: 20, C: 30, D: 40, E: 50 };
    const incoming = { F: 60, G: 70, H: 80, I: 90 };
    const result = mergeTriggers(existing, incoming, 4);
    expect(Object.keys(result)).toHaveLength(4);
  });

  test('sorts by value descending', () => {
    const existing = { A: 10 };
    const incoming = { B: 90, C: 50 };
    const result = mergeTriggers(existing, incoming);
    const values = Object.values(result);
    for (let i = 1; i < values.length; i++) {
      expect(values[i - 1]).toBeGreaterThanOrEqual(values[i]);
    }
  });
});

// ===== sanitizeInput =====
describe('sanitizeInput', () => {
  test('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  test('removes script tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>hello')).toBe('hello');
  });

  test('removes HTML tags', () => {
    expect(sanitizeInput('<b>bold</b> text')).toBe('bold text');
  });

  test('preserves normal text', () => {
    expect(sanitizeInput('I am stressed about Physics')).toBe('I am stressed about Physics');
  });
});

// ===== getBurnoutDisplay =====
describe('getBurnoutDisplay', () => {
  test('returns "—" for 0 burnout', () => {
    expect(getBurnoutDisplay(0).label).toBe('—');
  });

  test('returns "Low" for low burnout', () => {
    expect(getBurnoutDisplay(20).label).toBe('Low');
  });

  test('returns "Moderate" for mid burnout', () => {
    expect(getBurnoutDisplay(45).label).toBe('Moderate');
  });

  test('returns "High" for high burnout', () => {
    expect(getBurnoutDisplay(75).label).toBe('High');
  });

  test('returns correct color classes', () => {
    expect(getBurnoutDisplay(75).color).toContain('rose');
    expect(getBurnoutDisplay(45).color).toContain('amber');
    expect(getBurnoutDisplay(20).color).toContain('emerald');
  });
});

// ===== generateClientInsight =====
describe('generateClientInsight', () => {
  test('generates insight for triggers with negative sentiment', () => {
    const result = generateClientInsight({ Physics: 65 }, true);
    expect(result).toContain('Physics');
    expect(result).toContain('knowledge-gap anxiety');
  });

  test('returns null when no triggers', () => {
    const result = generateClientInsight({}, true);
    expect(result).toBeNull();
  });

  test('returns null when no negative sentiment', () => {
    const result = generateClientInsight({ Physics: 65 }, false);
    expect(result).toBeNull();
  });
});
