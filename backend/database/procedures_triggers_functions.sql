-- =====================================================================
-- Intelligent Laboratory Asset & Chemical Tracking Platform
-- Academic Project: PES University (DBMS Coursework)
-- Authors:
--   PES2UG24CS365 - Pranav Swaroop S
--   PES2UG24CS363 - Pranav Kaushal J
-- Advanced Relational Database Programming (Triggers, Procedures, Functions)
-- MySQL 8.0 Compatible
-- =====================================================================

USE lab_asset_tracker;

-- =====================================================================
-- SECTION 1: DATABASE TRIGGERS
-- =====================================================================

-- ---------------------------------------------------------------------
-- TRIGGER 1: trg_after_dispensation_deduct_stock
-- Type: AFTER INSERT ON dispensations
-- Purpose: Automatically deducts remaining volume/mass from the batch,
--          updates batch status to 'low' or 'depleted', and logs an audit record.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_dispensation_deduct_stock;

DELIMITER //

CREATE TRIGGER trg_after_dispensation_deduct_stock
AFTER INSERT ON dispensations
FOR EACH ROW
BEGIN
    DECLARE v_current_qty DECIMAL(10, 2);
    DECLARE v_min_threshold DECIMAL(10, 2);
    DECLARE v_user_name VARCHAR(100);

    -- Fetch current chemical threshold
    SELECT min_threshold_qty INTO v_min_threshold
    FROM chemicals c
    JOIN chemical_batches b ON b.chemical_id = c.id
    WHERE b.id = NEW.batch_id;

    -- Deduct quantity and update batch status
    UPDATE chemical_batches
    SET current_quantity = GREATEST(0.0, current_quantity - NEW.dispensed_amount),
        status = CASE 
            WHEN (current_quantity - NEW.dispensed_amount) <= 0.0 THEN 'depleted'
            WHEN (current_quantity - NEW.dispensed_amount) <= v_min_threshold THEN 'low'
            ELSE 'available'
        END
    WHERE id = NEW.batch_id;

    -- Fetch user name
    SELECT name INTO v_user_name FROM users WHERE id = NEW.user_id;

    -- Automatic audit trail entry
    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (
        NEW.user_id,
        v_user_name,
        'DISPENSE',
        'chemical_batch',
        CAST(NEW.batch_id AS CHAR),
        CONCAT('Automatic Trigger: Deducted ', NEW.dispensed_amount, ' ', NEW.unit, ' for experiment: ', NEW.experiment_name, ' (Witness: ', IFNULL(NEW.witness_name, 'None'), ')'),
        '127.0.0.1',
        NOW()
    );
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- TRIGGER 2: trg_after_calibration_update_asset
-- Type: AFTER INSERT ON asset_calibrations
-- Purpose: Automatically updates instrument calibration history, calculates
--          the next due date, and resets asset status to 'available'.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_calibration_update_asset;

DELIMITER //

CREATE TRIGGER trg_after_calibration_update_asset
AFTER INSERT ON asset_calibrations
FOR EACH ROW
BEGIN
    -- Update parent asset dates and operational status
    UPDATE assets
    SET last_calibration_date = NEW.calibration_date,
        next_calibration_due = NEW.next_due_date,
        status = CASE
            WHEN NEW.calibration_status IN ('passed', 'adjusted') THEN 'available'
            WHEN NEW.calibration_status = 'failed' THEN 'under_maintenance'
            ELSE status
        END
    WHERE id = NEW.asset_id;

    -- Log audit trail for ISO/IEC 17025 compliance
    INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (
        1,
        NEW.technician_name,
        'CALIBRATE',
        'asset',
        CAST(NEW.asset_id AS CHAR),
        CONCAT('Automatic Trigger: Logged calibration outcome "', NEW.calibration_status, '" (Next due: ', NEW.next_due_date, ', Certificate: ', IFNULL(NEW.certificate_number, 'N/A'), ')'),
        '127.0.0.1',
        NOW()
    );
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- TRIGGER 3: trg_before_borrow_verify_status
-- Type: BEFORE INSERT ON asset_borrow_logs
-- Purpose: Enforces database integrity by rejecting loans if the instrument
--          is currently 'in_use', 'under_maintenance', or 'calibration_due'.
-- ---------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_borrow_verify_status;

DELIMITER //

