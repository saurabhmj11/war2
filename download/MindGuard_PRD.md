# MindGuard — Multi-Agent Real-Time Mental Wellness Tracker

**Product Requirements Document**

| Field | Value |
|-------|-------|
| Event | PromptWars 2025 — Hack2Skill |
| Challenge | Mental Wellness Tracker |
| Version | 1.0 |
| Date | June 2025 |
| Classification | Confidential — Hackathon Team Internal |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State & Problem Analysis](#2-current-state--problem-analysis)
   - 2.1 [The Student Mental Health Crisis](#21-the-student-mental-health-crisis)
   - 2.2 [Limitations of Existing Solutions](#22-limitations-of-existing-solutions)
   - 2.3 [The Opportunity](#23-the-opportunity)
3. [Goals & Expected Outcomes](#3-goals--expected-outcomes)
   - 3.1 [Primary Goals](#31-primary-goals)
   - 3.2 [Expected Outcomes](#32-expected-outcomes)
   - 3.3 [Non-Goals](#33-non-goals)
4. [Solution Design](#4-solution-design)
   - 4.1 [System Architecture Overview](#41-system-architecture-overview)
   - 4.2 [Input Ingestion Layer](#42-input-ingestion-layer)
   - 4.3 [Multi-Agent Processing Layer](#43-multi-agent-processing-layer)
   - 4.4 [LangGraph Supervisor](#44-langgraph-supervisor)
   - 4.5 [Output & Intervention Layer](#45-output--intervention-layer)
   - 4.6 [Technology Stack](#46-technology-stack)
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

MindGuard is a multi-agent, real-time mental wellness tracking platform designed specifically for students experiencing academic stress, anxiety, and emotional burnout. Unlike existing mood trackers that rely on single-source self-reporting and static journaling, MindGuard aggregates signals from five distinct input channels—voice journals, text diaries, study behavior logs, conversational chat, and wearable physiological data—and processes them through a team of specialized AI agents orchestrated by a LangGraph supervisor. The result is a continuously updated, holistic understanding of each student's mental state that no single data source could capture alone.

The platform's core innovation lies in its multi-agent architecture. A **Sentiment Agent** analyzes emotional tone from text and voice, a **Behavior Agent** detects patterns of burnout and isolation from activity logs, a **Physio Agent** correlates heart rate variability and sleep quality with stress levels, a **Crisis Detector** flags dangerous emotional spikes requiring immediate intervention, and a **Memory Agent** maintains longitudinal context across sessions using ChromaDB vector storage. The LangGraph supervisor fuses these signals in real time, routing to personalized output agents that deliver coping strategies, mindfulness exercises, motivational nudges, weekly insight reports, or crisis escalation to a human counselor.

This PRD defines the product scope, target users, technical architecture, feature specifications, implementation roadmap, risk analysis, and success metrics for MindGuard. The project is scoped for a 10-week development cycle culminating in a live demo at the PromptWars 2025 hackathon, with a post-event roadmap for production deployment. MindGuard aims to solve a deeper problem than what typical hackathon teams will address: not just tracking mood, but understanding the full context of a student's mental wellness and intervening proactively before crises develop.

---

## 2. Current State & Problem Analysis

### 2.1 The Student Mental Health Crisis

Student mental health has deteriorated sharply across global educational institutions. According to the World Health Organization, depression and anxiety rank among the leading causes of illness and disability among adolescents and young adults aged 15 to 29. In India specifically, the National Mental Health Survey reports that nearly 10% of the population is affected by mental health disorders, with students forming a disproportionately large segment due to academic pressure, social isolation, and career uncertainty. The COVID-19 pandemic exacerbated these trends, with remote learning severing the in-person support networks that many students relied upon, and the effects have persisted well beyond lockdown periods.

Despite the severity of this crisis, most available digital tools for mental wellness are fundamentally limited. They treat mental health tracking as a checkbox exercise—a daily mood rating, a gratitude journal prompt, or a pre-recorded meditation session. These tools are static, reactive, and single-dimensional. A student who logs "fine" on a mood tracker while their study behavior shows 14-hour screen sessions and their wearable reports elevated resting heart rate receives no meaningful intervention from the tool, because the tool only sees the self-reported "fine." This disconnect between self-perception and physiological reality is where the deepest problems lie.

### 2.2 Limitations of Existing Solutions

| Limitation | Current Tools | MindGuard Approach |
|------------|---------------|-------------------|
| Single input source | Self-reported mood or journal only | 5 sources: voice, text, behavior, chat, wearable |
| No real-time analysis | Daily check-ins, static prompts | Continuous streaming analysis with live dashboard |
| No context memory | Each session starts fresh | ChromaDB vector store for longitudinal context |
| No crisis detection | Generic "call helpline" links | AI crisis detector with threshold-based escalation |
| No multi-signal fusion | Only text sentiment considered | LangGraph supervisor fuses sentiment + behavior + physio |
| Generic interventions | Same tips for all users | Personalized coping strategies from memory-aware agents |

*Table 1: Comparison of Current Tools vs. MindGuard Approach*

### 2.3 The Opportunity

The convergence of three technology trends creates a unique opportunity. First, large language models (LLMs) like Claude and Gemini have achieved the nuance and safety awareness necessary for mental health applications, capable of understanding emotional subtext and responding with empathy while respecting safety boundaries. Second, wearable devices have become ubiquitous among students, providing continuous physiological data streams (heart rate, sleep patterns, activity levels) that were previously available only in clinical settings. Third, multi-agent orchestration frameworks like LangGraph have matured to the point where complex workflows—with specialized agents communicating through a central supervisor—can be built and deployed rapidly, making the hackathon timeline feasible.

MindGuard leverages all three trends simultaneously. No existing open-source project or commercial product combines multi-source input, multi-agent processing, and real-time dashboarding in a single platform focused on student wellness. The closest reference architectures—the Daily Journal Analyzer (Gemini-based emotion extraction) and MindHaven (Streamlit mood tracker with DeepSeek chat)—each cover only one or two of these dimensions. MindGuard covers all five.

---

## 3. Goals & Expected Outcomes

### 3.1 Primary Goals

The primary goal of MindGuard is to build a working, demonstrable prototype that proves the viability of multi-agent, multi-source mental wellness tracking for students. The prototype must show end-to-end data flow from at least three input sources through the agent pipeline to the real-time dashboard within a single user session. It must demonstrate the LangGraph supervisor making intelligent routing decisions based on fused agent outputs, and it must include at least one crisis detection scenario that triggers an escalation pathway.

A secondary but equally important goal is to differentiate MindGuard from the expected hackathon competition. Most teams at PromptWars will build single-source mood trackers with basic sentiment analysis and pre-scripted responses. MindGuard's multi-agent architecture, real-time multi-signal fusion, and longitudinal memory represent a fundamentally different approach that solves deeper problems—not just "what is the user feeling?" but "what is the full context of their wellness, and what should we do about it right now?"

### 3.2 Expected Outcomes

| Outcome | Success Metric | Target |
|---------|---------------|--------|
| Multi-source ingestion | Number of active input channels | 5 sources operational |
| Real-time processing | End-to-end latency (input to dashboard) | Under 5 seconds for text/voice |
| Agent accuracy | Sentiment alignment with human labels | 80%+ on test dataset |
| Crisis detection | True positive rate for crisis scenarios | 90%+ with <10% false positive rate |
| Dashboard engagement | Student weekly active usage | 5+ sessions per week in pilot |
| Demo impact | Judge evaluation at PromptWars | Top 3 finish |

*Table 2: Expected Outcomes and Success Metrics*

### 3.3 Non-Goals

The following items are explicitly out of scope for the hackathon prototype but are noted for the post-event production roadmap:

- **Clinical validation** and FDA/CE medical device certification are not pursued in Phase 1; MindGuard is a wellness tool, not a diagnostic or therapeutic device.
- **Full HIPAA/GDPR compliance** infrastructure (encryption at rest, audit logging, consent management) will be designed for but not fully implemented in the prototype.
- **Native mobile applications** (iOS/Android) are deferred in favor of a responsive web application.
- **Integration with electronic health record (EHR)** systems is not included.
- **Multi-language support** beyond English is a Phase 2 consideration.

---

## 4. Solution Design

### 4.1 System Architecture Overview

MindGuard follows a three-tier architecture: an **Input Ingestion Layer** that normalizes data from heterogeneous sources, a **Multi-Agent Processing Layer** that runs specialized AI agents under a LangGraph supervisor, and a **Presentation Layer** that renders real-time insights on a web dashboard. Each tier communicates through well-defined APIs, enabling independent scaling and testing. The architecture is designed to be modular—new input sources or processing agents can be added without modifying existing components.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        INPUT SOURCES                                     │
│  ┌─────────┐ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐    │
│  │  Voice   │ │  Text   │ │  Study   │ │  Chat   │ │  Wearable    │    │
│  │ Journal  │ │  Diary  │ │ Behavior │ │         │ │  Data        │    │
│  │(Whisper) │ │ (NLP)   │ │ (Logs)   │ │(Conv.)  │ │(HR/Sleep)    │    │
│  └────┬─────┘ └────┬────┘ └────┬─────┘ └────┬────┘ └──────┬───────┘    │
│       │            │           │            │             │             │
└───────┼────────────┼───────────┼────────────┼─────────────┼─────────────┘
        │            │           │            │             │
        ▼            ▼           ▼            ▼             ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     SPECIALIZED AGENTS                                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │Sentiment │ │ Behavior │ │  Physio  │ │  Crisis  │ │  Memory  │     │
│  │  Agent   │ │  Agent   │ │  Agent   │ │ Detector │ │  Agent   │     │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │
│       │            │            │            │             │            │
│       └────────────┴──────┬─────┴────────────┘             │            │
│                           │                                │            │
│                    ┌──────▼──────┐                         │            │
│                    │  LangGraph  │◄────────────────────────┘            │
│                    │  Supervisor │                                      │
│                    │ Orchestrator│                                      │
│                    └──────┬──────┘                                      │
│                           │                                             │
└───────────────────────────┼─────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       OUTPUT AGENTS                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Coping  │ │Mindful-  │ │Motivational│ │ Weekly  │ │  Crisis  │     │
│  │Strategies│ │  ness    │ │  Nudges   │ │Insights │ │Escalation│     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   ChromaDB    │
                    │  Vector Store │
                    │ (Long-Term    │
                    │   Memory)     │
                    └───────────────┘
```

*Figure 1: MindGuard Multi-Agent Architecture Overview*

### 4.2 Input Ingestion Layer

The Input Ingestion Layer is responsible for collecting, normalizing, and queuing data from five distinct source types. Each source has a dedicated adapter that transforms raw data into a unified internal format (a JSON envelope containing source type, timestamp, content, metadata, and confidence score). The adapters feed into a common message queue (Redis Streams) that buffers incoming data for the processing layer.

| Source | Adapter | Data Format | Frequency |
|--------|---------|-------------|-----------|
| Voice Journal | Whisper STT + emotion prosody | Transcript + audio features | On-demand (user records) |
| Text Diary | NLP preprocessor | Raw text + metadata | On-demand (user writes) |
| Study Behavior | Activity log parser | Screen time + app usage + break patterns | Every 15 minutes |
| Chat | Conversation adapter | Message thread + intent tags | Real-time (per message) |
| Wearable | Health API connector (Apple HealthKit / Google Fit) | HR, HRV, sleep stages, steps | Every 5 minutes or on event |

*Table 3: Input Sources and Their Adapters*

### 4.3 Multi-Agent Processing Layer

The processing layer is the heart of MindGuard. It consists of five specialized agents and a LangGraph supervisor that orchestrates their interactions. Each agent is an independent computational unit with its own prompt template, tools, and memory scope. The supervisor maintains a shared state graph and routes tasks based on the current context, urgency level, and agent availability. This design ensures that no single agent becomes a bottleneck and that the system gracefully degrades if one agent is unavailable.

#### 4.3.1 Sentiment Agent

The Sentiment Agent processes text and voice transcript inputs to extract emotional valence (positive/negative/neutral), arousal level (calm/energetic/agitated), and dominant emotions (joy, sadness, anger, fear, surprise, disgust). It uses a fine-tuned LLM prompt that includes the student's recent emotional history from the Memory Agent, enabling context-aware analysis rather than isolated sentiment scoring. For voice inputs, the agent also considers prosodic features extracted by Whisper (pitch variation, speech rate, pause patterns) that provide additional emotional signals beyond the transcript text. The agent outputs a structured sentiment object containing valence score, arousal score, emotion labels with confidence values, and a brief textual analysis that other agents can consume.

#### 4.3.2 Behavior Agent

The Behavior Agent analyzes study activity patterns to detect behavioral indicators of deteriorating mental health. It tracks screen time distribution across productive vs. distracting applications, break frequency and duration, time-of-day study patterns (late-night studying as a stress indicator), and social interaction frequency (if the student opts into messaging metadata). The agent computes a **Burnout Risk Score (0–100)** based on a weighted combination of these factors, using thresholds derived from occupational health research on academic burnout. For example, consecutive days with more than 10 hours of screen time and fewer than 2 breaks triggers a "High Burnout Risk" flag. The agent also identifies positive behavioral patterns (consistent study schedules, regular breaks) that can be reinforced through motivational nudges.

#### 4.3.3 Physio Agent

The Physio Agent correlates physiological data from wearable devices with emotional and behavioral states. Its primary inputs are heart rate variability (HRV), resting heart rate, sleep duration and quality (REM/deep/light stages), and step count. Research consistently shows that reduced HRV correlates with stress and anxiety, elevated resting heart rate can indicate chronic stress, and disrupted sleep architecture is both a symptom and predictor of depression. The Physio Agent computes a **Stress Index (0–100)** using a composite model that weighs these factors according to established psychophysiological literature. When HRV drops below the student's personal baseline for three consecutive readings, the agent generates a "Physiological Stress Alert" that the supervisor evaluates alongside signals from other agents.

#### 4.3.4 Crisis Detector

The Crisis Detector is the most safety-critical agent in the system. It monitors all incoming signals for patterns that indicate imminent risk: expressions of self-harm or suicidal ideation in text or voice, sudden and severe drops in sentiment combined with social isolation behavior, extreme physiological stress readings, or direct statements of distress in chat. The agent uses a multi-tier classification approach:

- **Tier 1:** Keyword matching and pattern recognition for known crisis language (e.g., self-harm phrases, hopelessness indicators).
- **Tier 2:** LLM evaluation of context to distinguish between figurative language ("I'm dying of stress") and genuine crisis signals ("I don't see the point anymore").
- **Tier 3:** Cross-referencing with the Memory Agent's longitudinal data to assess whether this is an acute change from the student's baseline.

When a crisis is confirmed, the agent immediately triggers the Crisis Escalation output pathway, which displays prominent helpline information and, with the student's prior consent, notifies a designated emergency contact or campus counselor.

#### 4.3.5 Memory Agent

The Memory Agent maintains longitudinal context for each student using ChromaDB, a vector database that stores embeddings of past sessions, sentiment trajectories, behavioral patterns, and intervention outcomes. When any processing agent needs context (e.g., "has this student's mood been declining over the past week?"), it queries the Memory Agent, which retrieves the most relevant historical data using semantic similarity search. This enables the system to move beyond reactive, session-by-session analysis toward truly contextualized understanding.

For example, the Sentiment Agent can interpret "I'm okay" very differently if the Memory Agent reports that the same student has been logging this response for five consecutive days while their physiological data shows deteriorating sleep. The Memory Agent also tracks which interventions were effective for each student in the past, enabling personalized coping strategy recommendations.

### 4.4 LangGraph Supervisor

The LangGraph supervisor is the central orchestrator that ties all agents together. It maintains a shared state graph where each node represents an agent and edges represent data flow and conditional routing. The supervisor receives incoming data from the Input Ingestion Layer, determines which agents should process it based on the data type and current context, dispatches tasks to those agents, collects and fuses their outputs, and routes the fused result to the appropriate output agent. The supervisor also implements priority-based scheduling: crisis signals are processed immediately and preempt all other tasks, while routine mood updates are batched and processed during idle cycles to optimize resource usage.

The supervisor's routing logic is implemented as a conditional graph in LangGraph. For each incoming data event, the supervisor evaluates the current state (recent sentiment, burnout risk, stress index, crisis flags) and decides which agents need to be invoked:

- A new **voice journal entry** triggers the Sentiment Agent and Memory Agent.
- A **wearable stress alert** triggers the Physio Agent and Crisis Detector.
- A **chat message** triggers the Sentiment Agent and Memory Agent, with conditional invocation of the Crisis Detector if sentiment scores fall below a threshold.
- A **periodic "full review"** every 24 hours runs all agents against the accumulated data to generate the Weekly Insight Report.

### 4.5 Output & Intervention Layer

| Output Agent | Trigger | Deliverable | Channel |
|-------------|---------|-------------|---------|
| Coping Strategies Agent | Sentiment score < 40 or burnout risk > 60 | Personalized coping technique (breathing, reframing, journaling prompt) | Dashboard notification + chat |
| Mindfulness Exercises Agent | Physio stress index > 65 or explicit request | Guided breathing exercise, body scan, or progressive muscle relaxation | Dashboard + audio playback |
| Motivational Nudges Agent | Positive behavior detected or streak milestone | Encouragement message, streak celebration, progress summary | Push notification + dashboard |
| Weekly Insights Agent | Scheduled (every 7 days) or on-demand | Trend analysis, pattern summary, recommendations for next week | Dashboard report + email |
| Crisis Escalation Agent | Crisis Detector confirms risk | Helpline display, emergency contact notification, campus counselor alert | Full-screen modal + SMS/email |

*Table 4: Output Agents and Their Trigger Conditions*

### 4.6 Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Orchestration | LangGraph | Native multi-agent graph execution with conditional routing |
| LLM (Primary) | Claude API / Google Gemini | Strong safety alignment + nuanced emotional understanding |
| LLM (Fallback) | Groq LLaMA | Low-latency inference for real-time responses |
| Voice STT | Whisper API | Best-in-class speech-to-text with prosodic features |
| Memory Store | ChromaDB | Lightweight vector DB, Python-native, fast semantic search |
| Message Queue | Redis Streams | Low-latency pub/sub for real-time data flow |
| Backend | FastAPI | Async Python, WebSocket support, auto-generated API docs |
| Frontend | Next.js 14 + Recharts | Real-time dashboard, SSR, responsive design |
| Database | PostgreSQL + pgvector | Structured data + vector similarity search |
| Deployment | Docker Compose | Single-command deployment for demo; Kubernetes for production |

*Table 5: Technology Stack and Justifications*

---

## 5. Implementation Roadmap & Milestones

The development is structured into five phases over a 10-week timeline, with each phase building on the previous one and delivering a testable increment. The overlapping phases (Phase 1–3 have 1-week overlaps) allow parallel work streams where backend and frontend development proceed concurrently.

```
Week →   1    2    3    4    5    6    7    8    9    10
         ├─────────┤                                Phase 1: Core Pipeline
              ├──────────┤                          Phase 2: Multi-Agent System
                   ├──────────┤                     Phase 3: Real-Time Dashboard
                         ├──────┤                   Phase 4: Wearable Integration
                              ├──────┤              Phase 5: Polish & Demo
         ▼      ▼      ▼    ▼   ▼
        MVP   Alpha   Beta  RC  Demo
```

### 5.1 Phase 1: Core Pipeline (Weeks 1–3)

Phase 1 establishes the foundational data pipeline: the Input Ingestion Layer with text diary and chat adapters, the FastAPI backend with WebSocket support, and the LangGraph supervisor skeleton with the Sentiment Agent as the first processing agent. The deliverable at the end of Phase 1 is a minimum viable pipeline where a student can type a journal entry, the Sentiment Agent analyzes it, and the result appears on a basic dashboard. This proves end-to-end connectivity and validates the LangGraph integration before more complex agents are added.

### 5.2 Phase 2: Multi-Agent System (Weeks 3–5)

Phase 2 adds the remaining processing agents (Behavior Agent, Physio Agent, Crisis Detector, Memory Agent) and implements the supervisor's conditional routing logic. The Memory Agent integration with ChromaDB is the critical path item, as all other agents depend on it for longitudinal context. The deliverable is a fully functional multi-agent pipeline where a text input is processed by multiple agents simultaneously, their outputs are fused by the supervisor, and the fused result triggers the appropriate output agent. This phase also includes the Crisis Detector's multi-tier classification system and the Crisis Escalation output pathway.

### 5.3 Phase 3: Real-Time Dashboard (Weeks 5–7)

Phase 3 focuses on the frontend experience: the real-time Next.js dashboard with Recharts visualizations, WebSocket-driven live updates, and the five output agent deliverables (coping strategies, mindfulness exercises, motivational nudges, weekly insights, crisis escalation). The voice journal adapter with Whisper STT is also implemented in this phase. The deliverable is a polished, demo-ready web interface where all features are accessible and visually compelling. User experience testing with 3–5 student volunteers provides feedback for final adjustments.

### 5.4 Phase 4: Wearable Integration (Weeks 7–8)

Phase 4 integrates wearable data through the Health API connector (Apple HealthKit export or Google Fit API). This is the most technically challenging phase due to the variability of wearable data formats and the need to handle missing or noisy readings gracefully. The Physio Agent's Stress Index model is calibrated using the wearable data, and the real-time dashboard gains a physiological metrics panel. The deliverable is a complete data loop from wearable input through Physio Agent processing to dashboard visualization and intervention output.

### 5.5 Phase 5: Polish & Demo (Weeks 9–10)

Phase 5 is dedicated to performance optimization, edge case handling, and demo preparation. The team runs load tests to ensure the system handles concurrent users, stress-tests the crisis detection pathway with adversarial inputs, and prepares the demo script and presentation materials. A "Demo Day" dry run with external reviewers provides final feedback. The deliverable is a production-quality demo that can be presented to the PromptWars judges with confidence, including pre-loaded data scenarios that showcase the full range of MindGuard's capabilities.

---

## 6. Resource Requirements & Budget

### 6.1 Team Composition

| Role | Count | Responsibilities |
|------|-------|-----------------|
| Backend Engineer | 2 | FastAPI, LangGraph agents, Redis, PostgreSQL |
| Frontend Engineer | 1 | Next.js dashboard, Recharts, WebSocket client |
| AI/ML Engineer | 1 | LLM prompts, ChromaDB, sentiment/behavior models |
| Product/Design Lead | 1 | UX flows, demo script, judge presentation |

*Table 6: Team Composition*

### 6.2 Infrastructure Costs

| Resource | Provider | Spec | Monthly Cost (USD) |
|----------|----------|------|---------------------|
| LLM API (Claude/Gemini) | Anthropic/Google | Pro tier, ~50K requests/month | $150–$300 |
| GPU Instance (ML) | RunPod / Vast.ai | 1x A100, on-demand | $100–$200 |
| Cloud Hosting | Railway / Render | 2 vCPU, 8GB RAM | $20–$50 |
| Vector DB | ChromaDB Cloud | Starter tier | $0–$25 |
| Domain + SSL | Cloudflare | Custom domain | $15 |
| **Total** | | | **$285–$590/month** |

*Table 7: Infrastructure Cost Estimates*

### 6.3 Open-Source Dependencies

MindGuard leverages several open-source projects as building blocks rather than templates:

| Project | GitHub | Usage |
|---------|--------|-------|
| Daily Journal Analyzer | [soumyajiitdas/My-GenAICapstoneProject](https://github.com/soumyajiitdas/My-GenAICapstoneProject) | Reference architecture for Gemini-based emotion extraction from journal entries |
| MindHaven | [AminaAsif9/MindHaven](https://github.com/AminaAsif9/MindHaven) | Streamlit-based mood tracking interface with AI chat integration |
| MindLink | [Mallika-coder/mindlink](https://github.com/Mallika-coder/mindlink) | On-device TF.js sentiment analysis with student-specific features |
| Awesome Mental Health | [dreamingechoes/awesome-mental-health](https://github.com/dreamingechoes/awesome-mental-health) | Comprehensive catalog of existing tools and resources |
| Mental Wellness Prompts | [joebwd/mental-wellness-prompts](https://github.com/joebwd/mental-wellness-prompts) | Reusable conversation frameworks, safety protocols, crisis resources |

Each of these projects informs specific components of MindGuard without being adopted wholesale, ensuring that the final product is architecturally distinct and solves problems that none of these individual projects address.

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

### 7.1 Data Privacy & Security

Mental health data is among the most sensitive categories of personal information, and any breach would be catastrophic for user trust and legal compliance. The primary risk is unauthorized access to stored journal entries, sentiment profiles, or physiological data. Mitigation strategies include:

- Encrypting all data **at rest (AES-256)** and **in transit (TLS 1.3)**
- Implementing **role-based access control** with the principle of least privilege
- Storing **PII separately** from wellness data using pseudonymization
- Conducting **regular security audits**

For the hackathon prototype, we implement encryption in transit and basic authentication; full at-rest encryption and audit logging are deferred to the production roadmap.

### 7.2 Agent Hallucination & Misinterpretation

LLM-based agents can generate plausible but incorrect responses, which is particularly dangerous in a mental health context. A hallucinated crisis where none exists causes unnecessary panic; a missed crisis signal could have real-world consequences. Mitigation strategies include:

- Implementing the **multi-tier classification system** for crisis detection (keyword matching → contextual LLM evaluation → longitudinal cross-referencing)
- Requiring **consensus from at least two agents** before triggering crisis escalation
- Maintaining **human-in-the-loop** for all high-stakes decisions
- Implementing **confidence scoring** with automated suppression of low-confidence outputs
- Regular **prompt engineering reviews and red-teaming exercises**

### 7.3 Crisis False Positives & Negatives

False positives (flagging a non-crisis as a crisis) erode user trust and create alert fatigue, while false negatives (missing a genuine crisis) pose safety risks. The mitigation approach uses the three-tier crisis detection system described in Section 4.3.4, with explicit thresholds calibrated through testing against labeled datasets. We set an initial false positive tolerance of **10%** and a false negative tolerance of effectively **0%**, erring on the side of over-alerting during the prototype phase. Post-launch, we implement a feedback mechanism where users can dismiss false alerts, which feeds back into threshold calibration.

### 7.4 Wearable API Reliability

Wearable data APIs are notoriously inconsistent: data may arrive late, in batches, or not at all due to device disconnection, battery death, or API rate limits. The mitigation strategy includes:

- Implementing a **data staleness detector** that marks readings older than 30 minutes as "stale" and adjusts the Physio Agent's confidence accordingly
- Maintaining a **last-known-good state** so the dashboard continues to display the most recent valid reading
- Providing **fallback data sources** (manual input prompts when wearable data is unavailable)
- Designing the Physio Agent to **gracefully degrade** to behavior-only analysis when physiological data is missing

### 7.5 Performance & Latency

Real-time dashboard updates require low-latency processing, but multi-agent pipelines with multiple LLM calls can introduce significant delays. A single input that triggers three agents, each making one LLM call, could take 10–15 seconds in a sequential implementation. Mitigation strategies include:

- **Parallelizing independent agent calls** (all five agents can run simultaneously on different inputs)
- Implementing **streaming responses** so the dashboard updates incrementally as each agent completes
- Using **Groq LLaMA for low-latency fallback** when the primary LLM is slow
- **Caching frequent queries** in Redis
- Implementing **request prioritization** where crisis signals preempt routine processing

---

## 8. Expected Benefits & Evaluation

### 8.1 Competitive Differentiation

MindGuard's multi-agent, multi-source architecture provides structural advantages that cannot be replicated by teams building single-source mood trackers. The radar chart comparison across six key dimensions illustrates the gap:

| Dimension | MindGuard | Typical Solution |
|-----------|-----------|-----------------|
| Real-Time Tracking | 9 | 5 |
| Multi-Agent Workflow | 9 | 3 |
| Crisis Detection | 8 | 4 |
| Multi-Source Input | 9 | 3 |
| Long-Term Memory | 8 | 2 |
| Personalized Intervention | 9 | 5 |

The largest differentials are in **multi-agent workflow** (9 vs. 3), **multi-source input** (9 vs. 3), and **long-term memory** (8 vs. 2). These differentials are architectural—they cannot be overcome by simply adding features to a single-agent system.

### 8.2 Student Impact

For students, MindGuard offers three transformative benefits:

1. **Holistic Awareness:** By combining self-reported, behavioral, and physiological data, the system captures a more complete picture of wellness than any single source can provide. Students who under-report distress (a common pattern, especially among male students and in cultures where mental health struggles carry stigma) still receive appropriate support because the Behavior Agent and Physio Agent detect signals that self-reporting misses.

2. **Proactive Intervention:** The Memory Agent's longitudinal tracking enables the system to identify declining trends before they reach crisis levels, triggering early coping strategies and mindfulness exercises that may prevent escalation.

3. **Personalized Care:** The system learns which interventions work for each individual student over time, moving beyond generic advice toward tailored support that respects each student's unique patterns and preferences.

### 8.3 Evaluation Framework

| Evaluation Dimension | Method | Target |
|---------------------|--------|--------|
| Technical correctness | Unit tests + integration tests | 95%+ pass rate |
| Agent accuracy | Labeled dataset evaluation | 80%+ sentiment alignment |
| Crisis detection | Red-team adversarial testing | 90%+ true positive, <10% false positive |
| System latency | Load testing (k6 / Locust) | p95 < 5s for text input pipeline |
| User satisfaction | Student pilot survey (SUS) | Score > 70/100 |
| Demo impact | PromptWars judge scores | Top 3 placement |

*Table 8: Evaluation Framework*

### 8.4 Post-Hackathon Roadmap

If MindGuard performs well at PromptWars, the team plans to pursue a three-track post-event development strategy:

**Research Track** — Partnering with a university psychology department to conduct a formal IRB-approved study validating the multi-agent approach against single-source baselines, which would provide the clinical evidence necessary for institutional adoption.

**Product Track** — Building native mobile applications, implementing full HIPAA/GDPR compliance infrastructure, and developing a freemium monetization model with institutional licensing for universities.

**Open-Source Track** — Releasing the LangGraph agent templates and ChromaDB integration patterns as open-source libraries, enabling other developers to build similar multi-agent wellness tools and establishing MindGuard as a reference architecture in the mental health technology ecosystem.

Each track operates on a **6-month timeline**, with the first milestone being a pilot deployment at the team's home institution within 3 months of the hackathon.
