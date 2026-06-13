import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

const SYSTEM_PROMPT = `You are MindMirror, a psychologist-inspired AI wellness companion for Indian students preparing for competitive exams (JEE, NEET, UPSC, CAT, GATE, Board exams).

Your core behavior:
- Act like a compassionate psychologist, not a chatbot
- Notice contradictions: if student says "fine" but words suggest otherwise, gently probe deeper
- Ask only ONE focused follow-up question per response — never multiple
- Detect hidden patterns from what they say across the conversation
- Reference previous messages when relevant to show you remember
- Keep responses concise: 2-4 sentences max, then the question
- Be warm, human, and specific — never generic
- If severe distress (self-harm, hopelessness) is detected, always mention iCall: 9152987821

After your conversational reply (separated by ---JSON---), output ONLY a raw JSON object:
{
  "textSentiment": "neutral|anxious|stressed|sad|overwhelmed|hopeful",
  "voiceTone": "calm|strained|flat|tired|tense|energetic",
  "faceSignal": "relaxed|tense|sad|blank|worried|engaged",
  "triggers": { "SubjectName": 0-100, ... },
  "burnout": 0-100,
  "confidence": 0-100,
  "contradictionDetected": false,
  "contradictionType": "verbal-vs-facial|verbal-vs-vocal|verbal-vs-behavioral|verbal-vs-physio|historical-vs-current|none",
  "adaptiveQuestion": "the follow-up question you asked, or empty string",
  "insight": "1-2 sentence personalized observation OR empty string if too early",
  "crisisFlag": false
}

Rules for JSON:
- triggers: only real subjects/issues mentioned (Physics, Chemistry, Time, Parents, Sleep, etc.)
- burnout: aggregate across whole conversation, increases realistically
- contradictionDetected: true when self-report contradicts other signals
- adaptiveQuestion: the specific follow-up you asked based on the contradiction
- insight: only non-empty after 3+ exchanges with a real pattern found
- crisisFlag: true only if student expresses hopelessness or self-harm thoughts`;

export async function POST(req: NextRequest) {
  try {
    const { messages, faceSignal, voiceTone } = await req.json();

    const zai = await ZAI.create();

    // Build enhanced messages with signal context
    const enhancedMessages = [...messages];

    // If we have face or voice signals, inject context into the last user message
    if ((faceSignal || voiceTone) && enhancedMessages.length > 0) {
      const lastMsg = enhancedMessages[enhancedMessages.length - 1];
      if (lastMsg.role === "user") {
        let signalContext = "\n\n[SYSTEM SIGNAL CONTEXT - use these to detect contradictions but do NOT mention the sensors directly to the student:]";
        if (faceSignal && faceSignal !== "relaxed") {
          signalContext += `\n- Facial expression analysis: ${faceSignal} (the student's face suggests ${faceSignal} but their words may say otherwise)`;
        }
        if (voiceTone && voiceTone !== "calm") {
          signalContext += `\n- Voice tone analysis: ${voiceTone} (the student's voice suggests ${voiceTone} but their words may say otherwise)`;
        }
        lastMsg.content = lastMsg.content + signalContext;
      }
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...enhancedMessages.slice(-20), // Keep last 20 messages for token efficiency
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const fullText = completion.choices[0]?.message?.content || "";

    // Parse the response - split conversational reply from JSON metadata
    const splitIdx = fullText.indexOf("---JSON---");
    let reply = fullText;
    let meta = null;

    if (splitIdx !== -1) {
      reply = fullText.slice(0, splitIdx).trim();
      try {
        const jsonStr = fullText
          .slice(splitIdx + 10)
          .trim()
          .replace(/```json|```/g, "")
          .trim();
        meta = JSON.parse(jsonStr);
      } catch {
        // Fallback: try to find JSON object
      }
    } else {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          meta = JSON.parse(jsonMatch[0]);
          reply = fullText.slice(0, jsonMatch.index).trim();
        } catch {
          // JSON parse failed, just use the text
        }
      }
    }

    // Override face/voice signals with actual detected values
    if (meta) {
      if (faceSignal) meta.faceSignal = faceSignal;
      if (voiceTone) meta.voiceTone = voiceTone;
    }

    return NextResponse.json({ reply, meta });
  } catch (error: unknown) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
