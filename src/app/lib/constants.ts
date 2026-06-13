/**
 * MindMirror — Constants & Type Definitions
 *
 * Central location for all shared types, maps, and constants
 * used across the MindMirror application.
 */

// ===== TYPES =====

/** Structured metadata returned by the AI alongside each reply */
export interface Meta {
  textSentiment?: string;
  voiceTone?: string;
  faceSignal?: string;
  triggers?: Record<string, number>;
  burnout?: number;
  confidence?: number;
  contradictionDetected?: boolean;
  contradictionType?: string;
  adaptiveQuestion?: string;
  insight?: string;
  crisisFlag?: boolean;
}

/** A single chat message in the conversation */
export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  isCrisis?: boolean;
  meta?: Meta;
}

/** A saved journal entry */
export interface JournalEntry {
  id: number;
  date: string;
  summary: string;
  tags: string[];
  mood?: string;
}

/** Active contradiction state for the alert panel */
export interface ContradictionState {
  detected: boolean;
  type: string;
  question: string;
}

/** User-configurable privacy settings */
export interface Settings {
  camera: boolean;
  voice: boolean;
  journal: boolean;
  crisis: boolean;
}

/** A single data point in the mood timeline chart */
export interface MoodDataPoint {
  label: string;
  score: number;
}

// ===== MOOD & SENTIMENT MAPS =====

/** Maps text sentiment to a 0-100 mood score */
export const MOOD_SCORE_MAP: Record<string, number> = {
  hopeful: 90,
  neutral: 60,
  calm: 75,
  anxious: 35,
  stressed: 25,
  sad: 20,
  overwhelmed: 15,
};

/** Maps text sentiment to an emoji */
export const MOOD_EMOJI_MAP: Record<string, string> = {
  hopeful: '🌤️',
  neutral: '😐',
  calm: '😌',
  anxious: '😰',
  stressed: '😤',
  sad: '😢',
  overwhelmed: '🤯',
};

/** Maps text sentiment to Tailwind badge classes */
export const SENTIMENT_COLOR_MAP: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  anxious: 'bg-amber-50 text-amber-700',
  stressed: 'bg-rose-50 text-rose-700',
  sad: 'bg-violet-50 text-violet-700',
  overwhelmed: 'bg-rose-50 text-rose-700',
  hopeful: 'bg-emerald-50 text-emerald-700',
};

/** Maps voice tone to Tailwind badge classes */
export const TONE_COLOR_MAP: Record<string, string> = {
  calm: 'bg-emerald-50 text-emerald-700',
  strained: 'bg-amber-50 text-amber-700',
  flat: 'bg-slate-100 text-slate-700',
  tired: 'bg-amber-50 text-amber-700',
  tense: 'bg-rose-50 text-rose-700',
  energetic: 'bg-emerald-50 text-emerald-700',
};

/** Maps face signal to Tailwind badge classes */
export const FACE_COLOR_MAP: Record<string, string> = {
  relaxed: 'bg-emerald-50 text-emerald-700',
  tense: 'bg-rose-50 text-rose-700',
  sad: 'bg-violet-50 text-violet-700',
  blank: 'bg-slate-100 text-slate-700',
  worried: 'bg-amber-50 text-amber-700',
  engaged: 'bg-emerald-50 text-emerald-700',
};

// ===== QUICK REPLIES =====

export const QUICK_REPLIES = [
  { text: "I'm fine, just tired", icon: '😐' },
  { text: 'Physics is really stressing me out', icon: '⚛️' },
  { text: "Mock tests didn't go well again", icon: '📝' },
  { text: "I don't know if I can do this", icon: '😔' },
  { text: 'I studied all day but feel worse', icon: '📚' },
];

// ===== CRISIS KEYWORDS =====

/** Client-side crisis detection keywords for immediate helpline display */
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

// ===== CLIENT-SIDE TRIGGER KEYWORDS =====

/** Maps subject categories to keyword patterns for trigger detection */
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

/** Negative sentiment words for client-side analysis */
export const NEGATIVE_WORDS = [
  'stressed', 'anxious', 'worried', 'scared', 'overwhelmed',
  "can't", 'hate', 'terrible', 'awful', 'impossible',
  'hopeless', 'give up', 'burnout', 'exhausted',
];

/** Exam-related subjects for tag extraction */
export const EXAM_SUBJECTS = [
  'Physics', 'Chemistry', 'Math', 'Maths', 'Biology',
  'English', 'History', 'Geography', 'Economics',
  'UPSC', 'JEE', 'NEET', 'CAT', 'GATE',
];
