import React, { useState } from 'react';
import { FlaskConical, Sparkles, User, ChevronDown, ShieldCheck, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ onOpenAI, onOpenScan }) {
  const { currentUser, availableUsers, switchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand & Institution */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-slate-100 text-sm tracking-tight sm:text-base">
              Intelligent Laboratory Platform
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              PES University
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            PES2UG24CS365 (Pranav Swaroop S) · PES2UG24CS363 (Pranav Kaushal J)
          </p>
        </div>
      </div>

      {/* Right Tools & User Profile */}
      <div className="flex items-center gap-3">
        {/* AI Safety Advisor Button */}
        <button
          onClick={onOpenAI}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 hover:from-cyan-500/20 hover:to-indigo-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-medium transition shadow-sm"
        >
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="hidden md:inline">Safety AI Assistant</span>
        </button>

        {/* User Profile & Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold">
              {currentUser.name.charAt(0)}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-200 leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-cyan-400 font-mono leading-none">
                {currentUser.role_name}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 z-50 text-xs">
              <div className="px-4 py-2 border-b border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase font-mono">Current Identity</div>
                <div className="font-semibold text-slate-200">{currentUser.name}</div>
                <div className="text-slate-400 text-[11px] font-mono">{currentUser.srn_or_emp_id}</div>
              </div>

              <div className="px-4 py-1.5 text-[10px] text-slate-500 uppercase font-mono mt-1">
                Switch Identity Demo Profile:
              </div>
              {availableUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    switchUser(u);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-slate-800/60 transition flex items-center justify-between ${
                    u.id === currentUser.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-[10px] text-slate-400">{u.role_name} · {u.srn_or_emp_id}</div>
                  </div>
                  {u.id === currentUser.id && <ShieldCheck className="w-4 h-4 text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
