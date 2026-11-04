import json
from datetime import datetime, date
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

def serialize_date(val):
    if isinstance(val, (datetime, date)):
        return val.isoformat()
    return val

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255))

    users = db.relationship('User', backref='role', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    srn_or_emp_id = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    department = db.Column(db.String(100), default='Computer Science & Engineering')
    phone = db.Column(db.String(20))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'srn_or_emp_id': self.srn_or_emp_id,
            'name': self.name,
            'email': self.email,
            'role_id': self.role_id,
            'role_name': self.role.name if self.role else None,
            'department': self.department,
            'phone': self.phone,
            'is_active': self.is_active,
            'created_at': serialize_date(self.created_at)
        }

class Laboratory(db.Model):
    __tablename__ = 'laboratories'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    building = db.Column(db.String(100), nullable=False)
    floor = db.Column(db.String(20), nullable=False)
    in_charge_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    emergency_contact = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    in_charge = db.relationship('User', foreign_keys=[in_charge_user_id])
    locations = db.relationship('StorageLocation', backref='laboratory', lazy=True)
    assets = db.relationship('Asset', backref='laboratory', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'building': self.building,
            'floor': self.floor,
            'in_charge_user_id': self.in_charge_user_id,
            'in_charge_name': self.in_charge.name if self.in_charge else None,
            'emergency_contact': self.emergency_contact,
            'locations_count': len(self.locations),
            'assets_count': len(self.assets),
            'created_at': serialize_date(self.created_at)
        }

