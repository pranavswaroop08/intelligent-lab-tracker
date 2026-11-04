-- =====================================================================
-- Intelligent Laboratory Asset & Chemical Tracking Platform
-- Academic Project: PES University
-- Authors:
--   PES2UG24CS365 - Pranav Swaroop S
--   PES2UG24CS363 - Pranav Kaushal J
-- Relational Database Schema (MySQL 8.0 compatible, 3NF Normalized)
-- =====================================================================

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    srn_or_emp_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    department VARCHAR(100) DEFAULT 'Computer Science & Engineering',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Laboratories Table
CREATE TABLE IF NOT EXISTS laboratories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    building VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    in_charge_user_id INT,
    emergency_contact VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (in_charge_user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 4. Storage Locations Table (Cabinets, Fume Hoods, Freezers)
CREATE TABLE IF NOT EXISTS storage_locations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_id INT NOT NULL,
    location_code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    storage_type VARCHAR(50) NOT NULL, -- 'flammable_cabinet', 'acid_cabinet', 'base_cabinet', 'refrigerator_4c', 'freezer_minus20', 'general_shelf', 'fume_hood'
    room_no VARCHAR(50) NOT NULL,
    shelf_count INT DEFAULT 4,
    temperature_target_c DECIMAL(5, 2) DEFAULT 22.0,
    max_capacity_items INT DEFAULT 50,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES laboratories(id) ON DELETE CASCADE
);

-- 5. Hazard Classes Reference
CREATE TABLE IF NOT EXISTS hazard_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    ghs_icon_key VARCHAR(50),
    storage_category VARCHAR(50),
    description TEXT
);

-- 6. Chemicals Master Catalog
CREATE TABLE IF NOT EXISTS chemicals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    cas_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    iupac_name VARCHAR(200),
    formula VARCHAR(100),
    molecular_weight DECIMAL(10, 4),
    physical_state VARCHAR(20) DEFAULT 'liquid', -- 'liquid', 'solid', 'gas'
    density DECIMAL(10, 4),
    hazard_class_id INT,
    nfpa_health INT DEFAULT 0,
    nfpa_flammability INT DEFAULT 0,
    nfpa_instability INT DEFAULT 0,
    nfpa_special VARCHAR(20) DEFAULT '',
    ghs_signal_word VARCHAR(20) DEFAULT 'WARNING',
    ghs_hazard_codes TEXT, -- JSON string or comma-separated
    ghs_pictograms TEXT, -- JSON string
    sds_url VARCHAR(255),
    storage_requirements TEXT,
    min_threshold_qty DECIMAL(10, 2) DEFAULT 500.0,
    unit VARCHAR(20) DEFAULT 'ml',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hazard_class_id) REFERENCES hazard_classes(id) ON DELETE SET NULL
);

-- 7. Chemical Batches (Individual physical containers / bottles)
CREATE TABLE IF NOT EXISTS chemical_batches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chemical_id INT NOT NULL,
    barcode_qr VARCHAR(100) NOT NULL UNIQUE,
    batch_lot_number VARCHAR(100) NOT NULL,
    location_id INT NOT NULL,
    shelf_number INT DEFAULT 1,
    supplier VARCHAR(100),
    purity_percentage DECIMAL(5, 2) DEFAULT 99.0,
    manufacture_date DATE,
    received_date DATE NOT NULL,
    opened_date DATE,
    expiry_date DATE NOT NULL,
    initial_quantity DECIMAL(10, 2) NOT NULL,
    current_quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_inr DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'available', -- 'available', 'low', 'expired', 'quarantined', 'depleted'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE RESTRICT
);

-- 8. Chemical Incompatibilities Rule Matrix
CREATE TABLE IF NOT EXISTS chemical_incompatibilities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hazard_class_a_id INT NOT NULL,
    hazard_class_b_id INT NOT NULL,
    severity VARCHAR(30) NOT NULL, -- 'EXPLOSION_HAZARD', 'TOXIC_GAS_RELEASE', 'VIOLENT_EXOTHERMIC', 'FIRE_HAZARD', 'CORROSIVE_DEGRADATION'
    reason TEXT NOT NULL,
    safety_protocol TEXT NOT NULL,
    FOREIGN KEY (hazard_class_a_id) REFERENCES hazard_classes(id) ON DELETE CASCADE,
    FOREIGN KEY (hazard_class_b_id) REFERENCES hazard_classes(id) ON DELETE CASCADE
);

