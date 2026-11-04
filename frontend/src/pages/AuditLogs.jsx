import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Download } from 'lucide-react';
import { api } from '../services/api';

export default function AuditLogs() {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Immutable Regulatory Audit Log & Security Trail
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-evident activity logs for laboratory inspections, asset borrowing, chemical handling & hazard alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-slate-200"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Operator / User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity Type</th>
                <th className="py-3 px-4">Activity Audit Narrative</th>
                <th className="py-3 px-4 text-right">Terminal IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">#{l.id}</td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-200">{l.user_name}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                      l.action.includes('ALERT') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      l.action.includes('DISPENSE') ? 'bg-amber-500/20 text-amber-400' :
                      l.action.includes('BORROW') ? 'bg-indigo-500/20 text-indigo-400' :
                      l.action.includes('CALIBRATE') ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{l.entity_type}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-md">{l.details}</td>
                  <td className="py-3 px-4 text-right font-mono text-[11px] text-slate-500">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
