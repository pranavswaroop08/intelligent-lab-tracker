-- =====================================================================
-- Seed Data for Intelligent Laboratory Asset & Chemical Tracking Platform
-- PES University Lab Scenarios
-- =====================================================================

-- 1. Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'Admin', 'Full administrative authority over platform, laboratories, compliance, and users'),
(2, 'Lab Manager', 'Manages chemical stock, equipment calibration, inventory inspections, and approvals'),
(3, 'Researcher', 'Can borrow high-precision assets, dispense chemicals, and log experiment protocols'),
(4, 'Student', 'Can view safety sheets (SDS), check asset availability, and submit borrow/dispense requests');

-- 2. Hazard Classes
INSERT INTO hazard_classes (id, code, name, ghs_icon_key, storage_category, description) VALUES
(1, 'FLAM_LIQ', 'Flammable Liquids', 'flame', 'Flammables Cabinet', 'Liquids having a flash point of not more than 93°C. Must be grounded and kept away from ignition sources.'),
(2, 'CORR_ACID', 'Corrosive Inorganic Acids', 'corrosive', 'Acid Storage Cabinet', 'Strong acids capable of destroying living tissue and corroding metals. Store in secondary containment.'),
(3, 'CORR_BASE', 'Corrosive Bases & Alkalis', 'corrosive', 'Base Storage Cabinet', 'Strong alkaline substances. Must NEVER be stored with strong acids due to violent neutralization heat.'),
(4, 'OXIDIZER', 'Oxidizing Agents', 'flame_over_circle', 'Oxidizer Storage', 'Substances that readily evolve oxygen or facilitate combustion of flammable organic materials.'),
(5, 'TOXIC', 'Acute Toxicity & Poisons', 'skull_crossbones', 'Poisons Locker (Locked)', 'Substances capable of causing severe damage or death upon inhalation, ingestion, or dermal contact.'),
(6, 'WATER_REACT', 'Water-Reactive Chemicals', 'flame', 'Desiccator / Dry Cabinet', 'Substances that release flammable or toxic gases upon contact with moisture or water.'),
(7, 'BIOHAZARD', 'Biohazardous / Biological Reagents', 'biohazard', 'Refrigerator 4°C / Freezer', 'Biological cultures, enzymes, and sera requiring low-temperature cold chain.');

-- 3. Chemical Incompatibility Rules Matrix
INSERT INTO chemical_incompatibilities (hazard_class_a_id, hazard_class_b_id, severity, reason, safety_protocol) VALUES
(1, 4, 'EXPLOSION_HAZARD', 'Flammable solvents combined with strong oxidizers produce uncontrolled spontaneous combustion or explosive detonations.', 'Isolate by minimum 6 meters or store in separate dedicated UL-listed safety cabinets.'),
(2, 3, 'VIOLENT_EXOTHERMIC', 'Strong acids (e.g. HCl, H2SO4) mixed with strong bases (e.g. NaOH) undergo rapid, violent exothermic neutralization resulting in boiling acid spray.', 'Store in segregated dedicated polypropylene cabinets with separate sumps.'),
(2, 5, 'TOXIC_GAS_RELEASE', 'Acids reacting with cyanides or sulfides release lethal Hydrogen Cyanide (HCN) or Hydrogen Sulfide (H2S) toxic gas.', 'Absolute segregation mandatory. Cyanide cabinets must be individually locked and vented.'),
(1, 2, 'FIRE_HAZARD', 'Concentrated oxidizing acids (e.g. Nitric Acid) react violently with organic solvents (e.g. Acetone, Ethanol) generating severe fire and fume explosions.', 'Never place organic solvents and oxidizing acids on the same shelf or cabinet.');

-- 4. Laboratories
INSERT INTO laboratories (id, code, name, building, floor, in_charge_user_id, emergency_contact) VALUES
(1, 'PES-LAB-CHEM-301', 'Advanced Organic Synthesis & Instrumental Chemistry Lab', 'B.Tech Block 3', '3rd Floor', NULL, '+91-9845012345'),
(2, 'PES-LAB-BIOTECH-204', 'Molecular Biology & Biochemistry Core Facility', 'Science & Research Block', '2nd Floor', NULL, '+91-9845067890'),
(3, 'PES-LAB-PHYS-102', 'Materials Physics & Nanotechnology Lab', 'Main Campus Block A', '1st Floor', NULL, '+91-9845011223');

