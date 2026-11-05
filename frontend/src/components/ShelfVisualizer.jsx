import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertTriangle, Thermometer, Layers, Droplets, Info } from 'lucide-react';
import { api } from '../services/api';
import GHSPictogram from './GHSPictogram';

export default function ShelfVisualizer({ locationId, onSelectBatch }) {
  const [location, setLocation] = useState(null);
  const [auditResult, setAuditResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!locationId) return;
    setLoading(true);
    Promise.all([
      api.getLocationDetail(locationId),
      api.auditLocation(locationId)
    ])
      .then(([loc, audit]) => {
        setLocation(loc);
        setAuditResult(audit);
      })
      .catch((err) => console.error('Failed to load shelf data:', err))
      .finally(() => setLoading(false));
  }, [locationId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-2xl border border-slate-200">
        Loading interactive cabinet digital twin...
      </div>
    );
  }

  if (!location) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {/* Location Top Bar */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-[#13b5ea]/10 text-[#00a8cc] font-bold border border-[#13b5ea]/30">
              {location.location_code}
            </span>
            <h3 className="font-bold text-[#0b3c68] text-base">{location.name}</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">{location.notes || 'Secondary containment certified'}</p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-xs">
            <Thermometer className="w-4 h-4 text-[#13b5ea]" />
            <span className="text-slate-700 font-mono font-bold">{location.temperature_target_c}°C</span>
          </div>

          {auditResult && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-xs ${
                auditResult.is_safe
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
              }`}
            >
              {auditResult.is_safe ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Segregation Compliant</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Incompatible Chemicals Detected!</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Safety Audit Warnings Banner if any */}
      {auditResult && (!auditResult.is_safe || auditResult.warnings.length > 0) && (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs space-y-2">
          {auditResult.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{w.title}: </span>
                <span>{w.reason}</span>
                <div className="text-[11px] text-rose-700 mt-0.5">Protocol: {w.safety_protocol}</div>
              </div>
            </div>
          ))}
          {auditResult.cabinet_violations.map((cv, i) => (
            <div key={i} className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cv.issue}</span>
            </div>
          ))}
        </div>
      )}

      {/* Realistic Physical Cabinet / Shelf Rack Layout */}
      <div className="p-6 bg-slate-50/50">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#13b5ea]" />
            Physical Shelf Layout ({location.shelf_count} Tiers)
          </span>
          <span className="font-mono text-slate-500">Capacity: {location.current_items_count} / {location.max_capacity_items} Items</span>
        </div>

        <div className="space-y-4">
          {location.shelves_map.map((shelf) => (
            <div
              key={shelf.shelf_number}
              className="bg-white border border-slate-200 rounded-xl p-4 transition hover:border-[#13b5ea] shadow-xs"
            >
              <div className="flex items-center justify-between mb-3 text-xs border-b border-slate-100 pb-2">
                <span className="font-bold text-[#0b3c68] flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#13b5ea]"></span>
                  Shelf Level {shelf.shelf_number}
                </span>
                <span className="text-[11px] text-slate-500 font-mono font-medium">
                  {shelf.chemicals.length} Reagents Stored
                </span>
              </div>

              {shelf.chemicals.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400 italic">
                  Empty Shelf Tier — Available for compliant storage
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {shelf.chemicals.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => onSelectBatch && onSelectBatch(b)}
                      className="cursor-pointer bg-slate-50/80 border border-slate-200 hover:border-[#13b5ea] p-3 rounded-xl transition hover:shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-xs text-[#0b3c68] hover:text-[#13b5ea] transition truncate">
                            {b.chemical_name}
                          </h4>
                          {b.is_expired ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Expired
                            </span>
                          ) : b.status === 'low' ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              Low
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                              OK
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 font-mono mt-1">
                          CAS: {b.cas_number} · Lot: {b.batch_lot_number}
                        </div>
                      </div>

                      {/* Stock Level Progress */}
                      <div className="mt-3 pt-2 border-t border-slate-200/80">
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span>Volume</span>
                          <span className="font-mono text-[#0b3c68] font-bold">
                            {b.current_quantity} / {b.initial_quantity} {b.unit}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              b.is_expired
                                ? 'bg-rose-500'
                                : b.current_quantity / b.initial_quantity < 0.25
                                ? 'bg-amber-500'
                                : 'bg-[#13b5ea]'
                            }`}
                            style={{
                              width: `${Math.min(100, (b.current_quantity / b.initial_quantity) * 100)}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
