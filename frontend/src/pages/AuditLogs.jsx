import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Download, Shield, Wrench, Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AuditLogs() {
  const { currentUser, isAdmin, isLabManager, switchToSwaroop, switchToKaushal } = useAuth();
  const [logs, setLogs] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [selectedAction]);

  const loadLogs = () => {
    setLoading(true);
    let params = selectedAction ? `action=${encodeURIComponent(selectedAction)}` : '';
    api.getAuditLogs(params)
      .then((res) => setLogs(res))
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoading(false));
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'Details', 'IP Address'];
    const rows = logs.map(l => [
      l.id,
      l.created_at,
      `"${l.user_name || ''}"`,
      l.action,
      l.entity_type,
      l.entity_id || '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ip_address
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pes_lab_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* RBAC Role Clearance Strip */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isAdmin
          ? 'bg-rose-50 border-rose-200 text-rose-900'
          : isLabManager
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg text-white ${
            isAdmin ? 'bg-rose-600' : isLabManager ? 'bg-emerald-600' : 'bg-amber-600'
          }`}>
            {isAdmin ? <Shield className="w-5 h-5" /> : isLabManager ? <Wrench className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-extrabold text-sm flex items-center gap-2">
              <span>{currentUser.name} ({currentUser.srn_or_emp_id})</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white border border-current">
                {currentUser.role_name}
              </span>
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {isAdmin
                ? 'Full Regulatory Clearance (Pranav Swaroop S): Authorized to inspect complete immutable audit records and export CSV logs.'
                : isLabManager
                ? 'Operational Clearance (Pranav Kaushal J): Authorized to view chemical and equipment tracking audit records.'
                : 'Restricted Student Clearance: Viewing anonymized public audit summary.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <button
              onClick={switchToKaushal}
              className="px-3 py-1.5 rounded-md bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
            >
              Switch to Kaushal (Lab Mgr)
            </button>
          ) : (
            <button
              onClick={switchToSwaroop}
              className="px-3 py-1.5 rounded-md bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition"
            >
              Switch to Swaroop (Admin)
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
            <History className="w-6 h-6 text-[#13b5ea]" />
            Regulatory Security Audit Trail & Activity Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-evident activity logs for laboratory inspections, asset borrowing, chemical handling & hazard alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-700 font-medium"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="DISPENSE">DISPENSE</option>
            <option value="BORROW_ASSET">BORROW ASSET</option>
            <option value="RETURN_ASSET">RETURN ASSET</option>
            <option value="CALIBRATE_ASSET">CALIBRATE ASSET</option>
            <option value="INCOMPATIBILITY_ALERT">INCOMPATIBILITY ALERT</option>
            <option value="LOGIN">LOGIN</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-5">Log ID</th>
                <th className="py-3.5 px-5">Date & Time</th>
                <th className="py-3.5 px-5">Operator / User</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Entity Type</th>
                <th className="py-3.5 px-5">Activity Audit Narrative</th>
                <th className="py-3.5 px-5 text-right">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-5 font-mono text-slate-400 font-bold">#{l.id}</td>
                  <td className="py-3.5 px-5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-5 font-bold text-[#0b3c68]">{l.user_name}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      l.action.includes('ALERT') ? 'bg-rose-100 text-rose-700 border border-rose-300' :
                      l.action.includes('DISPENSE') ? 'bg-amber-100 text-amber-700' :
                      l.action.includes('BORROW') ? 'bg-indigo-100 text-indigo-700' :
                      l.action.includes('CALIBRATE') ? 'bg-cyan-100 text-cyan-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500">{l.entity_type}</td>
                  <td className="py-3.5 px-5 text-slate-800 max-w-md">{l.details}</td>
                  <td className="py-3.5 px-5 text-right font-mono text-[11px] text-slate-400">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