-- 5. Storage Locations
INSERT INTO storage_locations (id, lab_id, location_code, name, storage_type, room_no, shelf_count, temperature_target_c, max_capacity_items, notes) VALUES
(1, 1, 'CAB-FLAM-01', 'Main Safety Solvent Cabinet A1', 'flammable_cabinet', 'Room 301-A', 4, 20.0, 40, 'Yellow double-walled FM-approved fire cabinet with flame arrestor vent.'),
(2, 1, 'CAB-ACID-02', 'Polypropylene Acid Storage Cabinet B1', 'acid_cabinet', 'Room 301-B', 3, 21.0, 30, 'Corrosion-proof cabinet dedicated to non-oxidizing and mineral acids.'),
(3, 1, 'CAB-BASE-03', 'Caustics & Alkalis Storage Cabinet C1', 'base_cabinet', 'Room 301-B', 3, 22.0, 30, 'Separate cabinet for concentrated NaOH, KOH, and ammonium hydroxide.'),
(4, 1, 'CAB-OXID-04', 'Dedicated Oxidizer Storage Cabinet D1', 'oxidizer_cabinet', 'Room 301-C', 3, 20.0, 25, 'Specifically ventilated for nitrates, chlorates, and peroxides.'),
(5, 2, 'REF-COLD-01', 'Thermo Fisher Scientific 4°C Refrigerator', 'refrigerator_4c', 'Room 204', 5, 4.0, 60, 'Temperature-monitored cold chain for biochemical buffers, primers, and antibodies.'),
(6, 2, 'FRZ-MINUS20', 'Eppendorf -20°C Deep Freezer', 'freezer_minus20', 'Room 204', 4, -20.0, 50, 'Enzymes, DNA polymerase, and heat-labile cofactors.'),
(7, 1, 'SHELF-GEN-01', 'General Inorganic Salts Open Rack S1', 'general_shelf', 'Room 301', 5, 24.0, 80, 'Non-hazardous salts: NaCl, KCl, CaCl2, MgSO4.');

-- 6. Chemicals Master Catalog
INSERT INTO chemicals (id, cas_number, name, iupac_name, formula, molecular_weight, physical_state, density, hazard_class_id, nfpa_health, nfpa_flammability, nfpa_instability, nfpa_special, ghs_signal_word, ghs_hazard_codes, ghs_pictograms, sds_url, storage_requirements, min_threshold_qty, unit) VALUES
(1, '67-64-1', 'Acetone (HPLC Grade)', 'propan-2-one', 'C3H6O', 58.08, 'liquid', 0.7845, 1, 1, 3, 0, '', 'DANGER', '["H225", "H319", "H336"]', '["flame", "exclamation"]', 'https://chem-sds.pes.edu/sds/67-64-1.pdf', 'Store in Flammables Cabinet below 25°C. Ground during transfer.', 2000.0, 'ml'),
(2, '7647-01-0', 'Hydrochloric Acid 37% (Fuming)', 'chlorane', 'HCl', 36.46, 'liquid', 1.1900, 2, 3, 0, 1, '', 'DANGER', '["H314", "H335", "H290"]', '["corrosive", "exclamation"]', 'https://chem-sds.pes.edu/sds/7647-01-0.pdf', 'Store in Polypropylene Acid Cabinet. Dispense inside fume hood only.', 1000.0, 'ml'),
(3, '7697-37-2', 'Nitric Acid 68% (Puriss)', 'nitric acid', 'HNO3', 63.01, 'liquid', 1.4100, 4, 4, 0, 0, 'OX', 'DANGER', '["H272", "H314", "H330"]', '["flame_over_circle", "corrosive", "skull_crossbones"]', 'https://chem-sds.pes.edu/sds/7697-37-2.pdf', 'Strong oxidizer. Store segregated from flammables and organics. Incompatible with acetone!', 1000.0, 'ml'),
(4, '1310-73-2', 'Sodium Hydroxide Pellets (AR)', 'sodium hydroxide', 'NaOH', 40.00, 'solid', 2.1300, 3, 3, 0, 1, '', 'DANGER', '["H314", "H290"]', '["corrosive"]', 'https://chem-sds.pes.edu/sds/1310-73-2.pdf', 'Hygroscopic. Keep container tightly sealed in Base Storage Cabinet.', 500.0, 'g'),
(5, '64-17-5', 'Absolute Ethanol 99.9%', 'ethanol', 'C2H6O', 46.07, 'liquid', 0.7890, 1, 2, 3, 0, '', 'DANGER', '["H225", "H319"]', '["flame", "exclamation"]', 'https://chem-sds.pes.edu/sds/64-17-5.pdf', 'Flammable liquid. Store in certified flammables cabinet away from oxidizers.', 2500.0, 'ml'),
(6, '60-29-7', 'Diethyl Ether (Anhydrous)', 'ethoxyethane', 'C4H10O', 74.12, 'liquid', 0.7134, 1, 2, 4, 1, '', 'DANGER', '["H224", "H302", "H336"]', '["flame", "exclamation"]', 'https://chem-sds.pes.edu/sds/60-29-7.pdf', 'Extremely flammable. Forms explosive peroxides upon exposure to air and light.', 500.0, 'ml'),
(7, '7722-64-7', 'Potassium Permanganate (Crystalline)', 'potassium permanganate', 'KMnO4', 158.03, 'solid', 2.7000, 4, 2, 0, 0, 'OX', 'DANGER', '["H272", "H302", "H314", "H410"]', '["flame_over_circle", "corrosive", "environment"]', 'https://chem-sds.pes.edu/sds/7722-64-7.pdf', 'Strong oxidizer. Store separately from combustible substances and glycerol.', 250.0, 'g'),
(8, '143-33-9', 'Sodium Cyanide 98%', 'sodium cyanide', 'NaCN', 49.01, 'solid', 1.6000, 5, 4, 0, 0, '', 'DANGER', '["H300", "H310", "H330", "H410"]', '["skull_crossbones", "environment"]', 'https://chem-sds.pes.edu/sds/143-33-9.pdf', 'Lethal poison. Lock in poison cabinet. NEVER expose to acids (liberates deadly HCN gas).', 100.0, 'g');

