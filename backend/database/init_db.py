"""
Database Initialization & Seeder Script
Initializes tables and seeds initial PES University laboratory records.
Compatible with both MySQL and SQLite.
"""

import sys
from pathlib import Path

# Add backend directory to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from datetime import date, datetime, timedelta
from app import create_app
from app.models import (
    db, Role, User, Laboratory, StorageLocation, HazardClass, Chemical,
    ChemicalBatch, ChemicalIncompatibility, Asset, AssetBorrowLog,
    AssetCalibration, Dispensation, WasteLog, AuditLog
)

def init_database():
    app = create_app()
    with app.app_context():
        print(f"[InitDB] Connected using DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        print("[InitDB] Creating database tables...")
        db.create_all()

        # Install Database Triggers
        print("[InitDB] Installing Database Triggers...")
        triggers_sql = [
            """
            CREATE TRIGGER IF NOT EXISTS trg_after_dispensation_deduct_stock
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
            END;
            """,
            """
            CREATE TRIGGER IF NOT EXISTS trg_after_calibration_update_asset
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
            END;
            """
        ]
        for trg in triggers_sql:
            try:
                db.session.execute(db.text(trg))
            except Exception as e:
                print(f"[InitDB] Trigger creation note: {e}")
        db.session.commit()

        # Install Database Views (based on 14-table ER Diagram)
        print("[InitDB] Installing Database Views...")
        views_sql = [
            """
            CREATE VIEW IF NOT EXISTS vw_chemical_inventory_summary AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS vw_asset_maintenance_status AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS vw_hazard_incompatibility_matrix AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS vw_dispensation_audit_trail AS
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
            """,
            """
            CREATE VIEW IF NOT EXISTS vw_lab_safety_compliance_snapshot AS
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
            """
        ]
        for vw in views_sql:
            try:
                db.session.execute(db.text(vw))
            except Exception as e:
                print(f"[InitDB] View creation note: {e}")
        db.session.commit()

        # Check if already seeded
        if User.query.first():
            print("[InitDB] Database already initialized and seeded with records.")
            return

        print("[InitDB] Seeding roles...")
        roles = [
            Role(id=1, name='Admin', description='Full administrative authority over platform, laboratories, compliance, and users'),
            Role(id=2, name='Lab Manager', description='Manages chemical stock, equipment calibration, inventory inspections, and approvals'),
            Role(id=3, name='Researcher', description='Can borrow high-precision assets, dispense chemicals, and log experiment protocols'),
            Role(id=4, name='Student', description='Can view safety sheets (SDS), check asset availability, and submit borrow/dispense requests')
        ]
        db.session.add_all(roles)
        db.session.commit()

        print("[InitDB] Seeding users (including project authors)...")
        users = [
            User(
                id=1,
                srn_or_emp_id='PES2UG24CS365',
                name='Pranav Swaroop S',
                email='pranav.swaroop@pes.edu',
                role_id=1,
                department='Computer Science & Engineering',
                phone='+91-9845012365'
            ),
            User(
                id=2,
                srn_or_emp_id='PES2UG24CS363',
                name='Pranav Kaushal J',
                email='pranav.kaushal@pes.edu',
                role_id=2,
                department='Computer Science & Engineering',
                phone='+91-9845012363'
            ),
            User(
                id=3,
                srn_or_emp_id='PES-FAC-102',
                name='Dr. Rajeshwari K',
                email='rajeshwari.k@pes.edu',
                role_id=1,
                department='Chemistry & Material Sciences',
                phone='+91-9845011223'
            ),
            User(
                id=4,
                srn_or_emp_id='PES2UG24CS042',
                name='Ananya Rao',
                email='ananya.rao@pes.edu',
                role_id=3,
                department='Biotechnology & Life Sciences',
                phone='+91-9845088990'
            )
        ]
        for u in users:
            u.set_password('password123')
            db.session.add(u)
        db.session.commit()

        print("[InitDB] Seeding hazard classes...")
        hazards = [
            HazardClass(id=1, code='FLAM_LIQ', name='Flammable Liquids', ghs_icon_key='flame', storage_category='Flammables Cabinet', description='Liquids having a flash point of not more than 93°C. Must be grounded and kept away from ignition sources.'),
            HazardClass(id=2, code='CORR_ACID', name='Corrosive Inorganic Acids', ghs_icon_key='corrosive', storage_category='Acid Storage Cabinet', description='Strong acids capable of destroying living tissue and corroding metals. Store in secondary containment.'),
            HazardClass(id=3, code='CORR_BASE', name='Corrosive Bases & Alkalis', ghs_icon_key='corrosive', storage_category='Base Storage Cabinet', description='Strong alkaline substances. Must NEVER be stored with strong acids due to violent neutralization heat.'),
            HazardClass(id=4, code='OXIDIZER', name='Oxidizing Agents', ghs_icon_key='flame_over_circle', storage_category='Oxidizer Storage', description='Substances that readily evolve oxygen or facilitate combustion of flammable organic materials.'),
            HazardClass(id=5, code='TOXIC', name='Acute Toxicity & Poisons', ghs_icon_key='skull_crossbones', storage_category='Poisons Locker (Locked)', description='Substances capable of causing severe damage or death upon inhalation, ingestion, or dermal contact.'),
            HazardClass(id=6, code='WATER_REACT', name='Water-Reactive Chemicals', ghs_icon_key='flame', storage_category='Desiccator / Dry Cabinet', description='Substances that release flammable or toxic gases upon contact with moisture or water.'),
            HazardClass(id=7, code='BIOHAZARD', name='Biohazardous / Biological Reagents', ghs_icon_key='biohazard', storage_category='Refrigerator 4°C / Freezer', description='Biological cultures, enzymes, and sera requiring low-temperature cold chain.')
        ]
        db.session.add_all(hazards)
        db.session.commit()

        print("[InitDB] Seeding incompatibility rules matrix...")
        rules = [
            ChemicalIncompatibility(hazard_class_a_id=1, hazard_class_b_id=4, severity='EXPLOSION_HAZARD', reason='Flammable solvents combined with strong oxidizers produce uncontrolled spontaneous combustion or explosive detonations.', safety_protocol='Isolate by minimum 6 meters or store in separate dedicated UL-listed safety cabinets.'),
            ChemicalIncompatibility(hazard_class_a_id=2, hazard_class_b_id=3, severity='VIOLENT_EXOTHERMIC', reason='Strong acids (e.g. HCl, H2SO4) mixed with strong bases (e.g. NaOH) undergo rapid, violent exothermic neutralization resulting in boiling acid spray.', safety_protocol='Store in segregated dedicated polypropylene cabinets with separate sumps.'),
            ChemicalIncompatibility(hazard_class_a_id=2, hazard_class_b_id=5, severity='TOXIC_GAS_RELEASE', reason='Acids reacting with cyanides or sulfides release lethal Hydrogen Cyanide (HCN) or Hydrogen Sulfide (H2S) toxic gas.', safety_protocol='Absolute segregation mandatory. Cyanide cabinets must be individually locked and vented.'),
            ChemicalIncompatibility(hazard_class_a_id=1, hazard_class_b_id=2, severity='FIRE_HAZARD', reason='Concentrated oxidizing acids (e.g. Nitric Acid) react violently with organic solvents (e.g. Acetone, Ethanol) generating severe fire and fume explosions.', safety_protocol='Never place organic solvents and oxidizing acids on the same shelf or cabinet.')
        ]
        db.session.add_all(rules)
        db.session.commit()

        print("[InitDB] Seeding laboratories...")
        labs = [
            Laboratory(id=1, code='PES-LAB-CHEM-301', name='Advanced Organic Synthesis & Instrumental Chemistry Lab', building='B.Tech Block 3', floor='3rd Floor', in_charge_user_id=2, emergency_contact='+91-9845012345'),
            Laboratory(id=2, code='PES-LAB-BIOTECH-204', name='Molecular Biology & Biochemistry Core Facility', building='Science & Research Block', floor='2nd Floor', in_charge_user_id=1, emergency_contact='+91-9845067890'),
            Laboratory(id=3, code='PES-LAB-PHYS-102', name='Materials Physics & Nanotechnology Lab', building='Main Campus Block A', floor='1st Floor', in_charge_user_id=3, emergency_contact='+91-9845011223')
        ]
        db.session.add_all(labs)
        db.session.commit()

        print("[InitDB] Seeding storage locations...")
        locations = [
            StorageLocation(id=1, lab_id=1, location_code='CAB-FLAM-01', name='Main Safety Solvent Cabinet A1', storage_type='flammable_cabinet', room_no='Room 301-A', shelf_count=4, temperature_target_c=20.0, max_capacity_items=40, notes='Yellow double-walled FM-approved fire cabinet with flame arrestor vent.'),
            StorageLocation(id=2, lab_id=1, location_code='CAB-ACID-02', name='Polypropylene Acid Storage Cabinet B1', storage_type='acid_cabinet', room_no='Room 301-B', shelf_count=3, temperature_target_c=21.0, max_capacity_items=30, notes='Corrosion-proof cabinet dedicated to non-oxidizing and mineral acids.'),
            StorageLocation(id=3, lab_id=1, location_code='CAB-BASE-03', name='Caustics & Alkalis Storage Cabinet C1', storage_type='base_cabinet', room_no='Room 301-B', shelf_count=3, temperature_target_c=22.0, max_capacity_items=30, notes='Separate cabinet for concentrated NaOH, KOH, and ammonium hydroxide.'),
            StorageLocation(id=4, lab_id=1, location_code='CAB-OXID-04', name='Dedicated Oxidizer Storage Cabinet D1', storage_type='oxidizer_cabinet', room_no='Room 301-C', shelf_count=3, temperature_target_c=20.0, max_capacity_items=25, notes='Specifically ventilated for nitrates, chlorates, and peroxides.'),
            StorageLocation(id=5, lab_id=2, location_code='REF-COLD-01', name='Thermo Fisher Scientific 4°C Refrigerator', storage_type='refrigerator_4c', room_no='Room 204', shelf_count=5, temperature_target_c=4.0, max_capacity_items=60, notes='Temperature-monitored cold chain for biochemical buffers, primers, and antibodies.'),
            StorageLocation(id=6, lab_id=2, location_code='FRZ-MINUS20', name='Eppendorf -20°C Deep Freezer', storage_type='freezer_minus20', room_no='Room 204', shelf_count=4, temperature_target_c=-20.0, max_capacity_items=50, notes='Enzymes, DNA polymerase, and heat-labile cofactors.'),
            StorageLocation(id=7, lab_id=1, location_code='SHELF-GEN-01', name='General Inorganic Salts Open Rack S1', storage_type='general_shelf', room_no='Room 301', shelf_count=5, temperature_target_c=24.0, max_capacity_items=80, notes='Non-hazardous salts: NaCl, KCl, CaCl2, MgSO4.')
        ]
        db.session.add_all(locations)
        db.session.commit()

        print("[InitDB] Seeding chemical catalog...")
        chemicals = [
            Chemical(id=1, cas_number='67-64-1', name='Acetone (HPLC Grade)', iupac_name='propan-2-one', formula='C3H6O', molecular_weight=58.08, physical_state='liquid', density=0.7845, hazard_class_id=1, nfpa_health=1, nfpa_flammability=3, nfpa_instability=0, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H225", "H319", "H336"]', ghs_pictograms='["flame", "exclamation"]', sds_url='https://chem-sds.pes.edu/sds/67-64-1.pdf', storage_requirements='Store in Flammables Cabinet below 25°C. Ground during transfer.', min_threshold_qty=2000.0, unit='ml'),
            Chemical(id=2, cas_number='7647-01-0', name='Hydrochloric Acid 37% (Fuming)', iupac_name='chlorane', formula='HCl', molecular_weight=36.46, physical_state='liquid', density=1.1900, hazard_class_id=2, nfpa_health=3, nfpa_flammability=0, nfpa_instability=1, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H314", "H335", "H290"]', ghs_pictograms='["corrosive", "exclamation"]', sds_url='https://chem-sds.pes.edu/sds/7647-01-0.pdf', storage_requirements='Store in Polypropylene Acid Cabinet. Dispense inside fume hood only.', min_threshold_qty=1000.0, unit='ml'),
            Chemical(id=3, cas_number='7697-37-2', name='Nitric Acid 68% (Puriss)', iupac_name='nitric acid', formula='HNO3', molecular_weight=63.01, physical_state='liquid', density=1.4100, hazard_class_id=4, nfpa_health=4, nfpa_flammability=0, nfpa_instability=0, nfpa_special='OX', ghs_signal_word='DANGER', ghs_hazard_codes='["H272", "H314", "H330"]', ghs_pictograms='["flame_over_circle", "corrosive", "skull_crossbones"]', sds_url='https://chem-sds.pes.edu/sds/7697-37-2.pdf', storage_requirements='Strong oxidizer. Store segregated from flammables and organics. Incompatible with acetone!', min_threshold_qty=1000.0, unit='ml'),
            Chemical(id=4, cas_number='1310-73-2', name='Sodium Hydroxide Pellets (AR)', iupac_name='sodium hydroxide', formula='NaOH', molecular_weight=40.00, physical_state='solid', density=2.1300, hazard_class_id=3, nfpa_health=3, nfpa_flammability=0, nfpa_instability=1, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H314", "H290"]', ghs_pictograms='["corrosive"]', sds_url='https://chem-sds.pes.edu/sds/1310-73-2.pdf', storage_requirements='Hygroscopic. Keep container tightly sealed in Base Storage Cabinet.', min_threshold_qty=500.0, unit='g'),
            Chemical(id=5, cas_number='64-17-5', name='Absolute Ethanol 99.9%', iupac_name='ethanol', formula='C2H6O', molecular_weight=46.07, physical_state='liquid', density=0.7890, hazard_class_id=1, nfpa_health=2, nfpa_flammability=3, nfpa_instability=0, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H225", "H319"]', ghs_pictograms='["flame", "exclamation"]', sds_url='https://chem-sds.pes.edu/sds/64-17-5.pdf', storage_requirements='Flammable liquid. Store in certified flammables cabinet away from oxidizers.', min_threshold_qty=2500.0, unit='ml'),
            Chemical(id=6, cas_number='60-29-7', name='Diethyl Ether (Anhydrous)', iupac_name='ethoxyethane', formula='C4H10O', molecular_weight=74.12, physical_state='liquid', density=0.7134, hazard_class_id=1, nfpa_health=2, nfpa_flammability=4, nfpa_instability=1, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H224", "H302", "H336"]', ghs_pictograms='["flame", "exclamation"]', sds_url='https://chem-sds.pes.edu/sds/60-29-7.pdf', storage_requirements='Extremely flammable. Forms explosive peroxides upon exposure to air and light.', min_threshold_qty=500.0, unit='ml'),
            Chemical(id=7, cas_number='7722-64-7', name='Potassium Permanganate (Crystalline)', iupac_name='potassium permanganate', formula='KMnO4', molecular_weight=158.03, physical_state='solid', density=2.7000, hazard_class_id=4, nfpa_health=2, nfpa_flammability=0, nfpa_instability=0, nfpa_special='OX', ghs_signal_word='DANGER', ghs_hazard_codes='["H272", "H302", "H314", "H410"]', ghs_pictograms='["flame_over_circle", "corrosive", "environment"]', sds_url='https://chem-sds.pes.edu/sds/7722-64-7.pdf', storage_requirements='Strong oxidizer. Store separately from combustible substances and glycerol.', min_threshold_qty=250.0, unit='g'),
            Chemical(id=8, cas_number='143-33-9', name='Sodium Cyanide 98%', iupac_name='sodium cyanide', formula='NaCN', molecular_weight=49.01, physical_state='solid', density=1.6000, hazard_class_id=5, nfpa_health=4, nfpa_flammability=0, nfpa_instability=0, nfpa_special='', ghs_signal_word='DANGER', ghs_hazard_codes='["H300", "H310", "H330", "H410"]', ghs_pictograms='["skull_crossbones", "environment"]', sds_url='https://chem-sds.pes.edu/sds/143-33-9.pdf', storage_requirements='Lethal poison. Lock in poison cabinet. NEVER expose to acids (liberates deadly HCN gas).', min_threshold_qty=100.0, unit='g')
        ]
        db.session.add_all(chemicals)
        db.session.commit()

        print("[InitDB] Seeding physical chemical batches with QR tokens...")
        batches = [
            ChemicalBatch(id=1, chemical_id=1, barcode_qr='QR-CHEM-ACE-001', batch_lot_number='LOT-MERCK-2026A', location_id=1, shelf_number=2, supplier='Merck Life Science', purity_percentage=99.8, manufacture_date=date(2026, 1, 10), received_date=date(2026, 1, 25), opened_date=date(2026, 2, 1), expiry_date=date(2027, 1, 25), initial_quantity=2500.0, current_quantity=1850.0, unit='ml', cost_inr=1450.00, status='available', notes='HPLC Grade bottle in Cabinet A1 shelf 2.'),
            ChemicalBatch(id=2, chemical_id=2, barcode_qr='QR-CHEM-HCL-001', batch_lot_number='LOT-SIGMA-8841B', location_id=2, shelf_number=1, supplier='Sigma-Aldrich', purity_percentage=37.0, manufacture_date=date(2025, 11, 15), received_date=date(2025, 12, 1), opened_date=date(2025, 12, 10), expiry_date=date(2027, 12, 1), initial_quantity=1000.0, current_quantity=420.0, unit='ml', cost_inr=980.00, status='low', notes='Low stock alert active. Acid cabinet B1 shelf 1.'),
            ChemicalBatch(id=3, chemical_id=3, barcode_qr='QR-CHEM-HNO3-001', batch_lot_number='LOT-SDCHEM-3329', location_id=4, shelf_number=1, supplier='SD Fine Chemicals', purity_percentage=68.5, manufacture_date=date(2026, 3, 1), received_date=date(2026, 3, 15), opened_date=date(2026, 3, 20), expiry_date=date(2027, 3, 15), initial_quantity=1000.0, current_quantity=850.0, unit='ml', cost_inr=1250.00, status='available', notes='Segregated in Oxidizer Cabinet D1.'),
            ChemicalBatch(id=4, chemical_id=4, barcode_qr='QR-CHEM-NAOH-001', batch_lot_number='LOT-AVANTOR-491', location_id=3, shelf_number=2, supplier='Avantor Performance', purity_percentage=99.5, manufacture_date=date(2026, 2, 10), received_date=date(2026, 2, 28), opened_date=date(2026, 3, 5), expiry_date=date(2028, 2, 28), initial_quantity=1000.0, current_quantity=950.0, unit='g', cost_inr=620.00, status='available', notes='Pellets in Base Cabinet C1 shelf 2.'),
            ChemicalBatch(id=5, chemical_id=5, barcode_qr='QR-CHEM-ETOH-001', batch_lot_number='LOT-BENGAL-7712', location_id=1, shelf_number=1, supplier='Bengal Chemicals', purity_percentage=99.9, manufacture_date=date(2026, 1, 5), received_date=date(2026, 1, 18), opened_date=date(2026, 1, 20), expiry_date=date.today() + timedelta(days=16), initial_quantity=5000.0, current_quantity=3100.0, unit='ml', cost_inr=2800.00, status='available', notes='Expiring within 30 days! Routine solvent supply.'),
            ChemicalBatch(id=6, chemical_id=6, barcode_qr='QR-CHEM-DETH-001', batch_lot_number='LOT-SIGMA-9921D', location_id=1, shelf_number=3, supplier='Sigma-Aldrich', purity_percentage=99.5, manufacture_date=date(2025, 6, 10), received_date=date(2025, 7, 1), opened_date=date(2025, 7, 15), expiry_date=date(2026, 7, 1), initial_quantity=500.0, current_quantity=120.0, unit='ml', cost_inr=2100.00, status='expired', notes='Expired batch quarantined for peroxide check.'),
            ChemicalBatch(id=7, chemical_id=7, barcode_qr='QR-CHEM-KMNO4-01', batch_lot_number='LOT-MERCK-5542', location_id=4, shelf_number=2, supplier='Merck Life Science', purity_percentage=99.0, manufacture_date=date(2025, 9, 1), received_date=date(2025, 9, 20), opened_date=date(2025, 10, 1), expiry_date=date(2028, 9, 20), initial_quantity=500.0, current_quantity=380.0, unit='g', cost_inr=890.00, status='available', notes='Stored with oxidizers in Cabinet D1.'),
            ChemicalBatch(id=8, chemical_id=8, barcode_qr='QR-CHEM-NACN-001', batch_lot_number='LOT-ALFA-7703X', location_id=2, shelf_number=3, supplier='Alfa Aesar', purity_percentage=98.0, manufacture_date=date(2026, 1, 12), received_date=date(2026, 2, 1), opened_date=None, expiry_date=date(2028, 2, 1), initial_quantity=250.0, current_quantity=250.0, unit='g', cost_inr=4500.00, status='available', notes='Unopened in double containment secondary vessel.')
        ]
        db.session.add_all(batches)
        db.session.commit()

        print("[InitDB] Seeding laboratory assets & instrumentation...")
        assets = [
            Asset(id=1, asset_tag='AST-SPECTRO-001', name='Double-Beam UV-Visible Spectrophotometer', category='spectrophotometer', manufacturer='Shimadzu Corp', model_number='UV-1900i', serial_number='SHIM-UV-98214', lab_id=1, location_id=7, purchase_date=date(2024, 8, 10), warranty_expiry=date(2027, 8, 10), cost_inr=850000.00, status='available', calibration_interval_days=180, last_calibration_date=date(2026, 6, 15), next_calibration_due=date(2026, 12, 15), qr_code_token='QR-AST-SHIM-UV1900', specifications='Wavelength range 190 to 1100 nm, 1 nm spectral bandwidth, ultra-fast 29000 nm/min scan speed.', operating_instructions='Warm up for 20 minutes before zeroing with solvent blank. Always clean quartz cuvettes with spectroscopy-grade lens tissue.'),
            Asset(id=2, asset_tag='AST-CENTRI-002', name='High-Speed Refrigerated Microcentrifuge', category='centrifuge', manufacturer='Eppendorf', model_number='5424 R', serial_number='EPP-CENT-55412', lab_id=2, location_id=5, purchase_date=date(2025, 1, 20), warranty_expiry=date(2028, 1, 20), cost_inr=420000.00, status='in_use', calibration_interval_days=90, last_calibration_date=date(2026, 8, 10), next_calibration_due=date.today() + timedelta(days=6), qr_code_token='QR-AST-EPP-5424R', specifications='Max speed 15000 RPM (21,130 x g), temp range -10°C to +40°C, 24-place rotor.', operating_instructions='Always balance tubes symmetrically with identical weights (+-0.05g). Never open lid until rotor has come to a complete standstill.'),
            Asset(id=3, asset_tag='AST-BALANCE-003', name='Analytical Precision Micro-Balance (0.1 mg)', category='balance', manufacturer='Sartorius AG', model_number='Secura 224-1S', serial_number='SART-SEC-1092', lab_id=1, location_id=7, purchase_date=date(2024, 3, 15), warranty_expiry=date(2027, 3, 15), cost_inr=290000.00, status='calibration_due', calibration_interval_days=60, last_calibration_date=date(2026, 8, 1), next_calibration_due=date.today() - timedelta(days=2), qr_code_token='QR-AST-SART-224', specifications='Capacity 220 g, Readability 0.1 mg, Internal isoCAL automated calibration and leveling sensor.', operating_instructions='Close draft shields completely. Do not lean on marble balance bench. Clean pan immediately with camel-hair brush if spilled.'),
            Asset(id=4, asset_tag='AST-ROTAVAP-004', name='Digital Rotary Evaporator System', category='analyzer', manufacturer='Buchi Labortechnik', model_number='Rotavapor R-300', serial_number='BUCH-ROTA-7741', lab_id=1, location_id=1, purchase_date=date(2024, 11, 5), warranty_expiry=date(2027, 11, 5), cost_inr=680000.00, status='available', calibration_interval_days=120, last_calibration_date=date(2026, 7, 20), next_calibration_due=date(2026, 11, 20), qr_code_token='QR-AST-BUCH-R300', specifications='Heating bath B-305 (20-220°C), V-300 vacuum pump with interface I-300 Pro.', operating_instructions='Inspect glassware for star cracks before pulling vacuum. Ensure cooling chiller recirculates at <= 5°C before solvent distillation.'),
            Asset(id=5, asset_tag='AST-MICROSCOPE-005', name='LED Trinocular Biological Research Microscope', category='microscope', manufacturer='Olympus / Evident', model_number='CX23 LED', serial_number='OLY-CX23-3391', lab_id=2, location_id=5, purchase_date=date(2025, 2, 10), warranty_expiry=date(2028, 2, 10), cost_inr=165000.00, status='available', calibration_interval_days=365, last_calibration_date=date(2026, 2, 15), next_calibration_due=date(2027, 2, 15), qr_code_token='QR-AST-OLY-CX23', specifications='Plan achromat objectives 4x, 10x, 40x, 100x oil immersion. Built-in 4K digital camera output.', operating_instructions='Clean oil immersion lens with ether-alcohol mixture immediately after use. Always lower stage before removing slide.'),
            Asset(id=6, asset_tag='AST-AUTOCLAVE-006', name='Vertical High-Pressure Steam Sterilizer Autoclave', category='autoclave', manufacturer='Tomy Digital', model_number='SX-500', serial_number='TOMY-SX-6629', lab_id=2, location_id=5, purchase_date=date(2023, 9, 12), warranty_expiry=date(2026, 9, 12), cost_inr=390000.00, status='under_maintenance', calibration_interval_days=90, last_calibration_date=date(2026, 5, 10), next_calibration_due=date(2026, 8, 10), qr_code_token='QR-AST-TOMY-SX500', specifications='Chamber capacity 50 Liters, 105°C - 135°C sterilization temp, automated dual interlocking safety lid.', operating_instructions='Gasket replacement scheduled. Do not operate until pressure safety valve certification is renewed.')
        ]
        db.session.add_all(assets)
        db.session.commit()

        print("[InitDB] Seeding asset borrow logs...")
        borrows = [
            AssetBorrowLog(id=1, asset_id=2, user_id=1, borrowed_at=datetime.utcnow() - timedelta(hours=3), expected_return_at=datetime.utcnow() + timedelta(hours=3), status='active', purpose='Purification of recombinant protein constructs for Capstone validation', condition_on_checkout='Excellent', runtime_hours=3.5, notes='Operating at 4°C at 12,000 RPM'),
            AssetBorrowLog(id=2, asset_id=1, user_id=2, borrowed_at=datetime.utcnow() - timedelta(days=2), expected_return_at=datetime.utcnow() - timedelta(days=2, hours=-4), returned_at=datetime.utcnow() - timedelta(days=2, hours=-3, minutes=-45), status='returned', purpose='Absorbance kinetic assay of ester hydrolysis in organic solvents', condition_on_checkout='Clean & Calibrated', condition_on_return='Good condition, optical cell washed', runtime_hours=4.0, notes='Baseline recorded at 280nm'),
            AssetBorrowLog(id=3, asset_id=4, user_id=1, borrowed_at=datetime.utcnow() - timedelta(days=6), expected_return_at=datetime.utcnow() - timedelta(days=6, hours=-4), returned_at=datetime.utcnow() - timedelta(days=6, hours=-3, minutes=-30), status='returned', purpose='Concentration of extracted natural flavonoids from ethanol extract', condition_on_checkout='Excellent', condition_on_return='Cleaned with acetone', runtime_hours=3.0, notes='Vacuum held at 45 mbar without leaks')
        ]
        db.session.add_all(borrows)
        db.session.commit()

        print("[InitDB] Seeding calibration records...")
        calibrations = [
            AssetCalibration(id=1, asset_id=1, calibration_date=date(2026, 6, 15), technician_name='Nagaraj Shenoy', technician_organization='Shimadzu Authorized Metrology Services', calibration_status='passed', certificate_number='CAL-SHIM-2026-88', measured_deviation='+-0.08 nm at 656.1 nm D2 peak', standard_reference='Holmium Oxide Glass & Deuterium Lamp', next_due_date=date(2026, 12, 15), report_notes='Optical alignment and beam linearity verified within ISO/IEC 17025 tolerance.'),
            AssetCalibration(id=2, asset_id=3, calibration_date=date(2026, 8, 1), technician_name='Kavitha Murthy', technician_organization='National Accreditation Metrology Lab', calibration_status='adjusted', certificate_number='CAL-SART-2026-102', measured_deviation='+0.4 mg drift corrected via isoCAL internal mass', standard_reference='NABL Class E2 Calibration Mass Set', next_due_date=date(2026, 10, 1), report_notes='Cornerload and repeatability recalibrated. Recommended quarterly calibration due to micro-sensitivity.')
        ]
        db.session.add_all(calibrations)
        db.session.commit()

        print("[InitDB] Seeding chemical dispensations...")
        dispensations = [
            Dispensation(id=1, batch_id=1, user_id=1, dispensed_amount=150.0, unit='ml', experiment_name='Thin Layer Chromatography TLC eluent preparation', course_or_project='PESU Organic Chemistry Lab Exam', dispensed_at=datetime.utcnow() - timedelta(days=1), remaining_quantity_after=1850.0, witness_name='Pranav Kaushal J', notes='Used HPLC acetone in 1:1 mixture with Hexane.'),
            Dispensation(id=2, batch_id=2, user_id=2, dispensed_amount=80.0, unit='ml', experiment_name='Standard Acid-Base Titration Standardization', course_or_project='DBMS Lab Assignment Project', dispensed_at=datetime.utcnow() - timedelta(days=2), remaining_quantity_after=420.0, witness_name='Pranav Swaroop S', notes='Dispensed under fume hood with splash goggles.')
        ]
        db.session.add_all(dispensations)
        db.session.commit()

        print("[InitDB] Seeding audit logs...")
        audits = [
            AuditLog(id=1, user_id=1, user_name='Pranav Swaroop S', action='CREATE', entity_type='chemical', entity_id='1', details='Added Acetone (HPLC Grade) CAS 67-64-1 to catalog with NFPA ratings 1-3-0', ip_address='127.0.0.1'),
            AuditLog(id=2, user_id=2, user_name='Pranav Kaushal J', action='CREATE', entity_type='asset', entity_id='1', details='Registered UV-Visible Spectrophotometer Shimadzu UV-1900i with tag AST-SPECTRO-001', ip_address='127.0.0.1'),
            AuditLog(id=3, user_id=1, user_name='Pranav Swaroop S', action='INCOMPATIBILITY_ALERT', entity_type='safety_engine', entity_id='CAB-01', details='Blocked co-location of Nitric Acid 68% and Acetone in Cabinet A1 due to spontaneous explosive fire hazard.', ip_address='127.0.0.1')
        ]
        db.session.add_all(audits)
        db.session.commit()

        print("[InitDB] [SUCCESS] All tables initialized and successfully seeded!")

if __name__ == '__main__':
    init_database()
