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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Dispense Reagent</h3>
              <p className="text-xs text-slate-400">Volumetric deduction & chain-of-custody logging</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chemical Summary Strip */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-slate-200">{batch.chemical_name}</div>
            <div className="text-slate-400 font-mono">Lot: {batch.batch_lot_number} · Loc: {batch.location_code}</div>
          </div>
          <div className="text-right">
            <div className="text-slate-400 text-[11px]">Available Stock</div>
            <div className="font-mono font-bold text-cyan-400 text-sm">
              {batch.current_quantity} {batch.unit}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Logged By
              </label>
              <input
                type="text"
                value={`${currentUser.name} (${currentUser.srn_or_emp_id})`}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Experiment / Protocol Name *
            </label>
            <input
              type="text"
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              placeholder="e.g. Synthesis of Acetylsalicylic Acid (Aspirin)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Course / Research Project
              </label>
              <input
                type="text"
                value={courseOrProject}
                onChange={(e) => setCourseOrProject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Lab In-Charge / Witness
              </label>
              <input
                type="text"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Safety & Handling Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Handled inside fume hood with chemical splash goggles."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
            >
              {loading ? 'Deducting...' : 'Authorize & Dispense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