class StorageLocation(db.Model):
    __tablename__ = 'storage_locations'
    id = db.Column(db.Integer, primary_key=True)
    lab_id = db.Column(db.Integer, db.ForeignKey('laboratories.id'), nullable=False)
    location_code = db.Column(db.String(50), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    storage_type = db.Column(db.String(50), nullable=False) # flammable_cabinet, acid_cabinet, base_cabinet, refrigerator_4c, etc.
    room_no = db.Column(db.String(50), nullable=False)
    shelf_count = db.Column(db.Integer, default=4)
    temperature_target_c = db.Column(db.Float, default=22.0)
    max_capacity_items = db.Column(db.Integer, default=50)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    batches = db.relationship('ChemicalBatch', backref='location', lazy=True)
    assets = db.relationship('Asset', backref='location', lazy=True)

    def to_dict(self, include_inventory=False):
        data = {
            'id': self.id,
            'lab_id': self.lab_id,
            'lab_name': self.laboratory.name if self.laboratory else None,
            'location_code': self.location_code,
            'name': self.name,
            'storage_type': self.storage_type,
            'room_no': self.room_no,
            'shelf_count': self.shelf_count,
            'temperature_target_c': self.temperature_target_c,
            'max_capacity_items': self.max_capacity_items,
            'current_items_count': len(self.batches),
            'notes': self.notes,
            'created_at': serialize_date(self.created_at)
        }
        if include_inventory:
            data['batches'] = [b.to_dict() for b in self.batches]
            data['assets'] = [a.to_dict() for a in self.assets]
        return data

class HazardClass(db.Model):
    __tablename__ = 'hazard_classes'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    ghs_icon_key = db.Column(db.String(50))
    storage_category = db.Column(db.String(50))
    description = db.Column(db.Text)

    chemicals = db.relationship('Chemical', backref='hazard_class', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'ghs_icon_key': self.ghs_icon_key,
            'storage_category': self.storage_category,
            'description': self.description
        }

class Chemical(db.Model):
    __tablename__ = 'chemicals'
    id = db.Column(db.Integer, primary_key=True)
    cas_number = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    iupac_name = db.Column(db.String(200))
    formula = db.Column(db.String(100))
    molecular_weight = db.Column(db.Float)
    physical_state = db.Column(db.String(20), default='liquid')
    density = db.Column(db.Float)
    hazard_class_id = db.Column(db.Integer, db.ForeignKey('hazard_classes.id'), nullable=True)
    nfpa_health = db.Column(db.Integer, default=0)
    nfpa_flammability = db.Column(db.Integer, default=0)
    nfpa_instability = db.Column(db.Integer, default=0)
    nfpa_special = db.Column(db.String(20), default='')
    ghs_signal_word = db.Column(db.String(20), default='WARNING')
    ghs_hazard_codes = db.Column(db.Text) # JSON list
    ghs_pictograms = db.Column(db.Text)   # JSON list
    sds_url = db.Column(db.String(255))
    storage_requirements = db.Column(db.Text)
    min_threshold_qty = db.Column(db.Float, default=500.0)
    unit = db.Column(db.String(20), default='ml')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    batches = db.relationship('ChemicalBatch', backref='chemical', lazy=True)

    def to_dict(self):
        try:
            hazard_codes = json.loads(self.ghs_hazard_codes) if self.ghs_hazard_codes else []
        except Exception:
            hazard_codes = [self.ghs_hazard_codes] if self.ghs_hazard_codes else []

        try:
            pictograms = json.loads(self.ghs_pictograms) if self.ghs_pictograms else []
        except Exception:
            pictograms = [self.ghs_pictograms] if self.ghs_pictograms else []

        total_stock = sum(b.current_quantity for b in self.batches if b.status != 'expired')
        
        return {
            'id': self.id,
            'cas_number': self.cas_number,
            'name': self.name,
            'iupac_name': self.iupac_name,
            'formula': self.formula,
            'molecular_weight': self.molecular_weight,
            'physical_state': self.physical_state,
            'density': self.density,
            'hazard_class_id': self.hazard_class_id,
            'hazard_class_name': self.hazard_class.name if self.hazard_class else 'Unclassified',
            'hazard_class_code': self.hazard_class.code if self.hazard_class else 'NONE',
            'nfpa': {
                'health': self.nfpa_health,
                'flammability': self.nfpa_flammability,
                'instability': self.nfpa_instability,
                'special': self.nfpa_special
            },
            'ghs_signal_word': self.ghs_signal_word,
            'ghs_hazard_codes': hazard_codes,
            'ghs_pictograms': pictograms,
            'sds_url': self.sds_url,
            'storage_requirements': self.storage_requirements,
            'min_threshold_qty': self.min_threshold_qty,
            'unit': self.unit,
            'total_stock': total_stock,
            'is_low_stock': total_stock <= self.min_threshold_qty,
            'batches_count': len(self.batches),
            'created_at': serialize_date(self.created_at)
        }

class ChemicalBatch(db.Model):
    __tablename__ = 'chemical_batches'
    id = db.Column(db.Integer, primary_key=True)
    chemical_id = db.Column(db.Integer, db.ForeignKey('chemicals.id'), nullable=False)
    barcode_qr = db.Column(db.String(100), unique=True, nullable=False)
    batch_lot_number = db.Column(db.String(100), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('storage_locations.id'), nullable=False)
    shelf_number = db.Column(db.Integer, default=1)
    supplier = db.Column(db.String(100))
    purity_percentage = db.Column(db.Float, default=99.0)
    manufacture_date = db.Column(db.Date)
    received_date = db.Column(db.Date, nullable=False)
    opened_date = db.Column(db.Date)
    expiry_date = db.Column(db.Date, nullable=False)
    initial_quantity = db.Column(db.Float, nullable=False)
    current_quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    cost_inr = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='available') # available, low, expired, quarantined, depleted
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    dispensations = db.relationship('Dispensation', backref='batch', lazy=True)

    def to_dict(self):
        is_expired = False
        days_until_expiry = None
        if self.expiry_date:
            today = date.today()
            days_until_expiry = (self.expiry_date - today).days
            if days_until_expiry <= 0:
                is_expired = True

        return {
            'id': self.id,
            'chemical_id': self.chemical_id,
            'chemical_name': self.chemical.name if self.chemical else None,
            'cas_number': self.chemical.cas_number if self.chemical else None,
            'hazard_class_code': self.chemical.hazard_class.code if self.chemical and self.chemical.hazard_class else None,
            'barcode_qr': self.barcode_qr,
            'batch_lot_number': self.batch_lot_number,
            'location_id': self.location_id,
            'location_code': self.location.location_code if self.location else None,
            'location_name': self.location.name if self.location else None,
            'room_no': self.location.room_no if self.location else None,
            'shelf_number': self.shelf_number,
            'supplier': self.supplier,
            'purity_percentage': self.purity_percentage,
            'manufacture_date': serialize_date(self.manufacture_date),
            'received_date': serialize_date(self.received_date),
            'opened_date': serialize_date(self.opened_date),
            'expiry_date': serialize_date(self.expiry_date),
            'days_until_expiry': days_until_expiry,
            'is_expired': is_expired,
            'initial_quantity': self.initial_quantity,
            'current_quantity': self.current_quantity,
            'unit': self.unit,
            'cost_inr': self.cost_inr,
            'status': 'expired' if is_expired else self.status,
            'notes': self.notes,
            'created_at': serialize_date(self.created_at)
        }

