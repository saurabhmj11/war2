/**
 * MindMirror — Utility Functions
 *
 * Pure helper functions used across the application.
 * All functions are stateless and side-effect free.
 */

import { EXAM_SUBJECTS, NEGATIVE_WORDS, MOOD_SCORE_MAP, SUBJECT_KEYWORDS } from './constants';
import type { MoodDataPoint } from './constants';

/**
 * Extracts relevant tags from user text for journal entries.
 * Tags include exam subjects, emotional states, and common patterns.
 */
export function extractTags(text: string): string[] {
  const tags: string[] = [];

  // Subject tags
  EXAM_SUBJECTS.forEach(subject => {
    if (text.toLowerCase().includes(subject.toLowerCase())) {
      tags.push(subject);
    }
  });

  // Emotion tags
  if (/stress|stressed|pressure/i.test(text)) tags.push('stress');
  if (/tired|exhaust|burnout/i.test(text)) tags.push('burnout');
  if (/can't|cannot|give up/i.test(text)) tags.push('self-doubt');
  if (/anxious|worry|nervous/i.test(text)) tags.push('anxiety');

  return tags.slice(0, 4);
}

/**
 * Detects client-side crisis keywords in user text.
 * Returns true if any crisis keyword pattern is found.
 */
export function detectCrisisKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  const keywords = [
    'give up on everything', 'end it all', 'no point living',
    'suicide', 'kill myself', "don't want to live",
    'want to die', 'end my life', "can't go on", 'better off dead',
  ];
  return keywords.some(kw => lower.includes(kw));
}

/**
 * Detects client-side subject triggers from user text.
 * Returns a map of trigger name → intensity score (0-100).
 */
export function detectTriggers(text: string): Record<string, number> {
  const triggers: Record<string, number> = {};
  const lower = text.toLowerCase();

  for (const [subject, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      triggers[subject] = 65;
    }
  }

  return triggers;
}

/**
 * Checks if text contains negative sentiment words.
 */
export function hasNegativeSentiment(text: string): boolean {
  const lower = text.toLowerCase();
  return NEGATIVE_WORDS.some(w => lower.includes(w));
}

/**
 * Calculates burnout increment based on text sentiment.
 * Returns a value to add to the current burnout score.
 */
export function calculateBurnoutIncrement(text: string): number {
  return hasNegativeSentiment(text) ? 8 : 0;
}

/**
 * Gets the current time formatted for display.
 */
export function getFormattedTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats message text with basic markdown (bold) support.
 * Converts **text** to <strong>text</strong> and \n to <br>.
 */
export function formatMessageText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

/**
 * Merges trigger maps, keeping the maximum value for each key.
 * Returns the top N triggers sorted by intensity (descending).
 */
export function mergeTriggers(
  existing: Record<string, number>,
  incoming: Record<string, number>,
  maxItems: number = 8
): Record<string, number> {
  const merged = { ...existing };
  for (const [key, val] of Object.entries(incoming)) {
    merged[key] = Math.max(merged[key] || 0, val);
  }
  const sorted = Object.entries(merged)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems);
  return Object.fromEntries(sorted);
}

/**
 * Sanitizes user input text by trimming and removing script tags.
 * Used before sending to the API to prevent injection.
 */
export function sanitizeInput(text: string): string {
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, ''); // Strip all HTML tags
}

/**
 * Gets burnout display properties based on the current burnout level.
 */
export function getBurnoutDisplay(burnout: number): {
  label: string;
  color: string;
  barColor: string;
  description: string;
} {
  return {
    label: burnout >= 70 ? 'High' : burnout >= 40 ? 'Moderate' : burnout > 0 ? 'Low' : '—',
    color: burnout >= 70 ? 'text-rose-600' : burnout >= 40 ? 'text-amber-600' : 'text-emerald-600',
    barColor: burnout >= 70 ? 'bg-rose-500' : burnout >= 40 ? 'bg-amber-500' : 'bg-emerald-500',
    description: burnout >= 70
      ? 'Consider taking a real break today.'
      : burnout >= 40
        ? "You're pushing hard. Rest matters."
        : burnout > 0
          ? "You're managing well right now."
          : 'No data yet',
  };
}

/**
 * Generates a client-side insight based on triggers and conversation context.
 * This serves as a fallback when the LLM doesn't provide an insight.
 */
export function generateClientInsight(
  triggers: Record<string, number>,
  hasNegative: boolean
): string | null {
  const triggerNames = Object.keys(triggers);
  if (triggerNames.length === 0 || !hasNegative) return null;

  const topTrigger = triggerNames[0];
  return `${topTrigger} appears frequently alongside your stressful thoughts — this might be a knowledge-gap anxiety pattern, not a capability issue.`;
}

/**
 * Renders an SVG mood timeline chart from mood data points.
 * Returns SVG markup as a string for use in dangerouslySetInnerHTML.
 */
export function renderMoodChartSVG(moodHistory: MoodDataPoint[]): string | null {
  if (moodHistory.length === 0) return null;

  const w = 280;
  const h = 80;
  const padX = 24;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  // Single data point
  if (moodHistory.length === 1) {
    const m = moodHistory[0];
    const px = padX + chartW / 2;
    const py = padY + chartH - (m.score / 100) * chartH;
    const moodLabel = Object.entries(MOOD_SCORE_MAP).find(([, v]) => v === m.score)?.[0] || '';

    return `<svg viewBox="0 0 ${w} ${h}" class="w-full" aria-label="Mood trend chart">
      ${[0, 25, 50, 75, 100].map(v => {
        const y = padY + chartH - (v / 100) * chartH;
        return `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="3 3"/>`;
      }).join('')}
      <circle cx="${px}" cy="${py}" r="5" fill="#7c3aed" stroke="#fff" stroke-width="2"/>
      <text x="${w / 2}" y="${h - 2}" text-anchor="middle" font-size="8" fill="#94a3b8" font-family="Inter, sans-serif">${moodLabel}</text>
    </svg>`;
  }

  // Multiple data points
  const points = moodHistory.map((m, i) => ({
    x: padX + (i / Math.max(moodHistory.length - 1, 1)) * chartW,
    y: padY + chartH - (m.score / 100) * chartH,
    score: m.score,
    label: m.label,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

  return `<svg viewBox="0 0 ${w} ${h}" class="w-full" aria-label="Mood trend chart">
    ${[0, 25, 50, 75, 100].map(v => {
      const y = padY + chartH - (v / 100) * chartH;
      return `<line x1="${padX}" y1="${y}" x2="${w - padX}" y2="${y}" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="3 3"/>`;
    }).join('')}
    <path d="${areaPath}" fill="url(#moodGrad)" opacity="0.3"/>
    <path d="${linePath}" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#7c3aed" stroke="#fff" stroke-width="1.5"/>`).join('')}
    ${points.map(p => `<text x="${p.x}" y="${h - 2}" text-anchor="middle" font-size="7" fill="#94a3b8" font-family="Inter, sans-serif">${p.label}</text>`).join('')}
    <defs><linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/></linearGradient></defs>
  </svg>`;
}
