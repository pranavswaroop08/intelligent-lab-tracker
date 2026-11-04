import React, { useState, useEffect } from 'react';
import { Flame, ShieldAlert, AlertTriangle, ShieldCheck, Zap, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import NFPA704Diamond from '../components/NFPA704Diamond';
import GHSPictogram from '../components/GHSPictogram';

export default function CompatibilityMatrix({ onOpenAI }) {
  const [chemicals, setChemicals] = useState([]);
  const [chemAId, setChemAId] = useState(1); // Default Acetone
  const [chemBId, setChemBId] = useState(3); // Default Nitric Acid (Classic violent incompatibility!)
  const [simResult, setSimResult] = useState(null);
  const [facilityAudit, setFacilityAudit] = useState(null);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [chemList, ruleList, audit] = await Promise.all([
        api.getChemicals(),
        api.getIncompatibilityRules(),
        api.getFacilityAudit()
      ]);
      setChemicals(chemList);
      setRules(ruleList);
      setFacilityAudit(audit);

      if (chemList.length >= 2) {
        runSimulation(1, 3);
      }
    } catch (err) {
      console.error('Failed to load matrix data:', err);
    }
  };

  const runSimulation = async (idA, idB) => {
    const a = idA || chemAId;
    const b = idB || chemBId;
    if (!a || !b) return;

    setLoading(true);
    try {
      const res = await api.checkPairCompatibility(a, b);
      setSimResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-500" />
          Chemical Incompatibility & Co-Location Safety Engine
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Deterministic chemical reaction simulator preventing dangerous storage co-locations, violent neutralizations & toxic gas release
        </p>
      </div>

      {/* Simulator Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-200 text-sm">Interactive Pairwise Chemical Hazard Simulator</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
            EPA / OSHA Chemical Segregation Standard
          </span>
        </div>

        {/* Compound Selector Selects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-cyan-300 mb-2">Reagent Compound A</label>
            <select
              value={chemAId}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setChemAId(val);
                runSimulation(val, chemBId);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            >
              {chemicals.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.hazard_class_name}) · CAS {c.cas_number}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <label className="block text-xs font-semibold text-rose-300 mb-2">Reagent Compound B</label>
            <select
              value={chemBId}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setChemBId(val);
                runSimulation(chemAId, val);
              }}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-400"
            >
              {chemicals.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.hazard_class_name}) · CAS {c.cas_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Simulator Outcome Box */}
        {simResult && (
          <div
            className={`rounded-2xl p-6 border transition-all ${
              !simResult.compatible
                ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl ${
                    !simResult.compatible
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {!simResult.compatible ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <ShieldCheck className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      !simResult.compatible ? 'bg-rose-500 text-slate-950' : 'bg-emerald-500 text-slate-950'
                    }`}>
                      {simResult.severity || (simResult.compatible ? 'SAFE' : 'HAZARD')}
                    </span>
                    <h4 className="font-bold text-base text-slate-100">
                      {simResult.title || (simResult.compatible ? 'Safe for Co-Location' : 'Incompatible Compounds')}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Simulation evaluated across GHS Hazard Classes & Molecular Reactivity
                  </p>
                </div>
              </div>

              {/* Pairwise NFPA comparison */}
              <div className="flex items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0">
                <div className="text-center">
                  <div className="text-[10px] text-cyan-300 font-mono mb-1 truncate max-w-[80px]">
                    {simResult.chemical_a?.name}
                  </div>
                  <NFPA704Diamond
                    health={simResult.chemical_a?.nfpa.health}
                    flammability={simResult.chemical_a?.nfpa.flammability}
                    instability={simResult.chemical_a?.nfpa.instability}
                    special={simResult.chemical_a?.nfpa.special}
                    size={40}
                  />
                </div>
                <div className="text-slate-600 font-bold">+</div>
                <div className="text-center">
                  <div className="text-[10px] text-rose-300 font-mono mb-1 truncate max-w-[80px]">
                    {simResult.chemical_b?.name}
                  </div>
                  <NFPA704Diamond
                    health={simResult.chemical_b?.nfpa.health}
                    flammability={simResult.chemical_b?.nfpa.flammability}
                    instability={simResult.chemical_b?.nfpa.instability}
                    special={simResult.chemical_b?.nfpa.special}
                    size={40}
                  />
                </div>
              </div>
            </div>

            {/* Reaction Details */}
            <div className="space-y-3 text-xs leading-relaxed">
              <div>
                <span className="font-semibold text-slate-200">Chemical Mechanism & Hazard:</span>
                <p className="text-slate-300 mt-0.5">{simResult.reason}</p>
              </div>

              {simResult.safety_protocol && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                  <span className="font-semibold text-cyan-400">Mandatory Safety & Storage Protocol:</span>
                  <p className="mt-0.5 text-slate-300">{simResult.safety_protocol}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Facility-Wide Audit Summary */}
      {facilityAudit && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h3 className="font-semibold text-slate-200 text-sm">Lab-Wide Storage Facility Audit</h3>
            </div>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
              facilityAudit.overall_facility_status === 'COMPLIANT'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {facilityAudit.overall_facility_status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilityAudit.location_audits.map((loc, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400">{loc.location_code}</span>
                    <h4 className="font-semibold text-slate-200">{loc.location_name}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                    loc.is_safe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {loc.is_safe ? 'Compliant' : 'Violation'}
                  </span>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  {loc.total_batches} Containers · Type: {loc.storage_type}
                </div>

                {loc.warnings && loc.warnings.length > 0 && (
                  <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/20 text-rose-300 text-[11px] space-y-1">
                    {loc.warnings.map((w, wi) => (
                      <div key={wi}>⚠️ {w.title} ({w.chem_a?.name} + {w.chem_b?.name})</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
