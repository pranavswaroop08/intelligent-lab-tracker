import React, { useState, useEffect } from 'react';
import {
  History,
  ShieldCheck,
  Filter,
  Download,
  Shield,
  Wrench,
  Lock,
  Database,
  Table,
  Zap,
  Eye,
  Maximize2,
  ExternalLink,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import erDiagramImg from '../assets/er_diagram.png';

export default function AuditLogs() {
  const { currentUser, isAdmin, isLabManager, switchToSwaroop, switchToKaushal } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('audit'); // 'audit' | 'er_diagram' | 'views' | 'triggers'
  
  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [selectedAction, setSelectedAction] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(true);

  // Views State
  const [selectedView, setSelectedView] = useState('vw_chemical_inventory_summary');
  const [viewData, setViewData] = useState(null);
  const [loadingView, setLoadingView] = useState(false);

  // ER Diagram zoom modal
  const [zoomER, setZoomER] = useState(false);

  useEffect(() => {
    if (activeSubTab === 'audit') {
      loadLogs();
    }
  }, [activeSubTab, selectedAction]);

  useEffect(() => {
    if (activeSubTab === 'views') {
      loadViewData(selectedView);
    }
  }, [activeSubTab, selectedView]);

  const loadLogs = () => {
    setLoadingLogs(true);
    let params = selectedAction ? `action=${encodeURIComponent(selectedAction)}` : '';
    api.getAuditLogs(params)
      .then((res) => setLogs(res))
      .catch((err) => console.error('Failed to load audit logs:', err))
      .finally(() => setLoadingLogs(false));
  };

  const loadViewData = (vName) => {
    setLoadingView(true);
    api.getViewData(vName)
      .then((res) => setViewData(res))
      .catch((err) => {
        console.error('Failed to load view data:', err);
        setViewData(null);
      })
      .finally(() => setLoadingView(false));
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

  const VIEWS_INFO = [
    {
      id: 'vw_chemical_inventory_summary',
      name: 'Chemical Inventory Summary View',
      sql: `CREATE VIEW vw_chemical_inventory_summary AS
SELECT 
    c.id AS chemical_id, c.cas_number, c.name AS chemical_name, c.formula,
    h.name AS hazard_category, h.code AS hazard_code,
    c.nfpa_health, c.nfpa_flammability, c.nfpa_instability,
    c.min_threshold_qty, c.unit,
    COUNT(b.id) AS total_batches_count,
    COALESCE(SUM(b.current_quantity), 0.0) AS total_current_quantity,
    CASE 
        WHEN COALESCE(SUM(b.current_quantity), 0.0) <= c.min_threshold_qty THEN 'CRITICAL_LOW_STOCK'
        WHEN COALESCE(SUM(b.current_quantity), 0.0) <= (c.min_threshold_qty * 1.5) THEN 'WARNING_LOW_STOCK'
        ELSE 'ADEQUATE_STOCK'
    END AS stock_health_status
FROM chemicals c
LEFT JOIN hazard_classes h ON c.hazard_class_id = h.id
LEFT JOIN chemical_batches b ON b.chemical_id = c.id AND b.status != 'depleted'
GROUP BY c.id, c.cas_number, c.name, c.formula, h.name, h.code, 
         c.nfpa_health, c.nfpa_flammability, c.nfpa_instability, 
         c.min_threshold_qty, c.unit;`,
      purpose: 'Simplifies complex 4-table join into an instant stock-health catalog with automatic low-stock alarms.',
      joined: ['chemicals', 'hazard_classes', 'chemical_batches', 'storage_locations']
    },
    {
      id: 'vw_asset_maintenance_status',
      name: 'Asset Maintenance & Borrower View',
      sql: `CREATE VIEW vw_asset_maintenance_status AS
SELECT 
    a.id AS asset_id, a.asset_tag, a.name AS instrument_name, a.category,
    a.manufacturer, a.model_number, l.code AS lab_code, loc.location_code AS cabinet_code,
    a.status AS operational_status, a.last_calibration_date, a.next_calibration_due,
    CASE 
        WHEN a.next_calibration_due <= CURRENT_DATE THEN 'OVERDUE'
        ELSE 'VALID'
    END AS calibration_urgency,
    b.borrowed_at, u.name AS current_borrower_name, u.srn_or_emp_id AS borrower_srn
FROM assets a
JOIN laboratories l ON a.lab_id = l.id
LEFT JOIN storage_locations loc ON a.location_id = loc.id
LEFT JOIN asset_borrow_logs b ON b.asset_id = a.id AND b.status = 'active'
LEFT JOIN users u ON b.user_id = u.id;`,
      purpose: 'Consolidates equipment custody, active loans, and ISO/IEC 17025 metrology calibration deadlines.',
      joined: ['assets', 'laboratories', 'storage_locations', 'asset_borrow_logs', 'users']
    },
    {
      id: 'vw_hazard_incompatibility_matrix',
      name: 'Chemical Incompatibility Matrix View',
      sql: `CREATE VIEW vw_hazard_incompatibility_matrix AS
SELECT 
    ci.id AS rule_id,
    h1.code AS hazard_class_a_code, h1.name AS hazard_class_a_name, h1.storage_category AS storage_a_category,
    h2.code AS hazard_class_b_code, h2.name AS hazard_class_b_name, h2.storage_category AS storage_b_category,
    ci.severity AS hazard_severity, ci.reason AS chemical_reaction_hazard,
    ci.safety_protocol AS required_segregation_protocol
FROM chemical_incompatibilities ci
JOIN hazard_classes h1 ON ci.hazard_class_a_id = h1.id
JOIN hazard_classes h2 ON ci.hazard_class_b_id = h2.id;`,
      purpose: 'Unpacks self-referential chemical hazard joins into human-readable co-location explosion and toxicity alerts.',
      joined: ['chemical_incompatibilities', 'hazard_classes (A)', 'hazard_classes (B)']
    },
    {
      id: 'vw_dispensation_audit_trail',
      name: 'Dispensation Chain-of-Custody View',
      sql: `CREATE VIEW vw_dispensation_audit_trail AS
SELECT 
    d.id AS dispensation_id, d.dispensed_at,
    c.name AS chemical_name, c.cas_number, b.batch_lot_number, b.barcode_qr,
    d.dispensed_amount, d.unit, d.remaining_quantity_after,
    u.name AS dispensed_by_user, u.srn_or_emp_id AS operator_srn, r.name AS user_role,
    d.witness_name, d.experiment_name, d.course_or_project
FROM dispensations d
JOIN chemical_batches b ON d.batch_id = b.id
JOIN chemicals c ON b.chemical_id = c.id
JOIN users u ON d.user_id = u.id
JOIN roles r ON u.role_id = r.id;`,
      purpose: 'Auditing view connecting individual experiment protocols, authorizing witnesses, and batch lot numbers.',
      joined: ['dispensations', 'chemical_batches', 'chemicals', 'users', 'roles']
    },
    {
      id: 'vw_lab_safety_compliance_snapshot',
      name: 'Laboratory Safety Compliance Snapshot View',
      sql: `CREATE VIEW vw_lab_safety_compliance_snapshot AS
SELECT 
    l.id AS lab_id, l.code AS lab_code, l.name AS laboratory_name, l.building, l.floor,
    COUNT(DISTINCT a.id) AS total_instruments_count,
    SUM(CASE WHEN a.status = 'in_use' THEN 1 ELSE 0 END) AS active_borrowed_instruments,
    SUM(CASE WHEN a.next_calibration_due <= CURRENT_DATE THEN 1 ELSE 0 END) AS overdue_calibration_instruments,
    COUNT(DISTINCT b.id) AS active_chemical_batches_count,
    SUM(CASE WHEN b.expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) AS expired_chemical_batches_count
FROM laboratories l
LEFT JOIN assets a ON a.lab_id = l.id
LEFT JOIN storage_locations loc ON loc.lab_id = l.id
LEFT JOIN chemical_batches b ON b.location_id = loc.id AND b.status != 'depleted'
GROUP BY l.id, l.code, l.name, l.building, l.floor;`,
      purpose: 'Executive multi-table roll-up providing real-time compliance metrics across laboratory facilities.',
      joined: ['laboratories', 'assets', 'storage_locations', 'chemical_batches']
    }
  ];

  const TRIGGERS_INFO = [
    {
      name: 'trg_after_dispensation_deduct_stock',
      timing: 'AFTER INSERT ON dispensations',
      event: 'Deducts current_quantity, sets low/depleted status, writes to audit_logs',
      sql: `CREATE TRIGGER trg_after_dispensation_deduct_stock
AFTER INSERT ON dispensations
FOR EACH ROW
BEGIN
    UPDATE chemical_batches
    SET current_quantity = MAX(0.0, current_quantity - NEW.dispensed_amount),
        status = CASE
            WHEN (current_quantity - NEW.dispensed_amount) <= 0.0 THEN 'depleted'
            WHEN (current_quantity - NEW.dispensed_amount) <= 500.0 THEN 'low'
            ELSE 'available'
        END
    WHERE id = NEW.batch_id;

    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (
        NEW.user_id,
        (SELECT name FROM users WHERE id = NEW.user_id),
        'DISPENSE',
        'chemical_batch',
        NEW.batch_id,
        'Trigger trg_after_dispensation_deduct_stock automatically deducted ' || NEW.dispensed_amount || ' ' || NEW.unit || ' for experiment: ' || NEW.experiment_name,
        '127.0.0.1',
        DATETIME('now')
    );
END;`,
      explanation: 'Ensures ACID consistency between reagent dispensation records and physical inventory remaining without requiring manual application calculation.'
    },
    {
      name: 'trg_after_calibration_update_asset',
      timing: 'AFTER INSERT ON asset_calibrations',
      event: 'Updates last_calibration_date, next_calibration_due, resets status = available',
      sql: `CREATE TRIGGER trg_after_calibration_update_asset
AFTER INSERT ON asset_calibrations
FOR EACH ROW
BEGIN
    UPDATE assets
    SET last_calibration_date = NEW.calibration_date,
        next_calibration_due = NEW.next_due_date,
        status = CASE
            WHEN NEW.calibration_status IN ('passed', 'adjusted') THEN 'available'
            ELSE 'under_maintenance'
        END
    WHERE id = NEW.asset_id;

    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (
        1,
        NEW.technician_name,
        'CALIBRATE',
        'asset',
        NEW.asset_id,
        'Trigger trg_after_calibration_update_asset updated next calibration due to ' || NEW.next_due_date || ' (Outcome: ' || NEW.calibration_status || ')',
        '127.0.0.1',
        DATETIME('now')
    );
END;`,
      explanation: 'Guarantees ISO/IEC 17025 metrology compliance by resetting equipment status immediately upon technician certificate logging.'
    },
    {
      name: 'trg_before_borrow_verify_status',
      timing: 'BEFORE INSERT ON asset_borrow_logs',
      event: 'Integrity check preventing double loans or borrowing uncalibrated instruments',
      sql: `CREATE TRIGGER trg_before_borrow_verify_status
BEFORE INSERT ON asset_borrow_logs
FOR EACH ROW
WHEN (SELECT status FROM assets WHERE id = NEW.asset_id) != 'available'
BEGIN
    SELECT RAISE(ABORT, 'Asset cannot be borrowed: Instrument is currently in use or under maintenance.');
END;`,
      explanation: 'Database-level integrity guard preventing concurrency conflicts or double-booking of expensive laboratory instruments.'
    }
  ];

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
                ? 'Full Regulatory Clearance (Pranav Swaroop S): Authorized to inspect complete immutable audit records, schema views, and triggers.'
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

      {/* =========================================================================
          DBMS MINI-PROJECT NAVIGATION TABS (Audit / ER Diagram / Views / Triggers)
          ========================================================================= */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveSubTab('audit')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'audit'
              ? 'bg-[#0b3c68] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="w-4 h-4 text-[#13b5ea]" />
          <span>Activity Audit Trail</span>
        </button>

        <button
          onClick={() => setActiveSubTab('er_diagram')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'er_diagram'
              ? 'bg-[#0b3c68] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4 text-[#13b5ea]" />
          <span>ER Diagram (14 Relational Tables)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('views')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'views'
              ? 'bg-[#0b3c68] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-4 h-4 text-[#13b5ea]" />
          <span>Relational Database Views (5 Views)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('triggers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeSubTab === 'triggers'
              ? 'bg-[#0b3c68] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Zap className="w-4 h-4 text-[#13b5ea]" />
          <span>Active Database Triggers (3 Triggers)</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: ACTIVITY AUDIT TRAIL
          ========================================================================= */}
      {activeSubTab === 'audit' && (
        <div className="space-y-6">
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
      )}

      {/* =========================================================================
          SUB-TAB 2: ER DIAGRAM (14 RELATIONAL TABLES)
          ========================================================================= */}
      {activeSubTab === 'er_diagram' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
                <Database className="w-6 h-6 text-[#13b5ea]" />
                Entity-Relationship (ER) Schema Architecture
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full 3NF Normalized Relational Diagram with 14 Entities, Foreign Key Constraints & Cardinalities
              </p>
            </div>

            <button
              onClick={() => setZoomER(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#13b5ea] hover:bg-[#0da1d2] text-white text-xs font-bold uppercase tracking-wider transition shadow-xs self-start sm:self-auto"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Full Screen Zoom</span>
            </button>
          </div>

          {/* High-Resolution ER Diagram Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
            <div
              onClick={() => setZoomER(true)}
              className="cursor-zoom-in group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-950 max-h-[600px] flex items-center justify-center w-full"
            >
              <img
                src={erDiagramImg}
                alt="PES University DBMS Mini-Project ER Diagram"
                className="max-h-[580px] w-auto object-contain transition group-hover:scale-105 duration-300"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white font-bold text-sm">
                <Maximize2 className="w-5 h-5 text-[#13b5ea]" />
                Click to Expand Full Screen
              </div>
            </div>
            <div className="w-full mt-3 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Author Credits: PES2UG24CS365 (Pranav Swaroop S) & PES2UG24CS363 (Pranav Kaushal J)</span>
              <span>14 Tables · Normalized 3NF · Referential Integrity Enforced</span>
            </div>
          </div>

          {/* Table Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'ROLES', pk: 'id', fks: 'None', desc: 'System RBAC authorization definitions' },
              { name: 'USERS', pk: 'id', fks: 'role_id -> ROLES(id)', desc: 'Lab faculty, managers, researchers, students' },
              { name: 'LABORATORIES', pk: 'id', fks: 'in_charge_user_id -> USERS(id)', desc: 'Physical facilities and emergency contacts' },
              { name: 'STORAGE_LOCATIONS', pk: 'id', fks: 'lab_id -> LABORATORIES(id)', desc: 'Fire cabinets, fume hoods, 4°C refrigerators' },
              { name: 'HAZARD_CLASSES', pk: 'id', fks: 'None', desc: 'OSHA / GHS classification codes & icons' },
              { name: 'CHEMICAL_INCOMPATIBILITIES', pk: 'id', fks: 'hazard_a, hazard_b -> HAZARD_CLASSES', desc: 'Deterministic hazard segregation rules' },
              { name: 'CHEMICALS', pk: 'id', fks: 'hazard_class_id -> HAZARD_CLASSES', desc: 'Catalog master, CAS numbers, NFPA 704' },
              { name: 'CHEMICAL_BATCHES', pk: 'id', fks: 'chemical_id, location_id', desc: 'Individual containers, lot numbers, barcodes' },
              { name: 'ASSETS', pk: 'id', fks: 'lab_id, location_id', desc: 'Analytical instruments & calibration due dates' },
              { name: 'ASSET_BORROW_LOGS', pk: 'id', fks: 'asset_id, user_id', desc: 'Check-out/return custody & runtime tracking' },
              { name: 'ASSET_CALIBRATIONS', pk: 'id', fks: 'asset_id -> ASSETS(id)', desc: 'ISO/IEC 17025 metrology certification' },
              { name: 'DISPENSATIONS', pk: 'id', fks: 'batch_id, user_id', desc: 'Volumetric consumption & witness records' },
              { name: 'WASTE_LOGS', pk: 'id', fks: 'chemical_id, batch_id, location_id, user_id', desc: 'Hazardous waste accumulation & manifests' },
              { name: 'AUDIT_LOGS', pk: 'id', fks: 'user_id -> USERS(id)', desc: 'Immutable regulatory activity ledger' },
            ].map((tbl) => (
              <div key={tbl.name} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs text-xs space-y-1">
                <div className="font-extrabold text-[#0b3c68] flex items-center justify-between">
                  <span>{tbl.name}</span>
                  <span className="font-mono text-[10px] text-[#13b5ea] font-bold">PK: {tbl.pk}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">FK: {tbl.fks}</div>
                <p className="text-[11px] text-slate-600">{tbl.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: RELATIONAL DATABASE VIEWS (5 VIEWS)
          ========================================================================= */}
      {activeSubTab === 'views' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
              <Eye className="w-6 h-6 text-[#13b5ea]" />
              Relational Database Views (Virtual Tables)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live SQL views joining multi-table relationships to provide reporting abstraction and real-time computation
            </p>
          </div>

          {/* View Selector Buttons */}
          <div className="flex flex-wrap gap-2">
            {VIEWS_INFO.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedView(v.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedView === v.id
                    ? 'bg-[#13b5ea] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>{v.id}</span>
              </button>
            ))}
          </div>

          {/* Active View Specification */}
          {(() => {
            const currentViewObj = VIEWS_INFO.find(v => v.id === selectedView) || VIEWS_INFO[0];
            return (
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-extrabold text-base text-[#0b3c68]">{currentViewObj.name}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{currentViewObj.purpose}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                    <span className="font-bold text-slate-700">Joined:</span>
                    <span>{currentViewObj.joined.join(', ')}</span>
                  </div>
                </div>

                {/* SQL Definition Accordion */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    SQL CREATE VIEW Query:
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-cyan-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {currentViewObj.sql}
                  </pre>
                </div>

                {/* Live Data Query from View */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                      Live Result (`SELECT * FROM {selectedView} LIMIT 10;`):
                    </div>
                    {viewData && (
                      <span className="text-[11px] font-mono text-emerald-600 font-bold">
                        {viewData.count} live rows returned
                      </span>
                    )}
                  </div>

                  {loadingView ? (
                    <div className="py-8 text-center text-xs text-slate-500 font-mono">
                      Querying database view...
                    </div>
                  ) : viewData && viewData.rows && viewData.rows.length > 0 ? (
                    <div className="border border-slate-200 rounded-xl overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                          <tr>
                            {viewData.columns.map((col) => (
                              <th key={col} className="py-2.5 px-4 whitespace-nowrap">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {viewData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              {viewData.columns.map((col) => (
                                <td key={col} className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                                  {row[col] !== null && row[col] !== undefined ? String(row[col]) : 'NULL'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-xs text-slate-500">
                      No rows returned from this view.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: ACTIVE DATABASE TRIGGERS (3 TRIGGERS)
          ========================================================================= */}
      {activeSubTab === 'triggers' && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-extrabold text-[#0b3c68] flex items-center gap-2">
              <Zap className="w-6 h-6 text-[#13b5ea]" />
              Active Database Triggers & Automations
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Event-driven procedural logic enforcing ACID stock deductions, ISO/IEC 17025 metrology resets, and audit integrity
            </p>
          </div>

          <div className="space-y-6">
            {TRIGGERS_INFO.map((trg, idx) => (
              <div key={trg.name} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
                      TRIGGER #{idx + 1}
                    </span>
                    <h3 className="font-extrabold text-base text-[#0b3c68] mt-1">{trg.name}</h3>
                    <div className="text-xs font-mono text-[#13b5ea] font-semibold">{trg.timing}</div>
                  </div>
                  <div className="text-right">
                    <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                      STATUS: ACTIVE / ENABLED
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700">{trg.explanation}</p>

                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    SQL Trigger Code:
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-900 text-amber-300 font-mono text-[11px] overflow-x-auto leading-relaxed border border-slate-800">
                    {trg.sql}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-screen ER Diagram Modal */}
      {zoomER && (
        <div
          onClick={() => setZoomER(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-7xl max-h-[95vh] overflow-auto rounded-2xl p-2 bg-slate-950 border border-slate-800">
            <img
              src={erDiagramImg}
              alt="PES University ER Diagram Full"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
