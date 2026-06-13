/**
 * Core business logic for MindMirror.
 * Isolated from UI for testability.
 */

export const CRISIS_KEYWORDS = [
  'give up on everything',
  'end it all',
  'no point living',
  'suicide',
  'kill myself',
  "don't want to live",
  'want to die',
  'end my life',
  "can't go on",
  'better off dead',
];

export const NEGATIVE_WORDS = [
  'stressed', 'anxious', 'worried', 'scared', 'overwhelmed',
  "can't", 'hate', 'terrible', 'awful', 'impossible',
  'hopeless', 'give up', 'burnout', 'exhausted',
];

export const SUBJECT_KEYWORDS: Record<string, string[]> = {
  Physics: ['physics', 'mechanics', 'thermodynamics', 'electro'],
  Chemistry: ['chemistry', 'organic', 'inorganic', 'reactions'],
  Math: ['math', 'maths', 'calculus', 'algebra', 'trigonometry'],
  Biology: ['biology', 'botany', 'zoology'],
  Parents: ['parents', 'mom', 'dad', 'family pressure', 'family expects'],
  Sleep: ['sleep', 'insomnia', "can't sleep", 'tired', 'exhausted'],
  Time: ['time', 'running out of time', 'deadline', 'not enough time'],
  'Mock Tests': ['mock test', 'mock exam', 'practice test', 'test score'],
};

export const MOOD_SCORE_MAP: Record<string, number> = {
  hopeful: 90,
  neutral: 60,
  calm: 75,
  anxious: 35,
  stressed: 25,
  sad: 20,
  overwhelmed: 15,
};

/**
 * Detects if a message contains crisis-level language.
 */
export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Detects stress triggers from message text.
 * Returns a map of subject -> intensity score (always 65 for keyword match).
 */
export function detectTriggers(text: string): Record<string, number> {
  const lower = text.toLowerCase();
  const result: Record<string, number> = {};
  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      result[subject] = 65;
    }
  }
  return result;
}

/**
 * Returns true if the message contains predominantly negative language.
 */
export function isNegative(text: string): boolean {
  const lower = text.toLowerCase();
  return NEGATIVE_WORDS.some((w) => lower.includes(w));
}

/**
 * Detects a client-side contradiction: says "fine" but uses negative words.
 */
export function detectClientContradiction(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('fine') && isNegative(text);
}

/**
 * Extracts journal tags from message text.
 */
export function extractTags(text: string): string[] {
  const subjects = [
    'Physics', 'Chemistry', 'Math', 'Maths', 'Biology', 'English',
    'History', 'Geography', 'Economics', 'UPSC', 'JEE', 'NEET', 'CAT', 'GATE',
  ];
  const tags: string[] = [];
  subjects.forEach((s) => {
    if (text.toLowerCase().includes(s.toLowerCase())) tags.push(s);
  });
  if (/stress|stressed|pressure/i.test(text)) tags.push('stress');
  if (/tired|exhaust|burnout/i.test(text)) tags.push('burnout');
  if (/can't|cannot|give up/i.test(text)) tags.push('self-doubt');
  if (/anxious|worry|nervous/i.test(text)) tags.push('anxiety');
  return tags.slice(0, 4);
}

/**
 * Merges two trigger maps, keeping the maximum value for each key
 * and returning only the top N triggers.
 */
export function mergeTriggers(
  existing: Record<string, number>,
  incoming: Record<string, number>,
  maxEntries = 8,
): Record<string, number> {
  const merged = { ...existing };
  for (const [key, val] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] ?? 0, val);
  }
  return Object.fromEntries(
    Object.entries(merged)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxEntries),
  );
}

/**
 * Clamps a numeric value between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
