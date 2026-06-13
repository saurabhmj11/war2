import React from 'react';
import { JournalEntry } from '@/app/lib/constants';

interface JournalViewProps {
  activeView: string;
  journalEntries: JournalEntry[];
  sentimentColorMap: Record<string, string>;
  moodEmojiMap: Record<string, string>;
}

export function JournalView({
  activeView,
  journalEntries,
  sentimentColorMap,
  moodEmojiMap,
}: JournalViewProps) {
  return (
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
  );
}
