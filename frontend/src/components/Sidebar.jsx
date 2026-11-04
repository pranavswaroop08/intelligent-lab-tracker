import React from 'react';
import {
  LayoutDashboard,
  FlaskConical,
  Microscope,
  Box,
  Flame,
  Droplets,
  CalendarCheck,
  ShieldAlert,
  History,
  FileCheck2
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
  { id: 'chemicals', label: 'Chemical Catalog & Stock', icon: FlaskConical },
  { id: 'assets', label: 'Laboratory Equipment', icon: Microscope },
  { id: 'locations', label: 'Cabinets & Shelf Map', icon: Box },
  { id: 'compatibility', label: 'Hazard & Incompatibility', icon: Flame },
  { id: 'dispensations', label: 'Dispensations & Waste', icon: Droplets },
  { id: 'maintenance', label: 'Calibration Schedules', icon: CalendarCheck },
  { id: 'audit', label: 'Audit Trail & Compliance', icon: History }
];

export default function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
          Platform Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* University Course Badge Footer */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-[11px]">
          <FileCheck2 className="w-4 h-4" />
          <span>PES University CSE</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
          Full Stack Laboratory Asset & Chemical Safety System
        </p>
        <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          MySQL 8.0 · Flask · React
        </div>
      </div>
    </aside>
  );
}