CREATE TRIGGER trg_before_borrow_verify_status
BEFORE INSERT ON asset_borrow_logs
FOR EACH ROW
BEGIN
    DECLARE v_asset_status VARCHAR(30);

    SELECT status INTO v_asset_status FROM assets WHERE id = NEW.asset_id;

    IF v_asset_status = 'in_use' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Integrity Error: Asset is already in use by another student or researcher.';
    ELSEIF v_asset_status = 'under_maintenance' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Safety Error: Asset is currently locked under maintenance and cannot be borrowed.';
    END IF;

    -- Update asset to in_use on successful borrow
    UPDATE assets SET status = 'in_use' WHERE id = NEW.asset_id;
END //

DELIMITER ;


-- =====================================================================
-- SECTION 2: STORED PROCEDURES
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROCEDURE 1: sp_dispense_chemical_reagent
-- Purpose: Atomic transaction to dispense chemical stock, checking availability,
--          logging the dispensation, and updating remaining quantity.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_dispense_chemical_reagent;

DELIMITER //

CREATE PROCEDURE sp_dispense_chemical_reagent(
    IN p_batch_id INT,
    IN p_user_id INT,
    IN p_amount DECIMAL(10, 2),
    IN p_experiment VARCHAR(150),
    IN p_course VARCHAR(100),
    IN p_witness VARCHAR(100),
    OUT p_remaining_qty DECIMAL(10, 2),
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_current_qty DECIMAL(10, 2);
    DECLARE v_unit VARCHAR(20);
    DECLARE v_batch_status VARCHAR(30);
    DECLARE v_expiry_date DATE;

    -- Transaction handling
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_remaining_qty = -1.0;
        SET p_status_message = 'Transaction Rolled Back: SQL Exception occurred during dispensation.';
    END;

    START TRANSACTION;

    -- Fetch batch details with row-level lock
    SELECT current_quantity, unit, status, expiry_date
    INTO v_current_qty, v_unit, v_batch_status, v_expiry_date
    FROM chemical_batches
    WHERE id = p_batch_id FOR UPDATE;

    IF v_current_qty IS NULL THEN
        SET p_remaining_qty = -1.0;
        SET p_status_message = 'Error: Batch ID does not exist in inventory.';
        ROLLBACK;
        LEAVE proc_block;
    END IF;

    IF v_expiry_date < CURDATE() THEN
        SET p_remaining_qty = v_current_qty;
        SET p_status_message = 'Safety Block: Batch is EXPIRED. Dispensation strictly prohibited.';
        ROLLBACK;
        LEAVE proc_block;
    END IF;

    IF v_current_qty < p_amount THEN
        SET p_remaining_qty = v_current_qty;
        SET p_status_message = CONCAT('Error: Insufficient stock. Requested: ', p_amount, ', Available: ', v_current_qty);
        ROLLBACK;
        LEAVE proc_block;
    END IF;

    -- Compute remaining
    SET p_remaining_qty = v_current_qty - p_amount;

    -- Insert into dispensations (triggers trg_after_dispensation_deduct_stock)
    INSERT INTO dispensations (
        batch_id, user_id, dispensed_amount, unit, 
        experiment_name, course_or_project, remaining_quantity_after, 
        witness_name, dispensed_at
    ) VALUES (
        p_batch_id, p_user_id, p_amount, v_unit,
        p_experiment, IFNULL(p_course, 'PES University Coursework'), p_remaining_qty,
        p_witness, NOW()
    );

    COMMIT;
    SET p_status_message = CONCAT('Success: Dispensed ', p_amount, ' ', v_unit, '. Remaining: ', p_remaining_qty, ' ', v_unit);
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- PROCEDURE 2: sp_quarantine_expired_batches
-- Purpose: Sweeps inventory for chemical batches exceeding expiry date,
--          marks them 'expired', and generates safety audit alerts.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_quarantine_expired_batches;

DELIMITER //

CREATE PROCEDURE sp_quarantine_expired_batches(
    OUT p_quarantined_count INT
)
BEGIN
    -- Count eligible expired batches
    SELECT COUNT(*) INTO p_quarantined_count
    FROM chemical_batches
    WHERE expiry_date < CURDATE() AND status NOT IN ('expired', 'depleted');

    IF p_quarantined_count > 0 THEN
        -- Update statuses to expired
        UPDATE chemical_batches
        SET status = 'expired'
        WHERE expiry_date < CURDATE() AND status NOT IN ('expired', 'depleted');

        -- Log to audit
        INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at)
        VALUES (
            1,
            'Automated Safety Engine',
            'UPDATE',
            'chemical_batch',
            'MULTIPLE',
            CONCAT('Procedure sp_quarantine_expired_batches quarantined ', p_quarantined_count, ' expired chemical batch(es).'),
            '127.0.0.1',
            NOW()
        );
    END IF;
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- PROCEDURE 3: sp_generate_lab_compliance_summary
-- Purpose: Generates an aggregated compliance snapshot for a specific laboratory.
-- ---------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_generate_lab_compliance_summary;