-- 9. Laboratory Assets & Equipment
CREATE TABLE IF NOT EXISTS assets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_tag VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'spectrophotometer', 'chromatograph', 'centrifuge', 'balance', 'autoclave', 'fume_hood', 'microscope', 'analyzer', 'heating_cooling'
    manufacturer VARCHAR(100),
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    lab_id INT NOT NULL,
    location_id INT,
    purchase_date DATE,
    warranty_expiry DATE,
    cost_inr DECIMAL(12, 2) DEFAULT 0.00,
    status VARCHAR(30) DEFAULT 'available', -- 'available', 'in_use', 'under_maintenance', 'calibration_due', 'decommissioned'
    calibration_interval_days INT DEFAULT 90,
    last_calibration_date DATE,
    next_calibration_due DATE,
    qr_code_token VARCHAR(100) UNIQUE,
    specifications TEXT,
    operating_instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES laboratories(id) ON DELETE RESTRICT,
    FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL
);

-- 10. Asset Borrowing & Usage Tracking
CREATE TABLE IF NOT EXISTS asset_borrow_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    user_id INT NOT NULL,
    borrowed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_at DATETIME NOT NULL,
    returned_at DATETIME,
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'returned', 'overdue'
    purpose TEXT NOT NULL,
    condition_on_checkout VARCHAR(100) DEFAULT 'Excellent',
    condition_on_return VARCHAR(100),
    runtime_hours DECIMAL(6, 2) DEFAULT 0.0,
    notes TEXT,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 11. Asset Calibrations & Maintenance Tickets
CREATE TABLE IF NOT EXISTS asset_calibrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    asset_id INT NOT NULL,
    calibration_date DATE NOT NULL,
    technician_name VARCHAR(100) NOT NULL,
    technician_organization VARCHAR(150),
    calibration_status VARCHAR(30) NOT NULL, -- 'passed', 'adjusted', 'failed'
    certificate_number VARCHAR(100),
    measured_deviation VARCHAR(150),
    standard_reference VARCHAR(150),
    next_due_date DATE NOT NULL,
    report_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- 12. Chemical Dispensations & Consumptions
CREATE TABLE IF NOT EXISTS dispensations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    batch_id INT NOT NULL,
    user_id INT NOT NULL,
    dispensed_amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    experiment_name VARCHAR(150) NOT NULL,
    course_or_project VARCHAR(100) DEFAULT 'DBMS Mini-Project Lab',
    dispensed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    remaining_quantity_after DECIMAL(10, 2) NOT NULL,
    witness_name VARCHAR(100),
    notes TEXT,
    FOREIGN KEY (batch_id) REFERENCES chemical_batches(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 13. Hazardous Waste Logs
CREATE TABLE IF NOT EXISTS waste_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    chemical_id INT,
    batch_id INT,
    waste_code VARCHAR(50) NOT NULL, -- 'HAZ-SOLV-ORG', 'HAZ-ACID-INORG', 'HAZ-BASE-INORG', 'HAZ-HEAVY-MET', 'BIO-CONTAM'
    waste_description VARCHAR(200) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    container_id VARCHAR(50) NOT NULL,
    location_id INT,
    logged_by_user_id INT NOT NULL,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'accumulating', -- 'accumulating', 'manifested', 'disposed'
    disposal_date DATE,
    manifest_number VARCHAR(100),
    disposal_vendor VARCHAR(150),
    FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE SET NULL,
    FOREIGN KEY (batch_id) REFERENCES chemical_batches(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES storage_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (logged_by_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 14. Immutable Security Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    user_name VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'DISPENSE', 'BORROW', 'RETURN', 'CALIBRATE', 'INCOMPATIBILITY_ALERT'
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    details TEXT,
    ip_address VARCHAR(50) DEFAULT '127.0.0.1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Performance Indexes for Fast Lookups
CREATE INDEX IF NOT EXISTS idx_chem_cas ON chemicals(cas_number);
CREATE INDEX IF NOT EXISTS idx_chem_name ON chemicals(name);
CREATE INDEX IF NOT EXISTS idx_batch_barcode ON chemical_batches(barcode_qr);
CREATE INDEX IF NOT EXISTS idx_batch_expiry ON chemical_batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_asset_tag ON assets(asset_tag);
CREATE INDEX IF NOT EXISTS idx_asset_next_cal ON assets(next_calibration_due);
CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(created_at);