-- 7. Chemical Batches (Real containers in lab)
INSERT INTO chemical_batches (id, chemical_id, barcode_qr, batch_lot_number, location_id, shelf_number, supplier, purity_percentage, manufacture_date, received_date, opened_date, expiry_date, initial_quantity, current_quantity, unit, cost_inr, status, notes) VALUES
(1, 1, 'QR-CHEM-ACE-001', 'LOT-MERCK-2026A', 1, 2, 'Merck Life Science', 99.8, '2026-01-10', '2026-01-25', '2026-02-01', '2027-01-25', 2500.0, 1850.0, 'ml', 1450.00, 'available', 'HPLC Grade bottle in Cabinet A1 shelf 2.'),
(2, 2, 'QR-CHEM-HCL-001', 'LOT-SIGMA-8841B', 2, 1, 'Sigma-Aldrich', 37.0, '2025-11-15', '2025-12-01', '2025-12-10', '2027-12-01', 1000.0, 420.0, 'ml', 980.00, 'low', 'Low stock alert active. Acid cabinet B1 shelf 1.'),
(3, 3, 'QR-CHEM-HNO3-001', 'LOT-SDCHEM-3329', 4, 1, 'SD Fine Chemicals', 68.5, '2026-03-01', '2026-03-15', '2026-03-20', '2027-03-15', 1000.0, 850.0, 'ml', 1250.00, 'available', 'Segregated in Oxidizer Cabinet D1.'),
(4, 4, 'QR-CHEM-NAOH-001', 'LOT-AVANTOR-491', 3, 2, 'Avantor Performance', 99.5, '2026-02-10', '2026-02-28', '2026-03-05', '2028-02-28', 1000.0, 950.0, 'g', 620.00, 'available', 'Pellets in Base Cabinet C1 shelf 2.'),
(5, 5, 'QR-CHEM-ETOH-001', 'LOT-BENGAL-7712', 1, 1, 'Bengal Chemicals', 99.9, '2026-01-05', '2026-01-18', '2026-01-20', '2026-11-20', 5000.0, 3100.0, 'ml', 2800.00, 'available', 'Expiring within 30 days! Routine solvent supply.'),
(6, 6, 'QR-CHEM-DETH-001', 'LOT-SIGMA-9921D', 1, 3, 'Sigma-Aldrich', 99.5, '2025-06-10', '2025-07-01', '2025-07-15', '2026-07-01', 500.0, 120.0, 'ml', 2100.00, 'expired', 'Expired batch quarantined for peroxide check.'),
(7, 7, 'QR-CHEM-KMNO4-01', 'LOT-MERCK-5542', 4, 2, 'Merck Life Science', 99.0, '2025-09-01', '2025-09-20', '2025-10-01', '2028-09-20', 500.0, 380.0, 'g', 890.00, 'available', 'Stored with oxidizers in Cabinet D1.'),
(8, 8, 'QR-CHEM-NACN-001', 'LOT-ALFA-7703X', 2, 3, 'Alfa Aesar', 98.0, '2026-01-12', '2026-02-01', NULL, '2028-02-01', 250.0, 250.0, 'g', 4500.00, 'available', 'Unopened in double containment secondary vessel.');

