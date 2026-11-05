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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
            <Droplets className="w-6 h-6 text-[#13b5ea]" />
            Volumetric Dispensations & Hazardous Waste Manifests
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chain of custody tracking for chemical consumption and regulatory hazardous waste accumulation
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('dispensations')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${
                activeTab === 'dispensations' ? 'bg-[#13b5ea] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispensations ({dispensations.length})
            </button>
            <button
              onClick={() => setActiveTab('waste')}
              className={`px-3 py-1.5 rounded-md font-bold transition ${
                activeTab === 'waste' ? 'bg-[#13b5ea] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hazardous Waste ({wasteLogs.length})
            </button>
          </div>

          {activeTab === 'waste' && (
            <button
              onClick={() => setShowWasteModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm uppercase tracking-wider"
            >
              <Plus className="w-4 h-4" />
              LOG CONTAINER
            </button>
          )}
        </div>
      </div>

      {/* Main Table View */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'dispensations' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Chemical Compound</th>
                  <th className="py-3.5 px-5">Dispensed Qty</th>
                  <th className="py-3.5 px-5">Experiment & Purpose</th>
                  <th className="py-3.5 px-5">Researcher & Witness</th>
                  <th className="py-3.5 px-5 text-right">Remaining Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {dispensations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(d.dispensed_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-5 font-bold text-[#0b3c68]">
                      <div>{d.chemical_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Lot: {d.barcode_qr}</div>
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-rose-600 text-sm">
                      -{d.dispensed_amount} {d.unit}
                    </td>
                    <td className="py-3.5 px-5 text-slate-700 max-w-xs">
                      <div className="font-bold text-slate-800">{d.experiment_name}</div>
                      <div className="text-[11px] text-slate-500">{d.course_or_project}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      <div className="font-semibold">{d.user_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Witness: {d.witness_name || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold text-[#00a8cc] text-sm">
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
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3.5 px-5">Container ID & Code</th>
                  <th className="py-3.5 px-5">Waste Classification</th>
                  <th className="py-3.5 px-5">Accumulated Quantity</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Logged By</th>
                  <th className="py-3.5 px-5 text-right">Manifest & Vendor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {wasteLogs.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-5 font-mono">
                      <div className="font-bold text-[#0b3c68]">{w.container_id}</div>
                      <div className="text-[10px] text-slate-500">{w.waste_code}</div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-800 font-semibold">
                      {w.waste_description}
                    </td>
                    <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                      {w.quantity} {w.unit}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        w.status === 'manifested' ? 'bg-cyan-100 text-cyan-800' :
                        w.status === 'disposed' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-700">
                      {w.logged_by_name}
                    </td>
                    <td className="py-3.5 px-5 text-right text-slate-500 font-mono text-[11px]">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="font-bold text-base text-[#0b3c68] flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-amber-500" />
              Log Hazardous Waste Accumulation
            </h3>

            <form onSubmit={handleCreateWaste} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Waste Code</label>
                <select
                  value={newWaste.waste_code}
                  onChange={(e) => setNewWaste({ ...newWaste, waste_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800"
                >
                  <option value="HAZ-SOLV-ORG">HAZ-SOLV-ORG (Non-halogenated Organic Solvents)</option>
                  <option value="HAZ-ACID-INORG">HAZ-ACID-INORG (Inorganic Acid Solutions)</option>
                  <option value="HAZ-BASE-INORG">HAZ-BASE-INORG (Alkaline Caustic Effluent)</option>
                  <option value="HAZ-HEAVY-MET">HAZ-HEAVY-MET (Heavy Metals Aqueous Waste)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Waste Description</label>
                <input
                  type="text"
                  value={newWaste.waste_description}
                  onChange={(e) => setNewWaste({ ...newWaste, waste_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantity (Liters / kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={newWaste.quantity}
                    onChange={(e) => setNewWaste({ ...newWaste, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Container ID Tag</label>
                  <input
                    type="text"
                    value={newWaste.container_id}
                    onChange={(e) => setNewWaste({ ...newWaste, container_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWasteModal(false)}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold uppercase tracking-wider"
                >
                  REGISTER CONTAINER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
