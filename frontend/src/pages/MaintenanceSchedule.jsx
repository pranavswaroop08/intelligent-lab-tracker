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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-[#13b5ea]" />
            Metrology Calibration Interval Schedules (ISO/IEC 17025)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accredited metrological calibration intervals, drift monitoring, and traceability certificates
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Forecast Window:</span>
          <select
            value={daysWindow}
            onChange={(e) => setDaysWindow(parseInt(e.target.value))}
            className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-slate-700 font-medium"
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
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Calibration Due Queue ({schedule.length} Instruments)
        </div>

        {schedule.length === 0 ? (
          <div className="p-8 text-center text-xs text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200">
            ✅ All laboratory instrumentation is currently within accredited metrology validity windows.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {schedule.map((item, idx) => {
              const a = item.asset;
              return (
                <div
                  key={idx}
                  className="clean-card rounded-2xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        {a.asset_tag}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.priority === 'URGENT' ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' :
                        item.priority === 'HIGH' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        'bg-cyan-100 text-cyan-800'
                      }`}>
                        {item.priority} PRIORITY
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#0b3c68] leading-snug">{a.name}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{a.manufacturer} · {a.category}</p>

                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between text-slate-500">
                        <span>Calibration Due:</span>
                        <span className={`font-mono font-bold ${item.is_overdue ? 'text-rose-600' : 'text-slate-800'}`}>
                          {a.next_calibration_due} ({item.days_remaining}d left)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Assigned Room:</span>
                        <span className="text-slate-800 font-medium">{a.lab_name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setActiveCalibrateAsset(a)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wider transition shadow-xs"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      LOG CALIBRATION
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Metrology Calibration Log */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#13b5ea]" />
            <h3 className="font-bold text-xs text-[#0b3c68] uppercase tracking-wider">Historical Metrology Certificates & Traceability Records</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Calibration Date</th>
                <th className="py-3 px-4">Instrument & Tag</th>
                <th className="py-3 px-4">Technician / Organization</th>
                <th className="py-3 px-4">Deviation Drift</th>
                <th className="py-3 px-4">Standard Reference</th>
                <th className="py-3 px-4 text-right">Certificate #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {calibrations.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono text-slate-500">{c.calibration_date}</td>
                  <td className="py-3 px-4 font-bold text-[#0b3c68]">
                    <div>{c.asset_name}</div>
                    <div className="text-[10px] text-[#00a8cc] font-mono">{c.asset_tag}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <div className="font-semibold">{c.technician_name}</div>
                    <div className="text-[10px] text-slate-400">{c.technician_organization}</div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-800">{c.measured_deviation}</td>
                  <td className="py-3 px-4 text-slate-500">{c.standard_reference}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
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
