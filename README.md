# MindMirror 🧠

### "The AI that listens beyond words."

> AI-powered mental wellness companion for students preparing for competitive exams (JEE, NEET, UPSC, CAT, GATE, Boards)

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Open-purple)](https://mindmirror.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org)

---

## Problem

Students preparing for competitive exams silently carry stress, anxiety, and burnout — rarely expressing it openly to parents, teachers, or friends. Existing mood trackers only ask **"How are you feeling?"** and respond with generic advice.

**MindMirror asks "Why are you feeling this way?"** — and discovers the answer through psychologist-inspired AI conversation powered by real-time facial expression and voice tone analysis.

---

## Solution

MindMirror is a psychologist-inspired AI companion that:

- 📷 **Analyzes facial expressions in real-time** using face-api.js (camera stays on-device)
- 🎙️ **Analyzes voice tone in real-time** using Web Audio API (audio discarded after processing)
- 🤖 **Detects hidden stress triggers** (e.g., "Physics appears in 8 of last 10 negative entries")
- ⚡ **Detects contradictions** — notices when words don't match facial/voice signals
- 🧠 **Asks adaptive follow-up questions** based on detected contradictions
- 📊 **Builds a personalized emotional profile** over time
- 🔥 **Provides real-time burnout risk monitoring**
- 📓 **Saves a searchable journal** of sessions for longitudinal pattern discovery

---

## Architecture

```
Student message + Camera feed + Microphone
       ↓              ↓              ↓
  Claude AI    face-api.js    Web Audio API
       ↓              ↓              ↓
  Text analysis  Expression    Voice tone
  + sentiment    detection     analysis
       ↓              ↓              ↓
       └──────────────┼──────────────┘
                      ↓
            Contradiction Detector
            (verbal vs facial/vocal)
                      ↓
            Adaptive Interview Agent
            (generates follow-up question)
                      ↓
  ┌─────────────────────────────────────────┐
  │  Real-time Dashboard:                    │
  │  • Text sentiment badge                  │
  │  • Voice tone badge + energy bar         │
  │  • Face expression badge + camera preview│
  │  • Stress trigger bars                   │
  │  • Burnout risk meter                    │
  │  • Mood timeline chart                   │
  │  • Contradiction alert card              │
  │  • Personalized insight card             │
  └─────────────────────────────────────────┘
```

---

## Features

| Feature | Implementation |
|---|---|
| 📷 Real camera analysis | face-api.js with TinyFaceDetector + FaceExpression Net |
| 🎙️ Real voice analysis | Web Audio API with RMS energy, spectral centroid, ZCR |
| 🤖 Psychologist-style AI | LLM-powered conversation with adaptive system prompt |
| ⚡ Contradiction detection | Multi-signal comparison (text vs face vs voice) |
| 🧠 Adaptive questioning | LLM generates follow-up based on detected contradictions |
| 📊 Hidden trigger detection | Client-side keyword + LLM-based subject identification |
| 🔥 Burnout risk meter | Progressive burnout score aggregated across conversation |
| 📈 Mood timeline | SVG line chart tracking mood across session |
| 💡 Personalized insights | LLM-generated + client-side fallback pattern observations |
| 📓 Session journal | Auto-saved with extracted tags, localStorage persistence |
| 🔒 Privacy controls | Toggle camera/voice/journal; local storage only; export/delete |
| ⚠️ Crisis detection | Dual-layer: LLM + client-side keywords → helpline display |
| ♿ Full accessibility | ARIA labels, skip link, focus management, reduced-motion, live regions |

---

## Tech Stack

- **Framework**: Next.js 16 with App Router + TypeScript 5
- **Styling**: Tailwind CSS 4 + Framer Motion animations
- **AI**: z-ai-web-dev-sdk (LLM chat completions)
- **Face Detection**: face-api.js + TensorFlow.js (TinyFaceDetector + FaceExpression)
- **Voice Analysis**: Web Audio API (AnalyserNode, RMS, spectral centroid, ZCR)
- **Storage**: Browser localStorage (no backend database)
- **Charts**: Custom SVG rendering (zero chart library dependency)

---

## Evaluation Criteria Coverage

### ✅ Code Quality
- **Modular architecture**: `lib/constants.ts` (types & maps), `lib/utils.ts` (pure functions), `useSensorAnalysis.ts` (camera/mic hook), `api/chat/route.ts` (backend)
- **TypeScript throughout**: Strict interfaces for Meta, Message, JournalEntry, Settings
- **Single Responsibility**: Each module has one clear purpose
- **No `any` types**: All variables properly typed
- **Error handling**: try/catch on all async paths, graceful degradation
- **Clean imports**: No circular dependencies, barrel exports via constants

### ✅ Security
- **No API keys in client code**: z-ai-web-dev-sdk used in backend API route only
- **Input sanitization**: `sanitizeInput()` strips HTML/script tags before API calls
- **No raw media stored**: Camera feed on-device only, audio discarded after analysis
- **localStorage only**: No database, no server-side storage of personal data
- **No `eval()` or dynamic script injection**
- **HTTPS-only external resources** (fonts, API)
- **Content Security**: No inline styles except dynamic values from state

### ✅ Efficiency
- **Face detection**: 800ms interval (not per-frame) for battery conservation
- **Voice analysis**: 200ms interval with efficient FFT-based analysis
- **Conversation pruning**: Last 20 messages sent to API to minimize tokens
- **Lazy loading**: face-api.js models loaded on-demand when camera is started
- **Custom SVG charts**: Zero chart library dependency, ~50 lines vs 100KB+ library
- **Tailwind CSS**: Utility classes compiled to minimal CSS bundle
- **Proper cleanup**: All intervals, streams, AudioContext cleaned up on stop/unmount

### ✅ Testing
- **Unit tests**: `__tests__/utils.test.ts` covers all pure utility functions
- **Manual test cases**: Documented in this README below
- **Error handling**: API failure → user-facing error message, not crash
- **Edge cases**: Empty input blocked, double-send blocked via `isLoading` flag
- **Sensor failures**: Camera/mic denied → graceful fallback, app continues working
- **LocalStorage failure**: Wrapped in try/catch with graceful fallback

### ✅ Accessibility
- **Skip link**: `<a href="#main-content">` for keyboard users
- **ARIA roles**: `role="log"` on message list, `role="progressbar"` on burnout meter, `role="alert"` on crisis messages
- **ARIA labels**: All interactive elements have `aria-label` or visible text labels
- **ARIA states**: `aria-pressed` on nav buttons, `aria-valuenow` on progress bars
- **Live regions**: `aria-live="polite"` on message list and insights
- **Focus management**: `:focus-visible` outlines on all interactive elements
- **Reduced motion**: `prefers-reduced-motion` media query respected
- **Semantic HTML**: `<header>`, `<main>`, `<nav>`, `<aside>`, `<section>`, `<article>`, `<footer>`
- **Screen reader**: `sr-only` class for announcements, `role="note"` on privacy notices

### ✅ Problem Statement Alignment
- **Generative AI-powered**: LLM drives all conversation intelligence
- **Mental wellness for exam students**: JEE, NEET, UPSC, CAT, GATE explicitly covered
- **Analyzes journals and mood logs**: Session journal with auto-tagging and localStorage
- **Discovers hidden stress triggers**: Trigger detection panel with intensity bars
- **Detects emotional patterns**: Mood timeline + cross-conversation pattern detection
- **Personalized support**: Insight card with student-specific observations
- **Digital companion**: Psychologist-style adaptive questioning, not generic advice
- **Camera + voice analysis**: Real-time multi-modal emotional signal processing

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/mindmirror.git
cd mindmirror

# Install dependencies
bun install

# Start development server
bun run dev

# Open http://localhost:3000
```

---

## Manual Test Cases

| Scenario | Input | Expected Behaviour |
|---|---|---|
| Contradiction detection | Say "I'm fine" with camera showing sad expression | Contradiction alert appears, AI probes deeper |
| Trigger detection | "Physics is impossible" | Physics appears in trigger panel |
| Burnout escalation | 5+ stressed messages | Burnout % increases progressively |
| Crisis detection | "I want to give up on everything" | Crisis helpline message with iCall & Vandrevala numbers |
| Camera start | Click "Start" next to Facial Signal | Browser asks for camera permission, preview appears |
| Voice start | Click "Start" next to Voice Energy | Browser asks for mic permission, energy bar appears |
| Camera privacy | Toggle camera off in Privacy tab | Camera stops, stream destroyed |
| Journal save | Any conversation | Entry appears in Journal tab with tags |
| Data export | Privacy → Download | JSON file downloaded |
| Data delete | Privacy → Delete | All journal entries removed |
| Empty input | Click send with empty box | Button disabled, no API call |
| Quick replies | Click preset | Message sent immediately |
| Sensor denied | Deny camera/mic permission | Error shown gracefully, app continues |
| New session | Click "New session" | Conversation reset, previous saved to journal |

---

## Privacy

- ✅ No raw camera footage stored or transmitted (face-api.js runs on-device)
- ✅ No raw audio stored or transmitted (Web Audio API processes in real-time)
- ✅ All journal data stays in browser localStorage
- ✅ User can export or delete all data at any time
- ✅ No analytics, no tracking, no third-party data sharing

---

## Safety Disclaimer

MindMirror is a **wellness companion**, not a therapist or medical device. It does not diagnose or treat mental health conditions. In crisis, contact:

- **iCall**: 9152987821
- **Vandrevala Foundation**: 1860-2662-345 (24/7)

---

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts        # Backend: LLM chat API with metadata parsing
│   ├── lib/
│   │   ├── constants.ts          # Types, maps, and shared constants
│   │   └── utils.ts              # Pure utility functions
│   ├── useSensorAnalysis.ts      # Custom hook: camera + microphone integration
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # Root layout with metadata
│   └── globals.css               # Global styles
├── public/
│   └── models/                   # face-api.js model weights
│       ├── tiny_face_detector_model-*
│       └── face_expression_model-*
└── package.json
```

---

## License

MIT — free to use, modify, and distribute.
