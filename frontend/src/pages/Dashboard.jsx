import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Microscope,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Droplets,
  CalendarCheck,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import NFPA704Diamond from '../components/NFPA704Diamond';
import GHSPictogram from '../components/GHSPictogram';

export default function Dashboard({ setActiveTab, onOpenAI, onSelectQR }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = () => {
    setLoading(true);
    api.getDashboard()
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400 font-mono">Aggregating laboratory telemetry & safety metrics...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, hazard_distribution, recent_dispensations, recent_audits } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner with Compliance Score */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/5 blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Live Laboratory Telemetry Active
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              Chemical & Asset Intelligence Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Real-time monitoring of chemical hazards, GHS regulatory compliance, volumetric consumption, and instrument calibration across PES University research facilities.
            </p>
          </div>

          {/* Compliance Score Gauge Card */}
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center gap-5 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={summary.compliance_score >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                  strokeDasharray={`${summary.compliance_score}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-base font-bold text-slate-100 font-mono leading-none">
                  {summary.compliance_score}%
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">OSHA/GHS Readiness</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Grade {summary.compliance_grade}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-medium mt-0.5">
                {summary.compliance_score >= 85 ? 'Audit Inspection Ready' : 'Attention Items Flagged'}
              </div>
              <button
                onClick={() => setActiveTab('compatibility')}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1 mt-1"
              >
                Inspect facility audits <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Stat Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Chemical Reagents */}
        <div
          onClick={() => setActiveTab('chemicals')}
          className="cursor-pointer glass-card p-5 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Chemical Master Catalog</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{summary.total_chemicals}</span>
            <span className="text-xs text-slate-400">Compounds</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>{summary.total_batches} Active Containers</span>
            <span className="text-cyan-400 flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('chemicals')}
          className="cursor-pointer glass-card p-5 rounded-2xl border border-slate-800 hover:border-amber-500/40 transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Low Stock Reagents</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">{summary.low_stock_count}</span>
            <span className="text-xs text-slate-400">Below Reorder Level</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>{summary.expiring_batches_count} Expiring in 30 Days</span>
            <span className="text-amber-400 flex items-center gap-0.5">
              Review <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Laboratory Equipment */}
        <div
          onClick={() => setActiveTab('assets')}
          className="cursor-pointer glass-card p-5 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Laboratory Assets</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition">
              <Microscope className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-100 font-mono">{summary.total_assets}</span>
            <span className="text-xs text-slate-400">Instruments</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span className="text-emerald-400">{summary.active_borrows_count} Currently In Use</span>
            <span className="text-indigo-400 flex items-center gap-0.5">
              Track <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Calibrations Due */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className="cursor-pointer glass-card p-5 rounded-2xl border border-slate-800 hover:border-rose-500/40 transition group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Calibration Due</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">{summary.calibration_due_count}</span>
            <span className="text-xs text-slate-400">Require Recalibration</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2">
            <span>ISO/IEC 17025 Compliance</span>
            <span className="text-rose-400 flex items-center gap-0.5">
              Schedule <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Hazard Breakdown & Recent Dispensations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hazard Class Regulatory Segregation */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-200 text-sm">GHS Regulatory Storage Segregation</h3>
            </div>
            <button
              onClick={() => setActiveTab('compatibility')}
              className="text-xs text-cyan-400 hover:underline"
            >
              Matrix View
            </button>
          </div>

          <div className="space-y-3">
            {hazard_distribution.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/70">
                <div className="flex items-center gap-3">
                  <GHSPictogram type={h.code.toLowerCase().includes('flam') ? 'flame' : h.code.toLowerCase().includes('acid') ? 'corrosive' : 'skull_crossbones'} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{h.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Category Code: {h.code}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-cyan-300">
                    {h.count} Chemicals
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Volumetric Chemical Dispensations */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Recent Dispensations & Consumptions</h3>
            </div>
            <button
              onClick={() => setActiveTab('dispensations')}
              className="text-xs text-cyan-400 hover:underline"
            >
              All Records
            </button>
          </div>

          <div className="space-y-3">
            {recent_dispensations.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No dispensations logged yet.</div>
            ) : (
              recent_dispensations.map((d) => (
                <div key={d.id} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-200">{d.chemical_name}</div>
                    <div className="text-[11px] text-slate-400">
                      {d.experiment_name} · <span className="text-cyan-400">{d.user_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-400 text-xs">
                      -{d.dispensed_amount} {d.unit}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Bal: {d.remaining_quantity_after} {d.unit}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Security & Activity Audit Log Teaser */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Recent Platform Activity & Audit Trail</h3>
          </div>
          <button
            onClick={() => setActiveTab('audit')}
            className="text-xs text-cyan-400 hover:underline"
          >
            Full Security Log
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Operator</th>
                <th className="pb-2">Action</th>
                <th className="pb-2">Entity</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {recent_audits.map((a) => (
                <tr key={a.id} className="hover:bg-slate-950/30 transition">
                  <td className="py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 font-medium text-slate-200">{a.user_name}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      a.action.includes('ALERT') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      a.action.includes('DISPENSE') ? 'bg-amber-500/20 text-amber-400' :
                      a.action.includes('BORROW') ? 'bg-indigo-500/20 text-indigo-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-400 font-mono text-[11px]">{a.entity_type}</td>
                  <td className="py-2.5 text-slate-300 max-w-xs truncate">{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
