import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, BookOpen, AlertTriangle, Cpu } from 'lucide-react';
import { api } from '../services/api';

const QUICK_PROMPTS = [
  'How do I handle a 37% Hydrochloric Acid chemical spill?',
  'What PPE is required when dispensing concentrated Nitric Acid?',
  'Why is Acetone incompatible with strong oxidizers?',
  'Step-by-step startup calibration SOP for UV-Vis Spectrophotometer',
  'Protocol for hazardous organic halogenated solvent waste disposal'
];

export default function AIAssistantModal({ chemicalContext, assetContext, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      source: 'Gemini Safety Intelligence',
      text: "👋 Welcome to the **Intelligent Laboratory Safety Advisor**. Ask any question regarding chemical compatibility, NFPA 704 ratings, GHS safety sheets, spill protocols, or equipment calibration standards."
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (textToSend) => {
    const q = textToSend || prompt;
    if (!q.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', text: q.trim() }];
    setMessages(newMessages);
    setPrompt('');
    setLoading(true);

    try {
      const res = await api.askSafetyAdvisor(q.trim(), {
        chemical_id: chemicalContext ? chemicalContext.id : undefined,
        asset_id: assetContext ? assetContext.id : undefined
      });

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          source: res.source || 'Gemini Safety Engine',
          text: res.reply
        }
      ]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          source: 'System',
          text: `⚠️ Safety Assistant error: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-white shadow-md shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                Laboratory AI Safety Advisor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-slate-400">OSHA, GHS & SOP Safety Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Strip if active */}
        {(chemicalContext || assetContext) && (
          <div className="px-6 py-2 bg-slate-950/50 border-b border-slate-800 text-[11px] text-cyan-300 flex items-center gap-2">
            <span className="font-semibold text-slate-400">Target Context:</span>
            {chemicalContext && <span>🧪 {chemicalContext.name} (CAS: {chemicalContext.cas_number})</span>}
            {assetContext && <span>🔬 {assetContext.name} [{assetContext.asset_tag}]</span>}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] text-slate-500 mb-1 px-1 flex items-center gap-1 font-mono">
                {m.role === 'assistant' ? (
                  <>
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    <span>{m.source}</span>
                  </>
                ) : (
                  <span>You</span>
                )}
              </div>
              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-cyan-500 text-slate-950 font-medium rounded-br-sm'
                    : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-bl-sm shadow-md'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-950/50 rounded-xl border border-slate-800 w-fit">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Analyzing safety database & regulatory protocols...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-6 py-2 border-t border-slate-800/80 bg-slate-950/40">
          <div className="text-[11px] text-slate-400 mb-1.5 font-medium">Suggested Safety Questions:</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 transition shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about chemical storage, PPE, first-aid, or SOPs..."
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold shadow-md shadow-cyan-400/20 transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