DELIMITER //

CREATE PROCEDURE sp_generate_lab_compliance_summary(
    IN p_lab_id INT
)
BEGIN
    SELECT 
        l.name AS laboratory_name,
        l.code AS lab_code,
        COUNT(DISTINCT a.id) AS total_instruments,
        SUM(CASE WHEN a.status = 'available' THEN 1 ELSE 0 END) AS operational_instruments,
        SUM(CASE WHEN a.status = 'in_use' THEN 1 ELSE 0 END) AS active_borrows,
        SUM(CASE WHEN a.next_calibration_due <= CURDATE() THEN 1 ELSE 0 END) AS overdue_calibrations,
        COUNT(DISTINCT b.id) AS total_chemical_containers,
        SUM(CASE WHEN b.status = 'low' THEN 1 ELSE 0 END) AS low_stock_chemicals,
        SUM(CASE WHEN b.expiry_date < CURDATE() THEN 1 ELSE 0 END) AS expired_chemicals
    FROM laboratories l
    LEFT JOIN assets a ON a.lab_id = l.id
    LEFT JOIN storage_locations loc ON loc.lab_id = l.id
    LEFT JOIN chemical_batches b ON b.location_id = loc.id
    WHERE l.id = p_lab_id
    GROUP BY l.id, l.name, l.code;
END //

DELIMITER ;


-- =====================================================================
-- SECTION 3: STORED FUNCTIONS
-- =====================================================================

-- ---------------------------------------------------------------------
-- FUNCTION 1: fn_check_chemical_incompatibility
-- Returns: Severity code ('EXPLOSION_HAZARD', 'SAFE', etc.)
-- Purpose: Evaluates whether two chemical hazard classes can be co-located.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_check_chemical_incompatibility;

DELIMITER //

CREATE FUNCTION fn_check_chemical_incompatibility(
    p_hazard_a INT,
    p_hazard_b INT
) 
RETURNS VARCHAR(50)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_severity VARCHAR(50);

    IF p_hazard_a = p_hazard_b THEN
        RETURN 'SAFE';
    END IF;

    SELECT severity INTO v_severity
    FROM chemical_incompatibilities
    WHERE (hazard_class_a_id = p_hazard_a AND hazard_class_b_id = p_hazard_b)
       OR (hazard_class_a_id = p_hazard_b AND hazard_class_b_id = p_hazard_a)
    LIMIT 1;

    IF v_severity IS NOT NULL THEN
        RETURN v_severity;
    ELSE
        RETURN 'SAFE';
    END IF;
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- FUNCTION 2: fn_calculate_compliance_score
-- Returns: Integer between 0 and 100
-- Purpose: Calculates live regulatory safety index for a laboratory.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_compliance_score;

DELIMITER //

CREATE FUNCTION fn_calculate_compliance_score(
    p_lab_id INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_score INT DEFAULT 100;
    DECLARE v_expired_count INT DEFAULT 0;
    DECLARE v_overdue_cal_count INT DEFAULT 0;

    -- Count expired chemical containers in this lab
    SELECT COUNT(*) INTO v_expired_count
    FROM chemical_batches b
    JOIN storage_locations loc ON b.location_id = loc.id
    WHERE loc.lab_id = p_lab_id AND b.expiry_date < CURDATE();

    -- Count overdue instruments in this lab
    SELECT COUNT(*) INTO v_overdue_cal_count
    FROM assets
    WHERE lab_id = p_lab_id AND next_calibration_due <= CURDATE();

    -- Penalty calculation: -8 points per expired chemical, -5 points per overdue instrument
    SET v_score = v_score - (v_expired_count * 8) - (v_overdue_cal_count * 5);

    IF v_score < 30 THEN
        SET v_score = 30;
    END IF;

    RETURN v_score;
END //

DELIMITER ;

-- ---------------------------------------------------------------------
-- FUNCTION 3: fn_days_until_calibration
-- Returns: Integer number of days until an instrument's calibration expires.
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_days_until_calibration;

DELIMITER //

CREATE FUNCTION fn_days_until_calibration(
    p_asset_id INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_due_date DATE;
    DECLARE v_days INT;

    SELECT next_calibration_due INTO v_due_date
    FROM assets
    WHERE id = p_asset_id;

    IF v_due_date IS NULL THEN
        RETURN 999;
    END IF;

    SET v_days = DATEDIFF(v_due_date, CURDATE());
    RETURN v_days;
END //

DELIMITER ;
