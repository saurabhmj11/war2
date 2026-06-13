const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, TabStopType, TabStopPosition, ExternalHyperlink,
  InternalHyperlink, Bookmark, LevelFormat, TableOfContents,
  SectionType,
} = require("docx");
const fs = require("fs");
const { imageSize } = require("image-size");

// ── Palette ──
const P = {
  primary: "#0B1D33",
  body: "#1C2A3D",
  secondary: "#5B6B7D",
  accent: "#4A90D9",
  surface: "#F0F5FA",
  cover: {
    bg: "#0B1D33",
    titleColor: "FFFFFF",
    subtitleColor: "B0C4DE",
    metaColor: "8FA8C8",
    accentLine: "#4A90D9",
  }
};

const c = (hex) => hex.replace("#", "");

// ── Helpers ──
function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: level === HeadingLevel.HEADING_1 ? 360 : 240, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" }, size: level === HeadingLevel.HEADING_1 ? 32 : level === HeadingLevel.HEADING_2 ? 28 : 24 })]
  });
}

function bodyPara(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
  });
}

function bodyParaNoIndent(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
  });
}

function boldBodyPara(boldText, normalText) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    indent: { firstLine: 480 },
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: boldText, bold: true, size: 24, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimSun" } }),
      new TextRun({ text: normalText, size: 24, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } }),
    ]
  });
}

function captionPara(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, size: 21, color: c(P.secondary), italics: true, font: { ascii: "Times New Roman", eastAsia: "SimSun" } })]
  });
}

function emptyLine() {
  return new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });
}

function embedImage(filePath, displayWidth, caption) {
  const buf = fs.readFileSync(filePath);
  const dims = imageSize(buf);
  const displayHeight = Math.round(displayWidth * (dims.height / dims.width));
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [new ImageRun({ data: buf, transformation: { width: displayWidth, height: displayHeight }, type: "png" })]
    }),
    captionPara(caption),
  ];
}

// ── Table helper ──
function makeTable(headers, rows, colWidths) {
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const borderStyle = {
    top: { style: BorderStyle.SINGLE, size: 2, color: "9AA6B2" },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: "9AA6B2" },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D0D0D0" },
    insideVertical: { style: BorderStyle.NONE },
  };
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borderStyle,
    rows: [
      new TableRow({
        tableHeader: true,
        cantSplit: true,
        children: headers.map((h, i) =>
          new TableCell({
            width: { size: Math.round(colWidths[i] / totalW * 100), type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: "F1F5F9" },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 21, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
          })
        ),
      }),
      ...rows.map(row =>
        new TableRow({
          cantSplit: true,
          children: row.map((cell, i) =>
            new TableCell({
              width: { size: Math.round(colWidths[i] / totalW * 100), type: WidthType.PERCENTAGE },
              margins: { top: 60, bottom: 60, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 21, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "SimSun" } })] })],
            })
          ),
        })
      ),
    ],
  });
}

// ── Page dimensions ──
const pgSize = { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

// ── Footer builder ──
function pageNumFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })],
      }),
    ],
  });
}

// ── Header builder ──
function docHeader(text) {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text, size: 18, color: "808080", font: { ascii: "Calibri", eastAsia: "SimHei" } })],
      }),
    ],
  });
}

