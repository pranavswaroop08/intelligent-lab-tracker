import React, { useState } from 'react';
import { Search, ChevronDown, ShieldCheck, ShoppingCart, FlaskConical, FileText, Send, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ activeTab, setActiveTab, onOpenAI, onOpenDispenseQuote, onSearch, searchQuery }) {
  const { currentUser, availableUsers, switchUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || '');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(localSearch);
    if (activeTab !== 'chemicals') setActiveTab('chemicals');
  };

  return (
    <header className="w-full flex flex-col font-sans select-none sticky top-0 z-50 shadow-md">
      {/* =========================================================================
          TIER 1: Top Dark Charcoal Bar (#272b30)
          ========================================================================= */}
      <div className="bg-[#272b30] text-slate-300 text-xs py-1.5 px-4 sm:px-8 flex items-center justify-between border-b border-slate-700/60">
        {/* Left Pills / Quick Tags */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('chemicals')}
            className="px-3 py-0.5 rounded-sm bg-white text-[#272b30] font-medium text-[11px] hover:bg-slate-100 transition shadow-xs"
          >
            Hyaluronic Acid
          </button>
          <button
            onClick={() => setActiveTab('chemicals')}
            className="px-3 py-0.5 rounded-sm bg-[#383d44] text-slate-200 font-medium text-[11px] hover:bg-slate-700 transition"
          >
            Herbal Extract
          </button>
          <span className="hidden lg:inline-block text-[11px] text-slate-400 ml-2 font-mono">
            PES University · PES2UG24CS365 & PES2UG24CS363
          </span>
        </div>

        {/* Right Contact & Email */}
        <div className="flex items-center gap-4 text-[11px] text-slate-300">
          <a
            href="mailto:sales@stanfordchem.com"
            className="hover:text-white transition flex items-center gap-1 font-mono"
          >
            sales@stanfordchem.com
          </a>
          <span className="hidden md:inline-block text-slate-500">|</span>
          <span className="hidden md:inline-block font-mono text-cyan-400">
            PES Lab: +91-9845012345
          </span>
        </div>
      </div>

      {/* =========================================================================
          TIER 2: White Main Branding Row (Logo + Search + Action Buttons)
          ========================================================================= */}
      <div className="bg-white py-3.5 px-4 sm:px-8 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo: Stanford Chemicals Style */}
        <div
          onClick={() => setActiveTab('dashboard')}
          className="cursor-pointer flex items-center gap-3 shrink-0"
        >
          {/* Beaker Flask Logo SVG */}
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-10 h-10">
              {/* Flask neck and body outline in deep blue */}
              <path
                d="M40,15 L60,15 L60,35 L80,75 C83,81 79,88 72,88 L28,88 C21,88 17,81 20,75 L40,35 Z"
                fill="none"
                stroke="#0b3c68"
                strokeWidth="6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Liquid inside in bright cyan */}
              <path
                d="M30,55 Q50,60 70,55 L75,78 C76,82 73,85 68,85 L32,85 C27,85 24,82 25,78 Z"
                fill="#13b5ea"
                opacity="0.85"
              />
              {/* Bubbles */}
              <circle cx="45" cy="72" r="3" fill="#ffffff" />
              <circle cx="58" cy="67" r="2" fill="#ffffff" />
              <circle cx="50" cy="62" r="2.5" fill="#ffffff" />
            </svg>
          </div>

          <div className="leading-tight">
            <div className="text-[#0b3c68] font-extrabold text-xl tracking-tight font-sans">
              STANFORD
            </div>
            <div className="text-[#0b3c68] font-bold text-xs tracking-[0.25em] font-sans -mt-0.5">
              CHEMICALS
            </div>
            <div className="text-[9px] text-slate-400 font-mono tracking-wider">
              LAB ASSET & INVENTORY PLATFORM
            </div>
          </div>
        </div>

        {/* Center: Search Box */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full md:max-w-xl flex items-center"
        >
          <div className="relative w-full">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              placeholder="Search by Chemical Name, CAS # (e.g. 67-64-1), Formula, or Equipment Tag..."
              className="w-full pl-4 pr-10 py-2 rounded-md border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#13b5ea] focus:ring-1 focus:ring-[#13b5ea] transition shadow-xs"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#13b5ea] transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right Action Buttons: "GET A QUOTE" & "REQUEST MSDS" */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              if (onOpenDispenseQuote) onOpenDispenseQuote();
              else setActiveTab('dispensations');
            }}
            className="px-4 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wide shadow-sm transition transform active:scale-95"
          >
            GET A QUOTE
          </button>

          <button
            onClick={onOpenAI}
            className="px-4 py-2 rounded-md bg-white hover:bg-slate-50 text-[#00a8cc] border border-[#00a8cc] font-bold text-xs uppercase tracking-wide transition shadow-xs flex items-center gap-1.5"
            title="Ask Google Gemini AI for instant MSDS / Safety Data Sheets & Spill Protocols"
          >
            <FileText className="w-3.5 h-3.5" />
            REQUEST MSDS
          </button>
        </div>
      </div>

      {/* =========================================================================
          TIER 3: Primary Navigation Bar (#13b5ea Cyan Banner)
          ========================================================================= */}
      <nav className="bg-[#13b5ea] text-white px-4 sm:px-8 flex items-center justify-between overflow-x-auto scrollbar-none">
        {/* Navigation Links matching the template */}
        <div className="flex items-center space-x-1 sm:space-x-3 text-xs font-bold uppercase tracking-wider py-0 whitespace-nowrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'dashboard'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            HOME
          </button>

          <button
            onClick={() => setActiveTab('chemicals')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'chemicals'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            PRODUCTS
          </button>

          <button
            onClick={() => setActiveTab('chemicals')}
            className="py-3 px-3 transition text-white/90 hover:text-white hover:bg-white/10"
          >
            HYALURONIC ACID
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'assets'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            PHARMACEUTICALS (ASSETS)
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'locations'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            HERBAL EXTRACT (CABINETS)
          </button>

          <button
            onClick={() => setActiveTab('compatibility')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'compatibility'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            APPLICATIONS (SAFETY)
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'maintenance'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            CALIBRATION
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 transition relative ${
              activeTab === 'audit'
                ? 'text-white border-b-4 border-white'
                : 'text-white/90 hover:text-white hover:bg-white/10'
            }`}
          >
            ABOUT US (AUDIT)
          </button>
        </div>

        {/* Far Right: Red List Icon + Profile Switcher */}
        <div className="flex items-center gap-3 shrink-0 py-2">
          {/* Red List badge matching template */}
          <button
            onClick={() => setActiveTab('dispensations')}
            className="flex items-center gap-1.5 text-white/90 hover:text-white transition px-2 py-1 rounded bg-[#0da1d2]"
            title="Active Dispensations & Reagents List"
          >
            <div className="relative">
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center -top-1.5 -right-2 absolute border border-white">
                2
              </span>
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold uppercase ml-1">List</span>
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white text-slate-800 text-[11px] font-semibold hover:bg-slate-100 transition shadow-xs"
            >
              <User className="w-3.5 h-3.5 text-[#0b3c68]" />
              <span className="truncate max-w-[100px]">{currentUser.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-2xl py-2 z-50 text-xs text-slate-700">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-slate-400 text-[10px] uppercase font-mono">Current User</div>
                  <div className="font-bold text-[#0b3c68]">{currentUser.name}</div>
                  <div className="text-slate-500 text-[11px] font-mono">{currentUser.srn_or_emp_id}</div>
                </div>

                <div className="px-4 py-1.5 text-[10px] text-slate-400 uppercase font-mono mt-1">
                  Switch Demo Account:
                </div>
                {availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition flex items-center justify-between ${
                      u.id === currentUser.id ? 'bg-cyan-50 text-[#00a8cc] font-bold' : 'text-slate-700'
                    }`}
                  >
                    <div>
                      <div>{u.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{u.role_name}</div>
                    </div>
                    {u.id === currentUser.id && <ShieldCheck className="w-4 h-4 text-[#00a8cc]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
