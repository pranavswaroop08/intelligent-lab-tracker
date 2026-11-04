import React, { useState, useEffect } from 'react';
import { Droplets, Trash2, Plus, Calendar, User, Search } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Dispensations() {
  const { currentUser } = useAuth();
  const [dispensations, setDispensations] = useState([]);
  const [wasteLogs, setWasteLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('dispensations'); // 'dispensations' | 'waste'
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form for waste log
  const [newWaste, setNewWaste] = useState({
    waste_code: 'HAZ-SOLV-ORG',
    waste_description: 'Mixed acetone & ethanol organic liquid effluent',
    quantity: 5.0,
    unit: 'l',
    container_id: 'CONT-W-2026-04'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getDispensations(),
      api.getWasteLogs()
    ])
      .then(([disp, waste]) => {
        setDispensations(disp);
        setWasteLogs(waste);
      })
      .catch((err) => console.error('Failed to load dispensation data:', err))
      .finally(() => setLoading(false));
  };

  const handleCreateWaste = async (e) => {
    e.preventDefault();
    try {
      await api.logWaste({
        ...newWaste,
        user_id: currentUser.id
      });
      setShowWasteModal(false);
      loadData();
    } catch (err) {
      alert(`Failed to log waste: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Chemical Dispensations & Hazardous Waste Manifests
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chain of custody tracking for chemical consumption and regulatory hazardous waste accumulation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActiveTab('dispensations')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'dispensations' ? 'bg-cyan-500/20 text-cyan-300 font-medium' : 'text-slate-400'
              }`}
            >
              Dispensations ({dispensations.length})
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-3 py-1.5 rounded-lg transition ${
                activeTab === 'waste' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400'
              }`}
            >
              Hazardous Waste ({wasteLogs.length})
            </button>
          </div>

          {activeTab === 'waste' && (
            <button
              onClick={() => setShowWasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              Log Waste Container
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {activeTab === 'dispensations' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Chemical Reagent</th>
                  <th className="py-3 px-4">Dispensed Qty</th>
                  <th className="py-3 px-4">Experiment & Purpose</th>
                  <th className="py-3 px-4">Researcher & Witness</th>
                  <th className="py-3 px-4 text-right">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {dispensations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(d.dispensed_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      <div>{d.chemical_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Lot Barcode: {d.barcode_qr}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      -{d.dispensed_amount} {d.unit}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs">
                      <div className="font-medium text-slate-200">{d.experiment_name}</div>
                      <div className="text-[11px] text-slate-400">{d.course_or_project}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium">{d.user_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">Witness: {d.witness_name || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-300">
                      {d.remaining_quantity_after} {d.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="py-3 px-4">Container ID & Code</th>
                  <th className="py-3 px-4">Waste Classification</th>
                  <th className="py-3 px-4">Accumulated Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Logged By</th>
                  <th className="py-3 px-4 text-right">Manifest & Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {wasteLogs.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono">
                      <div className="font-bold text-amber-300">{w.container_id}</div>
                      <div className="text-[10px] text-slate-400">{w.waste_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-200 font-medium">
                      {w.waste_description}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                      {w.quantity} {w.unit}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                        w.status === 'manifested' ? 'bg-cyan-500/20 text-cyan-400' :
                        w.status === 'disposed' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {w.logged_by_name}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-mono text-[11px]">
                      {w.manifest_number || 'Accumulation In Progress'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Waste Modal */}
      {showWasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-amber-400" />
              Log Hazardous Waste Accumulation
            </h3>

            <form onSubmit={handleCreateWaste} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Waste Code</label>
                <select
                  value={newWaste.waste_code}
                  onChange={(e) => setNewWaste({ ...newWaste, waste_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                >
                  <option value="HAZ-SOLV-ORG">HAZ-SOLV-ORG (Non-halogenated Organic Solvents)</option>
                  <option value="HAZ-ACID-INORG">HAZ-ACID-INORG (Inorganic Acid Solutions)</option>
                  <option value="HAZ-BASE-INORG">HAZ-BASE-INORG (Alkaline Caustic Effluent)</option>
                  <option value="HAZ-HEAVY-MET">HAZ-HEAVY-MET (Heavy Metals Aqueous Waste)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Waste Description</label>
                <input
                  type="text"
                  value={newWaste.waste_description}
                  onChange={(e) => setNewWaste({ ...newWaste, waste_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Quantity (Liters / kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newWaste.quantity}
                    onChange={(e) => setNewWaste({ ...newWaste, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Container ID Tag</label>
                  <input
                    type="text"
                    value={newWaste.container_id}
                    onChange={(e) => setNewWaste({ ...newWaste, container_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowWasteModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold"
                >
                  Register Waste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