class ChemicalIncompatibility(db.Model):
    __tablename__ = 'chemical_incompatibilities'
    id = db.Column(db.Integer, primary_key=True)
    hazard_class_a_id = db.Column(db.Integer, db.ForeignKey('hazard_classes.id'), nullable=False)
    hazard_class_b_id = db.Column(db.Integer, db.ForeignKey('hazard_classes.id'), nullable=False)
    severity = db.Column(db.String(30), nullable=False) # EXPLOSION_HAZARD, TOXIC_GAS_RELEASE, VIOLENT_EXOTHERMIC, etc.
    reason = db.Column(db.Text, nullable=False)
    safety_protocol = db.Column(db.Text, nullable=False)

    hazard_a = db.relationship('HazardClass', foreign_keys=[hazard_class_a_id])
    hazard_b = db.relationship('HazardClass', foreign_keys=[hazard_class_b_id])

    def to_dict(self):
        return {
            'id': self.id,
            'hazard_class_a_id': self.hazard_class_a_id,
            'hazard_class_a_name': self.hazard_a.name if self.hazard_a else None,
            'hazard_class_b_id': self.hazard_class_b_id,
            'hazard_class_b_name': self.hazard_b.name if self.hazard_b else None,
            'severity': self.severity,
            'reason': self.reason,
            'safety_protocol': self.safety_protocol
        }

class Asset(db.Model):
    __tablename__ = 'assets'
    id = db.Column(db.Integer, primary_key=True)
    asset_tag = db.Column(db.String(50), unique=True, nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    manufacturer = db.Column(db.String(100))
    model_number = db.Column(db.String(100))
    serial_number = db.Column(db.String(100))
    lab_id = db.Column(db.Integer, db.ForeignKey('laboratories.id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('storage_locations.id'), nullable=True)
    purchase_date = db.Column(db.Date)
    warranty_expiry = db.Column(db.Date)
    cost_inr = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='available') # available, in_use, under_maintenance, calibration_due, decommissioned
    calibration_interval_days = db.Column(db.Integer, default=90)
    last_calibration_date = db.Column(db.Date)
    next_calibration_due = db.Column(db.Date)
    qr_code_token = db.Column(db.String(100), unique=True)
    specifications = db.Column(db.Text)
    operating_instructions = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    calibrations = db.relationship('AssetCalibration', backref='asset', lazy=True, order_by='AssetCalibration.calibration_date.desc()')
    borrow_logs = db.relationship('AssetBorrowLog', backref='asset', lazy=True, order_by='AssetBorrowLog.borrowed_at.desc()')

    def to_dict(self):
        is_cal_due = False
        if self.next_calibration_due:
            is_cal_due = (self.next_calibration_due - date.today()).days <= 7

        current_borrow = next((b for b in self.borrow_logs if b.status == 'active'), None)

        return {
            'id': self.id,
            'asset_tag': self.asset_tag,
            'name': self.name,
            'category': self.category,
            'manufacturer': self.manufacturer,
            'model_number': self.model_number,
            'serial_number': self.serial_number,
            'lab_id': self.lab_id,
            'lab_name': self.laboratory.name if self.laboratory else None,
            'location_id': self.location_id,
            'location_code': self.location.location_code if self.location else None,
            'purchase_date': serialize_date(self.purchase_date),
            'warranty_expiry': serialize_date(self.warranty_expiry),
            'cost_inr': self.cost_inr,
            'status': 'calibration_due' if is_cal_due and self.status == 'available' else self.status,
            'calibration_interval_days': self.calibration_interval_days,
            'last_calibration_date': serialize_date(self.last_calibration_date),
            'next_calibration_due': serialize_date(self.next_calibration_due),
            'is_calibration_due': is_cal_due,
            'qr_code_token': self.qr_code_token,
            'specifications': self.specifications,
            'operating_instructions': self.operating_instructions,
            'current_borrow': current_borrow.to_dict() if current_borrow else None,
            'total_borrows': len(self.borrow_logs),
            'calibrations_count': len(self.calibrations),
            'created_at': serialize_date(self.created_at)
        }

class AssetBorrowLog(db.Model):
    __tablename__ = 'asset_borrow_logs'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    borrowed_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expected_return_at = db.Column(db.DateTime, nullable=False)
    returned_at = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(30), default='active') # active, returned, overdue
    purpose = db.Column(db.Text, nullable=False)
    condition_on_checkout = db.Column(db.String(100), default='Excellent')
    condition_on_return = db.Column(db.String(100))
    runtime_hours = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'asset_tag': self.asset.asset_tag if self.asset else None,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_srn': self.user.srn_or_emp_id if self.user else None,
            'borrowed_at': serialize_date(self.borrowed_at),
            'expected_return_at': serialize_date(self.expected_return_at),
            'returned_at': serialize_date(self.returned_at),
            'status': self.status,
            'purpose': self.purpose,
            'condition_on_checkout': self.condition_on_checkout,
            'condition_on_return': self.condition_on_return,
            'runtime_hours': self.runtime_hours,
            'notes': self.notes
        }

