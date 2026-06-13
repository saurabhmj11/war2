# MindMirror — AI Wellness Companion That Listens Beyond Words

**Product Requirements Document**

| Field | Value |
|-------|-------|
| Product | MindMirror |
| Event | PromptWars 2025 — Hack2Skill |
| Challenge | Mental Wellness Tracker |
| Version | 2.0 |
| Date | June 2025 |
| Classification | Confidential — Hackathon Team Internal |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State & Problem Analysis](#2-current-state--problem-analysis)
   - 2.1 [The Student Mental Health Crisis](#21-the-student-mental-health-crisis)
   - 2.2 [Limitations of Existing Solutions](#22-limitations-of-existing-solutions)
   - 2.3 [Competitive Landscape: Wysa, Woebot & GitHub Projects](#23-competitive-landscape-wysa-woebot--github-projects)
   - 2.4 [The Opportunity](#24-the-opportunity)
3. [Goals & Expected Outcomes](#3-goals--expected-outcomes)
   - 3.1 [Primary Goals](#31-primary-goals)
   - 3.2 [Expected Outcomes](#32-expected-outcomes)
   - 3.3 [Non-Goals](#33-non-goals)
4. [Solution Design](#4-solution-design)
   - 4.1 [Core Innovation: Contradiction Detection & Adaptive Questioning](#41-core-innovation-contradiction-detection--adaptive-questioning)
   - 4.2 [System Architecture Overview](#42-system-architecture-overview)
   - 4.3 [Input Ingestion Layer](#43-input-ingestion-layer)
   - 4.4 [Multi-Agent Processing Layer](#44-multi-agent-processing-layer)
   - 4.5 [LangGraph Supervisor](#45-langgraph-supervisor)
   - 4.6 [Output & Intervention Layer](#46-output--intervention-layer)
   - 4.7 [Technology Stack](#47-technology-stack)
5. [Implementation Roadmap & Milestones](#5-implementation-roadmap--milestones)
   - 5.1 [Phase 1: Core Pipeline (Weeks 1–3)](#51-phase-1-core-pipeline-weeks-13)
   - 5.2 [Phase 2: Multi-Agent System (Weeks 3–5)](#52-phase-2-multi-agent-system-weeks-35)
   - 5.3 [Phase 3: Real-Time Dashboard (Weeks 5–7)](#53-phase-3-real-time-dashboard-weeks-57)
   - 5.4 [Phase 4: Wearable Integration (Weeks 7–8)](#54-phase-4-wearable-integration-weeks-78)
   - 5.5 [Phase 5: Polish & Demo (Weeks 9–10)](#55-phase-5-polish--demo-weeks-910)
6. [Resource Requirements & Budget](#6-resource-requirements--budget)
   - 6.1 [Team Composition](#61-team-composition)
   - 6.2 [Infrastructure Costs](#62-infrastructure-costs)
   - 6.3 [Open-Source Dependencies](#63-open-source-dependencies)
7. [Risk Analysis & Mitigation](#7-risk-analysis--mitigation)
   - 7.1 [Data Privacy & Security](#71-data-privacy--security)
   - 7.2 [Agent Hallucination & Misinterpretation](#72-agent-hallucination--misinterpretation)
   - 7.3 [Crisis False Positives & Negatives](#73-crisis-false-positives--negatives)
   - 7.4 [Wearable API Reliability](#74-wearable-api-reliability)
   - 7.5 [Performance & Latency](#75-performance--latency)
8. [Expected Benefits & Evaluation](#8-expected-benefits--evaluation)
   - 8.1 [Competitive Differentiation](#81-competitive-differentiation)
   - 8.2 [Student Impact](#82-student-impact)
   - 8.3 [Evaluation Framework](#83-evaluation-framework)
   - 8.4 [Post-Hackathon Roadmap](#84-post-hackathon-roadmap)

---

## 1. Executive Summary

**MindMirror is an AI wellness companion that listens beyond words.** By combining journal entries, voice tone, and facial expressions, it detects hidden emotional patterns and asks adaptive follow-up questions like a psychologist would—uncovering hidden stress triggers and emotional patterns that standard trackers miss.

Most mental wellness tools ask a single question: *"How are you feeling?"* They accept the answer at face value and move on. MindMirror asks a fundamentally different question: *"Why are you feeling this way?"*—and it has the multi-signal context to know when the answer doesn't match reality.

The core innovation is **not** multi-modal emotion detection. Emotion recognition alone is a commodity—any team can plug into an API. MindMirror's innovation is **adaptive questioning driven by multiple emotional signals**. When a student says "I'm fine" but their facial expression shows sadness and their voice carries low energy, MindMirror doesn't just record the contradiction—it uses it as the basis for a carefully constructed follow-up question: *"You said you're fine, but I'm noticing signs of stress. Would you like to talk about what happened today?"* This is exactly how a human counselor works.

MindMirror achieves this through a multi-agent architecture orchestrated by LangGraph. A **Sentiment Agent** analyzes emotional tone from text and voice, a **Behavior Agent** detects patterns of burnout and isolation from activity logs, a **Physio Agent** correlates heart rate variability and sleep quality with stress levels, a **Contradiction Detector** identifies mismatches between what a student says and what their signals reveal, a **Crisis Detector** flags dangerous emotional spikes requiring immediate intervention, and a **Memory Agent** maintains longitudinal context across sessions using ChromaDB vector storage. The LangGraph supervisor fuses these signals in real time, enabling the **Adaptive Interview Agent** to generate personalized follow-up questions, coping strategies, mindfulness exercises, motivational nudges, and crisis escalation when needed.

This PRD defines the product scope, target users, technical architecture, feature specifications, implementation roadmap, risk analysis, and success metrics for MindMirror. The project is scoped for a 10-week development cycle culminating in a live demo at the PromptWars 2025 hackathon, with a post-event roadmap for production deployment.

---

## 2. Current State & Problem Analysis

### 2.1 The Student Mental Health Crisis

Student mental health has deteriorated sharply across global educational institutions. According to the World Health Organization, depression and anxiety rank among the leading causes of illness and disability among adolescents and young adults aged 15 to 29. In India specifically, the National Mental Health Survey reports that nearly 10% of the population is affected by mental health disorders, with students forming a disproportionately large segment due to academic pressure, social isolation, and career uncertainty. The COVID-19 pandemic exacerbated these trends, with remote learning severing the in-person support networks that many students relied upon, and the effects have persisted well beyond lockdown periods.

Despite the severity of this crisis, most available digital tools for mental wellness are fundamentally limited. They treat mental health tracking as a checkbox exercise—a daily mood rating, a gratitude journal prompt, or a pre-recorded meditation session. These tools are static, reactive, and single-dimensional. A student who logs "fine" on a mood tracker while their study behavior shows 14-hour screen sessions and their wearable reports elevated resting heart rate receives no meaningful intervention from the tool, because the tool only sees the self-reported "fine." This disconnect between self-perception and physiological reality is where the deepest problems lie—and it is exactly the gap that the PromptWars challenge identifies when it asks for **"uncovering hidden stress triggers and emotional patterns that standard trackers miss."**

### 2.2 Limitations of Existing Solutions

Most existing tools follow a single pipeline:

```
User writes journal  →  Sentiment Analysis  →  Mood Score  →  Generic Advice
```

They answer the question *"How are you feeling?"* but never ask *"Why?"*

| Limitation | Current Tools | MindMirror Approach |
|------------|---------------|-------------------|
| Single input source | Self-reported mood or journal only | 5 sources: camera, voice, text, behavior, wearable |
| No contradiction detection | Accepts self-report at face value | Cross-signal comparison catches "I'm fine" + sad face |
| No adaptive questioning | Static prompts, same questions every time | Dynamic follow-ups based on detected inconsistencies |
| No context memory | Each session starts fresh | ChromaDB vector store for longitudinal context |
| No crisis detection | Generic "call helpline" links | AI crisis detector with threshold-based escalation |
| Generic interventions | Same tips for all users | Personalized coping strategies from memory-aware agents |
| Simulated empathy | Scripted responses | Genuine understanding through follow-up questions |

*Table 1: Comparison of Current Tools vs. MindMirror Approach*

The fundamental problem is that standard tools take the user's self-report as ground truth. But in mental health, self-report is often unreliable—especially among students who minimize distress due to stigma, cultural norms, or genuine lack of self-awareness. A tool that only sees "I'm fine" will never uncover the hidden stress triggers that the challenge specifically asks for.

### 2.3 Competitive Landscape: Wysa, Woebot & GitHub Projects

To understand MindMirror's positioning, it is essential to analyze the current market leaders and understand not just what they do well, but what they systematically miss.

**Wysa** is one of the most popular AI mental health companions, offering AI conversations, CBT exercises, and mood tracking. Its strengths lie in structured therapeutic techniques and a friendly conversational interface. However, Wysa operates purely on text input. It has no face analysis, no real-time emotion detection from voice, and no adaptive questioning based on non-verbal cues. When a user types "I'm okay," Wysa takes that at face value and moves on. It cannot detect the sadness in the user's face or the flatness in their voice, because it never sees or hears them. Wysa is an effective text-based companion, but it is blind to the 93% of communication that is non-verbal.

**Woebot** takes an evidence-based approach, using principles of Cognitive Behavioral Therapy (CBT) and Interpersonal Psychotherapy (IPT) to guide conversations. It provides good conversational support and structured therapeutic exercises. However, like Wysa, Woebot operates entirely through text chat. It lacks visual emotion analysis entirely, has no behavioral observations beyond what the user types, and performs no real-time signal fusion. Woebot's conversations are guided by clinical protocols—which is valuable—but those protocols are static. They cannot adapt to contradictions between what a user says and what their body language reveals, because Woebot never sees body language.

**Most GitHub Mood Trackers** (MindHaven, Daily Journal Analyzer, MoodTracker, etc.) follow the same pattern: journal input, sentiment analysis, mood chart. Some add AI chat via an LLM API. These are useful building blocks, but they all share the same blind spot: they only process what the user explicitly provides. None of them observe. None of them detect contradictions. None of them ask better questions based on what they observe.

| Feature | Wysa | Woebot | GitHub Trackers | MindMirror |
|---------|------|--------|----------------|------------|
| Journaling analysis | ✅ | ✅ | ✅ | ✅ |
| Mood tracking | ✅ | ✅ | ✅ | ✅ |
| Conversational AI | ✅ | ✅ | Partial | ✅ Adaptive interviewer |
| Hidden stress triggers | Partial | Partial | Partial | ✅ **Strong** |
| Emotional patterns | Partial | Partial | Partial | ✅ **Strong** |
| Face/camera analysis | ❌ | ❌ | ❌ | ✅ |
| Voice emotion detection | ❌ | ❌ | Partial | ✅ |
| Contradiction detection | ❌ | ❌ | ❌ | ✅ **Core feature** |
| Adaptive questioning | ❌ | ❌ | ❌ | ✅ **Core feature** |
| Real-time intervention | ❌ | ❌ | ❌ | ✅ |
| Digital companion empathy | Simulated | Scripted | Weak | ✅ **Through observation** |
| Personalized support | Generic | Protocol-based | Generic | ✅ **Context-aware** |

*Table 2: Competitive Feature Matrix — MindMirror vs. Existing Platforms*

The pattern is clear: existing tools are **passive listeners**. MindMirror is an **active observer**. That distinction maps almost perfectly to the challenge requirement: *"uncovering hidden stress triggers and emotional patterns that standard trackers miss."* That sentence is describing exactly what MindMirror does.

### 2.4 The Opportunity

The convergence of three technology trends creates a unique opportunity. First, large language models (LLMs) like Claude and Gemini have achieved the nuance and safety awareness necessary for mental health applications, capable of understanding emotional subtext and responding with empathy while respecting safety boundaries. Second, on-device emotion detection (facial expression analysis via MediaPipe, voice prosody via Whisper) has become fast, private, and accessible enough for real-time web applications—no clinical hardware required. Third, multi-agent orchestration frameworks like LangGraph have matured to the point where complex workflows—with specialized agents communicating through a central supervisor—can be built and deployed rapidly, making the hackathon timeline feasible.

MindMirror leverages all three trends simultaneously, but its value proposition is not the technology itself—it is what the technology enables: **adaptive questioning that uncovers hidden triggers**. The camera is just one signal. The voice is just one signal. The journal is just one signal. The innovation is the AI's ability to notice inconsistencies across these signals, ask better questions because of them, and uncover stress triggers that any single signal would miss.

---

## 3. Goals & Expected Outcomes

### 3.1 Primary Goals

The primary goal of MindMirror is to build a working, demonstrable prototype that proves the viability of **contradiction-driven adaptive questioning** for mental wellness tracking. The prototype must demonstrate three critical moments:

1. **The Contradiction Moment:** A student says "I'm fine" but their facial expression or voice tone reveals stress—and MindMirror detects this mismatch.
2. **The Adaptive Question:** MindMirror uses the contradiction as the basis for a follow-up question that a standard tracker would never ask: *"You said you're fine, but I'm noticing some tension. Would you like to talk about what's on your mind?"*
3. **The Hidden Trigger:** Through the adaptive conversation, MindMirror helps the student articulate a stress trigger they hadn't consciously identified—demonstrating the "uncovering hidden stress triggers" that the challenge specifically demands.

A secondary but equally important goal is to differentiate MindMirror from the expected hackathon competition. Most teams will build single-source mood trackers with basic sentiment analysis and pre-scripted responses. MindMirror's contradiction detection and adaptive questioning represent a fundamentally different approach that solves the specific problem the challenge identifies. The pitch is not "we detect emotions from multiple sources"—the pitch is **"we uncover hidden stress triggers by listening beyond words."**

### 3.2 Expected Outcomes

| Outcome | Success Metric | Target |
|---------|---------------|--------|
| Contradiction detection | Accuracy of cross-signal mismatch identification | 80%+ on labeled test scenarios |
| Adaptive questioning quality | Human evaluator rating of follow-up relevance | 4/5 or higher |
| Multi-source ingestion | Number of active input channels | 5 sources operational (camera, voice, text, behavior, wearable) |
| Real-time processing | End-to-end latency (input to adaptive response) | Under 5 seconds for text/voice |
| Crisis detection | True positive rate for crisis scenarios | 90%+ with <10% false positive rate |
| Dashboard engagement | Student weekly active usage | 5+ sessions per week in pilot |
| Demo impact | Judge evaluation at PromptWars | Top 3 finish |

*Table 3: Expected Outcomes and Success Metrics*

### 3.3 Non-Goals

The following items are explicitly out of scope for the hackathon prototype but are noted for the post-event production roadmap:

- **Clinical validation** and FDA/CE medical device certification are not pursued in Phase 1; MindMirror is a wellness tool, not a diagnostic or therapeutic device.
- **Full HIPAA/GDPR compliance** infrastructure (encryption at rest, audit logging, consent management) will be designed for but not fully implemented in the prototype.
- **Native mobile applications** (iOS/Android) are deferred in favor of a responsive web application.
- **Integration with electronic health record (EHR)** systems is not included.
- **Multi-language support** beyond English is a Phase 2 consideration.
- **Continuous background camera monitoring** is not included—camera is activated only during journaling/check-in sessions with explicit user consent, addressing privacy concerns.

---

## 4. Solution Design

### 4.1 Core Innovation: Contradiction Detection & Adaptive Questioning

Before detailing the architecture, it is essential to understand MindMirror's core innovation and why it is positioned the way it is.

**The problem with "emotion detection" as a pitch:** Any team can integrate a facial expression API or a voice sentiment API. Judges at PromptWars will see multiple teams doing this, and they will rightfully ask: "So you added a camera to a mood tracker. What's the innovation?" If MindMirror pitches multi-modal emotion detection as its core value, it will be dismissed as a commodity feature wrapped in a nice UI.

**The real innovation:** MindMirror's value is not in *detecting* emotions from multiple sources—it is in *using* those multiple sources to **detect contradictions** and **ask better questions**. A standard tracker asks: *"How are you feeling?"* and accepts whatever answer it receives. MindMirror asks the same question, but then observes whether the answer matches the student's facial expression, voice tone, and behavioral patterns. When it detects a mismatch, it uses that mismatch as the basis for an adaptive follow-up question—the kind of question a psychologist would ask.

```
Standard Tracker:
  Student: "I'm fine."
  AI: "Great! Here's a gratitude exercise."

MindMirror:
  Student: "I'm fine."
  Face: Sad expression detected
  Voice: Low energy, flat prosody
  AI: "You said you're fine, but I'm noticing signs of stress.
       Would you like to talk about what happened today?"
```

This is exactly how a human counselor works. They don't just listen to words—they observe body language, voice tone, and behavioral patterns, and they use inconsistencies to guide the conversation toward deeper understanding. The camera, voice, and wearable data are just **signals** that enable the real product: **adaptive questioning that uncovers hidden triggers.**

**Positioning principle:** Camera emotion detection is NOT the main innovation. The innovation is **adaptive questioning driven by multiple emotional signals**. The camera is just one signal. The AI's ability to notice inconsistencies, ask better questions, and uncover hidden stress triggers is the real value.

### 4.2 System Architecture Overview

MindMirror follows a three-tier architecture: an **Input Ingestion Layer** that normalizes data from heterogeneous sources, a **Multi-Agent Processing Layer** that runs specialized AI agents under a LangGraph supervisor with a Contradiction Detector at its center, and a **Presentation Layer** that renders real-time insights and delivers adaptive follow-up questions on a web dashboard.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          INPUT SOURCES                                   │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Camera  │ │  Voice   │ │  Text    │ │  Study   │ │ Wearable │     │
│  │ (Face)   │ │ Journal  │ │  Diary   │ │ Behavior │ │  Data    │     │
│  │(MediaPipe)│ │(Whisper) │ │ (NLP)    │ │ (Logs)   │ │(HR/Sleep)│     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │             │            │
└───────┼────────────┼────────────┼────────────┼─────────────┼────────────┘
        │            │            │            │             │
        ▼            ▼            ▼            ▼             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      SPECIALIZED AGENTS                                  │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────┐ │
│  │Sentiment │ │ Behavior │ │  Physio  │ │  Contradiction│ │  Memory  │ │
│  │  Agent   │ │  Agent   │ │  Agent   │ │   Detector    │ │  Agent   │ │
│  │(text+voice)│ │(activity)│ │(wearable)│ │  (CORE: cross│ │(ChromaDB)│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ │  -signal     │ └────┬─────┘ │
│       │            │            │        │  mismatch)   │       │       │
│       └────────────┴──────┬─────┘        └──────┬───────┘       │       │
│                           │                      │               │       │
│                    ┌──────▼──────┐        ┌──────▼───────┐      │       │
│                    │  LangGraph  │        │  Adaptive    │◄─────┘       │
│                    │  Supervisor │───────►│  Interview   │              │
│                    │ Orchestrator│        │  Agent       │              │
│                    └─────────────┘        └──────┬───────┘              │
│                                                  │                      │
└──────────────────────────────────────────────────┼──────────────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      OUTPUT & INTERVENTION                               │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │ Adaptive │ │Mindful-  │ │Motivational│ │ Weekly  │ │  Crisis  │     │
│  │ Follow-up│ │  ness    │ │  Nudges   │ │Insights │ │Escalation│     │
│  │Questions │ │Exercises │ │           │ │ Reports │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
```

*Figure 1: MindMirror Architecture — Contradiction Detection at the Core*

### 4.3 Input Ingestion Layer

The Input Ingestion Layer is responsible for collecting, normalizing, and queuing data from five distinct source types. Each source has a dedicated adapter that transforms raw data into a unified internal format (a JSON envelope containing source type, timestamp, content, metadata, and confidence score). The adapters feed into a common message queue (Redis Streams) that buffers incoming data for the processing layer.

**Critical design decision:** Camera and voice data are collected **only during active check-in sessions** with explicit user consent. There is no background monitoring. This addresses the primary privacy concern that judges and users will have, and it differentiates MindMirror from surveillance-style tools. The camera is a check-in tool, not a monitoring tool.

| Source | Adapter | Data Format | Frequency | Privacy Mode |
|--------|---------|-------------|-----------|--------------|
| Camera (Face) | MediaPipe Face Mesh + expression classifier | Facial action units + emotion labels + confidence | On-demand (during check-in) | Session-only, not stored |
| Voice Journal | Whisper STT + emotion prosody | Transcript + pitch/energy/speech-rate features | On-demand (user records) | Audio discarded after processing |
| Text Diary | NLP preprocessor | Raw text + metadata | On-demand (user writes) | Stored with encryption |
| Study Behavior | Activity log parser | Screen time + app usage + break patterns | Every 15 minutes | Aggregated, no content |
| Wearable | Health API connector (HealthKit / Google Fit) | HR, HRV, sleep stages, steps | Every 5 minutes or on event | Anonymized metrics only |

*Table 4: Input Sources, Adapters, and Privacy Modes*

### 4.4 Multi-Agent Processing Layer

The processing layer is the heart of MindMirror. It consists of six specialized agents and a LangGraph supervisor that orchestrates their interactions. Each agent is an independent computational unit with its own prompt template, tools, and memory scope. The **Contradiction Detector** is the central agent—it consumes outputs from all other agents and identifies mismatches that become the basis for adaptive questioning.

#### 4.4.1 Sentiment Agent

The Sentiment Agent processes text, voice transcripts, and facial expression data to extract emotional valence (positive/negative/neutral), arousal level (calm/energetic/agitated), and dominant emotions (joy, sadness, anger, fear, surprise, disgust). It uses a fine-tuned LLM prompt that includes the student's recent emotional history from the Memory Agent, enabling context-aware analysis rather than isolated sentiment scoring. For voice inputs, the agent also considers prosodic features extracted by Whisper (pitch variation, speech rate, pause patterns). For camera inputs, it integrates MediaPipe facial action unit data to produce a visual emotion assessment. The agent outputs a structured sentiment object containing valence score, arousal score, emotion labels with confidence values, and the source of each assessment—enabling the Contradiction Detector to identify when text sentiment contradicts visual or vocal sentiment.

#### 4.4.2 Behavior Agent

The Behavior Agent analyzes study activity patterns to detect behavioral indicators of deteriorating mental health. It tracks screen time distribution across productive vs. distracting applications, break frequency and duration, time-of-day study patterns (late-night studying as a stress indicator), and social interaction frequency. The agent computes a **Burnout Risk Score (0–100)** based on a weighted combination of these factors. Consecutive days with more than 10 hours of screen time and fewer than 2 breaks triggers a "High Burnout Risk" flag. The agent also identifies positive behavioral patterns (consistent study schedules, regular breaks) that can be reinforced through motivational nudges.

#### 4.4.3 Physio Agent

The Physio Agent correlates physiological data from wearable devices with emotional and behavioral states. Its primary inputs are heart rate variability (HRV), resting heart rate, sleep duration and quality (REM/deep/light stages), and step count. The Physio Agent computes a **Stress Index (0–100)** using a composite model that weighs these factors according to established psychophysiological literature. When HRV drops below the student's personal baseline for three consecutive readings, the agent generates a "Physiological Stress Alert" that the supervisor evaluates alongside signals from other agents.

#### 4.4.4 Contradiction Detector (Core Innovation)

The Contradiction Detector is the agent that makes MindMirror fundamentally different from any existing mental wellness tool. It consumes the outputs of the Sentiment Agent, Behavior Agent, and Physio Agent and identifies **cross-signal mismatches**—situations where what the student says contradicts what their other signals reveal.

**Types of contradictions detected:**

| Contradiction Type | Example | Adaptive Response Trigger |
|--------------------|---------|--------------------------|
| Verbal vs. Facial | Says "fine" but face shows sadness | *"You said you're fine, but I notice some tension in your expression."* |
| Verbal vs. Vocal | Says "okay" but voice is flat/low energy | *"You sound a bit tired today. Is there something weighing on you?"* |
| Verbal vs. Behavioral | Says "good" but 14-hour screen time + no breaks | *"You've been working really hard lately. How are you really doing?"* |
| Verbal vs. Physio | Says "relaxed" but HRV is low and HR is elevated | *"Your body seems to be carrying some stress. Want to talk about it?"* |
| Historical vs. Current | Previously reported anxiety but now claims "perfect" | *"Last week you mentioned feeling anxious. Has something changed?"* |

*Table 5: Contradiction Types and Adaptive Response Triggers*

The Contradiction Detector does not simply flag mismatches—it computes a **Contradiction Score (0–100)** based on the severity of the mismatch, the confidence of each signal, and the student's historical baseline. Low-severity contradictions (e.g., slight vocal flatness with positive text) trigger gentle check-ins. High-severity contradictions (e.g., claims of well-being with clear distress signals across multiple channels) trigger direct, empathetic follow-up questions. The scoring model is calibrated to avoid over-interpreting noisy signals while ensuring that genuine distress is never missed.

**Why this is not "just emotion recognition":** Emotion recognition tells you *what* emotion is present. Contradiction detection tells you *that the emotion doesn't match the story*. That mismatch is the entry point for the adaptive conversation that uncovers hidden triggers. Without contradiction detection, you have a multi-signal mood tracker. With it, you have a system that asks the right questions at the right time—like a psychologist.

#### 4.4.5 Crisis Detector

The Crisis Detector is the most safety-critical agent in the system. It monitors all incoming signals for patterns that indicate imminent risk: expressions of self-harm or suicidal ideation in text or voice, sudden and severe drops in sentiment combined with social isolation behavior, extreme physiological stress readings, or direct statements of distress in chat. The agent uses a multi-tier classification approach:

- **Tier 1:** Keyword matching and pattern recognition for known crisis language.
- **Tier 2:** LLM evaluation of context to distinguish figurative language from genuine crisis signals.
- **Tier 3:** Cross-referencing with the Memory Agent's longitudinal data and the Contradiction Detector's output to assess acute changes from baseline.

When a crisis is confirmed, the agent immediately triggers the Crisis Escalation output pathway, which displays prominent helpline information and, with the student's prior consent, notifies a designated emergency contact or campus counselor.

#### 4.4.6 Memory Agent

The Memory Agent maintains longitudinal context for each student using ChromaDB, a vector database that stores embeddings of past sessions, sentiment trajectories, behavioral patterns, contradiction patterns, and intervention outcomes. When any processing agent needs context, it queries the Memory Agent, which retrieves the most relevant historical data using semantic similarity search.

The Memory Agent is particularly important for the Contradiction Detector, because historical context changes the meaning of a contradiction. A student who consistently says "fine" with a sad expression is showing a different pattern than a student who is usually congruent but shows a single mismatch. The Memory Agent enables the system to distinguish between a chronic masking pattern (which warrants a different conversational approach) and an acute emotional shift (which may indicate a new stressor that needs immediate exploration).

The Memory Agent also tracks which interventions were effective for each student in the past, enabling the Adaptive Interview Agent to personalize its questioning style and the coping strategies it recommends.

### 4.5 LangGraph Supervisor

The LangGraph supervisor is the central orchestrator that ties all agents together. It maintains a shared state graph where each node represents an agent and edges represent data flow and conditional routing. The supervisor receives incoming data from the Input Ingestion Layer, determines which agents should process it, dispatches tasks, collects and fuses their outputs, and routes the fused result to the appropriate output agent.

**Supervisor routing logic:**

- A new **voice journal entry** triggers the Sentiment Agent and Memory Agent. Their outputs flow to the Contradiction Detector.
- A **camera check-in** triggers the Sentiment Agent (facial analysis). Combined with any concurrent text/voice data, the Contradiction Detector evaluates cross-signal consistency.
- A **wearable stress alert** triggers the Physio Agent and Crisis Detector. If the student also reports "fine" recently, the Contradiction Detector generates a high-priority mismatch.
- A **chat message** triggers the Sentiment Agent and Memory Agent, with conditional invocation of the Crisis Detector if sentiment scores fall below threshold.
- A **periodic "full review"** every 24 hours runs all agents against accumulated data, generates contradiction reports, and produces the Weekly Insight Report.

The supervisor implements **priority-based scheduling**: crisis signals are processed immediately and preempt all other tasks, contradiction detections are processed next (as they drive adaptive questioning), and routine mood updates are batched during idle cycles.

### 4.6 Output & Intervention Layer

| Output Agent | Trigger | Deliverable | Channel |
|-------------|---------|-------------|---------|
| **Adaptive Interview Agent** | Contradiction Score > 30 | Contextual follow-up question based on detected mismatch | In-app conversation |
| Coping Strategies Agent | Sentiment score < 40 or burnout risk > 60 | Personalized coping technique (breathing, reframing, journaling prompt) | Dashboard notification + chat |
| Mindfulness Exercises Agent | Physio stress index > 65 or explicit request | Guided breathing exercise, body scan, or progressive muscle relaxation | Dashboard + audio playback |
| Motivational Nudges Agent | Positive behavior detected or streak milestone | Encouragement message, streak celebration, progress summary | Push notification + dashboard |
| Weekly Insights Agent | Scheduled (every 7 days) or on-demand | Trend analysis, contradiction patterns, hidden trigger summary | Dashboard report + email |
| Crisis Escalation Agent | Crisis Detector confirms risk | Helpline display, emergency contact notification, campus counselor alert | Full-screen modal + SMS/email |

*Table 6: Output Agents and Their Trigger Conditions*

The **Adaptive Interview Agent** is the most important output agent, because it is the mechanism through which MindMirror delivers its core value: asking the right question at the right time. The agent generates follow-up questions that are:

1. **Specific to the detected contradiction** — not generic, but referencing the particular mismatch (verbal vs. visual, verbal vs. behavioral, etc.)
2. **Empathetic in tone** — never confrontational ("You're lying") but always curious and caring ("I notice something—would you like to explore it?")
3. **Open-ended** — designed to encourage the student to articulate their experience, not just confirm or deny
4. **Contextually informed** — incorporating the Memory Agent's longitudinal data to personalize the question

### 4.7 Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Orchestration | LangGraph | Native multi-agent graph execution with conditional routing |
| LLM (Primary) | Claude API / Google Gemini | Strong safety alignment + nuanced emotional understanding |
| LLM (Fallback) | Groq LLaMA | Low-latency inference for real-time responses |
| Face Expression | MediaPipe Face Mesh | On-device, private, real-time facial action unit detection |
| Voice STT | Whisper API | Best-in-class speech-to-text with prosodic features |
| Memory Store | ChromaDB | Lightweight vector DB, Python-native, fast semantic search |
| Message Queue | Redis Streams | Low-latency pub/sub for real-time data flow |
| Backend | FastAPI | Async Python, WebSocket support, auto-generated API docs |
| Frontend | Next.js 14 + Recharts | Real-time dashboard, SSR, responsive design |
| Database | PostgreSQL + pgvector | Structured data + vector similarity search |
| Deployment | Docker Compose | Single-command deployment for demo; Kubernetes for production |

*Table 7: Technology Stack and Justifications*

---

## 5. Implementation Roadmap & Milestones

The development is structured into five phases over a 10-week timeline, with each phase building on the previous one and delivering a testable increment. The overlapping phases allow parallel work streams where backend and frontend development proceed concurrently.

```
Week →   1    2    3    4    5    6    7    8    9    10
         ├─────────┤                                Phase 1: Core Pipeline
              ├──────────┤                          Phase 2: Multi-Agent + Contradiction
                   ├──────────┤                     Phase 3: Real-Time Dashboard + Camera
                         ├──────┤                   Phase 4: Wearable Integration
                              ├──────┤              Phase 5: Polish & Demo
         ▼      ▼      ▼    ▼   ▼
        MVP   Alpha   Beta  RC  Demo
```

### 5.1 Phase 1: Core Pipeline (Weeks 1–3)

Phase 1 establishes the foundational data pipeline: the Input Ingestion Layer with text diary and chat adapters, the FastAPI backend with WebSocket support, and the LangGraph supervisor skeleton with the Sentiment Agent as the first processing agent. The deliverable at the end of Phase 1 is a minimum viable pipeline where a student can type a journal entry, the Sentiment Agent analyzes it, and the result appears on a basic dashboard. This proves end-to-end connectivity and validates the LangGraph integration before more complex agents are added.

### 5.2 Phase 2: Multi-Agent System + Contradiction Detection (Weeks 3–5)

Phase 2 adds the remaining processing agents (Behavior Agent, Physio Agent, **Contradiction Detector**, Crisis Detector, Memory Agent) and implements the supervisor's conditional routing logic. **The Contradiction Detector is the critical path item**—it is the agent that differentiates MindMirror from every other solution, and its scoring model must be calibrated through iterative testing with labeled contradiction scenarios. The Adaptive Interview Agent is also implemented in this phase, using contradiction scores to generate follow-up questions. The Memory Agent integration with ChromaDB enables longitudinal context for all agents. The deliverable is a fully functional multi-agent pipeline where a text input is processed by multiple agents, the Contradiction Detector identifies cross-signal mismatches, and the Adaptive Interview Agent generates contextually appropriate follow-up questions.

### 5.3 Phase 3: Real-Time Dashboard + Camera Integration (Weeks 5–7)

Phase 3 focuses on the frontend experience and the camera input channel. The real-time Next.js dashboard with Recharts visualizations, WebSocket-driven live updates, and the six output agent deliverables are implemented. The **camera integration with MediaPipe Face Mesh** is the headline feature of this phase—enabling the "I'm fine" + sad face contradiction scenario that will be the centerpiece of the demo. The voice journal adapter with Whisper STT is also implemented. The deliverable is a polished, demo-ready web interface where a student can do a camera check-in, MindMirror detects a contradiction between their verbal and visual signals, and the Adaptive Interview Agent asks a contextual follow-up question in real time. User experience testing with 3–5 student volunteers provides feedback for final adjustments.

### 5.4 Phase 4: Wearable Integration (Weeks 7–8)

Phase 4 integrates wearable data through the Health API connector (Apple HealthKit export or Google Fit API). This is the most technically challenging phase due to the variability of wearable data formats and the need to handle missing or noisy readings gracefully. The Physio Agent's Stress Index model is calibrated using the wearable data, and the Contradiction Detector gains a fourth signal channel (verbal vs. physio contradictions). The real-time dashboard gains a physiological metrics panel. The deliverable is a complete data loop from wearable input through Physio Agent processing to contradiction detection and intervention output.

### 5.5 Phase 5: Polish & Demo (Weeks 9–10)

Phase 5 is dedicated to performance optimization, edge case handling, and demo preparation. The team runs load tests to ensure the system handles concurrent users, stress-tests the crisis detection pathway with adversarial inputs, and prepares the demo script and presentation materials. The demo script is structured around the **three critical moments** defined in Section 3.1: the Contradiction Moment, the Adaptive Question, and the Hidden Trigger. A "Demo Day" dry run with external reviewers provides final feedback. The deliverable is a production-quality demo that can be presented to the PromptWars judges with confidence, including pre-loaded data scenarios that showcase MindMirror's unique ability to listen beyond words.

---

## 6. Resource Requirements & Budget

### 6.1 Team Composition

| Role | Count | Responsibilities |
|------|-------|-----------------|
| Backend Engineer | 2 | FastAPI, LangGraph agents, Redis, PostgreSQL |
| Frontend Engineer | 1 | Next.js dashboard, Recharts, WebSocket client, MediaPipe integration |
| AI/ML Engineer | 1 | LLM prompts, ChromaDB, Contradiction Detector model, facial expression analysis |
| Product/Design Lead | 1 | UX flows, demo script, adaptive questioning design, judge presentation |

*Table 8: Team Composition*

### 6.2 Infrastructure Costs

| Resource | Provider | Spec | Monthly Cost (USD) |
|----------|----------|------|---------------------|
| LLM API (Claude/Gemini) | Anthropic/Google | Pro tier, ~50K requests/month | $150–$300 |
| GPU Instance (ML) | RunPod / Vast.ai | 1x A100, on-demand | $100–$200 |
| Cloud Hosting | Railway / Render | 2 vCPU, 8GB RAM | $20–$50 |
| Vector DB | ChromaDB Cloud | Starter tier | $0–$25 |
| Domain + SSL | Cloudflare | Custom domain | $15 |
| **Total** | | | **$285–$590/month** |

*Table 9: Infrastructure Cost Estimates*

### 6.3 Open-Source Dependencies

MindMirror leverages several open-source projects as building blocks rather than templates:

| Project | GitHub | Usage in MindMirror |
|---------|--------|-------------------|
| Daily Journal Analyzer | [soumyajiitdas/My-GenAICapstoneProject](https://github.com/soumyajiitdas/My-GenAICapstoneProject) | Reference for Gemini-based emotion extraction from journal entries |
| MindHaven | [AminaAsif9/MindHaven](https://github.com/AminaAsif9/MindHaven) | Reference for Streamlit-based mood tracking UI + AI chat |
| MindLink | [Mallika-coder/mindlink](https://github.com/Mallika-coder/mindlink) | On-device TF.js sentiment + gamified student features |
| Awesome Mental Health | [dreamingechoes/awesome-mental-health](https://github.com/dreamingechoes/awesome-mental-health) | Catalog of existing tools and resources |
| Mental Wellness Prompts | [joebwd/mental-wellness-prompts](https://github.com/joebwd/mental-wellness-prompts) | Safety protocols, crisis resources, conversation frameworks |
| MediaPipe | [google/mediapipe](https://github.com/google/mediapipe) | Real-time facial action unit detection (on-device) |

Each of these projects informs specific components of MindMirror without being adopted wholesale, ensuring that the final product is architecturally distinct and solves problems that none of these individual projects address.

---

## 7. Risk Analysis & Mitigation

### Risk Assessment Matrix

| Risk | Likelihood | Impact | Detectability | Risk Score |
|------|-----------|--------|---------------|------------|
| Data Privacy Breach | 2.0 | 5.0 | 4.0 | 3.7 |
| Agent Hallucination | 4.0 | 3.0 | 3.0 | 3.3 |
| Crisis False Positive | 3.0 | 5.0 | 2.0 | 3.3 |
| Wearable API Failure | 3.0 | 2.0 | 4.0 | 3.0 |
| Latency Spike | 3.0 | 3.0 | 4.0 | 3.3 |
| Camera Misinterpretation | 3.5 | 3.0 | 3.0 | 3.2 |
| Over-reliance on Contradiction Detection | 2.5 | 4.0 | 3.0 | 3.2 |

### 7.1 Data Privacy & Security

Mental health data is among the most sensitive categories of personal information, and any breach would be catastrophic for user trust and legal compliance. The primary risk is unauthorized access to stored journal entries, sentiment profiles, or physiological data. **Camera data introduces an additional privacy dimension**—facial images are biometric data, and their handling requires extra care. Mitigation strategies include:

- **Camera data is processed on-device only** (MediaPipe runs in the browser). Raw video frames are never transmitted to the server. Only extracted facial action units and emotion labels (small numerical vectors) are sent.
- **Voice audio is discarded immediately** after Whisper processing. Only the transcript and prosodic features are stored.
- Encrypting all data **at rest (AES-256)** and **in transit (TLS 1.3)**.
- Implementing **role-based access control** with the principle of least privilege.
- Storing **PII separately** from wellness data using pseudonymization.
- Conducting **regular security audits**.

### 7.2 Agent Hallucination & Misinterpretation

LLM-based agents can generate plausible but incorrect responses, which is particularly dangerous in a mental health context. The Contradiction Detector introduces an additional hallucination risk: it may "detect" a contradiction that doesn't exist (e.g., misinterpreting a neutral facial expression as sad), leading to an inappropriate follow-up question that could confuse or upset the student. Mitigation strategies include:

- **Confidence thresholds** on all emotion detection outputs. Low-confidence signals (e.g., facial expression detected with <60% confidence) are flagged as unreliable and do not trigger contradiction alerts.
- **Multi-signal consensus**: A contradiction is only flagged when at least two independent signals disagree with the student's self-report. A single low-confidence signal does not trigger adaptive questioning.
- **Graceful fallback**: When the Contradiction Detector is uncertain, the Adaptive Interview Agent defaults to a gentle, open-ended check-in rather than a specific contradiction-based question.
- Regular **prompt engineering reviews and red-teaming exercises** to reduce LLM hallucination risk.

### 7.3 Crisis False Positives & Negatives

False positives (flagging a non-crisis as a crisis) erode user trust and create alert fatigue, while false negatives (missing a genuine crisis) pose safety risks. The mitigation approach uses the three-tier crisis detection system described in Section 4.4.5, with explicit thresholds calibrated through testing against labeled datasets. We set an initial false positive tolerance of **10%** and a false negative tolerance of effectively **0%**, erring on the side of over-alerting during the prototype phase. Post-launch, we implement a feedback mechanism where users can dismiss false alerts, which feeds back into threshold calibration.

### 7.4 Wearable API Reliability

Wearable data APIs are notoriously inconsistent: data may arrive late, in batches, or not at all due to device disconnection, battery death, or API rate limits. The mitigation strategy includes:

- Implementing a **data staleness detector** that marks readings older than 30 minutes as "stale" and adjusts the Physio Agent's confidence accordingly.
- Maintaining a **last-known-good state** so the dashboard continues to display the most recent valid reading.
- Providing **fallback data sources** (manual input prompts when wearable data is unavailable).
- Designing the Physio Agent to **gracefully degrade** to behavior-only analysis when physiological data is missing.
- The Contradiction Detector **reduces the weight of stale wearable data** in its scoring, preventing false contradictions from outdated readings.

### 7.5 Performance & Latency

Real-time dashboard updates require low-latency processing, but multi-agent pipelines with multiple LLM calls can introduce significant delays. A single input that triggers three agents, each making one LLM call, could take 10–15 seconds in a sequential implementation. This is particularly critical for the camera check-in experience, where the student expects an immediate adaptive response. Mitigation strategies include:

- **MediaPipe runs entirely on-device** (browser WASM), so facial expression results are available in <200ms with no server round-trip.
- **Parallelizing independent agent calls** (all five agents can run simultaneously on different inputs).
- Implementing **streaming responses** so the Adaptive Interview Agent's follow-up question appears incrementally.
- Using **Groq LLaMA for low-latency fallback** when the primary LLM is slow.
- **Caching frequent query patterns** in Redis.

### 7.6 Camera Misinterpretation

Facial expression analysis is inherently noisy—lighting conditions, camera angle, cultural differences in emotional expression, and conditions like resting bitch face can all produce false readings. A student with a naturally neutral expression might be consistently misidentified as "sad" or "angry," generating false contradictions. Mitigation strategies include:

- **Personal baseline calibration**: During onboarding, MindMirror collects a baseline of the student's typical facial expressions across multiple check-ins. The Contradiction Detector compares against this personal baseline rather than population norms.
- **Confidence gating**: Facial expression outputs below a confidence threshold (initially set at 60%) are treated as "uncertain" and do not trigger contradiction-based questioning.
- **Temporal smoothing**: A single frame's emotion label is never used alone. The system requires consistent emotion signals across at least 3 seconds of video before generating a contradiction flag.
- **Cultural sensitivity**: The expression classifier is configured to avoid over-interpreting expressions that may have different meanings across cultures.

### 7.7 Over-Reliance on Contradiction Detection

There is a risk that the system becomes too focused on detecting contradictions and fails to respond appropriately when the student's self-report is actually accurate (i.e., they really are fine). The mitigation strategy includes:

- **Respecting congruent signals**: When all signals align (student says "fine" and their face/voice/behavior also indicate fine), the system should validate this and move on—don't go looking for problems that don't exist.
- **Contradiction fatigue monitoring**: The Memory Agent tracks how many contradictions have been flagged for a student over time. If a student experiences frequent false contradictions, the threshold for flagging is automatically raised to reduce noise.
- **User feedback loop**: After each adaptive follow-up question, the student can indicate whether the question was helpful. This feedback calibrates the Contradiction Detector's sensitivity for that individual.

---

## 8. Expected Benefits & Evaluation

### 8.1 Competitive Differentiation

MindMirror's contradiction-driven adaptive questioning provides structural advantages that cannot be replicated by teams building single-source mood trackers or multi-modal emotion detectors. The differentiation is not in *detecting* emotions from multiple sources—it is in *using* those sources to ask better questions.

| Dimension | MindMirror | Typical Hackathon Project | Wysa/Woebot |
|-----------|------------|--------------------------|-------------|
| Journaling analysis | ✅ | ✅ | ✅ |
| Mood tracking | ✅ | ✅ | ✅ |
| Hidden stress triggers | ✅ **Strong** | Partial | Partial |
| Emotional patterns | ✅ **Strong** | Partial | Partial |
| Conversational AI | ✅ Adaptive interviewer | Basic chatbot | Protocol-based |
| Contradiction detection | ✅ **Core feature** | ❌ | ❌ |
| Adaptive questioning | ✅ **Core feature** | ❌ | ❌ |
| Camera/face analysis | ✅ (1 signal) | Rare | ❌ |
| Voice emotion detection | ✅ (1 signal) | Rare | ❌ |
| Real-time intervention | ✅ | ❌ | ❌ |
| Digital companion empathy | ✅ **Through observation** | Weak | Simulated/Scripted |
| Personalized support | ✅ **Context-aware** | Generic | Protocol-based |

*Table 10: Competitive Differentiation Matrix*

The key insight is that MindMirror maps almost perfectly to the specific language of the challenge: **"uncovering hidden stress triggers and emotional patterns that standard trackers miss."** That sentence describes the exact output of the Contradiction Detector + Adaptive Interview Agent pipeline. Standard trackers miss hidden triggers because they only process what the student explicitly says. MindMirror uncovers them by observing what the student doesn't say.

### 8.2 Student Impact

For students, MindMirror offers three transformative benefits:

1. **Being truly seen:** Most students are used to wellness tools that accept "I'm fine" at face value. MindMirror is different—it notices the sadness behind the smile, the stress behind the "okay," the exhaustion behind the "good." This is not surveillance; it is the kind of attentive observation that a good counselor provides. For students who minimize their distress (a common pattern, especially among male students and in cultures where mental health struggles carry stigma), MindMirror provides the first experience of being genuinely understood by a digital tool.

2. **Discovering hidden triggers:** Through adaptive questioning, MindMirror helps students articulate stress triggers they hadn't consciously identified. A student who says "I'm fine" but shows physiological stress may, through a well-timed follow-up question, realize that an upcoming exam they haven't been thinking about is actually causing significant anxiety. This "uncovering" process—moving from unconscious stress to articulated awareness—is the core therapeutic mechanism.

3. **Personalized care over time:** The Memory Agent tracks which contradictions are chronic vs. acute, which adaptive questions lead to breakthroughs, and which coping strategies actually work for each individual student. Over time, MindMirror becomes more attuned to each student's patterns, asking better questions and offering more relevant support.

### 8.3 Evaluation Framework

| Evaluation Dimension | Method | Target |
|---------------------|--------|--------|
| Contradiction detection accuracy | Labeled scenario testing (verbal vs. signal mismatches) | 80%+ correct identification |
| Adaptive question quality | Human evaluator blind rating (relevance, empathy, helpfulness) | 4/5 or higher |
| Technical correctness | Unit tests + integration tests | 95%+ pass rate |
| Agent accuracy | Labeled dataset evaluation | 80%+ sentiment alignment |
| Crisis detection | Red-team adversarial testing | 90%+ true positive, <10% false positive |
| System latency | Load testing (k6 / Locust) | p95 < 5s for text input pipeline |
| User satisfaction | Student pilot survey (SUS) | Score > 70/100 |
| Demo impact | PromptWars judge scores | Top 3 placement |

*Table 11: Evaluation Framework*

### 8.4 Post-Hackathon Roadmap

If MindMirror performs well at PromptWars, the team plans to pursue a three-track post-event development strategy:

**Research Track** — Partnering with a university psychology department to conduct a formal IRB-approved study validating the contradiction detection + adaptive questioning approach against single-source baselines. The key research question: *Does adaptive questioning based on cross-signal contradictions lead to more accurate identification of hidden stress triggers compared to standard self-report-based tracking?* This study would provide the clinical evidence necessary for institutional adoption.

**Product Track** — Building native mobile applications (where camera access is more natural and continuous), implementing full HIPAA/GDPR compliance infrastructure, and developing a freemium monetization model with institutional licensing for universities. The mobile app enables a more seamless camera check-in experience—students can do a quick face + voice check-in between classes without opening a laptop.

**Open-Source Track** — Releasing the Contradiction Detector agent template, the Adaptive Interview Agent prompt library, and the ChromaDB integration patterns as open-source libraries. This enables other developers to build similar adaptive questioning systems and establishes MindMirror as the reference architecture for contradiction-driven mental wellness tools.

Each track operates on a **6-month timeline**, with the first milestone being a pilot deployment at the team's home institution within 3 months of the hackathon.
