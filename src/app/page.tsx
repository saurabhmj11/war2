/* eslint-disable react-hooks/refs */
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSensorAnalysis } from './useSensorAnalysis';
import { sanitizeHtml } from '../lib/sanitize';
import {
  detectCrisis,
  detectTriggers,
  isNegative,
  detectClientContradiction,
  extractTags,
  mergeTriggers,
  MOOD_SCORE_MAP,
} from '../lib/mindmirror';

// ===== TYPES =====
interface Meta {
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

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  time: string;
  isCrisis?: boolean;
  meta?: Meta;
}

interface JournalEntry {
  id: number;
  date: string;
  summary: string;
  tags: string[];
  mood?: string;
}

// ===== CONSTANTS =====
const moodScoreMap: Record<string, number> = {
  hopeful: 90, neutral: 60, calm: 75, anxious: 35, stressed: 25, sad: 20, overwhelmed: 15
};

const moodEmojiMap: Record<string, string> = {
  hopeful: '🌤️', neutral: '😐', calm: '😌', anxious: '😰', stressed: '😤', sad: '😢', overwhelmed: '🤯'
};

const sentimentColorMap: Record<string, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  anxious: 'bg-amber-50 text-amber-700',
  stressed: 'bg-rose-50 text-rose-700',
  sad: 'bg-violet-50 text-violet-700',
  overwhelmed: 'bg-rose-50 text-rose-700',
  hopeful: 'bg-emerald-50 text-emerald-700'
};

const toneColorMap: Record<string, string> = {
  calm: 'bg-emerald-50 text-emerald-700',
  strained: 'bg-amber-50 text-amber-700',
  flat: 'bg-slate-100 text-slate-700',
  tired: 'bg-amber-50 text-amber-700',
  tense: 'bg-rose-50 text-rose-700',
  energetic: 'bg-emerald-50 text-emerald-700'
};

const faceColorMap: Record<string, string> = {
  relaxed: 'bg-emerald-50 text-emerald-700',
  tense: 'bg-rose-50 text-rose-700',
  sad: 'bg-violet-50 text-violet-700',
  blank: 'bg-slate-100 text-slate-700',
  worried: 'bg-amber-50 text-amber-700',
  engaged: 'bg-emerald-50 text-emerald-700'
};

const QUICK_REPLIES = [
  { text: "I'm fine, just tired", icon: '😐' },
  { text: "Physics is really stressing me out", icon: '⚛️' },
  { text: "Mock tests didn't go well again", icon: '📝' },
  { text: "I don't know if I can do this", icon: '😔' },
  { text: "I studied all day but feel worse", icon: '📚' },
];

