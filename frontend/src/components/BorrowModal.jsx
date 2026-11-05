import React, { useState } from 'react';
import { X, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function BorrowModal({ asset, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const isReturn = asset.status === 'in_use';

  const [purpose, setPurpose] = useState('Laboratory Course Practical Session');
  const [durationHours, setDurationHours] = useState('4');
  const [conditionReturn, setConditionReturn] = useState('Clean & Operational');
  const [runtimeHours, setRuntimeHours] = useState('2.5');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isReturn) {
        const res = await api.returnAsset(asset.id, {
          user_name: currentUser.name,
          condition_on_return: conditionReturn,
          runtime_hours: parseFloat(runtimeHours) || 1.0,
          notes: notes.trim()
        });
        if (onSuccess) onSuccess(res);
      } else {
        const res = await api.borrowAsset(asset.id, {
          user_id: currentUser.id,
          user_name: currentUser.name,
          purpose: purpose.trim(),
          borrow_duration_hours: parseInt(durationHours) || 4,
          notes: notes.trim()
        });
        if (onSuccess) onSuccess(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0b3c68] text-white">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isReturn ? 'bg-emerald-400' : 'bg-[#13b5ea]'}`}></span>
              {isReturn ? 'Check-in / Return Asset' : 'Check-out / Borrow Asset'}
            </h3>
            <p className="text-xs text-slate-300">{asset.name} [{asset.asset_tag}]</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isReturn ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Borrower
                </label>
                <input
                  type="text"
                  value={`${currentUser.name} (${currentUser.srn_or_emp_id})`}
                  disabled
                  className="w-full px-3.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Purpose / Experiment *
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Optical density measurement at 600nm"
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-[#13b5ea]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Estimated Usage Duration
                </label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
                >
                  <option value="1">1 Hour (Quick practical)</option>
                  <option value="2">2 Hours (Standard session)</option>
                  <option value="4">4 Hours (Half-day lab)</option>
                  <option value="8">8 Hours (Full-day research run)</option>
                  <option value="24">24 Hours (Overnight continuous test)</option>
                </select>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Instrument Condition on Return *
                </label>
                <select
                  value={conditionReturn}
                  onChange={(e) => setConditionReturn(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
                >
                  <option value="Clean & Operational">Clean & Fully Operational (Excellent)</option>
                  <option value="Cleaned with Lens Tissue">Optics / Sensors cleaned as per SOP</option>
                  <option value="Minor Dust / Needs Recalibration">Requires routine cleaning</option>
                  <option value="Damaged / Error Encountered">Error encountered during run (Flag inspection)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Total Runtime Hours Used
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={runtimeHours}
                  onChange={(e) => setRuntimeHours(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cuvettes returned to rack. Balanced before spin."
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
              className={`px-5 py-2.5 rounded-md text-white font-bold text-xs uppercase tracking-wider shadow-md transition disabled:opacity-50 ${
                isReturn ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#13b5ea] hover:bg-[#0da1d2]'
              }`}
            >
              {loading ? 'Processing...' : isReturn ? 'Confirm Return' : 'Confirm Check-out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
