-- =====================================================================
-- Intelligent Laboratory Asset & Chemical Tracking Platform
-- Academic Project: PES University (DBMS Coursework)
-- Authors:
--   PES2UG24CS365 - Pranav Swaroop S
--   PES2UG24CS363 - Pranav Kaushal J
-- Relational Database Views (MySQL 8.0 & SQLite Compatible)
-- Based on the 14-Table 3NF Normalized ER Diagram
-- =====================================================================

-- ---------------------------------------------------------------------
-- VIEW 1: vw_chemical_inventory_summary
-- Purpose: Aggregates master chemical specifications with active batches,
--          physical storage cabinets, and stock threshold warnings.
-- Tables Joined: chemicals, hazard_classes, chemical_batches, storage_locations
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_chemical_inventory_summary;

CREATE VIEW vw_chemical_inventory_summary AS
SELECT 
    c.id AS chemical_id,
    c.cas_number,
    c.name AS chemical_name,
    c.formula,
    h.name AS hazard_category,
    h.code AS hazard_code,
    c.nfpa_health,
    c.nfpa_flammability,
    c.nfpa_instability,
    c.min_threshold_qty,
    c.unit,
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
GROUP BY 
    c.id, c.cas_number, c.name, c.formula, h.name, h.code, 
    c.nfpa_health, c.nfpa_flammability, c.nfpa_instability, 
    c.min_threshold_qty, c.unit;


-- ---------------------------------------------------------------------
-- VIEW 2: vw_asset_maintenance_status
-- Purpose: Consolidates precision instrument lifecycle, metrology calibration,
--          days until next calibration due, and active borrower custody.
-- Tables Joined: assets, laboratories, storage_locations, asset_borrow_logs, users
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_asset_maintenance_status;

CREATE VIEW vw_asset_maintenance_status AS
SELECT 
    a.id AS asset_id,
    a.asset_tag,
    a.name AS instrument_name,
    a.category,
    a.manufacturer,
    a.model_number,
    l.code AS lab_code,
    loc.location_code AS cabinet_code,
    a.status AS operational_status,
    a.last_calibration_date,
    a.next_calibration_due,
    a.calibration_interval_days,
    CASE 
        WHEN a.next_calibration_due <= CURRENT_DATE THEN 'OVERDUE'
        ELSE 'VALID'
    END AS calibration_urgency,
    b.borrowed_at,
    u.name AS current_borrower_name,
    u.srn_or_emp_id AS borrower_srn
FROM assets a
JOIN laboratories l ON a.lab_id = l.id
LEFT JOIN storage_locations loc ON a.location_id = loc.id
LEFT JOIN asset_borrow_logs b ON b.asset_id = a.id AND b.status = 'active'
LEFT JOIN users u ON b.user_id = u.id;


-- ---------------------------------------------------------------------
-- VIEW 3: vw_hazard_incompatibility_matrix
-- Purpose: Unpacks the self-referential chemical incompatibility table into
--          human-readable hazard names, severity levels, and segregation protocols.
-- Tables Joined: chemical_incompatibilities, hazard_classes (h1), hazard_classes (h2)
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_hazard_incompatibility_matrix;

CREATE VIEW vw_hazard_incompatibility_matrix AS
SELECT 
    ci.id AS rule_id,
    h1.code AS hazard_class_a_code,
    h1.name AS hazard_class_a_name,
    h1.storage_category AS storage_a_category,
    h2.code AS hazard_class_b_code,
    h2.name AS hazard_class_b_name,
    h2.storage_category AS storage_b_category,
    ci.severity AS hazard_severity,
    ci.reason AS chemical_reaction_hazard,
    ci.safety_protocol AS required_segregation_protocol
FROM chemical_incompatibilities ci
JOIN hazard_classes h1 ON ci.hazard_class_a_id = h1.id
JOIN hazard_classes h2 ON ci.hazard_class_b_id = h2.id;


-- ---------------------------------------------------------------------
-- VIEW 4: vw_dispensation_audit_trail
-- Purpose: Provides a complete chain-of-custody audit report for reagent
--          dispensations, connecting the user, batch lot, chemical, and witness.
-- Tables Joined: dispensations, chemical_batches, chemicals, users, roles
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_dispensation_audit_trail;

CREATE VIEW vw_dispensation_audit_trail AS
SELECT 
    d.id AS dispensation_id,
    d.dispensed_at,
    c.name AS chemical_name,
    c.cas_number,
    b.batch_lot_number,
    b.barcode_qr,
    d.dispensed_amount,
    d.unit,
    d.remaining_quantity_after,
    u.name AS dispensed_by_user,
    u.srn_or_emp_id AS operator_srn,
    r.name AS user_role,
    d.witness_name,
    d.experiment_name,
    d.course_or_project
FROM dispensations d
JOIN chemical_batches b ON d.batch_id = b.id
JOIN chemicals c ON b.chemical_id = c.id
JOIN users u ON d.user_id = u.id
JOIN roles r ON u.role_id = r.id;


-- ---------------------------------------------------------------------
-- VIEW 5: vw_lab_safety_compliance_snapshot
-- Purpose: Laboratory-level executive summary aggregating instruments,
--          chemical stock containers, overdue calibrations, and active loans.
-- Tables Joined: laboratories, assets, storage_locations, chemical_batches
-- ---------------------------------------------------------------------
DROP VIEW IF EXISTS vw_lab_safety_compliance_snapshot;

CREATE VIEW vw_lab_safety_compliance_snapshot AS
SELECT 
    l.id AS lab_id,
    l.code AS lab_code,
    l.name AS laboratory_name,
    l.building,
    l.floor,
    COUNT(DISTINCT a.id) AS total_instruments_count,
    SUM(CASE WHEN a.status = 'in_use' THEN 1 ELSE 0 END) AS active_borrowed_instruments,
    SUM(CASE WHEN a.next_calibration_due <= CURRENT_DATE THEN 1 ELSE 0 END) AS overdue_calibration_instruments,
    COUNT(DISTINCT b.id) AS active_chemical_batches_count,
    SUM(CASE WHEN b.expiry_date < CURRENT_DATE THEN 1 ELSE 0 END) AS expired_chemical_batches_count
FROM laboratories l
LEFT JOIN assets a ON a.lab_id = l.id
LEFT JOIN storage_locations loc ON loc.lab_id = l.id
LEFT JOIN chemical_batches b ON b.location_id = loc.id AND b.status != 'depleted'
GROUP BY 
    l.id, l.code, l.name, l.building, l.floor;
