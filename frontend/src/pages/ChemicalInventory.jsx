import React, { useState, useEffect } from 'react';
import {
  FlaskConical,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  QrCode,
  Droplets,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../services/api';
import NFPA704Diamond from '../components/NFPA704Diamond';
import GHSPictogram from '../components/GHSPictogram';
import DispenseModal from '../components/DispenseModal';
import QRModal from '../components/QRModal';

export default function ChemicalInventory({ onOpenAI }) {
  const [chemicals, setChemicals] = useState([]);
  const [batches, setBatches] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHazard, setSelectedHazard] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedChem, setSelectedChem] = useState(null);
  const [activeDispenseBatch, setActiveDispenseBatch] = useState(null);
  const [activeQRItem, setActiveQRItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state for adding new chemical
  const [newChem, setNewChem] = useState({
    name: '',
    cas_number: '',
    formula: '',
    physical_state: 'liquid',
    hazard_class_id: 1,
    nfpa_health: 1,
    nfpa_flammability: 2,
    nfpa_instability: 0,
    nfpa_special: '',
    min_threshold_qty: 1000,
    unit: 'ml',
    storage_requirements: 'Store in certified storage cabinet.'
  });

  useEffect(() => {
    loadData();
  }, [searchQuery, selectedHazard, lowStockOnly]);

  const loadData = () => {
    setLoading(true);
    let params = [];
    if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
    if (selectedHazard) params.push(`hazard=${encodeURIComponent(selectedHazard)}`);
    if (lowStockOnly) params.push(`low_stock=true`);

    Promise.all([
      api.getChemicals(params.join('&')),
      api.getBatches(),
      api.getHazards()
    ])
      .then(([chemRes, batchRes, hazardRes]) => {
        setChemicals(chemRes);
        setBatches(batchRes);
        setHazards(hazardRes);
      })
      .catch((err) => console.error('Failed to load chemicals:', err))
      .finally(() => setLoading(false));
  };

  const handleCreateChemical = async (e) => {
    e.preventDefault();
    try {
      await api.createChemical(newChem);
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert(`Failed to add chemical: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            Chemical Reagents & Storage Inventory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            OSHA & GHS HazCom Compliant Reagent Registry with Batch Lifecycle Tracking
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs shadow-lg shadow-cyan-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Chemical
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Chemical, CAS (e.g. 67-64-1), Formula..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedHazard}
            onChange={(e) => setSelectedHazard(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Hazard Classes</option>
            {hazards.map((h) => (
              <option key={h.id} value={h.code}>{h.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-slate-900 px-3 py-2 rounded-xl border border-slate-700/80">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-0"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low Stock Reagents Only</span>
          </label>
        </div>
      </div>

      {/* Chemical Registry Cards / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Chemical Compound & Formula</th>
                <th className="py-3 px-4">CAS Registry</th>
                <th className="py-3 px-4">Hazard Class & GHS</th>
                <th className="py-3 px-4 text-center">NFPA 704</th>
                <th className="py-3 px-4">Total Inventory</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {chemicals.map((c) => {
                const chemBatches = batches.filter((b) => b.chemical_id === c.id);
                const isSelected = selectedChem?.id === c.id;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => setSelectedChem(isSelected ? null : c)}
                      className={`hover:bg-slate-800/40 cursor-pointer transition ${
                        isSelected ? 'bg-slate-800/50 border-l-4 border-l-cyan-400' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.is_low_stock && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {c.formula || 'N/A'} · MW: {c.molecular_weight || '—'} g/mol
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-cyan-300 font-medium">
                        {c.cas_number}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {c.ghs_pictograms && c.ghs_pictograms.length > 0 && (
                            <div className="flex -space-x-1">
                              {c.ghs_pictograms.slice(0, 2).map((p, i) => (
                                <GHSPictogram key={i} type={p} size="sm" />
                              ))}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-200">{c.hazard_class_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{c.ghs_signal_word}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-block">
                          <NFPA704Diamond
                            health={c.nfpa.health}
                            flammability={c.nfpa.flammability}
                            instability={c.nfpa.instability}
                            special={c.nfpa.special}
                            size={44}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-200">
                          {c.total_stock} {c.unit}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Min threshold: {c.min_threshold_qty} {c.unit} ({chemBatches.length} bottles)
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              const targetBatch = chemBatches[0];
                              if (targetBatch) setActiveDispenseBatch(targetBatch);
                              else alert('No active batches in stock to dispense.');
                            }}
                            className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs transition"
                            title="Dispense from batch"
                          >
                            <Droplets className="w-4 h-4" />
                          </button>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Physical Batch Containers Tray */}
                    {isSelected && (
                      <tr className="bg-slate-950/80 border-y border-slate-800">
                        <td colSpan={6} className="p-5">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                                Physical Container Batches on Shelf ({chemBatches.length} Units)
                              </h4>
                              <div className="text-xs text-slate-400">
                                Storage Req: <span className="text-slate-200">{c.storage_requirements}</span>
                              </div>
                            </div>

                            {chemBatches.length === 0 ? (
                              <div className="text-xs text-slate-500 italic py-2">
                                No physical bottles currently placed in any laboratory cabinet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {chemBatches.map((b) => (
                                  <div
                                    key={b.id}
                                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-semibold text-slate-200 font-mono">
                                          {b.barcode_qr}
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                          Lot: {b.batch_lot_number} · {b.supplier}
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                                        b.is_expired ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                        b.status === 'low' ? 'bg-amber-500/20 text-amber-400' :
                                        'bg-emerald-500/10 text-emerald-400'
                                      }`}>
                                        {b.status}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] py-1 border-y border-slate-800/80">
                                      <div>
                                        <span className="text-slate-500">Location:</span>{' '}
                                        <span className="text-slate-300 font-mono">{b.location_code} (Shelf {b.shelf_number})</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500">Expires:</span>{' '}
                                        <span className={b.is_expired ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                                          {b.expiry_date}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <div className="font-mono font-bold text-cyan-300">
                                        {b.current_quantity} / {b.initial_quantity} {b.unit}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          onClick={() => setActiveQRItem({
                                            title: `${c.name} Container`,
                                            subtitle: `Lot: ${b.batch_lot_number} · Loc: ${b.location_code}`,
                                            token: b.barcode_qr,
                                            details: {
                                              chemical: c.name,
                                              cas_number: c.cas_number,
                                              location: b.location_code,
                                              shelf: b.shelf_number,
                                              expiry: b.expiry_date
                                            }
                                          })}
                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                          title="View & Print QR Code"
                                        >
                                          <QrCode className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setActiveDispenseBatch(b)}
                                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium text-[11px] border border-cyan-500/30 transition"
                                        >
                                          Dispense
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Chemical Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-cyan-400" />
                Register New Chemical Compound
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChemical} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Compound Name *</label>
                  <input
                    type="text"
                    value={newChem.name}
                    onChange={(e) => setNewChem({ ...newChem, name: e.target.value })}
                    placeholder="e.g. Dichloromethane (HPLC)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">CAS Registry Number *</label>
                  <input
                    type="text"
                    value={newChem.cas_number}
                    onChange={(e) => setNewChem({ ...newChem, cas_number: e.target.value })}
                    placeholder="e.g. 75-09-2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Chemical Formula</label>
                  <input
                    type="text"
                    value={newChem.formula}
                    onChange={(e) => setNewChem({ ...newChem, formula: e.target.value })}
                    placeholder="e.g. CH2Cl2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Regulatory Hazard Class</label>
                  <select
                    value={newChem.hazard_class_id}
                    onChange={(e) => setNewChem({ ...newChem, hazard_class_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400"
                  >
                    {hazards.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NFPA 704 Ratings Grid */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="text-xs font-semibold text-slate-300 mb-2">NFPA 704 Standard Ratings</div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-blue-400 block font-mono">Health (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_health}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_health: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-red-400 block font-mono">Flammability (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_flammability}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_flammability: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-yellow-400 block font-mono">Instability (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_instability}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_instability: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block font-mono">Special (OX, W)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newChem.nfpa_special}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_special: e.target.value.toUpperCase() })}
                      placeholder="e.g. OX"
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-center font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Storage Instructions</label>
                <textarea
                  rows={2}
                  value={newChem.storage_requirements}
                  onChange={(e) => setNewChem({ ...newChem, storage_requirements: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-xs shadow-md"
                >
                  Save Compound
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Modals */}
      {activeDispenseBatch && (
        <DispenseModal
          batch={activeDispenseBatch}
          onClose={() => setActiveDispenseBatch(null)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {activeQRItem && (
        <QRModal
          title={activeQRItem.title}
          subtitle={activeQRItem.subtitle}
          token={activeQRItem.token}
          details={activeQRItem.details}
          onClose={() => setActiveQRItem(null)}
        />
      )}
    </div>
  );
}
