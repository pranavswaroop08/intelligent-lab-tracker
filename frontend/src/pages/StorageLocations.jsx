import React, { useState, useEffect } from 'react';
import { Box, Thermometer, Layers, ShieldCheck, AlertTriangle, ChevronRight, Check } from 'lucide-react';
import { api } from '../services/api';
import ShelfVisualizer from '../components/ShelfVisualizer';

export default function StorageLocations() {
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Box className="w-5 h-5 text-cyan-400" />
          Laboratory Storage Cabinets & Shelf Visualizer
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Interactive digital twin of physical laboratory storage cabinets, cold storage & segregation zones
        </p>
      </div>

      {/* Main Grid: Location Selector List + Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Location Cards */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Storage Facilities ({locations.length})
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
                    ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {loc.location_code}
                    </span>
                    <h3 className="font-semibold text-xs text-slate-100 mt-1.5 leading-snug">
                      {loc.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{loc.temperature_target_c}°C</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 mt-1 font-mono">
                  Room {loc.room_no} · {loc.shelf_count} Shelf Tiers
                </div>

                {/* Capacity Bar */}
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                    <span>Capacity Load</span>
                    <span className="font-mono text-slate-200">{loc.current_items_count} / {loc.max_capacity_items} Items</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        fillPercent > 80 ? 'bg-amber-400' : 'bg-cyan-400'
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
            <div className="p-12 text-center text-xs text-slate-500 border border-slate-800 rounded-2xl bg-slate-900/40">
              Select a cabinet or refrigerator to inspect physical shelf items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