export default function MindMirrorPage() {
  // ===== STATE =====
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: "Hi! I'm **MindMirror** — your personal wellness companion. I'm here to listen without judgment, and sometimes I might notice things in your words that even you haven't fully realized yet.\n\nHow are you feeling about your exam preparation today?",
      time: 'Just now'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'journal' | 'privacy'>('chat');
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Real sensor analysis (camera + microphone)
  const sensor = useSensorAnalysis();

  // Insight panel state
  const [textSentiment, setTextSentiment] = useState('neutral');
  const [triggers, setTriggers] = useState<Record<string, number>>({});
  const [burnout, setBurnout] = useState(0);
  const [moodHistory, setMoodHistory] = useState<{ label: string; score: number }[]>([]);
  const [insight, setInsight] = useState('');
  const [showInsight, setShowInsight] = useState(false);
  const [contradiction, setContradiction] = useState<{ detected: boolean; type: string; question: string } | null>(null);
  const [exchangeCount, setExchangeCount] = useState(0);

  // Use real sensor values
  const voiceTone = sensor.voiceTone;
  const faceSignal = sensor.faceSignal;

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Settings state
  const [settings, setSettings] = useState({ camera: true, voice: true, journal: true, crisis: true });

  // Refs
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ===== LOAD SETTINGS & JOURNAL =====
  useEffect(() => {
    let active = true;
    try {
      const savedSettings = { camera: true, voice: true, journal: true, crisis: true };
      ['camera', 'voice', 'journal', 'crisis'].forEach(key => {
        const stored = localStorage.getItem('mm_setting_' + key);
        if (stored !== null) (savedSettings as Record<string, boolean>)[key] = stored === 'true';
      });
      
      const entries = JSON.parse(localStorage.getItem('mindmirror_journal') || '[]') as JournalEntry[];
      
      // Use setTimeout to avoid 'Calling setState synchronously within an effect' warning
      setTimeout(() => {
        if (active) {
          setSettings(savedSettings);
          setJournalEntries(entries);
        }
      }, 0);
    } catch { /* ignore */ }
    
    return () => { active = false; };
  }, []);

  // ===== AUTO-SCROLL =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== AUTO-RESIZE TEXTAREA =====
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  // ===== HELPERS =====
  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ===== SAVE TO JOURNAL =====
  const saveToJournal = useCallback((currentMessages: Message[]) => {
    try {
      const summary = currentMessages
        .filter(m => m.role === 'user')
        .map(m => m.text)
        .join(' ');
      if (!summary.trim()) return;

      const entry: JournalEntry = {
        id: Date.now(),
        date: new Date().toLocaleString('en-IN'),
        summary: summary.slice(0, 300),
        tags: extractTags(summary),
        mood: textSentiment,
      };
      const entries = [entry, ...journalEntries].slice(0, 50);
      setJournalEntries(entries);
      localStorage.setItem('mindmirror_journal', JSON.stringify(entries));
    } catch { /* ignore */ }
  }, [textSentiment, journalEntries]);

  // ===== SEND MESSAGE =====
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setInputText('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // ===== CLIENT-SIDE CRISIS DETECTION =====
    const isClientCrisis = detectCrisis(text);

    // ===== CLIENT-SIDE TRIGGER DETECTION =====
    const clientTriggers = detectTriggers(text);

    // ===== CLIENT-SIDE SENTIMENT HINT =====
    const isNegativeText = isNegative(text);

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text, time: getTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    // Add thinking indicator
    const thinkingMsg: Message = { id: 'thinking', role: 'ai', text: '', time: '' };
    setMessages([...newMessages, thinkingMsg]);

    conversationHistory.current.push({ role: 'user', content: text });

    // Immediately apply client-side triggers to panel
    if (Object.keys(clientTriggers).length > 0) {
      setTriggers(prev => mergeTriggers(prev, clientTriggers));
    }

    // Immediately increment burnout slightly for negative messages
    if (isNegativeText) {
      setBurnout(prev => Math.min(100, prev + 8));
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationHistory.current.slice(-20),
          faceSignal: faceSignal !== 'relaxed' ? faceSignal : undefined,
          voiceTone: voiceTone !== 'calm' ? voiceTone : undefined,
        }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const { reply, meta } = data;

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: reply || "I'm here. Could you tell me more?",
        time: getTime(),
        meta
      };
      const messagesAfterAI = [...newMessages, aiMsg];

      // Add crisis message if flagged by LLM OR client-side detection
      if ((meta?.crisisFlag || isClientCrisis) && settings.crisis) {
        const crisisMsg: Message = {
          id: `c-${Date.now()}`,
          role: 'ai',
          text: "I want to make sure you're okay. If things feel really heavy right now, please reach out:\n\n📞 **iCall**: 9152987821\n📞 **Vandrevala Foundation**: 1860-2662-345\n\nThey're trained to listen, and you deserve support beyond what I can offer.",
          time: getTime(),
          isCrisis: true
        };
        messagesAfterAI.push(crisisMsg);
      }

      setMessages(messagesAfterAI);
      conversationHistory.current.push({ role: 'assistant', content: reply });

      // Update exchange count
      setExchangeCount(prev => prev + 1);

      // Update insight panel with LLM meta + client-side enhancements
      if (meta) {
        if (meta.textSentiment) setTextSentiment(meta.textSentiment);
        // Note: voiceTone and faceSignal now come from real sensors (useSensorAnalysis)
        // We still log LLM's interpretation for debugging but don't override real sensor data

        // Merge triggers from LLM with client-side triggers
        if (meta.triggers && Object.keys(meta.triggers).length > 0) {
          setTriggers(prev => mergeTriggers(prev, meta.triggers));
        }

        // Use LLM burnout if higher than current, or increment client-side
        if (typeof meta.burnout === 'number') {
          setBurnout(prev => Math.max(prev, meta.burnout));
        }

        // Add mood score to history
        if (meta.textSentiment) {
          const score = MOOD_SCORE_MAP[meta.textSentiment] ?? 50;
          setMoodHistory(prev => {
            const next = [...prev, { label: `#${prev.length + 1}`, score }].slice(-10);
            return next;
          });
        }

        // Show insight from LLM or generate client-side insight
        if (meta.insight) {
          setInsight(meta.insight);
          setShowInsight(true);
        } else if (exchangeCount >= 2) {
          // Client-side insight generation as fallback
          const triggerNames = Object.keys(triggers);
          if (triggerNames.length > 0) {
            const topTrigger = triggerNames[0];
            const negWords = ['stressed', 'anxious', 'worried', 'overwhelmed', 'can\'t'];
            const hasNeg = conversationHistory.current
              .filter(m => m.role === 'user')
              .some(m => negWords.some(w => m.content.toLowerCase().includes(w)));
            if (hasNeg) {
              setInsight(`${topTrigger} appears frequently alongside your stressful thoughts — this might be a knowledge-gap anxiety pattern, not a capability issue.`);
              setShowInsight(true);
            }
          }
        }

        if (meta.contradictionDetected) {
          setContradiction({
            detected: true,
            type: meta.contradictionType || 'verbal-vs-facial',
            question: meta.adaptiveQuestion || ''
          });
        } else if (detectClientContradiction(text)) {
          // Client-side contradiction: "fine" + negative context
          setContradiction({
            detected: true,
            type: 'verbal-vs-behavioral',
            question: 'You say you\'re fine, but your words suggest otherwise. What\'s really going on?'
          });
        } else {
          setContradiction(null);
        }
      } else {
        // No meta from LLM — still apply client-side updates
        if (isNegativeText) {
          setMoodHistory(prev => {
            const next = [...prev, { label: `#${prev.length + 1}`, score: 30 }].slice(-10);
            return next;
          });
        }
      }

      // Save to journal
      if (settings.journal) {
        saveToJournal(messagesAfterAI);
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'thinking').concat({
        id: `e-${Date.now()}`, role: 'ai', text: "I had trouble connecting. Please try again.", time: getTime()
      }));
      console.error('API error:', err);
    }

    setIsLoading(false);
  };

  // ===== CLEAR SESSION =====
  const clearSession = () => {
    if (!confirm('Start a new session? Current conversation will be saved to the journal.')) return;
    if (settings.journal) saveToJournal(messages);
    conversationHistory.current = [];
    setMessages([
      { id: 'new-welcome', role: 'ai', text: "Hi again! Ready for a new session. How are you feeling right now?", time: 'Just now' }
    ]);
    setMoodHistory([]);
    setBurnout(0);
    setTriggers({});
    setInsight('');
    setShowInsight(false);
    setContradiction(null);
    setTextSentiment('neutral');
    // Note: voiceTone and faceSignal reset automatically when camera/mic stop
    setExchangeCount(0);
  };

  // ===== EXPORT / DELETE DATA =====
  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify(journalEntries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'mindmirror_journal.json'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  const deleteData = () => {
    if (!confirm('Delete all journal entries? This cannot be undone.')) return;
    localStorage.removeItem('mindmirror_journal');
    setJournalEntries([]);
  };

  // ===== DERIVED STATE =====
  const sortedTriggers = Object.entries(triggers).sort(([, a], [, b]) => b - a).slice(0, 6);
  const burnoutLabel = burnout >= 70 ? 'High' : burnout >= 40 ? 'Moderate' : burnout > 0 ? 'Low' : '—';
  const burnoutColor = burnout >= 70 ? 'text-rose-600' : burnout >= 40 ? 'text-amber-600' : 'text-emerald-600';
  const burnoutBarColor = burnout >= 70 ? 'bg-rose-500' : burnout >= 40 ? 'bg-amber-500' : 'bg-emerald-500';
  const burnoutDesc = burnout >= 70 ? 'Consider taking a real break today.' : burnout >= 40 ? "You're pushing hard. Rest matters." : burnout > 0 ? "You're managing well right now." : 'No data yet';

  // ===== SVG CHART FOR MOOD TIMELINE =====
  const renderMoodChart = () => {
    if (moodHistory.length === 0) {
      return (
        <div className="text-xs text-slate-400 text-center py-4">
          Start talking — mood trend will appear
        </div>
      );
    }

    const w = 280;
    const h = 80;
    const padX = 24;
    const padY = 10;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    // Handle single-point case (show just a dot)
    if (moodHistory.length === 1) {
      const m = moodHistory[0];
      const px = padX + chartW / 2;
      const py = padY + chartH - (m.score / 100) * chartH;
      const moodLabel = Object.entries(moodScoreMap).find(([, v]) => v === m.score)?.[0] || '';

      return (
        <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-label="Mood trend chart">
          {[0, 25, 50, 75, 100].map(v => {
            const y = padY + chartH - (v / 100) * chartH;
            return <line key={v} x1={padX} y1={y} x2={w - padX} y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 3" />;
          })}
          <circle cx={px} cy={py} r="5" fill="#7c3aed" stroke="#fff" strokeWidth="2" />
          <text x={w / 2} y={h - 2} textAnchor="middle" className="text-[8px] fill-slate-400" fontFamily="Inter, sans-serif">{moodLabel}</text>
        </svg>
      );
    }

    const points = moodHistory.map((m, i) => ({
      x: padX + (i / Math.max(moodHistory.length - 1, 1)) * chartW,
      y: padY + chartH - (m.score / 100) * chartH,
      score: m.score,
      label: m.label
    }));

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" aria-label="Mood trend chart">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = padY + chartH - (v / 100) * chartH;
          return <line key={v} x1={padX} y1={y} x2={w - padX} y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3 3" />;
        })}
        {/* Area fill */}
        <path d={areaPath} fill="url(#moodGrad)" opacity="0.3" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#7c3aed" stroke="#fff" strokeWidth="1.5" />
            <text x={p.x} y={h - 2} textAnchor="middle" className="text-[7px] fill-slate-400" fontFamily="Inter, sans-serif">{p.label}</text>
          </g>
        ))}
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // ===== RENDER =====
  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Skip link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-9999 focus:bg-violet-600 focus:text-white focus:px-4 focus:py-2 focus:text-sm">
        Skip to main content
      </a>

      {/* ===== HEADER ===== */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200 px-4 md:px-6 h-14 flex items-center justify-between sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-violet-200/50">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5.5-4 6.8V18H9v-2.2C6.5 14.5 5 12 5 9a7 7 0 0 1 7-7z" />
              <path d="M9 21h6M10 18v3M14 18v3" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-900 text-sm">MindMirror</span>
            <span className="text-[10px] text-slate-400 ml-1 font-normal">beta</span>
          </div>
        </div>
        <nav className="flex items-center gap-1" role="navigation" aria-label="App sections">
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${activeView === 'chat' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveView('chat')}
            aria-pressed={activeView === 'chat'}
          >
            Session
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${activeView === 'journal' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveView('journal')}
            aria-pressed={activeView === 'journal'}
          >
            Journal
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200 ${activeView === 'privacy' ? 'bg-violet-600 text-white shadow-md shadow-violet-200' : 'text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setActiveView('privacy')}
            aria-pressed={activeView === 'privacy'}
          >
            Privacy
          </button>
          <button
            className="md:hidden ml-1 px-2 py-1.5 text-xs font-medium rounded-full text-slate-600 hover:bg-slate-100 transition-all"
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            aria-label="Toggle insights panel"
          >
            📊
          </button>
        </nav>
      </header>

      {/* ===== MAIN ===== */}
      <main id="main-content" className="flex-1 flex overflow-hidden" role="main">

        {/* ===== CHAT VIEW ===== */}
        <section
          id="view-chat"
          className={`flex-1 flex flex-col min-w-0 ${activeView === 'chat' ? '' : 'hidden md:flex'}`}
          aria-label="Conversation session"
        >
          {/* Chat top bar */}
          <div className="px-4 md:px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="md:col-span-3 lg:col-span-4 bg-linear-to-br from-white to-slate-50/80 rounded-2xl md:rounded-[32px] border border-slate-200/60 shadow-xs flex flex-col overflow-hidden h-[calc(100vh-140px)] relative">
                🧘
              </div>
              <div>
                <div className="text-sm font-medium text-slate-900">MindMirror</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  Listening actively
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {exchangeCount > 0 && (
                <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                  {exchangeCount} exchange{exchangeCount !== 1 ? 's' : ''}
                </span>
              )}
              <button
                className="px-3 py-1.5 text-xs font-medium rounded-full text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
                onClick={clearSession}
                aria-label="Start new session"
              >
                New session
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4"
            role="log"
            aria-label="Conversation messages"
            aria-live="polite"
            aria-busy={isLoading}
            aria-atomic={false}
            tabIndex={0}
          >
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-100 to-purple-100 border border-violet-200 flex items-center justify-center text-xs shrink-0">
                    🧠
                  </div>
                )}
                <div className={`max-w-[80%] md:max-w-[70%]`}>
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed rounded-2xl ${msg.id === 'thinking'
                        ? 'bg-slate-100 text-slate-400 italic rounded-bl-md'
                        : msg.role === 'ai'
                          ? msg.isCrisis
                            ? 'bg-rose-50 border-l-[3px] border-rose-400 text-rose-900 rounded-bl-md'
                            : 'bg-slate-100 text-slate-800 rounded-bl-md'
                          : 'bg-violet-600 text-white rounded-br-md'
                      }`}
                    role={msg.isCrisis ? 'alert' : undefined}
                    aria-label={msg.role === 'ai' ? 'MindMirror says' : 'You said'}
                  >
                    {msg.id === 'thinking' ? (
                      <div className="flex items-center gap-2" role="status" aria-label="MindMirror is thinking">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span>MindMirror is reflecting…</span>
                      </div>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(msg.text) }} />
                    )}
                  </div>
                  {msg.time && (
                    <div className={`text-[10px] text-slate-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.time}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shrink-0">
                    🎓
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-4 md:px-5 py-2 border-t border-slate-100 bg-white shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider shrink-0">Quick</span>
              {QUICK_REPLIES.map(qr => (
                <button
                  key={qr.text}
                  className="shrink-0 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full text-slate-600 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all duration-150 whitespace-nowrap"
                  onClick={() => sendMessage(qr.text)}
                  disabled={isLoading}
                >
                  {qr.icon} {qr.text}
                </button>
              ))}
            </div>
          </div>

          {/* Input area */}
          <div className="px-4 md:px-5 py-3 border-t border-slate-200 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                className="flex-1 resize-none border border-slate-200 rounded-xl px-4 py-2.5 text-sm leading-relaxed min-h-[44px] max-h-[120px] outline-none transition-all duration-150 text-slate-900 bg-slate-50 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100 placeholder:text-slate-400"
                placeholder="Share what's on your mind…"
                rows={1}
                aria-label="Message input"
                aria-describedby="input-hint"
                aria-disabled={isLoading}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                disabled={isLoading}
              />
              <p id="input-hint" className="sr-only">Press Enter to send. Shift+Enter for new line.</p>
              <button
                className="w-11 h-11 bg-violet-600 hover:bg-violet-700 active:scale-95 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 shadow-lg shadow-violet-200 disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed"
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isLoading}
                aria-label="Send message"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* ===== INSIGHTS PANEL ===== */}
        <AnimatePresence>
          {(activeView === 'chat' || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
            <aside
              id="panel-insights"
              className={`w-[340px] border-l border-slate-200 bg-slate-50/80 overflow-y-auto shrink-0 hidden md:flex flex-col ${showMobilePanel ? 'flex! fixed inset-[56px_0_0_0] z-200 w-full' : ''}`}
              role="complementary"
              aria-label="Real-time emotional insights"
            >
              {/* Panel header */}
              <div className="px-4 py-3 border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Insights</h2>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-600 font-medium">Active</span>
                  </div>
                </div>
              </div>

              {/* Signal Analysis */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Signal Analysis</div>
                <div className="space-y-2.5">
                  {/* Text sentiment */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-400">Text tone</div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${sentimentColorMap[textSentiment] || 'bg-slate-100 text-slate-700'}`}>
                      {moodEmojiMap[textSentiment] || '😐'} {textSentiment.charAt(0).toUpperCase() + textSentiment.slice(1)}
                    </span>
                  </div>

                  {/* Voice tone - REAL MICROPHONE */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sensor.micActive ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                      <svg viewBox="0 0 24 24" className={`w-4 h-4 ${sensor.micActive ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-400">Voice energy {sensor.micActive && <span className="text-emerald-500">(LIVE)</span>}</div>
                      {sensor.micActive && (
                        <div className="w-full h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all duration-150" style={{ width: `${sensor.voiceEnergy}%` }} />
                        </div>
                      )}
                    </div>
                    <button
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-all ${sensor.micActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-emerald-300'
                        }`}
                      onClick={sensor.micActive ? sensor.stopMic : sensor.startMic}
                      aria-label={sensor.micActive ? 'Stop microphone' : 'Start microphone'}
                    >
                      {sensor.micActive ? 'Stop' : 'Start'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3 ml-11">
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${toneColorMap[voiceTone] || 'bg-slate-100 text-slate-700'}`}>
                      {voiceTone === 'calm' ? '😌' : voiceTone === 'tense' ? '😰' : voiceTone === 'tired' ? '😴' : '🎙️'} {voiceTone.charAt(0).toUpperCase() + voiceTone.slice(1)}
                    </span>
                    {sensor.micError && <span className="text-[10px] text-rose-500">{sensor.micError}</span>}
                  </div>

                  {/* Face signal - REAL CAMERA */}
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${sensor.cameraActive ? 'bg-amber-50' : 'bg-slate-100'}`}>
                      <svg viewBox="0 0 24 24" className={`w-4 h-4 ${sensor.cameraActive ? 'text-amber-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] text-slate-400">Facial signal {sensor.cameraActive && <span className="text-amber-500">(LIVE)</span>}</div>
                    </div>
                    <button
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium border transition-all ${sensor.cameraActive
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-amber-300'
                        }`}
                      onClick={sensor.cameraActive ? sensor.stopCamera : sensor.startCamera}
                      aria-label={sensor.cameraActive ? 'Stop camera' : 'Start camera'}
                    >
                      {sensor.cameraActive ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Camera Preview */}
              {sensor.cameraActive && (
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-900/5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Camera Preview
                    <span className="ml-2 text-amber-500">{String(sensor.dominantExpression)} ({Number(sensor.faceConfidence)}%)</span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-4/3 max-w-[280px] mx-auto">
                    <video
                      ref={sensor.videoRef}
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                      autoPlay
                      playsInline
                      muted
                      aria-label="Camera preview for facial expression analysis"
                    />
                    <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                      <span className="text-[9px] text-white bg-black/60 px-1.5 py-0.5 rounded">
                        {String(sensor.dominantExpression)} {Number(sensor.faceConfidence)}%
                      </span>
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Contradiction Alert */}
              <AnimatePresence>
                {contradiction?.detected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 py-3 border-b border-slate-100 bg-linear-to-r from-amber-50 to-orange-50 overflow-hidden"
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mb-2 flex items-center gap-1.5">
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        ⚡
                      </motion.span>
                      Contradiction Detected
                    </div>
                    <div className="bg-white/80 rounded-xl p-3 border border-amber-200">
                      <div className="text-[11px] font-bold text-orange-700 uppercase tracking-wide mb-1.5">
                        {contradiction.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-amber-900/80 leading-relaxed">
                        Your words and signals don&apos;t match. MindMirror is adapting its questions to probe deeper.
                        {contradiction.question && (
                          <div className="mt-2 pt-2 border-t border-amber-200/50">
                            <span className="font-semibold text-amber-800">Adaptive question: </span>
                            &ldquo;{contradiction.question}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stress Triggers */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Stress Triggers Detected</div>
                {sortedTriggers.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-3">Start talking — patterns will appear here</div>
                ) : (
                  <div className="space-y-2.5">
                    {sortedTriggers.map(([name, val]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 w-20 truncate shrink-0" title={name}>{name}</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${val >= 70 ? 'bg-rose-500' : val >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${val}%` }}
                            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                            role="img"
                            aria-label={`${name} stress level ${val}%`}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 w-8 text-right shrink-0">{val}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Burnout Risk */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Burnout Risk</div>
                <div className="space-y-2">
                  <div
                    className="h-3 bg-slate-200 rounded-full overflow-hidden"
                    role="progressbar"
                    aria-label="Burnout risk level"
                    aria-valuenow={burnout}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <motion.div
                      className={`h-full rounded-full ${burnoutBarColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${burnout}%` }}
                      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${burnoutColor}`}>{burnoutLabel}</span>
                    <span className="text-xs text-slate-400">{burnout > 0 ? `${burnout}%` : '—'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{burnoutDesc}</div>
                </div>
              </div>

              {/* Mood Timeline */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Mood Over Session</div>
                {renderMoodChart()}
              </div>

              {/* Personalized Insight */}
              <div className="px-4 py-3" aria-live="polite">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Personalized Insight</div>
                {showInsight && insight ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-violet-50 border border-violet-200 rounded-xl p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-[11px] font-bold text-violet-700 uppercase tracking-wide">Pattern Found</span>
                    </div>
                    <p className="text-xs text-violet-900 leading-relaxed">{insight}</p>
                  </motion.div>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-3">Insight appears after a few exchanges</div>
                )}
              </div>
            </aside>
          )}
        </AnimatePresence>

        {/* ===== JOURNAL VIEW ===== */}
        <section
          id="view-journal"
          className={`flex-1 overflow-y-auto p-6 md:p-10 ${activeView === 'journal' ? '' : 'hidden'}`}
          aria-label="Journal entries"
        >
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Your Journal</h1>
              <p className="text-sm text-slate-400">Every conversation is saved here. Patterns are discovered across entries over time.</p>
            </div>
            <div className="space-y-4">
              {journalEntries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📓</div>
                  <div className="text-sm text-slate-400">No entries yet. Start a session to record your first journal entry.</div>
                </div>
              ) : journalEntries.map(e => (
                <article
                  key={e.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer"
                  tabIndex={0}
                  aria-label={`Journal entry from ${e.date}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-slate-400">{e.date}</div>
                    {e.mood && (
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${sentimentColorMap[e.mood] || 'bg-slate-100 text-slate-700'}`}>
                        {moodEmojiMap[e.mood] || '😐'} {e.mood}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed line-clamp-3">{e.summary}</div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {e.tags.map(t => (
                      <span key={t} className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${t === 'stress' || t === 'self-doubt' ? 'bg-rose-50 text-rose-700' :
                          t === 'burnout' ? 'bg-amber-50 text-amber-700' :
                            t === 'anxiety' ? 'bg-amber-50 text-amber-700' :
                              'bg-violet-50 text-violet-700'
                        }`}>{t}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== PRIVACY VIEW ===== */}
        <section
          id="view-privacy"
          className={`flex-1 overflow-y-auto p-6 md:p-10 ${activeView === 'privacy' ? '' : 'hidden'}`}
          aria-label="Privacy and settings"
        >
          <div className="max-w-xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Privacy & Settings</h1>
            <p className="text-sm text-slate-400 mb-6">You own your data. MindMirror never stores raw video or audio. You control everything.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6" role="note">
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">🔒</span>
                <div className="text-sm text-emerald-800 leading-relaxed">
                  <strong>Data stays with you.</strong> All conversation analysis runs through the AI API securely. No raw camera footage or voice recordings are stored or transmitted. Your journal entries are saved locally in your browser only.
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
              {(['camera', 'voice', 'journal', 'crisis'] as const).map((key, idx) => (
                <div key={key} className={`flex items-center justify-between p-4 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                  <div className="flex-1 mr-4">
                    <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      Enable {key === 'camera' ? 'camera analysis' : key === 'voice' ? 'voice analysis' : key === 'journal' ? 'journal entries' : 'crisis resource prompts'}
                      {key === 'camera' && sensor.cameraActive && <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">LIVE</span>}
                      {key === 'voice' && sensor.micActive && <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">LIVE</span>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{
                      key === 'camera' ? 'Detects facial expressions using face-api.js. Camera feed stays on-device — never recorded or transmitted.'
                        : key === 'voice' ? 'Analyzes tone and energy via Web Audio API. Raw audio is discarded immediately after analysis.'
                          : key === 'journal' ? 'Stores session transcripts locally for pattern discovery.'
                            : 'Show iCall / Vandrevala helpline when severe distress is detected.'
                    }</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer" aria-label={`Enable ${key}`}>
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings[key]}
                      onChange={e => {
                        const val = e.target.checked;
                        setSettings(prev => ({ ...prev, [key]: val }));
                        localStorage.setItem('mm_setting_' + key, String(val));
                        // Auto-start/stop sensors when toggled
                        if (key === 'camera') {
                          if (val) sensor.startCamera(); else sensor.stopCamera();
                        }
                        if (key === 'voice') {
                          if (val) sensor.startMic(); else sensor.stopMic();
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-violet-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600 after:shadow-sm"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
              <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-medium text-slate-900">Export my data</div>
                  <div className="text-xs text-slate-400 mt-0.5">Download all journal entries as JSON.</div>
                </div>
                <button
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
                  onClick={exportData}
                  aria-label="Download journal data"
                >
                  Download
                </button>
              </div>
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 mr-4">
                  <div className="text-sm font-medium text-rose-700">Delete all data</div>
                  <div className="text-xs text-slate-400 mt-0.5">Permanently removes all local journal entries.</div>
                </div>
                <button
                  className="px-4 py-1.5 text-xs font-medium rounded-full text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all"
                  onClick={deleteData}
                  aria-label="Delete all data"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4" role="note">
              <div className="flex items-start gap-2">
                <span className="text-base mt-0.5">⚠️</span>
                <div className="text-sm text-amber-800 leading-relaxed">
                  <strong>Important:</strong> MindMirror is a wellness companion, not a therapist or medical device. It does not diagnose or treat mental health conditions. If you are in crisis, please contact <strong>iCall: 9152987821</strong> or <strong>Vandrevala Foundation: 1860-2662-345</strong>.
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== CRISIS FOOTER ===== */}
      <footer className="shrink-0 bg-white border-t border-slate-100 px-4 py-2 flex items-center justify-center gap-4 text-[10px] text-slate-400">
        <span>🧠 MindMirror is a wellness companion, not a medical device</span>
        <span>·</span>
        <span>📞 iCall: 9152987821</span>
        <span>·</span>
        <span>📞 Vandrevala: 1860-2662-345</span>
      </footer>
    </div>
  );
}
