import React, { useState } from 'react';
import { X, Droplets, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DispenseModal({ batch, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [dispensedAmount, setDispensedAmount] = useState('');
  const [experimentName, setExperimentName] = useState('');
  const [courseOrProject, setCourseOrProject] = useState('DBMS Mini-Project Lab');
  const [witnessName, setWitnessName] = useState('Pranav Kaushal J');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const qty = parseFloat(dispensedAmount);
    if (!qty || qty <= 0) {
      setError('Please enter a valid dispensation quantity greater than 0');
      return;
    }
    if (qty > batch.current_quantity) {
      setError(`Cannot dispense more than available stock (${batch.current_quantity} ${batch.unit})`);
      return;
    }
    if (!experimentName.trim()) {
      setError('Please provide an experiment or practical protocol title');
      return;
    }

    setLoading(true);
    try {
      const res = await api.dispenseChemical({
        batch_id: batch.id,
        user_id: currentUser.id,
        user_name: currentUser.name,
        dispensed_amount: qty,
        experiment_name: experimentName.trim(),
        course_or_project: courseOrProject.trim(),
        witness_name: witnessName.trim(),
        notes: notes.trim()
      });
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Dispensation failed');
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
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Dispense Reagent</h3>
              <p className="text-xs text-slate-300">Volumetric deduction & chain-of-custody logging</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chemical Summary Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div>
            <div className="font-bold text-[#0b3c68] text-sm">{batch.chemical_name}</div>
            <div className="text-slate-500 font-mono">Lot: {batch.batch_lot_number} · Loc: {batch.location_code}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[11px] font-semibold uppercase">Available Stock</div>
            <div className="font-mono font-black text-[#13b5ea] text-sm">
              {batch.current_quantity} {batch.unit}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Amount to Dispense ({batch.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={batch.current_quantity}
                value={dispensedAmount}
                onChange={(e) => setDispensedAmount(e.target.value)}
                placeholder={`Max ${batch.current_quantity}`}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-[#13b5ea]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Logged By
              </label>
              <input
                type="text"
                value={`${currentUser.name} (${currentUser.srn_or_emp_id})`}
                disabled
                className="w-full px-3.5 py-2 rounded-md bg-slate-100 border border-slate-200 text-slate-500 text-xs cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Experiment / Protocol Name *
            </label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="e.g. Synthesis of Acetylsalicylic Acid (Aspirin)"
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-[#13b5ea]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Course / Research Project
              </label>
              <input
                type="text"
                value={courseOrProject}
                onChange={(e) => setCourseOrProject(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Lab In-Charge / Witness
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Safety & Handling Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handled inside fume hood with chemical splash goggles."
              className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-slate-800 text-xs focus:outline-none focus:border-[#13b5ea]"
            />
          </div>

          {/* Action buttons */}
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
              {loading ? 'Deducting...' : 'Authorize & Dispense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