class AssetCalibration(db.Model):
    __tablename__ = 'asset_calibrations'
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    calibration_date = db.Column(db.Date, nullable=False)
    technician_name = db.Column(db.String(100), nullable=False)
    technician_organization = db.Column(db.String(150))
    calibration_status = db.Column(db.String(30), nullable=False) # passed, adjusted, failed
    certificate_number = db.Column(db.String(100))
    measured_deviation = db.Column(db.String(150))
    standard_reference = db.Column(db.String(150))
    next_due_date = db.Column(db.Date, nullable=False)
    report_notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'asset_id': self.asset_id,
            'asset_name': self.asset.name if self.asset else None,
            'asset_tag': self.asset.asset_tag if self.asset else None,
            'calibration_date': serialize_date(self.calibration_date),
            'technician_name': self.technician_name,
            'technician_organization': self.technician_organization,
            'calibration_status': self.calibration_status,
            'certificate_number': self.certificate_number,
            'measured_deviation': self.measured_deviation,
            'standard_reference': self.standard_reference,
            'next_due_date': serialize_date(self.next_due_date),
            'report_notes': self.report_notes,
            'created_at': serialize_date(self.created_at)
        }

class Dispensation(db.Model):
    __tablename__ = 'dispensations'
    id = db.Column(db.Integer, primary_key=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('chemical_batches.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    dispensed_amount = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    experiment_name = db.Column(db.String(150), nullable=False)
    course_or_project = db.Column(db.String(100), default='DBMS Mini-Project Lab')
    dispensed_at = db.Column(db.DateTime, default=datetime.utcnow)
    remaining_quantity_after = db.Column(db.Float, nullable=False)
    witness_name = db.Column(db.String(100))
    notes = db.Column(db.Text)

    user = db.relationship('User', foreign_keys=[user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'batch_id': self.batch_id,
            'chemical_name': self.batch.chemical.name if self.batch and self.batch.chemical else None,
            'cas_number': self.batch.chemical.cas_number if self.batch and self.batch.chemical else None,
            'barcode_qr': self.batch.barcode_qr if self.batch else None,
            'user_id': self.user_id,
            'user_name': self.user.name if self.user else None,
            'user_srn': self.user.srn_or_emp_id if self.user else None,
            'dispensed_amount': self.dispensed_amount,
            'unit': self.unit,
            'experiment_name': self.experiment_name,
            'course_or_project': self.course_or_project,
            'dispensed_at': serialize_date(self.dispensed_at),
            'remaining_quantity_after': self.remaining_quantity_after,
            'witness_name': self.witness_name,
            'notes': self.notes
        }

class WasteLog(db.Model):
    __tablename__ = 'waste_logs'
    id = db.Column(db.Integer, primary_key=True)
    chemical_id = db.Column(db.Integer, db.ForeignKey('chemicals.id'), nullable=True)
    batch_id = db.Column(db.Integer, db.ForeignKey('chemical_batches.id'), nullable=True)
    waste_code = db.Column(db.String(50), nullable=False)
    waste_description = db.Column(db.String(200), nullable=False)
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=False)
    container_id = db.Column(db.String(50), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('storage_locations.id'), nullable=True)
    logged_by_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(30), default='accumulating') # accumulating, manifested, disposed
    disposal_date = db.Column(db.Date, nullable=True)
    manifest_number = db.Column(db.String(100))
    disposal_vendor = db.Column(db.String(150))

    chemical = db.relationship('Chemical')
    logged_by = db.relationship('User', foreign_keys=[logged_by_user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'chemical_id': self.chemical_id,
            'chemical_name': self.chemical.name if self.chemical else None,
            'waste_code': self.waste_code,
            'waste_description': self.waste_description,
            'quantity': self.quantity,
            'unit': self.unit,
            'container_id': self.container_id,
            'location_id': self.location_id,
            'logged_by_user_id': self.logged_by_user_id,
            'logged_by_name': self.logged_by.name if self.logged_by else None,
            'logged_at': serialize_date(self.logged_at),
            'status': self.status,
            'disposal_date': serialize_date(self.disposal_date),
            'manifest_number': self.manifest_number,
            'disposal_vendor': self.disposal_vendor
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    user_name = db.Column(db.String(100))
    action = db.Column(db.String(50), nullable=False) # CREATE, UPDATE, DELETE, DISPENSE, BORROW, RETURN, CALIBRATE, etc.
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.String(50))
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(50), default='127.0.0.1')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': self.user_name or 'System',
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': serialize_date(self.created_at)
        }
