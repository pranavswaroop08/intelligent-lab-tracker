import React from 'react';
import { X, Shield, Wrench, Check, UserCheck, ShieldCheck, Database, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleComparisonModal({ onClose }) {
  const { currentUser, switchToSwaroop, switchToKaushal } = useAuth();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs font-sans animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0b3c68] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#13b5ea] text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Role-Based Access Control (RBAC) Architecture</h3>
              <p className="text-xs text-slate-300">
                PES University DBMS Mini-Project · Team Credentials & Functional Separation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Quick Active Switch Banner */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Currently Logged In As:</div>
              <div className="text-sm font-extrabold text-[#0b3c68] flex items-center gap-2 mt-0.5">
                {currentUser.role_name === 'Admin' ? (
                  <ShieldCheck className="w-4 h-4 text-rose-600 inline" />
                ) : (
                  <Wrench className="w-4 h-4 text-emerald-600 inline" />
                )}
                {currentUser.name} ({currentUser.srn_or_emp_id})
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  currentUser.role_name === 'Admin' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {currentUser.role_name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  switchToSwaroop();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  currentUser.id === 1
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Swaroop (Admin)
              </button>

              <button
                onClick={() => {
                  switchToKaushal();
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 ${
                  currentUser.id === 2
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                Kaushal (Lab Mgr)
              </button>
            </div>
          </div>

          {/* Side by side comparison cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PRANAV SWAROOP S CARD */}
            <div className={`p-4 rounded-xl border-2 transition ${
              currentUser.id === 1
                ? 'bg-rose-50/40 border-rose-500 shadow-md'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                    ROLE 1: SYSTEM ADMIN
                  </span>
                  <h4 className="font-extrabold text-sm text-[#0b3c68] mt-1">Pranav Swaroop S</h4>
                  <p className="text-[11px] font-mono text-slate-500">SRN: PES2UG24CS365</p>
                </div>
                <div className="p-2.5 rounded-full bg-rose-100 text-rose-600">
                  <Shield className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-800">Key Responsibilities:</div>
                <ul className="space-y-1.5 text-slate-600 text-[11px]">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Full Database Administration:</strong> Direct control over all 14 relational tables, schema triggers, and indices.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Regulatory Audit Logs:</strong> Access to immutable `audit_logs` table and 1-click regulatory CSV compliance export.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Cabinet & Topology Setup:</strong> Configures physical safety cabinets, rooms, and storage temperature constraints.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Hazard Constraint Overrides:</strong> Authorized to override OSHA/EPA segregation alerts under emergency protocols.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>User & RBAC Management:</strong> Assigns roles, provisions credentials, and sets user active/suspended status.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* PRANAV KAUSHAL J CARD */}
            <div className={`p-4 rounded-xl border-2 transition ${
              currentUser.id === 2
                ? 'bg-emerald-50/40 border-emerald-500 shadow-md'
                : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    ROLE 2: LAB MANAGER
                  </span>
                  <h4 className="font-extrabold text-sm text-[#0b3c68] mt-1">Pranav Kaushal J</h4>
                  <p className="text-[11px] font-mono text-slate-500">SRN: PES2UG24CS363</p>
                </div>
                <div className="p-2.5 rounded-full bg-emerald-100 text-emerald-600">
                  <Wrench className="w-6 h-6" />
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="text-[11px] font-bold text-slate-800">Key Responsibilities:</div>
                <ul className="space-y-1.5 text-slate-600 text-[11px]">
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Metrology & Calibration:</strong> Issues ISO/IEC 17025 certificates and logs precision drift on analytical instruments.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Chemical Stock Intake & Expiry:</strong> Receives new lots from vendors (Merck, Sigma) and quarantines expired batches.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Dispensation Authorization:</strong> Witnesses and authorizes volumetric reagent withdrawals for students and researchers.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Asset Custody & Loans:</strong> Approves spectrophotometer and microcentrifuge borrows with runtime logging.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Hazardous Waste Manifests:</strong> Logs chemical waste accumulation and dispatches to KSPCB authorized incinerators.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Feature Matrix Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#0b3c68] text-white">
                <tr>
                  <th className="py-2.5 px-3 font-bold">Feature / Database Action</th>
                  <th className="py-2.5 px-3 font-bold text-center">Pranav Swaroop S (Admin)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Pranav Kaushal J (Lab Mgr)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Student / Researcher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                <tr>
                  <td className="py-2 px-3 font-medium text-slate-800">Log Instrument Calibration (ISO 17025)</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Allowed</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Primary Specialist</td>
                  <td className="py-2 px-3 text-center text-slate-400">Read-Only</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-slate-800">Add / Configure Storage Cabinets</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Primary Owner</td>
                  <td className="py-2 px-3 text-center text-amber-600 font-medium">Inspect Shelves</td>
                  <td className="py-2 px-3 text-center text-slate-400">Read-Only</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-slate-800">Regulatory Audit Logs & CSV Export</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Full Access + Export</td>
                  <td className="py-2 px-3 text-center text-blue-600 font-medium">Operational View</td>
                  <td className="py-2 px-3 text-center text-rose-500 font-medium">Restricted</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-slate-800">Volumetric Reagent Dispensation</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Authorized</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Authorizing Witness</td>
                  <td className="py-2 px-3 text-center text-amber-600 font-medium">Requires Witness</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-medium text-slate-800">Digital QR Token Generation</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Full Access</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Full Access</td>
                  <td className="py-2 px-3 text-center text-emerald-600 font-bold">Scan & View</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-t border-slate-200">
          <div className="text-[11px] text-slate-500 font-medium">
            Clicking a switch button updates the active session across all components and database audit records instantly.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white font-bold text-xs uppercase tracking-wide transition shadow-xs"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
