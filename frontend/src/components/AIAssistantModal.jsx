import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, BookOpen, AlertTriangle, Cpu, FileText } from 'lucide-react';
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
      source: 'Google Gemini 2.5 Flash Safety Engine',
      text: "👋 Welcome to the **PES Chemicals Laboratory Safety & MSDS Advisor**.\n\nAsk any question regarding chemical compatibility, NFPA 704 ratings, GHS safety data sheets (MSDS), emergency spill neutralization, or equipment calibration standards."
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
          text: `⚠️ Safety Assistant notice: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/50 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl h-[90vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0b3c68] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#13b5ea] text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Laboratory Safety & MSDS AI Advisor
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-cyan-200 font-mono font-bold">
                  Gemini Powered
                </span>
              </h3>
              <p className="text-xs text-slate-300">OSHA, GHS & SOP Compliance Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Context Strip if active */}
        {(chemicalContext || assetContext) && (
          <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 text-xs text-[#00a8cc] font-medium flex items-center gap-2">
            <span className="font-bold text-slate-500">Target Context:</span>
            {chemicalContext && <span>🧪 {chemicalContext.name} (CAS: {chemicalContext.cas_number})</span>}
            {assetContext && <span>🔬 {assetContext.name} [{assetContext.asset_tag}]</span>}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1 font-mono font-semibold">
                {m.role === 'assistant' ? (
                  <>
                    <Cpu className="w-3 h-3 text-[#13b5ea]" />
                    <span>{m.source}</span>
                  </>
                ) : (
                  <span>You</span>
                )}
              </div>
              <div
                className={`max-w-[90%] rounded-2xl p-4 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-[#13b5ea] text-white font-medium rounded-br-xs shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-xs'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 p-3 bg-white rounded-xl border border-slate-200 w-fit shadow-xs">
              <Sparkles className="w-4 h-4 text-[#13b5ea] animate-spin" />
              <span>Analyzing safety database & regulatory protocols...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-6 py-2 border-t border-slate-200 bg-white">
          <div className="text-[11px] text-slate-500 mb-1.5 font-bold uppercase tracking-wider">Suggested Questions:</div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="whitespace-nowrap px-3 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-slate-200 transition shrink-0"
              >
                {qp}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
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
              className="flex-1 px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea] focus:bg-white"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="p-2.5 rounded-lg bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold shadow-sm transition disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
