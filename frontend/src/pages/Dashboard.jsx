import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Microscope,
  AlertTriangle,
  Clock,
  ShieldCheck,
  TrendingUp,
  Droplets,
  CalendarCheck,
  ArrowRight,
  ExternalLink,
  FileText,
  QrCode,
  Layers,
  Sparkles,
  Shield,
  Wrench,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import NFPA704Diamond from '../components/NFPA704Diamond';
import GHSPictogram from '../components/GHSPictogram';
import DispenseModal from '../components/DispenseModal';
import QRModal from '../components/QRModal';
import heroImg from '../assets/chemical_hero.jpg';

const HERO_SLIDES = [
  {
    title: "Pure Hyaluronic Acid Powder",
    highlight: "Pharmaceutical & Research Grade Reagents",
    description: "PES University Laboratory Division / Chemical Inventory Platform offers high, medium, low molecular weight, and oligomeric hyaluronic acid powder, suitable for analytical chemistry, drug carriers, and academic laboratory research inventory.",
    primaryBtn: "Our Products",
    secondaryBtn: "Catalog"
  },
  {
    title: "Intelligent Laboratory Asset & Chemical Tracker",
    highlight: "OSHA & GHS Co-Location Safety Engine",
    description: "Automated real-time segregation matrix preventing dangerous chemical co-locations (oxidizers + flammables detonation prevention), volumetric dispensation tracking, and ISO/IEC 17025 equipment calibration.",
    primaryBtn: "Explore Safety Engine",
    secondaryBtn: "View Cabinets"
  }
];

const SUB_TABS = [
  { id: 'sodium_hyaluronate', label: 'Sodium Hyaluronate' },
  { id: 'dihydromyricetin', label: 'Dihydromyricetin' },
  { id: 'chondroitin_sulfate', label: 'Chondroitin Sulfate' },
  { id: 'ferulic_acid', label: 'Ferulic Acid' }
];

