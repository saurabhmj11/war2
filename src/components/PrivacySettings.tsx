import React from 'react';

interface PrivacySettingsProps {
  activeView: string;
  settings: { camera: boolean; voice: boolean; journal: boolean; crisis: boolean };
  setSettings: React.Dispatch<React.SetStateAction<{ camera: boolean; voice: boolean; journal: boolean; crisis: boolean }>>;
  sensor: {
    cameraActive: boolean;
    micActive: boolean;
    startCamera: () => void;
    stopCamera: () => void;
    startMic: () => void;
    stopMic: () => void;
  };
  exportData: () => void;
  deleteData: () => void;
}

export function PrivacySettings({
  activeView,
  settings,
  setSettings,
  sensor,
  exportData,
  deleteData
}: PrivacySettingsProps) {
  return (
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
  );
}
