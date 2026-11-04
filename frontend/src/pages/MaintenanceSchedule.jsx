import React, { useState, useEffect } from 'react';
import { CalendarCheck, Wrench, ShieldCheck, Clock, Award, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import CalibrateModal from '../components/CalibrateModal';

export default function MaintenanceSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [calibrations, setCalibrations] = useState([]);
  const [activeCalibrateAsset, setActiveCalibrateAsset] = useState(null);
  const [daysWindow, setDaysWindow] = useState(60);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [daysWindow]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getMaintenanceSchedule(daysWindow),
      api.getCalibrations()
    ])
      .then(([schedRes, calRes]) => {
        setSchedule(schedRes);
        setCalibrations(calRes);
      })
      .catch((err) => console.error('Failed to load maintenance data:', err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-amber-400" />
            Instrument Calibration & Metrology Schedule
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ISO/IEC 17025 Compliant Calibration Interval Tracking & Metrological Traceability
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Horizon:</span>
          <select
            value={daysWindow}
            onChange={(e) => setDaysWindow(parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200"
          >
            <option value="30">Next 30 Days</option>
            <option value="60">Next 60 Days</option>
            <option value="90">Next 90 Days</option>
            <option value="180">Next 6 Months</option>
          </select>
        </div>
      </div>

      {/* Upcoming Calibrations Due Cards */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Active Calibration Due Queue ({schedule.length} Instruments)
        </div>

        {schedule.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
            ✅ All laboratory assets are currently within their accredited calibration validity window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((item, idx) => {
              const a = item.asset;
              return (
                <div
                  key={idx}
                  className="glass-card rounded-2xl border border-slate-800 p-4 flex flex-col justify-between hover:border-slate-700"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {a.asset_tag}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.priority === 'URGENT' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        item.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      }`}>
                        {item.priority} PRIORITY
                      </span>
                    </div>

                    <h3 className="font-semibold text-slate-100 text-xs leading-snug">{a.name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{a.manufacturer} · {a.category}</p>

                    <div className="mt-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Calibration Due:</span>
                        <span className={`font-mono font-bold ${item.is_overdue ? 'text-rose-400' : 'text-slate-200'}`}>
                          {a.next_calibration_due} ({item.days_remaining}d left)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Assigned Room:</span>
                        <span className="text-slate-300">{a.lab_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => setActiveCalibrateAsset(a)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      Perform Calibration
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Metrology Calibration Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-xs text-slate-200">Historical Metrology Certificates & Traceability Records</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Calibration Date</th>
                <th className="py-3 px-4">Instrument & Tag</th>
                <th className="py-3 px-4">Technician / Organization</th>
                <th className="py-3 px-4">Deviation Drift</th>
                <th className="py-3 px-4">Standard Reference</th>
                <th className="py-3 px-4 text-right">Certificate #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {calibrations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-300">{c.calibration_date}</td>
                  <td className="py-3 px-4 font-semibold text-slate-200">
                    <div>{c.asset_name}</div>
                    <div className="text-[10px] text-cyan-400 font-mono">{c.asset_tag}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{c.technician_name}</div>
                    <div className="text-[10px] text-slate-500">{c.technician_organization}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{c.measured_deviation}</td>
                  <td className="py-3 px-4 text-slate-400">{c.standard_reference}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                    {c.certificate_number}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeCalibrateAsset && (
        <CalibrateModal
          asset={activeCalibrateAsset}
          onClose={() => setActiveCalibrateAsset(null)}
          onSuccess={() => loadData()}
        />
      )}
    </div>
  );
}