// ──────────────────────────────────────
// COVER PAGE (R4 Top Color Block style)
// ──────────────────────────────────────
function buildCover() {
  const coverBg = P.cover.bg;
  const accentLine = P.cover.accentLine;
  
  const allNoBorders = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [
      // Top color block row
      new TableRow({
        height: { value: 7500, rule: "exact" },
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: c(coverBg) },
            margins: { top: 0, bottom: 0, left: 0, right: 0 },
            verticalAlign: "top",
            children: [
              new Paragraph({ spacing: { before: 2200 }, children: [] }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 600 },
                spacing: { line: 1200, lineRule: "atLeast" },
                children: [new TextRun({ text: "MindGuard", size: 72, bold: true, color: c(P.cover.titleColor), font: { ascii: "Calibri", eastAsia: "SimHei" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 600 },
                spacing: { before: 120, after: 200 },
                children: [new TextRun({ text: "Multi-Agent Real-Time Mental Wellness Tracker", size: 32, color: c(P.cover.subtitleColor), font: { ascii: "Calibri", eastAsia: "SimHei" } })]
              }),
              // Accent line
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 600 },
                spacing: { before: 100 },
                children: [new TextRun({ text: "________________________________________", size: 24, color: c(accentLine), font: { ascii: "Calibri" } })]
              }),
              new Paragraph({
                alignment: AlignmentType.LEFT,
                indent: { left: 600 },
                spacing: { before: 200 },
                children: [new TextRun({ text: "Product Requirements Document", size: 28, color: c(P.cover.metaColor), font: { ascii: "Calibri", eastAsia: "SimHei" } })]
              }),
            ],
          }),
        ],
      }),
      // Bottom white section
      new TableRow({
        height: { value: 9338, rule: "exact" },
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, fill: "FFFFFF" },
            margins: { top: 0, bottom: 0, left: 600, right: 600 },
            verticalAlign: "top",
            children: [
              new Paragraph({ spacing: { before: 1200 }, children: [] }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Event: ", size: 22, bold: true, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  new TextRun({ text: "PromptWars 2025 \u2014 Hack2Skill", size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
                ]
              }),
              new Paragraph({ spacing: { before: 160 }, children: [
                  new TextRun({ text: "Challenge: ", size: 22, bold: true, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  new TextRun({ text: "Mental Wellness Tracker", size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
              ]}),
              new Paragraph({ spacing: { before: 160 }, children: [
                  new TextRun({ text: "Version: ", size: 22, bold: true, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  new TextRun({ text: "1.0", size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
              ]}),
              new Paragraph({ spacing: { before: 160 }, children: [
                  new TextRun({ text: "Date: ", size: 22, bold: true, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  new TextRun({ text: "June 2025", size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
              ]}),
              new Paragraph({ spacing: { before: 160 }, children: [
                  new TextRun({ text: "Classification: ", size: 22, bold: true, color: c(P.secondary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
                  new TextRun({ text: "Confidential \u2014 Hackathon Team Internal", size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimSun" } }),
              ]}),
            ],
          }),
        ],
      }),
    ],
  });
}

// ──────────────────────────────────────
// BODY CONTENT
// ──────────────────────────────────────

function execSummary() {
  return [
    heading("1. Executive Summary"),
    bodyPara("MindGuard is a multi-agent, real-time mental wellness tracking platform designed specifically for students experiencing academic stress, anxiety, and emotional burnout. Unlike existing mood trackers that rely on single-source self-reporting and static journaling, MindGuard aggregates signals from five distinct input channels\u2014voice journals, text diaries, study behavior logs, conversational chat, and wearable physiological data\u2014and processes them through a team of specialized AI agents orchestrated by a LangGraph supervisor. The result is a continuously updated, holistic understanding of each student\u2019s mental state that no single data source could capture alone."),
    bodyPara("The platform\u2019s core innovation lies in its multi-agent architecture. A Sentiment Agent analyzes emotional tone from text and voice, a Behavior Agent detects patterns of burnout and isolation from activity logs, a Physio Agent correlates heart rate variability and sleep quality with stress levels, a Crisis Detector flags dangerous emotional spikes requiring immediate intervention, and a Memory Agent maintains longitudinal context across sessions using ChromaDB vector storage. The LangGraph supervisor fuses these signals in real time, routing to personalized output agents that deliver coping strategies, mindfulness exercises, motivational nudges, weekly insight reports, or crisis escalation to a human counselor."),
    bodyPara("This PRD defines the product scope, target users, technical architecture, feature specifications, implementation roadmap, risk analysis, and success metrics for MindGuard. The project is scoped for a 10-week development cycle culminating in a live demo at the PromptWars 2025 hackathon, with a post-event roadmap for production deployment. MindGuard aims to solve a deeper problem than what typical hackathon teams will address: not just tracking mood, but understanding the full context of a student\u2019s mental wellness and intervening proactively before crises develop."),
  ];
}

function problemAnalysis() {
  return [
    heading("2. Current State & Problem Analysis"),
    heading("2.1 The Student Mental Health Crisis", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Student mental health has deteriorated sharply across global educational institutions. According to the World Health Organization, depression and anxiety rank among the leading causes of illness and disability among adolescents and young adults aged 15 to 29. In India specifically, the National Mental Health Survey reports that nearly 10% of the population is affected by mental health disorders, with students forming a disproportionately large segment due to academic pressure, social isolation, and career uncertainty. The COVID-19 pandemic exacerbated these trends, with remote learning severing the in-person support networks that many students relied upon, and the effects have persisted well beyond lockdown periods."),
    bodyPara("Despite the severity of this crisis, most available digital tools for mental wellness are fundamentally limited. They treat mental health tracking as a checkbox exercise\u2014a daily mood rating, a gratitude journal prompt, or a pre-recorded meditation session. These tools are static, reactive, and single-dimensional. A student who logs \u201cfine\u201d on a mood tracker while their study behavior shows 14-hour screen sessions and their wearable reports elevated resting heart rate receives no meaningful intervention from the tool, because the tool only sees the self-reported \u201cfine.\u201d This disconnect between self-perception and physiological reality is where the deepest problems lie."),

    heading("2.2 Limitations of Existing Solutions", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Limitation", "Current Tools", "MindGuard Approach"],
      [
        ["Single input source", "Self-reported mood or journal only", "5 sources: voice, text, behavior, chat, wearable"],
        ["No real-time analysis", "Daily check-ins, static prompts", "Continuous streaming analysis with live dashboard"],
        ["No context memory", "Each session starts fresh", "ChromaDB vector store for longitudinal context"],
        ["No crisis detection", "Generic \u201ccall helpline\u201d links", "AI crisis detector with threshold-based escalation"],
        ["No multi-signal fusion", "Only text sentiment considered", "LangGraph supervisor fuses sentiment + behavior + physio"],
        ["Generic interventions", "Same tips for all users", "Personalized coping strategies from memory-aware agents"],
      ],
      [25, 35, 40]
    ),
    captionPara("Table 1: Comparison of Current Tools vs. MindGuard Approach"),

    heading("2.3 The Opportunity", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The convergence of three technology trends creates a unique opportunity. First, large language models (LLMs) like Claude and Gemini have achieved the nuance and safety awareness necessary for mental health applications, capable of understanding emotional subtext and responding with empathy while respecting safety boundaries. Second, wearable devices have become ubiquitous among students, providing continuous physiological data streams (heart rate, sleep patterns, activity levels) that were previously available only in clinical settings. Third, multi-agent orchestration frameworks like LangGraph have matured to the point where complex workflows\u2014with specialized agents communicating through a central supervisor\u2014can be built and deployed rapidly, making the hackathon timeline feasible."),
    bodyPara("MindGuard leverages all three trends simultaneously. No existing open-source project or commercial product combines multi-source input, multi-agent processing, and real-time dashboarding in a single platform focused on student wellness. The closest reference architectures\u2014the Daily Journal Analyzer (Gemini-based emotion extraction) and MindHaven (Streamlit mood tracker with DeepSeek chat)\u2014each cover only one or two of these dimensions. MindGuard covers all five."),
  ];
}

function goalsOutcomes() {
  return [
    heading("3. Goals & Expected Outcomes"),
    heading("3.1 Primary Goals", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The primary goal of MindGuard is to build a working, demonstrable prototype that proves the viability of multi-agent, multi-source mental wellness tracking for students. The prototype must show end-to-end data flow from at least three input sources through the agent pipeline to the real-time dashboard within a single user session. It must demonstrate the LangGraph supervisor making intelligent routing decisions based on fused agent outputs, and it must include at least one crisis detection scenario that triggers an escalation pathway."),
    bodyPara("A secondary but equally important goal is to differentiate MindGuard from the expected hackathon competition. Most teams at PromptWars will build single-source mood trackers with basic sentiment analysis and pre-scripted responses. MindGuard\u2019s multi-agent architecture, real-time multi-signal fusion, and longitudinal memory represent a fundamentally different approach that solves deeper problems\u2014not just \u201cwhat is the user feeling?\u201d but \u201cwhat is the full context of their wellness, and what should we do about it right now?\u201d"),

    heading("3.2 Expected Outcomes", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Outcome", "Success Metric", "Target"],
      [
        ["Multi-source ingestion", "Number of active input channels", "5 sources operational"],
        ["Real-time processing", "End-to-end latency (input to dashboard)", "Under 5 seconds for text/voice"],
        ["Agent accuracy", "Sentiment alignment with human labels", "80%+ on test dataset"],
        ["Crisis detection", "True positive rate for crisis scenarios", "90%+ with <10% false positive rate"],
        ["Dashboard engagement", "Student weekly active usage", "5+ sessions per week in pilot"],
        ["Demo impact", "Judge evaluation at PromptWars", "Top 3 finish"],
      ],
      [30, 35, 35]
    ),
    captionPara("Table 2: Expected Outcomes and Success Metrics"),

    heading("3.3 Non-Goals", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The following items are explicitly out of scope for the hackathon prototype but are noted for the post-event production roadmap. Clinical validation and FDA/CE medical device certification are not pursued in Phase 1; MindGuard is a wellness tool, not a diagnostic or therapeutic device. Full HIPAA/GDPR compliance infrastructure (encryption at rest, audit logging, consent management) will be designed for but not fully implemented in the prototype. Native mobile applications (iOS/Android) are deferred in favor of a responsive web application. Integration with electronic health record (EHR) systems is not included. Multi-language support beyond English is a Phase 2 consideration."),
  ];
}

function solutionDesign() {
  return [
    heading("4. Solution Design"),
    heading("4.1 System Architecture Overview", { _: HeadingLevel.HEADING_2 }),
    bodyPara("MindGuard follows a three-tier architecture: an Input Ingestion Layer that normalizes data from heterogeneous sources, a Multi-Agent Processing Layer that runs specialized AI agents under a LangGraph supervisor, and a Presentation Layer that renders real-time insights on a web dashboard. Each tier communicates through well-defined APIs, enabling independent scaling and testing. The architecture is designed to be modular\u2014new input sources or processing agents can be added without modifying existing components."),

    ...embedImage("/home/z/my-project/download/architecture.png", 520, "Figure 1: MindGuard Multi-Agent Architecture Overview"),

    heading("4.2 Input Ingestion Layer", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The Input Ingestion Layer is responsible for collecting, normalizing, and queuing data from five distinct source types. Each source has a dedicated adapter that transforms raw data into a unified internal format (a JSON envelope containing source type, timestamp, content, metadata, and confidence score). The adapters feed into a common message queue (Redis Streams) that buffers incoming data for the processing layer."),

    makeTable(
      ["Source", "Adapter", "Data Format", "Frequency"],
      [
        ["Voice Journal", "Whisper STT + emotion prosody", "Transcript + audio features", "On-demand (user records)" ],
        ["Text Diary", "NLP preprocessor", "Raw text + metadata", "On-demand (user writes)"],
        ["Study Behavior", "Activity log parser", "Screen time + app usage + break patterns", "Every 15 minutes"],
        ["Chat", "Conversation adapter", "Message thread + intent tags", "Real-time (per message)"],
        ["Wearable", "Health API connector (Apple HealthKit / Google Fit)", "HR, HRV, sleep stages, steps", "Every 5 minutes or on event"],
      ],
      [15, 25, 30, 30]
    ),
    captionPara("Table 3: Input Sources and Their Adapters"),

    heading("4.3 Multi-Agent Processing Layer", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The processing layer is the heart of MindGuard. It consists of five specialized agents and a LangGraph supervisor that orchestrates their interactions. Each agent is an independent computational unit with its own prompt template, tools, and memory scope. The supervisor maintains a shared state graph and routes tasks based on the current context, urgency level, and agent availability. This design ensures that no single agent becomes a bottleneck and that the system gracefully degrades if one agent is unavailable."),

    heading("4.3.1 Sentiment Agent", { _: HeadingLevel.HEADING_3 }),
    bodyPara("The Sentiment Agent processes text and voice transcript inputs to extract emotional valence (positive/negative/neutral), arousal level (calm/energetic/agitated), and dominant emotions (joy, sadness, anger, fear, surprise, disgust). It uses a fine-tuned LLM prompt that includes the student\u2019s recent emotional history from the Memory Agent, enabling context-aware analysis rather than isolated sentiment scoring. For voice inputs, the agent also considers prosodic features extracted by Whisper (pitch variation, speech rate, pause patterns) that provide additional emotional signals beyond the transcript text. The agent outputs a structured sentiment object containing valence score, arousal score, emotion labels with confidence values, and a brief textual analysis that other agents can consume."),

    heading("4.3.2 Behavior Agent", { _: HeadingLevel.HEADING_3 }),
    bodyPara("The Behavior Agent analyzes study activity patterns to detect behavioral indicators of deteriorating mental health. It tracks screen time distribution across productive vs. distracting applications, break frequency and duration, time-of-day study patterns (late-night studying as a stress indicator), and social interaction frequency (if the student opts into messaging metadata). The agent computes a Burnout Risk Score (0\u2013100) based on a weighted combination of these factors, using thresholds derived from occupational health research on academic burnout. For example, consecutive days with more than 10 hours of screen time and fewer than 2 breaks triggers a \u201cHigh Burnout Risk\u201d flag. The agent also identifies positive behavioral patterns (consistent study schedules, regular breaks) that can be reinforced through motivational nudges."),

    heading("4.3.3 Physio Agent", { _: HeadingLevel.HEADING_3 }),
    bodyPara("The Physio Agent correlates physiological data from wearable devices with emotional and behavioral states. Its primary inputs are heart rate variability (HRV), resting heart rate, sleep duration and quality (REM/deep/light stages), and step count. Research consistently shows that reduced HRV correlates with stress and anxiety, elevated resting heart rate can indicate chronic stress, and disrupted sleep architecture is both a symptom and predictor of depression. The Physio Agent computes a Stress Index (0\u2013100) using a composite model that weighs these factors according to established psychophysiological literature. When HRV drops below the student\u2019s personal baseline for three consecutive readings, the agent generates a \u201cPhysiological Stress Alert\u201d that the supervisor evaluates alongside signals from other agents."),

    heading("4.3.4 Crisis Detector", { _: HeadingLevel.HEADING_3 }),
    bodyPara("The Crisis Detector is the most safety-critical agent in the system. It monitors all incoming signals for patterns that indicate imminent risk: expressions of self-harm or suicidal ideation in text or voice, sudden and severe drops in sentiment combined with social isolation behavior, extreme physiological stress readings, or direct statements of distress in chat. The agent uses a multi-tier classification approach. Tier 1 applies keyword matching and pattern recognition for known crisis language (e.g., self-harm phrases, hopelessness indicators). Tier 2 uses the LLM to evaluate context and distinguish between figurative language (\u201cI\u2019m dying of stress\u201d) and genuine crisis signals (\u201cI don\u2019t see the point anymore\u201d). Tier 3 cross-references with the Memory Agent\u2019s longitudinal data to assess whether this is an acute change from the student\u2019s baseline. When a crisis is confirmed, the agent immediately triggers the Crisis Escalation output pathway, which displays prominent helpline information and, with the student\u2019s prior consent, notifies a designated emergency contact or campus counselor."),

    heading("4.3.5 Memory Agent", { _: HeadingLevel.HEADING_3 }),
    bodyPara("The Memory Agent maintains longitudinal context for each student using ChromaDB, a vector database that stores embeddings of past sessions, sentiment trajectories, behavioral patterns, and intervention outcomes. When any processing agent needs context (e.g., \u201chas this student\u2019s mood been declining over the past week?\u201d), it queries the Memory Agent, which retrieves the most relevant historical data using semantic similarity search. This enables the system to move beyond reactive, session-by-session analysis toward truly contextualized understanding. For example, the Sentiment Agent can interpret \u201cI\u2019m okay\u201d very differently if the Memory Agent reports that the same student has been logging this response for five consecutive days while their physiological data shows deteriorating sleep. The Memory Agent also tracks which interventions were effective for each student in the past, enabling personalized coping strategy recommendations."),

    heading("4.4 LangGraph Supervisor", { _: HeadingLevel.HEADING_2 }),
    bodyPara("The LangGraph supervisor is the central orchestrator that ties all agents together. It maintains a shared state graph where each node represents an agent and edges represent data flow and conditional routing. The supervisor receives incoming data from the Input Ingestion Layer, determines which agents should process it based on the data type and current context, dispatches tasks to those agents, collects and fuses their outputs, and routes the fused result to the appropriate output agent. The supervisor also implements priority-based scheduling: crisis signals are processed immediately and preempt all other tasks, while routine mood updates are batched and processed during idle cycles to optimize resource usage."),
    bodyPara("The supervisor\u2019s routing logic is implemented as a conditional graph in LangGraph. For each incoming data event, the supervisor evaluates the current state (recent sentiment, burnout risk, stress index, crisis flags) and decides which agents need to be invoked. A new voice journal entry triggers the Sentiment Agent and Memory Agent. A wearable stress alert triggers the Physio Agent and Crisis Detector. A chat message triggers the Sentiment Agent and Memory Agent, with conditional invocation of the Crisis Detector if sentiment scores fall below a threshold. The supervisor also implements a periodic \u201cfull review\u201d every 24 hours that runs all agents against the accumulated data to generate the Weekly Insight Report."),

    heading("4.5 Output & Intervention Layer", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Output Agent", "Trigger", "Deliverable", "Channel"],
      [
        ["Coping Strategies Agent", "Sentiment score < 40 or burnout risk > 60", "Personalized coping technique (breathing, reframing, journaling prompt)", "Dashboard notification + chat"],
        ["Mindfulness Exercises Agent", "Physio stress index > 65 or explicit request", "Guided breathing exercise, body scan, or progressive muscle relaxation", "Dashboard + audio playback"],
        ["Motivational Nudges Agent", "Positive behavior detected or streak milestone", "Encouragement message, streak celebration, progress summary", "Push notification + dashboard"],
        ["Weekly Insights Agent", "Scheduled (every 7 days) or on-demand", "Trend analysis, pattern summary, recommendations for next week", "Dashboard report + email"],
        ["Crisis Escalation Agent", "Crisis Detector confirms risk", "Helpline display, emergency contact notification, campus counselor alert", "Full-screen modal + SMS/email"],
      ],
      [20, 25, 30, 25]
    ),
    captionPara("Table 4: Output Agents and Their Trigger Conditions"),

    heading("4.6 Technology Stack", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Layer", "Technology", "Justification"],
      [
        ["Orchestration", "LangGraph", "Native multi-agent graph execution with conditional routing"],
        ["LLM (Primary)", "Claude API / Google Gemini", "Strong safety alignment + nuanced emotional understanding"],
        ["LLM (Fallback)", "Groq LLaMA", "Low-latency inference for real-time responses"],
        ["Voice STT", "Whisper API", "Best-in-class speech-to-text with prosodic features"],
        ["Memory Store", "ChromaDB", "Lightweight vector DB, Python-native, fast semantic search"],
        ["Message Queue", "Redis Streams", "Low-latency pub/sub for real-time data flow"],
        ["Backend", "FastAPI", "Async Python, WebSocket support, auto-generated API docs"],
        ["Frontend", "Next.js 14 + Recharts", "Real-time dashboard, SSR, responsive design"],
        ["Database", "PostgreSQL + pgvector", "Structured data + vector similarity search"],
        ["Deployment", "Docker Compose", "Single-command deployment for demo; Kubernetes for production"],
      ],
      [18, 28, 54]
    ),
    captionPara("Table 5: Technology Stack and Justifications"),
  ];
}

function roadmap() {
  return [
    heading("5. Implementation Roadmap & Milestones"),
    bodyPara("The development is structured into five phases over a 10-week timeline, with each phase building on the previous one and delivering a testable increment. The overlapping phases (Phase 1\u20133 have 1-week overlaps) allow parallel work streams where backend and frontend development proceed concurrently. Each phase concludes with a milestone review where the team validates functionality against the PRD specifications."),

    ...embedImage("/home/z/my-project/download/timeline.png", 500, "Figure 2: Implementation Roadmap with Milestones"),

    heading("5.1 Phase 1: Core Pipeline (Weeks 1\u20133)", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Phase 1 establishes the foundational data pipeline: the Input Ingestion Layer with text diary and chat adapters, the FastAPI backend with WebSocket support, and the LangGraph supervisor skeleton with the Sentiment Agent as the first processing agent. The deliverable at the end of Phase 1 is a minimum viable pipeline where a student can type a journal entry, the Sentiment Agent analyzes it, and the result appears on a basic dashboard. This proves end-to-end connectivity and validates the LangGraph integration before more complex agents are added."),

    heading("5.2 Phase 2: Multi-Agent System (Weeks 3\u20135)", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Phase 2 adds the remaining processing agents (Behavior Agent, Physio Agent, Crisis Detector, Memory Agent) and implements the supervisor\u2019s conditional routing logic. The Memory Agent integration with ChromaDB is the critical path item, as all other agents depend on it for longitudinal context. The deliverable is a fully functional multi-agent pipeline where a text input is processed by multiple agents simultaneously, their outputs are fused by the supervisor, and the fused result triggers the appropriate output agent. This phase also includes the Crisis Detector\u2019s multi-tier classification system and the Crisis Escalation output pathway."),

    heading("5.3 Phase 3: Real-Time Dashboard (Weeks 5\u20137)", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Phase 3 focuses on the frontend experience: the real-time Next.js dashboard with Recharts visualizations, WebSocket-driven live updates, and the five output agent deliverables (coping strategies, mindfulness exercises, motivational nudges, weekly insights, crisis escalation). The voice journal adapter with Whisper STT is also implemented in this phase. The deliverable is a polished, demo-ready web interface where all features are accessible and visually compelling. User experience testing with 3\u20135 student volunteers provides feedback for final adjustments."),

    heading("5.4 Phase 4: Wearable Integration (Weeks 7\u20138)", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Phase 4 integrates wearable data through the Health API connector (Apple HealthKit export or Google Fit API). This is the most technically challenging phase due to the variability of wearable data formats and the need to handle missing or noisy readings gracefully. The Physio Agent\u2019s Stress Index model is calibrated using the wearable data, and the real-time dashboard gains a physiological metrics panel. The deliverable is a complete data loop from wearable input through Physio Agent processing to dashboard visualization and intervention output."),

    heading("5.5 Phase 5: Polish & Demo (Weeks 9\u201310)", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Phase 5 is dedicated to performance optimization, edge case handling, and demo preparation. The team runs load tests to ensure the system handles concurrent users, stress-tests the crisis detection pathway with adversarial inputs, and prepares the demo script and presentation materials. A \u201cDemo Day\u201d dry run with external reviewers provides final feedback. The deliverable is a production-quality demo that can be presented to the PromptWars judges with confidence, including pre-loaded data scenarios that showcase the full range of MindGuard\u2019s capabilities."),
  ];
}

function resourcesBudget() {
  return [
    heading("6. Resource Requirements & Budget"),
    heading("6.1 Team Composition", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Role", "Count", "Responsibilities"],
      [
        ["Backend Engineer", "2", "FastAPI, LangGraph agents, Redis, PostgreSQL"],
        ["Frontend Engineer", "1", "Next.js dashboard, Recharts, WebSocket client"],
        ["AI/ML Engineer", "1", "LLM prompts, ChromaDB, sentiment/behavior models"],
        ["Product/Design Lead", "1", "UX flows, demo script, judge presentation"],
      ],
      [22, 12, 66]
    ),
    captionPara("Table 6: Team Composition"),

    heading("6.2 Infrastructure Costs", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Resource", "Provider", "Spec", "Monthly Cost (USD)"],
      [
        ["LLM API (Claude/Gemini)", "Anthropic/Google", "Pro tier, ~50K requests/month", "$150\u2013$300"],
        ["GPU Instance (ML)", "RunPod / Vast.ai", "1x A100, on-demand", "$100\u2013$200"],
        ["Cloud Hosting", "Railway / Render", "2 vCPU, 8GB RAM", "$20\u2013$50"],
        ["Vector DB", "ChromaDB Cloud", "Starter tier", "$0\u2013$25"],
        ["Domain + SSL", "Cloudflare", "Custom domain", "$15"],
        ["Total", "", "", "$285\u2013$590/month"],
      ],
      [22, 20, 28, 30]
    ),
    captionPara("Table 7: Infrastructure Cost Estimates"),

    heading("6.3 Open-Source Dependencies", { _: HeadingLevel.HEADING_2 }),
    bodyPara("MindGuard leverages several open-source projects as building blocks rather than templates. The Daily Journal Analyzer (soumyajiitdas/My-GenAICapstoneProject) provides reference architecture for Gemini-based emotion extraction from journal entries. MindHaven (AminaAsif9/MindHaven) demonstrates the Streamlit-based mood tracking interface with AI chat integration. MindLink (Mallika-coder/mindlink) implements on-device TF.js sentiment analysis with student-specific features like avatar check-ins and gamified streaks. The Awesome Mental Health repository (dreamingechoes/awesome-mental-health) provides a comprehensive catalog of existing tools and resources. Each of these projects informs specific components of MindGuard without being adopted wholesale, ensuring that the final product is architecturally distinct and solves problems that none of these individual projects address."),
  ];
}

function riskAnalysis() {
  return [
    heading("7. Risk Analysis & Mitigation"),

    ...embedImage("/home/z/my-project/download/risk_heatmap.png", 460, "Figure 3: Risk Assessment Matrix"),

    heading("7.1 Data Privacy & Security", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Mental health data is among the most sensitive categories of personal information, and any breach would be catastrophic for user trust and legal compliance. The primary risk is unauthorized access to stored journal entries, sentiment profiles, or physiological data. Mitigation strategies include encrypting all data at rest (AES-256) and in transit (TLS 1.3), implementing role-based access control with the principle of least privilege, storing personally identifiable information (PII) separately from wellness data using pseudonymization, and conducting regular security audits. For the hackathon prototype, we implement encryption in transit and basic authentication; full at-rest encryption and audit logging are deferred to the production roadmap."),

    heading("7.2 Agent Hallucination & Misinterpretation", { _: HeadingLevel.HEADING_2 }),
    bodyPara("LLM-based agents can generate plausible but incorrect responses, which is particularly dangerous in a mental health context. A hallucinated crisis where none exists causes unnecessary panic; a missed crisis signal could have real-world consequences. Mitigation strategies include implementing the multi-tier classification system for crisis detection (keyword matching, contextual LLM evaluation, longitudinal cross-referencing), requiring consensus from at least two agents before triggering crisis escalation, maintaining human-in-the-loop for all high-stakes decisions, and implementing confidence scoring with automated suppression of low-confidence outputs. Regular prompt engineering reviews and red-teaming exercises further reduce hallucination risk."),

    heading("7.3 Crisis False Positives & Negatives", { _: HeadingLevel.HEADING_2 }),
    bodyPara("False positives (flagging a non-crisis as a crisis) erode user trust and create alert fatigue, while false negatives (missing a genuine crisis) pose safety risks. The mitigation approach uses the three-tier crisis detection system described in Section 4.3.4, with explicit thresholds calibrated through testing against labeled datasets. We set an initial false positive tolerance of 10% and a false negative tolerance of effectively 0%, erring on the side of over-alerting during the prototype phase. Post-launch, we implement a feedback mechanism where users can dismiss false alerts, which feeds back into threshold calibration."),

    heading("7.4 Wearable API Reliability", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Wearable data APIs are notoriously inconsistent: data may arrive late, in batches, or not at all due to device disconnection, battery death, or API rate limits. The mitigation strategy includes implementing a data staleness detector that marks readings older than 30 minutes as \u201cstale\u201d and adjusts the Physio Agent\u2019s confidence accordingly, maintaining a last-known-good state so the dashboard continues to display the most recent valid reading, providing fallback data sources (manual input prompts when wearable data is unavailable), and designing the Physio Agent to gracefully degrade to behavior-only analysis when physiological data is missing."),

    heading("7.5 Performance & Latency", { _: HeadingLevel.HEADING_2 }),
    bodyPara("Real-time dashboard updates require low-latency processing, but multi-agent pipelines with multiple LLM calls can introduce significant delays. A single input that triggers three agents, each making one LLM call, could take 10\u201315 seconds in a sequential implementation. Mitigation strategies include parallelizing independent agent calls (all five agents can run simultaneously on different inputs), implementing streaming responses so the dashboard updates incrementally as each agent completes, using Groq LLaMA for low-latency fallback when the primary LLM is slow, caching frequent queries in Redis, and implementing request prioritization where crisis signals preempt routine processing."),
  ];
}

function benefits() {
  return [
    heading("8. Expected Benefits & Evaluation"),
    heading("8.1 Competitive Differentiation", { _: HeadingLevel.HEADING_2 }),

    ...embedImage("/home/z/my-project/download/radar_comparison.png", 440, "Figure 4: Feature Comparison \u2014 MindGuard vs. Typical Solutions"),

    bodyPara("MindGuard\u2019s multi-agent, multi-source architecture provides structural advantages that cannot be replicated by teams building single-source mood trackers. The radar chart above illustrates the gap across six key dimensions: real-time tracking, multi-agent workflow, crisis detection, multi-source input, long-term memory, and personalized intervention. While typical solutions score 2\u20135 on most dimensions, MindGuard scores 8\u20139 across the board, with the largest differentials in multi-agent workflow (9 vs. 3), multi-source input (9 vs. 3), and long-term memory (8 vs. 2). These differentials are architectural\u2014they cannot be overcome by simply adding features to a single-agent system."),

    heading("8.2 Student Impact", { _: HeadingLevel.HEADING_2 }),
    bodyPara("For students, MindGuard offers three transformative benefits. First, holistic awareness: by combining self-reported, behavioral, and physiological data, the system captures a more complete picture of wellness than any single source can provide. Students who under-report distress (a common pattern, especially among male students and in cultures where mental health struggles carry stigma) still receive appropriate support because the Behavior Agent and Physio Agent detect signals that self-reporting misses. Second, proactive intervention: the Memory Agent\u2019s longitudinal tracking enables the system to identify declining trends before they reach crisis levels, triggering early coping strategies and mindfulness exercises that may prevent escalation. Third, personalized care: the system learns which interventions work for each individual student over time, moving beyond generic advice toward tailored support that respects each student\u2019s unique patterns and preferences."),

    heading("8.3 Evaluation Framework", { _: HeadingLevel.HEADING_2 }),
    makeTable(
      ["Evaluation Dimension", "Method", "Target"],
      [
        ["Technical correctness", "Unit tests + integration tests", "95%+ pass rate"],
        ["Agent accuracy", "Labeled dataset evaluation", "80%+ sentiment alignment"],
        ["Crisis detection", "Red-team adversarial testing", "90%+ true positive, <10% false positive"],
        ["System latency", "Load testing (k6 / Locust)", "p95 < 5s for text input pipeline"],
        ["User satisfaction", "Student pilot survey (SUS)", "Score > 70/100"],
        ["Demo impact", "PromptWars judge scores", "Top 3 placement"],
      ],
      [25, 40, 35]
    ),
    captionPara("Table 8: Evaluation Framework"),

    heading("8.4 Post-Hackathon Roadmap", { _: HeadingLevel.HEADING_2 }),
    bodyPara("If MindGuard performs well at PromptWars, the team plans to pursue a three-track post-event development strategy. The Research Track involves partnering with a university psychology department to conduct a formal IRB-approved study validating the multi-agent approach against single-source baselines, which would provide the clinical evidence necessary for institutional adoption. The Product Track focuses on building native mobile applications, implementing full HIPAA/GDPR compliance infrastructure, and developing a freemium monetization model with institutional licensing for universities. The Open-Source Track involves releasing the LangGraph agent templates and ChromaDB integration patterns as open-source libraries, enabling other developers to build similar multi-agent wellness tools and establishing MindGuard as a reference architecture in the mental health technology ecosystem. Each track operates on a 6-month timeline, with the first milestone being a pilot deployment at the team\u2019s home institution within 3 months of the hackathon."),
  ];
}

// ──────────────────────────────────────
// ASSEMBLE DOCUMENT
// ──────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimSun" }, size: 24, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 240, after: 120, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  numbering: {
    config: [
      {
        reference: "list-outcomes",
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── Section 1: Cover ──
    {
      properties: {
        page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: [buildCover()],
    },
    // ── Section 2: Front Matter (TOC) ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: { default: pageNumFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Calibri", eastAsia: "SimHei" }, color: c(P.primary) })],
        }),
        new TableOfContents("Table of Contents", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"", italics: true, size: 18, color: "888888" })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ── Section 3: Body ──
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: pgSize,
          margin: pgMargin,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: docHeader("MindGuard PRD v1.0") },
      footers: { default: pageNumFooter() },
      children: [
        ...execSummary(),
        ...problemAnalysis(),
        ...goalsOutcomes(),
        ...solutionDesign(),
        ...roadmap(),
        ...resourcesBudget(),
        ...riskAnalysis(),
        ...benefits(),
      ],
    },
  ],
});

// ── Generate ──
const OUTPUT = "/home/z/my-project/download/MindGuard_PRD.docx";
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log("Document generated:", OUTPUT);
});