export default function Dashboard({ setActiveTab, onOpenAI }) {
  const { currentUser, switchToSwaroop, switchToKaushal, isAdmin, isLabManager } = useAuth();
  const [data, setData] = useState(null);
  const [chemicals, setChemicals] = useState([]);
  const [assets, setAssets] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState('sodium_hyaluronate');
  const [activeDispenseBatch, setActiveDispenseBatch] = useState(null);
  const [activeQRItem, setActiveQRItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getChemicals(),
      api.getAssets()
    ])
      .then(([dashRes, chemRes, assetRes]) => {
        setData(dashRes);
        setChemicals(chemRes);
        setAssets(assetRes);
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#13b5ea] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-mono">Loading laboratory chemicals & telemetry...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { summary, hazard_distribution, recent_dispensations, recent_audits } = data;
  const slide = HERO_SLIDES[currentSlide];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* =========================================================================
          RBAC ACTIVE CLEARANCE & ROLE BANNER
          ========================================================================= */}
      <div className={`p-4 rounded-2xl border transition-all shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
        isAdmin
          ? 'bg-rose-50/70 border-rose-200 text-slate-800'
          : 'bg-emerald-50/70 border-emerald-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl text-white shadow-xs ${isAdmin ? 'bg-rose-600' : 'bg-emerald-600'}`}>
            {isAdmin ? <Shield className="w-5 h-5" /> : <Wrench className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-[#0b3c68] text-sm">{currentUser.name}</span>
              <span className="text-slate-500 font-mono text-xs">({currentUser.srn_or_emp_id})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isAdmin ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
              }`}>
                {currentUser.role_name}
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">· {currentUser.clearance_level}</span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'Full administrative control over all 14 relational tables, schema triggers, storage topology, and regulatory audit trail.'
                : 'Operational authority over ISO/IEC 17025 metrology calibrations, chemical lot intake, dispensation witnessing, and KSPCB waste manifests.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          {isAdmin ? (
            <button
              onClick={switchToKaushal}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5" />
              Switch to Kaushal (Lab Mgr)
            </button>
          ) : (
            <button
              onClick={switchToSwaroop}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
            >
              <Shield className="w-3.5 h-3.5" />
              Switch to Swaroop (Admin)
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          HERO BANNER
          ========================================================================= */}
      <div className="relative w-full rounded-[32px] overflow-hidden shadow-xl border border-slate-200 bg-slate-900 min-h-[380px] sm:min-h-[420px] flex flex-col justify-between">
        {/* Background Image: Molecular Droplets / Bubbles */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${heroImg})` }}
        >
          {/* Subtle gradient overlay to guarantee text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-900/40 to-transparent"></div>
        </div>

        {/* Carousel Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg z-20"
          title="Previous Banner"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition shadow-lg z-20"
          title="Next Banner"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Hero Content Container */}
        <div className="relative z-10 p-8 sm:p-14 max-w-2xl text-white space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-[#13b5ea]/30 text-cyan-200 text-xs font-semibold backdrop-blur-md border border-[#13b5ea]/40">
            {slide.highlight}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
            {slide.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-xl font-normal drop-shadow-sm">
            {slide.description}
          </p>

          {/* Action Buttons inside Hero */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('chemicals')}
              className="px-6 py-2.5 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition transform active:scale-95"
            >
              {slide.primaryBtn}
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className="px-6 py-2.5 rounded-md bg-white/25 hover:bg-white/35 text-white font-bold text-xs uppercase tracking-wider backdrop-blur-md border border-white/40 transition"
            >
              {slide.secondaryBtn}
            </button>
          </div>
        </div>

        {/* =========================================================================
            HORIZONTAL SUB-TABS (Embedded seamlessly on bottom border of Hero)
            ========================================================================= */}
        <div className="relative z-10 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-between px-4 sm:px-8 py-0 overflow-x-auto scrollbar-none shadow-sm">
          <div className="flex items-center text-xs font-semibold whitespace-nowrap">
            {SUB_TABS.map((tab) => {
              const isActive = activeSubTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`py-3.5 px-4 sm:px-6 transition border-b-2 text-xs font-medium ${
                    isActive
                      ? 'border-[#13b5ea] text-[#13b5ea] font-bold bg-[#13b5ea]/5'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setActiveTab('chemicals')}
            className="text-xs font-bold text-[#13b5ea] hover:underline flex items-center gap-1 shrink-0 py-3 px-3"
          >
            View All &gt;&gt;
          </button>
        </div>
      </div>

      {/* =========================================================================
          SECTION TITLE: Bulk Chemical Catalog & High-Precision Laboratory Inventory
          ========================================================================= */}
      <div className="text-center pt-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
          Bulk Pure Hyaluronic Acid & Research Chemical Catalog
        </h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xl mx-auto">
          Pharmaceutical & analytical research purity reagents certified for PES University academic laboratories and research centers.
        </p>
      </div>

      {/* =========================================================================
          GRID OF CHEMICAL PRODUCTS (Clean Card Layout)
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {chemicals.slice(0, 8).map((c) => (
          <div
            key={c.id}
            className="clean-card rounded-2xl overflow-hidden flex flex-col justify-between group"
          >
            {/* Chemical Header Badge */}
            <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="font-mono text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                CAS {c.cas_number}
              </span>
              <span className="text-[10px] font-bold text-[#13b5ea] uppercase">
                {c.physical_state}
              </span>
            </div>

            {/* Product Body */}
            <div className="p-5 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-sm text-[#0b3c68] group-hover:text-[#13b5ea] transition leading-snug">
                  {c.name}
                </h3>
              </div>

              <div className="text-xs text-slate-500 font-mono">
                Formula: <span className="text-slate-700 font-semibold">{c.formula || 'C3H6O'}</span> · MW: {c.molecular_weight || '58.08'}
              </div>

              {/* NFPA 704 and GHS Icons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  {c.ghs_pictograms && c.ghs_pictograms.length > 0 ? (
                    c.ghs_pictograms.slice(0, 2).map((p, i) => (
                      <GHSPictogram key={i} type={p} size="sm" />
                    ))
                  ) : (
                    <GHSPictogram type="flame" size="sm" />
                  )}
                  <span className="text-[11px] text-slate-600 font-medium truncate max-w-[100px]">
                    {c.hazard_class_name}
                  </span>
                </div>

                <div className="scale-75 origin-right">
                  <NFPA704Diamond
                    health={c.nfpa.health}
                    flammability={c.nfpa.flammability}
                    instability={c.nfpa.instability}
                    special={c.nfpa.special}
                    size={38}
                  />
                </div>
              </div>

              {/* Stock Gauge */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1">
                  <span>Available Inventory</span>
                  <span className="font-mono font-bold text-[#0b3c68]">
                    {c.total_stock} {c.unit}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      c.is_low_stock ? 'bg-amber-400' : 'bg-[#13b5ea]'
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(15, (c.total_stock / (c.min_threshold_qty * 2)) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Product Card Actions */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  api.getBatches(`chemical_id=${c.id}`).then((bList) => {
                    if (bList.length > 0) setActiveDispenseBatch(bList[0]);
                    else alert('No active bottles currently in stock.');
                  });
                }}
                className="w-full py-1.5 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-center transition shadow-xs text-[11px] uppercase tracking-wider"
              >
                DISPENSE
              </button>

              <button
                onClick={onOpenAI}
                className="w-full py-1.5 rounded-md bg-white hover:bg-slate-100 text-[#00a8cc] border border-[#00a8cc] font-bold text-center transition text-[11px] uppercase tracking-wider"
              >
                VIEW SDS
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* =========================================================================
          FACILITY TELEMETRY & OSHA/GHS COMPLIANCE METRIC STRIP
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Reagents */}
        <div
          onClick={() => setActiveTab('chemicals')}
          className="cursor-pointer clean-card p-5 rounded-2xl flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Compounds</div>
            <div className="text-2xl font-black text-[#0b3c68] font-mono mt-1">{summary.total_chemicals}</div>
            <div className="text-[11px] text-[#13b5ea] mt-0.5 font-medium">{summary.total_batches} Active Containers</div>
          </div>
          <div className="p-3 rounded-xl bg-cyan-50 text-[#13b5ea]">
            <FlaskConical className="w-6 h-6" />
          </div>
        </div>

        {/* Compliance Grade */}
        <div
          onClick={() => setActiveTab('compatibility')}
          className="cursor-pointer clean-card p-5 rounded-2xl flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">OSHA / GHS Readiness</div>
            <div className="text-2xl font-black text-emerald-600 font-mono mt-1">{summary.compliance_score}%</div>
            <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">Grade {summary.compliance_grade} (Audit Ready)</div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Instruments In Use */}
        <div
          onClick={() => setActiveTab('assets')}
          className="cursor-pointer clean-card p-5 rounded-2xl flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lab Instruments</div>
            <div className="text-2xl font-black text-[#0b3c68] font-mono mt-1">{summary.total_assets}</div>
            <div className="text-[11px] text-indigo-600 mt-0.5 font-medium">{summary.active_borrows_count} Instruments in Use</div>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Microscope className="w-6 h-6" />
          </div>
        </div>

        {/* Calibration Attention */}
        <div
          onClick={() => setActiveTab('maintenance')}
          className="cursor-pointer clean-card p-5 rounded-2xl flex items-center justify-between"
        >
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calibration Due</div>
            <div className="text-2xl font-black text-amber-500 font-mono mt-1">{summary.calibration_due_count}</div>
            <div className="text-[11px] text-amber-600 mt-0.5 font-medium">ISO/IEC 17025 Traceable</div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-500">
            <CalendarCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          RECENT CONSUMPTIONS & AUDIT LOGS TABLE
          ========================================================================= */}
      <div className="clean-card rounded-2xl p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-[#0b3c68] uppercase tracking-wider">
              Recent Chemical Dispensations & Custody Logs
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time database transaction log for academic practicals</p>
          </div>
          <button
            onClick={() => setActiveTab('dispensations')}
            className="text-xs font-bold text-[#13b5ea] hover:underline"
          >
            View All Logs &gt;&gt;
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Chemical Compound</th>
                <th className="pb-2">Experiment Protocol</th>
                <th className="pb-2">Researcher / Student</th>
                <th className="pb-2 text-right">Dispensed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recent_dispensations.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 font-mono text-slate-400 text-[11px]">
                    {new Date(d.dispensed_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 font-bold text-[#0b3c68]">{d.chemical_name}</td>
                  <td className="py-2.5 text-slate-500">{d.experiment_name}</td>
                  <td className="py-2.5 font-medium">{d.user_name}</td>
                  <td className="py-2.5 text-right font-mono font-bold text-rose-500">
                    -{d.dispensed_amount} {d.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Active Modals */}
      {activeDispenseBatch && (
        <DispenseModal
          batch={activeDispenseBatch}
          onClose={() => setActiveDispenseBatch(null)}
          onSuccess={() => loadAllData()}
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
