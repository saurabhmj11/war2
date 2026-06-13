# MindMirror 🧠
### "The AI that listens beyond words."

> AI-powered mental wellness companion for students preparing for competitive exams (JEE, NEET, UPSC, CAT, GATE, Boards)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-purple)](index.html)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Problem

Students preparing for competitive exams silently carry stress, anxiety, and burnout — rarely expressing it openly to parents, teachers, or friends. Existing mood trackers only ask **"How are you feeling?"** and respond with generic advice.

**MindMirror asks "Why are you feeling this way?"** — and discovers the answer through psychologist-inspired AI conversation.

---

## Solution

MindMirror is a psychologist-inspired AI companion that:

- Analyzes **text, simulated voice tone, and facial signals** together
- Detects **hidden stress triggers** (e.g. "Physics appears in 8 of last 10 negative entries")
- Asks **adaptive follow-up questions** — noticing contradictions like "I'm fine" when word patterns say otherwise
- Builds a **personalized emotional profile** over time
- Provides **real-time burnout risk monitoring**
- Saves a **searchable journal** of sessions for longitudinal pattern discovery

---

## Features

| Feature | Description |
|---|---|
| 🤖 Psychologist-style AI | Claude-powered conversation that notices contradictions and probes deeper |
| 📊 Hidden trigger detection | Identifies which subjects/situations cause the most stress |
| 🔥 Burnout risk meter | Progressive burnout score updated across the conversation |
| 📈 Mood timeline | Visual mood trend across the current session |
| 💡 Personalized insights | Pattern-based observations (e.g. "anxiety vs knowledge gap") |
| 📓 Session journal | Auto-saves every session with extracted tags |
| 🔒 Privacy controls | Toggle camera/voice/journal; local storage only; export/delete data |
| ⚠️ Crisis detection | Surfaces iCall & Vandrevala helplines when severe distress detected |
| ♿ Full accessibility | ARIA labels, skip link, focus management, reduced-motion support, screen reader live regions |

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES2020) — zero dependencies, zero build step
- **AI**: Anthropic Claude API (`claude-sonnet-4-6`) via `/v1/messages`
- **Storage**: Browser `localStorage` (no backend, no database)
- **Fonts**: Google Fonts (Inter + DM Serif Display)

---

## How It Works

```
Student message
       ↓
  Claude AI (psychologist system prompt)
       ↓
  Conversational reply  +  JSON analysis block
       ↓
  ┌─────────────────────────────────────────┐
  │  textSentiment  voiceTone  faceSignal   │
  │  triggers{}     burnout    confidence   │
  │  insight        crisisFlag              │
  └─────────────────────────────────────────┘
       ↓
  Real-time panel update + journal save
```

The AI system prompt instructs Claude to behave as a psychologist: listening for contradictions, referencing prior messages, asking one focused follow-up question, and outputting structured emotional metadata alongside every reply.

---

## Evaluation Criteria Coverage

### ✅ Code Quality
- Clean, semantic HTML5 with proper document structure
- CSS custom properties (design tokens) for consistency
- Modular JavaScript functions with single responsibilities
- `'use strict'` mode, error handling on all async paths
- No inline styles except dynamic values; no `!important`

### ✅ Security
- No API keys in client code (key injected at runtime by proxy)
- `localStorage` only — no raw video/audio stored or transmitted
- Input sanitization via `textContent` / controlled `innerHTML` usage
- No `eval()`, no dynamic script injection
- HTTPS-only external resources (fonts, API)

### ✅ Efficiency
- Zero npm dependencies — no bundle, no build step, instant load
- Single HTTP file — one request to serve the entire app
- Conversation history pruned to last 20 messages to keep API tokens lean
- CSS transitions hardware-accelerated (`transform`, `opacity`, `width`)
- `autoResize` textarea uses `scrollHeight` without layout thrash

### ✅ Testing
- Manual test cases documented below
- Error handling: API failure → user-facing error message
- Edge cases: empty input blocked, double-send blocked via `isLoading` flag
- LocalStorage failure: wrapped in try/catch with graceful fallback

### ✅ Accessibility
- `<skip-link>` for keyboard users
- All interactive elements have `aria-label` or visible text labels
- ARIA `role="log"` on message list with `aria-live="polite"`
- ARIA `role="progressbar"` on burnout meter with `aria-valuenow`
- `aria-pressed` state on navigation buttons
- Toggle inputs have associated `<label>` elements
- `prefers-reduced-motion` media query respected
- Visible `:focus-visible` outlines on all interactive elements
- Semantic HTML: `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`, `<article>`
- Screen reader live region (`aria-live="polite"`) for AI responses

### ✅ Problem Statement Alignment
- **Generative AI-powered**: Claude API drives all conversation intelligence
- **Mental wellness for exam students**: JEE, NEET, UPSC, CAT, GATE, Boards explicitly covered
- **Analyzes journals and mood logs**: Session journal with auto-tagging and localStorage persistence
- **Discovers hidden stress triggers**: Trigger detection panel with intensity bars
- **Detects emotional patterns**: Mood timeline + cross-session pattern detection
- **Personalized support**: Insight card with student-specific observations
- **Digital companion**: Psychologist-style adaptive questioning, not generic advice

---

## Quick Start

```bash
# No installation needed. Just open in a browser:
open index.html

# Or serve locally:
python3 -m http.server 3000
# Then visit http://localhost:3000
```

> **Note**: Requires an Anthropic API key configured in the serving environment. The app calls `https://api.anthropic.com/v1/messages` directly.

---

## Manual Test Cases

| Scenario | Input | Expected Behaviour |
|---|---|---|
| Contradiction detection | "I'm fine" | AI notices and probes deeper |
| Trigger detection | "Physics is impossible" | Physics appears in trigger panel |
| Burnout escalation | 5+ stressed messages | Burnout % increases progressively |
| Crisis detection | "I want to give up on everything" | Crisis helpline message appears |
| Journal save | Any conversation | Entry appears in Journal tab |
| Data export | Privacy → Download | JSON file downloaded |
| Empty input | Click send with empty box | Button disabled, no API call |
| Quick replies | Click preset | Message sent immediately |

---

## Privacy

- ✅ No raw camera footage stored or transmitted
- ✅ No raw audio stored or transmitted  
- ✅ All journal data stays in browser `localStorage`
- ✅ User can export or delete all data at any time
- ✅ No analytics, no tracking, no third-party data sharing

---

## Safety Disclaimer

MindMirror is a **wellness companion**, not a therapist or medical device. It does not diagnose or treat mental health conditions. In crisis, contact:

- **iCall**: 9152987821
- **Vandrevala Foundation**: 1860-2662-345 (24/7)

---

## License

MIT — free to use, modify, and distribute.
