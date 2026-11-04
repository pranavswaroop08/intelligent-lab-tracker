import React, { useState, useEffect } from 'react';
import {
  Microscope,
  Search,
  Filter,
  Plus,
  QrCode,
  Clock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  CalendarCheck
} from 'lucide-react';
import { api } from '../services/api';
import BorrowModal from '../components/BorrowModal';
import CalibrateModal from '../components/CalibrateModal';
import QRModal from '../components/QRModal';

export default function AssetInventory({ onOpenAI }) {
  const [assets, setAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [activeBorrowAsset, setActiveBorrowAsset] = useState(null);
  const [activeCalibrateAsset, setActiveCalibrateAsset] = useState(null);
  const [activeQRAsset, setActiveQRAsset] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, [searchQuery, selectedCategory, selectedStatus]);

  const loadAssets = () => {
    setLoading(true);
    let params = [];
    if (searchQuery) params.push(`q=${encodeURIComponent(searchQuery)}`);
    if (selectedCategory) params.push(`category=${encodeURIComponent(selectedCategory)}`);
    if (selectedStatus) params.push(`status=${encodeURIComponent(selectedStatus)}`);

    api.getAssets(params.join('&'))
      .then((res) => setAssets(res))
      .catch((err) => console.error('Failed to load assets:', err))
      .finally(() => setLoading(false));
  };

  const categories = [
    { id: 'spectrophotometer', label: 'Spectrophotometer' },
    { id: 'centrifuge', label: 'Centrifuge' },
    { id: 'balance', label: 'Precision Balance' },
    { id: 'analyzer', label: 'Rotary Evaporator / Analyzer' },
    { id: 'microscope', label: 'Biological Microscope' },
    { id: 'autoclave', label: 'Autoclave / Sterilizer' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Microscope className="w-5 h-5 text-indigo-400" />
            Laboratory Instrumentation & Assets
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Equipment Check-in/Check-out, Runtime Tracking & Metrology Calibration Lifecycle
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Instrument, Tag (e.g. AST-001), Model..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-100 focus:outline-none focus:border-indigo-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Instrument Types</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
          >
            <option value="">All Operational Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use / Borrowed</option>
            <option value="calibration_due">Calibration Due</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {assets.map((a) => {
          const isDue = a.is_calibration_due || a.status === 'calibration_due';
          const isInUse = a.status === 'in_use';

          return (
            <div
              key={a.id}
              className="glass-card rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 shadow-lg group"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {a.asset_tag}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium ${
                    isInUse ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                    isDue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    a.status === 'under_maintenance' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isInUse ? '● In Use' : isDue ? '● Calibration Due' : a.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-100 text-sm leading-snug group-hover:text-cyan-300 transition">
                  {a.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  {a.manufacturer} · {a.model_number || 'Model Standard'}
                </p>

                {/* Live Checkout Status Banner if in use */}
                {isInUse && a.current_borrow && (
                  <div className="mt-3 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200">
                    <div className="font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      Active Checkout by {a.current_borrow.user_name}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                      Purpose: {a.current_borrow.purpose}
                    </div>
                  </div>
                )}

                {/* Calibration details */}
                <div className="mt-3 space-y-1 text-[11px] bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>Last Calibration:</span>
                    <span className="text-slate-300 font-mono">{a.last_calibration_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Next Due Date:</span>
                    <span className={`font-mono ${isDue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {a.next_calibration_due || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Lab Room:</span>
                    <span className="text-slate-300">{a.lab_name}</span>
                  </div>
                </div>

                {/* Operating SOP Snippet */}
                {a.operating_instructions && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-2 mt-3 leading-relaxed">
                    SOP: "{a.operating_instructions}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveQRAsset({
                    title: a.name,
                    subtitle: `Tag: ${a.asset_tag} · ${a.manufacturer}`,
                    token: a.qr_code_token || `QR-${a.asset_tag}`,
                    details: {
                      instrument: a.name,
                      asset_tag: a.asset_tag,
                      manufacturer: a.manufacturer,
                      status: a.status,
                      calibration_due: a.next_calibration_due
                    }
                  })}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Generate & Print Asset QR Label"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCalibrateAsset(a)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium transition"
                  >
                    Calibrate
                  </button>

                  <button
                    onClick={() => setActiveBorrowAsset(a)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md transition ${
                      isInUse
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
                    }`}
                  >
                    {isInUse ? 'Return Asset' : 'Check-out'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Modals */}
      {activeBorrowAsset && (
        <BorrowModal
          asset={activeBorrowAsset}
          onClose={() => setActiveBorrowAsset(null)}
          onSuccess={() => loadAssets()}
        />
      )}

      {activeCalibrateAsset && (
        <CalibrateModal
          asset={activeCalibrateAsset}
          onClose={() => setActiveCalibrateAsset(null)}
          onSuccess={() => loadAssets()}
        />
      )}

      {activeQRAsset && (
        <QRModal
          title={activeQRAsset.title}
          subtitle={activeQRAsset.subtitle}
          token={activeQRAsset.token}
          details={activeQRAsset.details}
          onClose={() => setActiveQRAsset(null)}
        />
      )}
    </div>
  );
}
