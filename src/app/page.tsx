'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

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
}

interface JournalEntry {
  id: number;
  date: string;
  summary: string;
  tags: string[];
}

// ===== BADGE MAPS =====
const sentimentBadge: Record<string, string> = {
  neutral: 'badge-neutral', anxious: 'badge-anxious', stressed: 'badge-stressed',
  sad: 'badge-sad', overwhelmed: 'badge-stressed', hopeful: 'badge-calm'
};
const toneBadge: Record<string, string> = {
  calm: 'badge-calm', strained: 'badge-anxious', flat: 'badge-neutral',
  tired: 'badge-anxious', tense: 'badge-stressed', energetic: 'badge-calm'
};
const faceBadge: Record<string, string> = {
  relaxed: 'badge-calm', tense: 'badge-stressed', sad: 'badge-sad',
  blank: 'badge-neutral', worried: 'badge-anxious', engaged: 'badge-calm'
};

const moodScoreMap: Record<string, number> = {
  hopeful: 90, neutral: 60, calm: 75, anxious: 35, stressed: 25, sad: 20, overwhelmed: 15
};

const QUICK_REPLIES = [
  "I'm fine, just tired",
  "Physics is really stressing me out",
  "Mock tests didn't go well again",
  "I don't know if I can do this",
  "I studied all day but feel worse"
];