-- 8. Laboratory Assets & Equipment
INSERT INTO assets (id, asset_tag, name, category, manufacturer, model_number, serial_number, lab_id, location_id, purchase_date, warranty_expiry, cost_inr, status, calibration_interval_days, last_calibration_date, next_calibration_due, qr_code_token, specifications, operating_instructions) VALUES
(1, 'AST-SPECTRO-001', 'Double-Beam UV-Visible Spectrophotometer', 'spectrophotometer', 'Shimadzu Corp', 'UV-1900i', 'SHIM-UV-98214', 1, 7, '2024-08-10', '2027-08-10', 850000.00, 'available', 180, '2026-06-15', '2026-12-15', 'QR-AST-SHIM-UV1900', 'Wavelength range 190 to 1100 nm, 1 nm spectral bandwidth, ultra-fast 29000 nm/min scan speed.', 'Warm up for 20 minutes before zeroing with solvent blank. Always clean quartz cuvettes with spectroscopy-grade lens tissue.'),
(2, 'AST-CENTRI-002', 'High-Speed Refrigerated Microcentrifuge', 'centrifuge', 'Eppendorf', '5424 R', 'EPP-CENT-55412', 2, 5, '2025-01-20', '2028-01-20', 420000.00, 'in_use', 90, '2026-08-10', '2026-11-10', 'QR-AST-EPP-5424R', 'Max speed 15000 RPM (21,130 x g), temp range -10°C to +40°C, 24-place rotor.', 'Always balance tubes symmetrically with identical weights (+-0.05g). Never open lid until rotor has come to a complete standstill.'),
(3, 'AST-BALANCE-003', 'Analytical Precision Micro-Balance (0.1 mg)', 'balance', 'Sartorius AG', 'Secura 224-1S', 'SART-SEC-1092', 1, 7, '2024-03-15', '2027-03-15', 290000.00, 'calibration_due', 60, '2026-08-01', '2026-10-01', 'QR-AST-SART-224', 'Capacity 220 g, Readability 0.1 mg, Internal isoCAL automated calibration and leveling sensor.', 'Close draft shields completely. Do not lean on marble balance bench. Clean pan immediately with camel-hair brush if spilled.'),
(4, 'AST-ROTAVAP-004', 'Digital Rotary Evaporator System', 'analyzer', 'Buchi Labortechnik', 'Rotavapor R-300', 'BUCH-ROTA-7741', 1, 1, '2024-11-05', '2027-11-05', 680000.00, 'available', 120, '2026-07-20', '2026-11-20', 'QR-AST-BUCH-R300', 'Heating bath B-305 (20-220°C), V-300 vacuum pump with interface I-300 Pro.', 'Inspect glassware for star cracks before pulling vacuum. Ensure cooling chiller recirculates at <= 5°C before solvent distillation.'),
(5, 'AST-MICROSCOPE-005', 'LED Trinocular Biological Research Microscope', 'microscope', 'Olympus / Evident', 'CX23 LED', 'OLY-CX23-3391', 2, 5, '2025-02-10', '2028-02-10', 165000.00, 'available', 365, '2026-02-15', '2027-02-15', 'QR-AST-OLY-CX23', 'Plan achromat objectives 4x, 10x, 40x, 100x oil immersion. Built-in 4K digital camera output.', 'Clean oil immersion lens with ether-alcohol mixture immediately after use. Always lower stage before removing slide.'),
(6, 'AST-AUTOCLAVE-006', 'Vertical High-Pressure Steam Sterilizer Autoclave', 'autoclave', 'Tomy Digital', 'SX-500', 'TOMY-SX-6629', 2, 5, '2023-09-12', '2026-09-12', 390000.00, 'under_maintenance', 90, '2026-05-10', '2026-08-10', 'QR-AST-TOMY-SX500', 'Chamber capacity 50 Liters, 105°C - 135°C sterilization temp, automated dual interlocking safety lid.', 'Gasket replacement scheduled. Do not operate until pressure safety valve certification is renewed.');

