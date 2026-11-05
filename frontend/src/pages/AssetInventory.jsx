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
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
            <Microscope className="w-6 h-6 text-[#13b5ea]" />
            Pharmaceutical & Research Laboratory Equipment
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Precision instrumentation lifecycle, check-out/return custody, and ISO/IEC 17025 metrology calibration
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Instrument, Tag (e.g. AST-001), Model..."
            className="w-full pl-10 pr-4 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#13b5ea] focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-[#13b5ea]"
          >
            <option value="">All Instrument Types</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-md bg-slate-50 border border-slate-300 text-xs text-slate-700 focus:outline-none focus:border-[#13b5ea]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assets.map((a) => {
          const isDue = a.is_calibration_due || a.status === 'calibration_due';
          const isInUse = a.status === 'in_use';

          return (
            <div
              key={a.id}
              className="clean-card rounded-2xl p-6 flex flex-col justify-between group"
            >
              <div>
                {/* Header Strip */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                    {a.asset_tag}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                    isInUse ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                    isDue ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse' :
                    a.status === 'under_maintenance' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isInUse ? '● In Use' : isDue ? '● Calibration Due' : a.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-[#0b3c68] text-base leading-snug group-hover:text-[#13b5ea] transition">
                  {a.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  {a.manufacturer} · {a.model_number || 'Model Standard'}
                </p>

                {/* Live Checkout Status Banner if in use */}
                {isInUse && a.current_borrow && (
                  <div className="mt-3 p-3 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900">
                    <div className="font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      Active Checkout by {a.current_borrow.user_name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                      Purpose: {a.current_borrow.purpose}
                    </div>
                  </div>
                )}

                {/* Calibration details */}
                <div className="mt-3 space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-slate-500">
                    <span>Last Calibration:</span>
                    <span className="text-slate-800 font-mono font-semibold">{a.last_calibration_date || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Next Due Date:</span>
                    <span className={`font-mono font-bold ${isDue ? 'text-rose-600' : 'text-slate-800'}`}>
                      {a.next_calibration_due || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Assigned Facility:</span>
                    <span className="text-slate-800 font-medium">{a.lab_name}</span>
                  </div>
                </div>

                {/* Operating SOP */}
                {a.operating_instructions && (
                  <p className="text-xs text-slate-500 italic line-clamp-2 mt-3 leading-relaxed">
                    SOP: "{a.operating_instructions}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
                  className="p-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                  title="Generate & Print Asset QR Label"
                >
                  <QrCode className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveCalibrateAsset(a)}
                    className="px-3.5 py-1.5 rounded-md bg-white hover:bg-amber-50 text-amber-700 border border-amber-300 text-xs font-bold uppercase tracking-wider transition"
                  >
                    CALIBRATE
                  </button>

                  <button
                    onClick={() => setActiveBorrowAsset(a)}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition ${
                      isInUse
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-[#13b5ea] hover:bg-[#0da1d2] text-white'
                    }`}
                  >
                    {isInUse ? 'RETURN ASSET' : 'CHECK-OUT'}
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