export default function MindMirrorPage() {
  // ===== STATE =====
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', role: 'ai', text: "Hi! I'm MindMirror — your personal wellness companion. I'm here to listen without judgment.\n\nHow are you feeling about your exam preparation today?", time: 'Just now' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeView, setActiveView] = useState<'chat' | 'journal' | 'privacy'>('chat');
  const [showMobilePanel, setShowMobilePanel] = useState(false);

  // Insight panel state
  const [textSentiment, setTextSentiment] = useState('neutral');
  const [voiceTone, setVoiceTone] = useState('calm');
  const [faceSignal, setFaceSignal] = useState('relaxed');
  const [triggers, setTriggers] = useState<Record<string, number>>({});
  const [burnout, setBurnout] = useState(0);
  const [moodHistory, setMoodHistory] = useState<number[]>([]);
  const [insight, setInsight] = useState('');
  const [showInsight, setShowInsight] = useState(false);
  const [contradiction, setContradiction] = useState<{ detected: boolean; type: string; question: string } | null>(null);

  // Journal state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Settings state
  const [settings, setSettings] = useState({ camera: true, voice: true, journal: true, crisis: true });

  // Conversation history for API
  const conversationHistory = useRef<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ===== LOAD SETTINGS & JOURNAL =====
  useEffect(() => {
    try {
      const savedSettings = { camera: true, voice: true, journal: true, crisis: true };
      ['camera', 'voice', 'journal', 'crisis'].forEach(key => {
        const stored = localStorage.getItem('mm_setting_' + key);
        if (stored !== null) (savedSettings as Record<string, boolean>)[key] = stored === 'true';
      });
      setSettings(savedSettings);

      const entries = JSON.parse(localStorage.getItem('mindmirror_journal') || '[]') as JournalEntry[];
      setJournalEntries(entries);
    } catch { /* ignore */ }
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

  // ===== GET TIME =====
  const getTime = () => new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  // ===== EXTRACT TAGS =====
  const extractTags = (text: string): string[] => {
    const subjects = ['Physics', 'Chemistry', 'Math', 'Maths', 'Biology', 'English', 'History', 'Geography', 'Economics'];
    const tags: string[] = [];
    subjects.forEach(s => { if (text.toLowerCase().includes(s.toLowerCase())) tags.push(s); });
    if (/stress|stressed|pressure/i.test(text)) tags.push('stress');
    if (/tired|exhaust|burnout/i.test(text)) tags.push('burnout');
    if (/can't|cannot|give up/i.test(text)) tags.push('self-doubt');
    return tags.slice(0, 4);
  };

  // ===== SAVE TO JOURNAL =====
  const saveToJournal = useCallback(() => {
    if (!settings.journal) return;
    try {
      const summary = conversationHistory.current
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' ');
      if (!summary.trim()) return;

      const entry: JournalEntry = {
        id: Date.now(),
        date: new Date().toLocaleString('en-IN'),
        summary: summary.slice(0, 300),
        tags: extractTags(summary),
      };
      const entries = [entry, ...journalEntries].slice(0, 50);
      setJournalEntries(entries);
      localStorage.setItem('mindmirror_journal', JSON.stringify(entries));
    } catch { /* ignore */ }
  }, [settings.journal, journalEntries]);

  // ===== SEND MESSAGE =====
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || inputText).trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setInputText('');

    // Add user message
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text, time: getTime() };
    setMessages(prev => [...prev, userMsg]);

    // Add thinking indicator
    const thinkingMsg: Message = { id: 'thinking', role: 'ai', text: 'Thinking…', time: '' };
    setMessages(prev => [...prev, thinkingMsg]);

    // Add to conversation history
    conversationHistory.current.push({ role: 'user', content: text });

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

      // Add AI message (replace thinking)
      const aiMsg: Message = { id: `a-${Date.now()}`, role: 'ai', text: reply || "I'm here. Could you tell me more?", time: getTime() };
      setMessages(prev => prev.filter(m => m.id !== 'thinking').concat(aiMsg));

      // Add crisis message if flagged
      if (meta?.crisisFlag && settings.crisis) {
        const crisisMsg: Message = {
          id: `c-${Date.now()}`,
          role: 'ai',
          text: "I want to make sure you're okay. If things feel really heavy right now, please reach out to a counselor:\n\n📞 iCall: 9152987821\n📞 Vandrevala Foundation: 1860-2662-345\n\nThey're trained to listen, and you deserve support beyond what I can offer.",
          time: getTime(),
          isCrisis: true
        };
        setMessages(prev => [...prev, crisisMsg]);
      }

      // Update conversation history
      conversationHistory.current.push({ role: 'assistant', content: reply });

      // Debug: log meta to verify data
      console.log('[MindMirror] AI meta:', JSON.stringify(meta));

      // Update insight panel
      if (meta) {
        if (meta.textSentiment) setTextSentiment(meta.textSentiment);
        if (meta.voiceTone) setVoiceTone(meta.voiceTone);
        if (meta.faceSignal) setFaceSignal(meta.faceSignal);
        if (meta.triggers && Object.keys(meta.triggers).length > 0) setTriggers(meta.triggers);
        if (typeof meta.burnout === 'number') setBurnout(meta.burnout);
        if (meta.textSentiment) {
          const score = moodScoreMap[meta.textSentiment] ?? 50;
          console.log('[MindMirror] Mood update:', meta.textSentiment, '→ score:', score);
          setMoodHistory(prev => {
            const next = [...prev, score].slice(-8);
            console.log('[MindMirror] moodHistory:', next);
            return next;
          });
        }
        if (meta.insight) {
          setInsight(meta.insight);
          setShowInsight(true);
        }
        if (meta.contradictionDetected) {
          setContradiction({
            detected: true,
            type: meta.contradictionType || 'verbal-vs-facial',
            question: meta.adaptiveQuestion || ''
          });
        } else {
          setContradiction(null);
        }
      }

      // Save to journal
      saveToJournal();
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
    saveToJournal();
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
    setVoiceTone('calm');
    setFaceSignal('relaxed');
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

  // ===== RENDER =====
  const sortedTriggers = Object.entries(triggers).sort(([, a], [, b]) => b - a).slice(0, 6);
  const burnoutLabel = burnout >= 70 ? 'High' : burnout >= 40 ? 'Moderate' : burnout > 0 ? 'Low' : '—';
  const burnoutColor = burnout >= 70 ? '#A32D2D' : burnout >= 40 ? '#854F0B' : '#0F6E56';
  const burnoutDesc = burnout >= 70 ? 'Consider taking a real break today.' : burnout >= 40 ? "You're pushing hard. Rest matters." : burnout > 0 ? "You're managing well right now." : 'No data yet';

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <div aria-live="polite" aria-atomic="true" className="sr-only" id="sr-announce" />

      {/* HEADER */}
      <header className="mm-header" role="banner">
        <a href="#" className="mm-logo" aria-label="MindMirror home">
          <div className="mm-logo-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 3-1.5 5.5-4 6.8V18H9v-2.2C6.5 14.5 5 12 5 9a7 7 0 0 1 7-7z"/><path d="M9 21h6M10 18v3M14 18v3"/></svg>
          </div>
          <span className="mm-logo-text">MindMirror<span className="mm-logo-tag"> beta</span></span>
        </a>
        <nav className="mm-nav" role="navigation" aria-label="App sections">
          <button className={`mm-nav-btn ${activeView === 'chat' ? 'active' : ''}`} onClick={() => setActiveView('chat')} aria-pressed={activeView === 'chat'}>Session</button>
          <button className={`mm-nav-btn ${activeView === 'journal' ? 'active' : ''}`} onClick={() => setActiveView('journal')} aria-pressed={activeView === 'journal'}>Journal</button>
          <button className={`mm-nav-btn ${activeView === 'privacy' ? 'active' : ''}`} onClick={() => setActiveView('privacy')} aria-pressed={activeView === 'privacy'}>Privacy</button>
          <button className="mm-nav-btn" onClick={() => setShowMobilePanel(!showMobilePanel)} aria-label="Toggle insights panel" style={{ display: 'none' }}>📊</button>
        </nav>
      </header>

      {/* MAIN */}
      <main className="mm-main" id="main-content" role="main">

        {/* ===== CHAT VIEW ===== */}
        <section id="view-chat" className={`view ${activeView === 'chat' ? 'active' : ''}`} aria-label="Conversation session">
          <div className="chat-topbar">
            <div className="session-info">
              <div className="avatar" aria-hidden="true">🧘</div>
              <div>
                <div className="session-name">MindMirror</div>
                <div className="session-sub"><span className="status-dot" aria-hidden="true" />Listening actively</div>
              </div>
            </div>
            <button className="mm-nav-btn" onClick={clearSession} aria-label="Start new session">New session</button>
          </div>

          <div className="messages" role="log" aria-label="Conversation messages" aria-live="polite" tabIndex={0}>
            {messages.map(msg => (
              <div key={msg.id} className={`msg-wrap ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className={`msg-avatar ${msg.role}`} aria-hidden="true">{msg.role === 'ai' ? '🧠' : '🎓'}</div>
                <div>
                  <div className={`msg-bubble ${msg.role} ${msg.isCrisis ? 'crisis' : ''} ${msg.id === 'thinking' ? 'thinking' : ''}`}
                    role={msg.isCrisis ? 'alert' : 'article'}
                    aria-label={msg.role === 'ai' ? 'MindMirror says' : 'You said'}
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br>') }}
                  />
                  {msg.time && <div className="msg-time">{msg.time}</div>}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="quick-replies" role="group" aria-label="Suggested replies">
            <span className="qr-label">Quick replies</span>
            {QUICK_REPLIES.map(qr => (
              <button key={qr} className="qr-btn" onClick={() => sendMessage(qr)}>{qr}</button>
            ))}
          </div>

          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              placeholder="Share what's on your mind…"
              rows={1}
              aria-label="Message input"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={isLoading}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!inputText.trim() || isLoading} aria-label="Send message">
              <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </section>

        {/* ===== INSIGHTS PANEL ===== */}
        <aside id="panel-insights" className={showMobilePanel ? 'mobile-open' : ''} role="complementary" aria-label="Real-time emotional insights" style={{ display: activeView === 'chat' ? '' : 'none' }}>

          {/* Signal Analysis */}
          <div className="panel-section">
            <div className="panel-title">Signal analysis</div>
            <div className="signals">
              <div className="signal-item">
                <div className="signal-icon text" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div><div className="signal-label">Text tone</div><span className={`signal-badge ${sentimentBadge[textSentiment] || 'badge-neutral'}`}>{textSentiment.charAt(0).toUpperCase() + textSentiment.slice(1)}</span></div>
              </div>
              <div className="signal-item">
                <div className="signal-icon voice" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"/></svg>
                </div>
                <div><div className="signal-label">Voice energy</div><span className={`signal-badge ${toneBadge[voiceTone] || 'badge-neutral'}`}>{voiceTone.charAt(0).toUpperCase() + voiceTone.slice(1)}</span></div>
              </div>
              <div className="signal-item">
                <div className="signal-icon face" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
                </div>
                <div><div className="signal-label">Facial signal</div><span className={`signal-badge ${faceBadge[faceSignal] || 'badge-neutral'}`}>{faceSignal.charAt(0).toUpperCase() + faceSignal.slice(1)}</span></div>
              </div>
            </div>
          </div>

          {/* Contradiction Alert */}
          {contradiction?.detected && (
            <div className="panel-section">
              <div className="panel-title">Contradiction detected</div>
              <div className="contradiction-alert">
                <div className="contradiction-header">
                  <span style={{ fontSize: 14 }}>⚡</span>
                  <span className="contradiction-title">{contradiction.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
                <div className="contradiction-text">
                  Your words and signals don&apos;t match. MindMirror is adapting its questions to probe deeper.
                  {contradiction.question && <><br /><strong>Adaptive question: </strong>&ldquo;{contradiction.question}&rdquo;</>}
                </div>
              </div>
            </div>
          )}

          {/* Stress Triggers */}
          <div className="panel-section">
            <div className="panel-title">Stress triggers detected</div>
            {sortedTriggers.length === 0 ? (
              <div className="empty-state">Start talking — patterns will appear here</div>
            ) : (
              <div className="trigger-list">
                {sortedTriggers.map(([name, val]) => (
                  <div key={name} className="trigger-row">
                    <span className="trigger-name" title={name}>{name}</span>
                    <div className="trigger-track">
                      <div className={`trigger-fill ${val >= 70 ? 'fill-high' : val >= 40 ? 'fill-mid' : 'fill-low'}`}
                        style={{ width: `${val}%` }} role="img" aria-label={`${name} stress level ${val}%`} />
                    </div>
                    <span className="trigger-pct">{val}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Burnout Risk */}
          <div className="panel-section">
            <div className="panel-title">Burnout risk</div>
            <div className="burnout-wrap">
              <div className="burnout-track" role="progressbar" aria-label="Burnout risk level" aria-valuenow={burnout} aria-valuemin={0} aria-valuemax={100}>
                <div className="burnout-fill" style={{ width: `${burnout}%` }} />
              </div>
              <div className="burnout-meta">
                <span className="burnout-label" style={{ color: burnoutColor }}>{burnoutLabel}</span>
                <span className="burnout-pct">{burnout > 0 ? `${burnout}%` : '—'}</span>
              </div>
              <div className="burnout-desc">{burnoutDesc}</div>
            </div>
          </div>

          {/* Mood Timeline */}
          <div className="panel-section">
            <div className="panel-title">Mood over session</div>
            <div className="mood-timeline" aria-label="Mood trend visualization">
              {Array.from({ length: 8 }).map((_, i) => {
                const val = moodHistory[i];
                if (val == null) return <div key={i} className="mood-bar-empty" aria-hidden="true" />;
                const h = Math.round(6 + (val / 100) * 42);
                const cls = val >= 65 ? 'high' : val >= 40 ? 'mid' : 'low';
                return <div key={i} className={`mood-bar ${cls}`} style={{ height: `${h}px` }} aria-label={`Mood ${val}%`} />;
              })}
            </div>
          </div>

          {/* Personalized Insight */}
          <div className="panel-section" aria-live="polite">
            <div className="panel-title">Personalized insight</div>
            {showInsight && insight ? (
              <div className="insight-card">
                <div className="insight-card-header" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span className="insight-card-title">Pattern found</span>
                </div>
                <p className="insight-text">{insight}</p>
              </div>
            ) : (
              <div className="empty-state">Insight appears after a few exchanges</div>
            )}
          </div>
        </aside>

        {/* ===== JOURNAL VIEW ===== */}
        <section id="view-journal" className={`view ${activeView === 'journal' ? 'active' : ''}`} aria-label="Journal entries">
          <div className="journal-header">
            <h1>Your journal</h1>
            <p>Every conversation is saved here. Patterns are discovered across entries over time.</p>
          </div>
          <div className="journal-entries">
            {journalEntries.length === 0 ? (
              <div className="empty-state">No entries yet. Start a session to record your first journal entry.</div>
            ) : journalEntries.map(e => (
              <article key={e.id} className="journal-entry" tabIndex={0} aria-label={`Journal entry from ${e.date}`}>
                <div className="entry-date">{e.date}</div>
                <div className="entry-text">{e.summary}</div>
                <div className="entry-tags">
                  {e.tags.map(t => (
                    <span key={t} className={`entry-tag ${t === 'stress' || t === 'self-doubt' ? 'stress' : t === 'burnout' ? 'burnout' : ''}`}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== PRIVACY VIEW ===== */}
        <section id="view-privacy" className={`view ${activeView === 'privacy' ? 'active' : ''}`} aria-label="Privacy and settings">
          <div className="settings-wrap">
            <h1>Privacy &amp; settings</h1>
            <p className="sub">You own your data. MindMirror never stores raw video or audio. You control everything.</p>

            <div className="privacy-notice" role="note">
              <strong>Data stays with you.</strong> All conversation analysis runs through the AI API securely. No raw camera footage or voice recordings are stored or transmitted. Your journal entries are saved locally in your browser only.
            </div>

            <div className="setting-group" role="group" aria-label="Session settings">
              {(['camera', 'voice', 'journal', 'crisis'] as const).map(key => (
                <div key={key} className="setting-row">
                  <div className="setting-info">
                    <div className="setting-label">Enable {key} {key === 'camera' ? 'analysis' : key === 'voice' ? 'analysis' : key === 'journal' ? 'entries' : 'resource prompts'}</div>
                    <div className="setting-desc">{
                      key === 'camera' ? 'Detects facial expressions during sessions. Never recorded.'
                      : key === 'voice' ? 'Analyzes tone and energy. Raw audio is discarded immediately.'
                      : key === 'journal' ? 'Stores session transcripts locally for pattern discovery.'
                      : 'Show iCall / Vandrevala helpline when severe distress is detected.'
                    }</div>
                  </div>
                  <label className="toggle" aria-label={`Enable ${key}`}>
                    <input type="checkbox" checked={settings[key]} onChange={e => {
                      const val = e.target.checked;
                      setSettings(prev => ({ ...prev, [key]: val }));
                      localStorage.setItem('mm_setting_' + key, String(val));
                    }} />
                    <span className="toggle-track" />
                    <span className="toggle-thumb" />
                  </label>
                </div>
              ))}
            </div>

            <div className="setting-group" role="group" aria-label="Data controls">
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Export my data</div>
                  <div className="setting-desc">Download all journal entries as JSON.</div>
                </div>
                <button className="mm-nav-btn" onClick={exportData} aria-label="Download journal data">Download</button>
              </div>
              <div className="setting-row">
                <div className="setting-info">
                  <div className="setting-label">Delete all data</div>
                  <div className="setting-desc">Permanently removes all local journal entries.</div>
                </div>
                <button className="mm-nav-btn delete-btn" onClick={deleteData} aria-label="Delete all data">Delete</button>
              </div>
            </div>

            <div className="not-therapy" role="note">
              <strong>⚠ Important:</strong> MindMirror is a wellness companion, not a therapist or medical device. It does not diagnose or treat mental health conditions. If you are in crisis, please contact <strong>iCall: 9152987821</strong> or <strong>Vandrevala Foundation: 1860-2662-345</strong>.
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