-- 9. Asset Borrow Logs (Active and past borrows)
INSERT INTO asset_borrow_logs (id, asset_id, user_id, borrowed_at, expected_return_at, returned_at, status, purpose, condition_on_checkout, condition_on_return, runtime_hours, notes) VALUES
(1, 2, 1, '2026-11-04 10:30:00', '2026-11-04 16:30:00', NULL, 'active', 'Purification of recombinant protein constructs for DBMS Capstone validation', 'Excellent', NULL, 3.5, 'Operating at 4°C at 12,000 RPM'),
(2, 1, 2, '2026-11-02 09:15:00', '2026-11-02 14:00:00', '2026-11-02 13:45:00', 'returned', 'Absorbance kinetic assay of ester hydrolysis in organic solvents', 'Clean & Calibrated', 'Good condition, optical cell washed', 4.0, 'Baseline recorded at 280nm'),
(3, 4, 1, '2026-10-28 14:00:00', '2026-10-28 18:00:00', '2026-10-28 17:30:00', 'returned', 'Concentration of extracted natural flavonoids from ethanol extract', 'Excellent', 'Cleaned with acetone', 3.0, 'Vacuum held at 45 mbar without leaks');

-- 10. Asset Calibrations
INSERT INTO asset_calibrations (id, asset_id, calibration_date, technician_name, technician_organization, calibration_status, certificate_number, measured_deviation, standard_reference, next_due_date, report_notes) VALUES
(1, 1, '2026-06-15', 'Nagaraj Shenoy', 'Shimadzu Authorized Metrology Services', 'passed', 'CAL-SHIM-2026-88', '+-0.08 nm at 656.1 nm D2 peak', 'Holmium Oxide Glass & Deuterium Lamp', '2026-12-15', 'Optical alignment and beam linearity verified within ISO/IEC 17025 tolerance.'),
(2, 3, '2026-08-01', 'Kavitha Murthy', 'National Accreditation Metrology Lab', 'adjusted', 'CAL-SART-2026-102', '+0.4 mg drift corrected via isoCAL internal mass', 'NABL Class E2 Calibration Mass Set', '2026-10-01', 'Cornerload and repeatability recalibrated. Recommended quarterly calibration due to micro-sensitivity.');

-- 11. Chemical Dispensations
INSERT INTO dispensations (id, batch_id, user_id, dispensed_amount, unit, experiment_name, course_or_project, dispensed_at, remaining_quantity_after, witness_name, notes) VALUES
(1, 1, 1, 150.0, 'ml', 'Thin Layer Chromatography TLC eluent preparation', 'PESU Organic Chemistry Lab Exam', '2026-11-03 11:20:00', 1850.0, 'Pranav Kaushal J', 'Used HPLC acetone in 1:1 mixture with Hexane.'),
(2, 2, 2, 80.0, 'ml', 'Standard Acid-Base Titration Standardization', 'DBMS Lab Assignment Project', '2026-11-02 14:10:00', 420.0, 'Pranav Swaroop S', 'Dispensed under fume hood with splash goggles.');

-- 12. Hazardous Waste Logs
INSERT INTO waste_logs (id, chemical_id, batch_id, waste_code, waste_description, quantity, unit, container_id, location_id, logged_by_user_id, logged_at, status, disposal_date, manifest_number, disposal_vendor) VALUES
(1, 1, 1, 'HAZ-SOLV-ORG', 'Non-halogenated organic solvents mixture (Acetone + Ethanol waste)', 8.5, 'l', 'CONT-ORG-W-01', 1, 1, '2026-10-30 16:45:00', 'accumulating', NULL, NULL, NULL),
(2, 2, 2, 'HAZ-ACID-INORG', 'Neutralized dilute inorganic acid effluent (pH 6.5 buffered)', 15.0, 'l', 'CONT-ACID-W-02', 2, 2, '2026-10-25 15:00:00', 'manifested', '2026-11-15', 'MNF-PES-2026-089', 'Karnataka State Pollution Control Board Approved Incinerator Ltd');

-- 13. Audit Logs
INSERT INTO audit_logs (id, user_id, user_name, action, entity_type, entity_id, details, ip_address, created_at) VALUES
(1, 1, 'Pranav Swaroop S', 'CREATE', 'chemical', '1', 'Added Acetone (HPLC Grade) CAS 67-64-1 to catalog with NFPA ratings 1-3-0', '127.0.0.1', '2026-10-01 10:00:00'),
(2, 2, 'Pranav Kaushal J', 'CREATE', 'asset', '1', 'Registered UV-Visible Spectrophotometer Shimadzu UV-1900i with tag AST-SPECTRO-001', '127.0.0.1', '2026-10-02 11:15:00'),
(3, 1, 'Pranav Swaroop S', 'INCOMPATIBILITY_ALERT', 'safety_engine', 'CAB-01', 'Blocked co-location of Nitric Acid 68% and Acetone in Cabinet A1 due to spontaneous explosive fire hazard.', '127.0.0.1', '2026-10-05 14:30:00');
