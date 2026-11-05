import React, { useState, useEffect } from 'react';
import { Box, Thermometer, Layers, ShieldCheck, AlertTriangle, ChevronRight, Check, Shield, Wrench } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ShelfVisualizer from '../components/ShelfVisualizer';

export default function StorageLocations() {
  const { currentUser, isAdmin, isLabManager, switchToSwaroop, switchToKaushal } = useAuth();
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = () => {
    setLoading(true);
    api.getLocations()
      .then((res) => {
        setLocations(res);
        if (res.length > 0 && !selectedLocId) setSelectedLocId(res[0].id);
      })
      .catch((err) => console.error('Failed to load locations:', err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* RBAC Storage Topology Clearance Strip */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isAdmin
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white ${isAdmin ? 'bg-rose-600' : 'bg-emerald-600'}`}>
            {isAdmin ? <Shield className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-extrabold text-sm flex items-center gap-2">
              <span>{currentUser.name} ({currentUser.srn_or_emp_id})</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-current">
                {currentUser.role_name}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'Storage Topology Architect (Pranav Swaroop S): Can create new fire cabinets, set room temperature setpoints, and configure shelf tier counts.'
                : 'Physical Inspection Lead (Pranav Kaushal J): Can conduct shelf inventory audits and flag spill sumps for maintenance.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              onClick={switchToKaushal}
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
            >
              Switch to Kaushal (Lab Mgr)
            </button>
          ) : (
            <button
              onClick={switchToSwaroop}
              className="px-3 py-1.5 rounded-md bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
            >
              Switch to Swaroop (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
          <Box className="w-6 h-6 text-[#13b5ea]" />
          Storage Cabinets & Shelf Visualizer (Digital Twin)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Interactive digital twin of physical laboratory safety cabinets, cold storage & hazard segregation zones
        </p>
      </div>

      {/* Main Grid: Location Selector List + Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Location Cards */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Storage Units ({locations.length})
          </div>

          {locations.map((loc) => {
            const isSelected = selectedLocId === loc.id;
            const fillPercent = Math.min(100, Math.round((loc.current_items_count / loc.max_capacity_items) * 100));

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocId(loc.id)}
                className={`cursor-pointer rounded-2xl p-4 border transition ${
                  isSelected
                    ? 'bg-white border-[#13b5ea] shadow-md ring-1 ring-[#13b5ea]'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-[#00a8cc] font-bold">
                      {loc.location_code}
                    </span>
                    <h3 className="font-bold text-xs text-[#0b3c68] mt-1.5 leading-snug">
                      {loc.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    <Thermometer className="w-3.5 h-3.5 text-[#13b5ea]" />
                    <span className="font-bold">{loc.temperature_target_c}°C</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 mt-1 font-mono">
                  Room {loc.room_no} · {loc.shelf_count} Shelf Tiers
                </div>

                {/* Capacity Bar */}
                <div className="mt-3 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                    <span>Capacity Load</span>
                    <span className="font-mono font-bold text-slate-700">{loc.current_items_count} / {loc.max_capacity_items} Items</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        fillPercent > 80 ? 'bg-amber-500' : 'bg-[#13b5ea]'
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Interactive Shelf Model */}
        <div className="lg:col-span-2">
          {selectedLocId ? (
            <ShelfVisualizer locationId={selectedLocId} />
          ) : (
            <div className="p-12 text-center text-xs text-slate-400 border border-slate-200 rounded-2xl bg-white">
              Select a cabinet or refrigerator to inspect physical shelf items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
