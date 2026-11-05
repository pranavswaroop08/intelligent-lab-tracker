import React, { useState } from 'react';
import { X, Wrench, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CalibrateModal({ asset, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [technicianName, setTechnicianName] = useState('Pranav Kaushal J');
  const [organization, setOrganization] = useState('PES University Metrology Lab');
  const [calibrationStatus, setCalibrationStatus] = useState('passed');
  const [measuredDeviation, setMeasuredDeviation] = useState('+0.02 units (Within tolerance)');
  const [standardRef, setStandardRef] = useState('ISO/IEC 17025 Class Standard');
  const [notes, setNotes] = useState('Complete electronic span baseline and zero drift verified.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.calibrateAsset(asset.id, {
        technician_name: technicianName.trim(),
        technician_organization: organization.trim(),
        calibration_status: calibrationStatus,
        measured_deviation: measuredDeviation.trim(),
        standard_reference: standardRef.trim(),
        report_notes: notes.trim()
      });
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Calibration logging failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0b3c68] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#13b5ea] text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Log Instrument Calibration</h3>
              <p className="text-xs text-slate-300">{asset.name} [{asset.asset_tag}]</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Asset summary strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-[#0b3c68] text-sm">{asset.model || 'Standard Laboratory Instrument'}</div>
            <div className="text-slate-500 font-mono">Serial: {asset.serial_number || 'N/A'} · Loc: {asset.location_code || 'PES Lab'}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[11px] font-semibold uppercase">Current Status</div>
            <div className="font-mono font-bold text-[#13b5ea] text-xs uppercase">
              {asset.status || 'Active'}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Technician / Inspector Name *
              </label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Accredited Organization
              </label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Calibration Outcome *
              </label>
              <select
                value={calibrationStatus}
                onChange={(e) => setCalibrationStatus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
              >
                <option value="passed">Passed (Within Tolerance)</option>
                <option value="adjusted">Adjusted / Recalibrated</option>
                <option value="failed">Failed (Requires Servicing)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Measured Drift / Deviation
              </label>
              <input
                type="text"
                value={measuredDeviation}
                onChange={(e) => setMeasuredDeviation(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Standard Calibration Reference
            </label>
            <input
              type="text"
              value={standardRef}
              onChange={(e) => setStandardRef(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Calibration Report Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Issue Certificate & Update Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
