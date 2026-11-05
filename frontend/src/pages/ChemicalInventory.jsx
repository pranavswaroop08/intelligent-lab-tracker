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
  X,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import NFPA704Diamond from '../components/NFPA704Diamond';
import GHSPictogram from '../components/GHSPictogram';
import DispenseModal from '../components/DispenseModal';
import QRModal from '../components/QRModal';

export default function ChemicalInventory({ onOpenAI, initialSearch }) {
  const [chemicals, setChemicals] = useState([]);
  const [batches, setBatches] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
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
    if (initialSearch !== undefined) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

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
    <div className="space-y-6 font-sans">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
            <FlaskConical className="w-6 h-6 text-[#13b5ea]" />
            Chemical Products & Reagent Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Certified chemical inventory with physical batch lot tracking, GHS pictograms, and NFPA 704 fire diamonds
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wider shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Chemical Compound
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Compound, CAS (e.g. 67-64-1), Formula..."
            className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#13b5ea] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedHazard}
            onChange={(e) => setSelectedHazard(e.target.value)}
            className="px-3 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-[#13b5ea]"
          >
            <option value="">All Regulatory Hazard Classes</option>
            {hazards.map((h) => (
              <option key={h.id} value={h.code}>{h.name}</option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none bg-slate-50 px-3 py-2 rounded-md border border-slate-300">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-slate-300 text-[#13b5ea] focus:ring-0"
            />
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Low Stock Reagents Only</span>
          </label>
        </div>
      </div>

      {/* Main Chemical Catalog Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">Compound Name & Formula</th>
                <th className="py-3.5 px-5">CAS Registry</th>
                <th className="py-3.5 px-5">Hazard Class & GHS</th>
                <th className="py-3.5 px-5 text-center">NFPA 704</th>
                <th className="py-3.5 px-5">Available Stock</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {chemicals.map((c) => {
                const chemBatches = batches.filter((b) => b.chemical_id === c.id);
                const isSelected = selectedChem?.id === c.id;

                return (
                  <React.Fragment key={c.id}>
                    <tr
                      onClick={() => setSelectedChem(isSelected ? null : c)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition ${
                        isSelected ? 'bg-cyan-50/50 border-l-4 border-l-[#13b5ea]' : ''
                      }`}
                    >
                      <td className="py-4 px-5">
                        <div className="font-bold text-sm text-[#0b3c68] flex items-center gap-2">
                          <span>{c.name}</span>
                          {c.is_low_stock && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-700 border border-amber-300">
                              Low Stock
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">
                          {c.formula || 'N/A'} · MW: {c.molecular_weight || '—'} g/mol
                        </div>
                      </td>

                      <td className="py-4 px-5 font-mono text-[#00a8cc] font-bold">
                        {c.cas_number}
                      </td>

                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2">
                          {c.ghs_pictograms && c.ghs_pictograms.length > 0 && (
                            <div className="flex -space-x-1">
                              {c.ghs_pictograms.slice(0, 2).map((p, i) => (
                                <GHSPictogram key={i} type={p} size="sm" />
                              ))}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{c.hazard_class_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{c.ghs_signal_word}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-center">
                        <div className="inline-block scale-90">
                          <NFPA704Diamond
                            health={c.nfpa.health}
                            flammability={c.nfpa.flammability}
                            instability={c.nfpa.instability}
                            special={c.nfpa.special}
                            size={42}
                          />
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          {c.total_stock} {c.unit}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Reorder Threshold: {c.min_threshold_qty} {c.unit} ({chemBatches.length} bottles)
                        </div>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              const targetBatch = chemBatches[0];
                              if (targetBatch) setActiveDispenseBatch(targetBatch);
                              else alert('No active bottles in stock to dispense.');
                            }}
                            className="px-3 py-1.5 rounded bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wide transition shadow-xs"
                            title="Dispense from batch"
                          >
                            DISPENSE
                          </button>
                          <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-[#13b5ea]' : ''}`} />
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Physical Batch Containers Tray */}
                    {isSelected && (
                      <tr className="bg-slate-50 border-y border-slate-200">
                        <td colSpan={6} className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                              <h4 className="font-bold text-xs text-[#0b3c68] uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#13b5ea]"></span>
                                Physical Inventory Bottles in Storage ({chemBatches.length} Units)
                              </h4>
                              <div className="text-xs text-slate-500">
                                Storage Spec: <span className="text-slate-800 font-semibold">{c.storage_requirements}</span>
                              </div>
                            </div>

                            {chemBatches.length === 0 ? (
                              <div className="text-xs text-slate-500 italic py-2">
                                No physical bottles currently placed in any laboratory cabinet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {chemBatches.map((b) => (
                                  <div
                                    key={b.id}
                                    className="p-4 rounded-xl bg-white border border-slate-200 text-xs space-y-2 hover:border-[#13b5ea] transition shadow-xs"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-bold text-[#0b3c68] font-mono text-sm">
                                          {b.barcode_qr}
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          Lot: {b.batch_lot_number} · {b.supplier}
                                        </div>
                                      </div>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                        b.is_expired ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                                        b.status === 'low' ? 'bg-amber-100 text-amber-700' :
                                        'bg-emerald-100 text-emerald-700'
                                      }`}>
                                        {b.status}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-y border-slate-100">
                                      <div>
                                        <span className="text-slate-400">Cabinet:</span>{' '}
                                        <span className="text-slate-700 font-mono font-semibold">{b.location_code} (Shelf {b.shelf_number})</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">Expires:</span>{' '}
                                        <span className={`font-mono font-bold ${b.is_expired ? 'text-rose-600' : 'text-slate-700'}`}>
                                          {b.expiry_date}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-1">
                                      <div className="font-mono font-bold text-[#0b3c68] text-sm">
                                        {b.current_quantity} / {b.initial_quantity} {b.unit}
                                      </div>
                                      <div className="flex items-center gap-2">
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
                                          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                                          title="View & Print QR Code"
                                        >
                                          <QrCode className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => setActiveDispenseBatch(b)}
                                          className="px-3 py-1 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-[11px] uppercase tracking-wider transition"
                                        >
                                          DISPENSE
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-base text-[#0b3c68] flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#13b5ea]" />
                Register New Chemical Compound
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1.5 rounded-md text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChemical} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compound Name *</label>
                  <input
                    type="text"
                    value={newChem.name}
                    onChange={(e) => setNewChem({ ...newChem, name: e.target.value })}
                    placeholder="e.g. Dichloromethane (HPLC)"
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:border-[#13b5ea]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CAS Registry Number *</label>
                  <input
                    type="text"
                    value={newChem.cas_number}
                    onChange={(e) => setNewChem({ ...newChem, cas_number: e.target.value })}
                    placeholder="e.g. 75-09-2"
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:border-[#13b5ea]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chemical Formula</label>
                  <input
                    type="text"
                    value={newChem.formula}
                    onChange={(e) => setNewChem({ ...newChem, formula: e.target.value })}
                    placeholder="e.g. CH2Cl2"
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:border-[#13b5ea]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Regulatory Hazard Class</label>
                  <select
                    value={newChem.hazard_class_id}
                    onChange={(e) => setNewChem({ ...newChem, hazard_class_id: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:border-[#13b5ea]"
                  >
                    {hazards.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NFPA 704 Ratings Grid */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 mb-2">NFPA 704 Standard Fire Diamond Ratings</div>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-blue-600 block font-mono font-bold">Health (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_health}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_health: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-red-600 block font-mono font-bold">Flammability (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_flammability}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_flammability: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-amber-600 block font-mono font-bold">Instability (0-4)</label>
                    <input
                      type="number"
                      min="0"
                      max="4"
                      value={newChem.nfpa_instability}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_instability: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-600 block font-mono font-bold">Special (OX, W)</label>
                    <input
                      type="text"
                      maxLength={4}
                      value={newChem.nfpa_special}
                      onChange={(e) => setNewChem({ ...newChem, nfpa_special: e.target.value.toUpperCase() })}
                      placeholder="e.g. OX"
                      className="w-full px-2 py-1.5 rounded-md bg-white border border-slate-300 text-xs text-center font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Instructions</label>
                <textarea
                  rows={2}
                  value={newChem.storage_requirements}
                  onChange={(e) => setNewChem({ ...newChem, storage_requirements: e.target.value })}
                  className="w-full px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:border-[#13b5ea]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  SAVE COMPOUND
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
          onSuccess={() => loadData()}
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
