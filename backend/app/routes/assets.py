from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from app.models import db, Asset, AssetBorrowLog, AssetCalibration, User, AuditLog
from app.services.qr_service import QRService

assets_bp = Blueprint('assets', __name__, url_prefix='/api/assets')

@assets_bp.route('', methods=['GET'])
def get_assets():
    category = request.args.get('category')
    status = request.args.get('status')
    lab_id = request.args.get('lab_id')
    query = request.args.get('q', '').strip()

    asset_query = Asset.query

    if category:
        asset_query = asset_query.filter_by(category=category)
    if status:
        asset_query = asset_query.filter_by(status=status)
    if lab_id:
        asset_query = asset_query.filter_by(lab_id=int(lab_id))

    if query:
        search_filter = f"%{query}%"
        asset_query = asset_query.filter(
            (Asset.name.ilike(search_filter)) |
            (Asset.asset_tag.ilike(search_filter)) |
            (Asset.manufacturer.ilike(search_filter)) |
            (Asset.model_number.ilike(search_filter))
        )

    assets = asset_query.all()
    return jsonify([a.to_dict() for a in assets])

@assets_bp.route('/<int:asset_id>', methods=['GET'])
def get_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = asset.to_dict()
    data['calibration_history'] = [c.to_dict() for c in asset.calibrations]
    data['borrow_history'] = [b.to_dict() for b in asset.borrow_logs]
    return jsonify(data)

@assets_bp.route('', methods=['POST'])
def create_asset():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    category = data.get('category', '').strip()
    lab_id = data.get('lab_id')

    if not name or not category or not lab_id:
        return jsonify({'error': 'name, category, and lab_id are required'}), 400

    asset_tag = data.get('asset_tag')
    if not asset_tag:
        asset_tag = f"AST-{category[:4].upper()}-{datetime.utcnow().strftime('%y%m%d%H%M')}"

    cal_interval = int(data.get('calibration_interval_days', 90))
    last_cal = None
    next_cal = None
    if data.get('last_calibration_date'):
        last_cal = datetime.strptime(data['last_calibration_date'], '%Y-%m-%d').date()
        next_cal = last_cal + timedelta(days=cal_interval)
    else:
        next_cal = date.today() + timedelta(days=cal_interval)

    qr_token = f"QR-{asset_tag}"

    asset = Asset(
        asset_tag=asset_tag,
        name=name,
        category=category,
        manufacturer=data.get('manufacturer', ''),
        model_number=data.get('model_number', ''),
        serial_number=data.get('serial_number', ''),
        lab_id=int(lab_id),
        location_id=data.get('location_id'),
        purchase_date=datetime.strptime(data['purchase_date'], '%Y-%m-%d').date() if data.get('purchase_date') else None,
        warranty_expiry=datetime.strptime(data['warranty_expiry'], '%Y-%m-%d').date() if data.get('warranty_expiry') else None,
        cost_inr=float(data.get('cost_inr', 0.0)),
        status='available',
        calibration_interval_days=cal_interval,
        last_calibration_date=last_cal,
        next_calibration_due=next_cal,
        qr_code_token=qr_token,
        specifications=data.get('specifications', ''),
        operating_instructions=data.get('operating_instructions', '')
    )

    db.session.add(asset)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_name=data.get('user_name', 'PES Staff'),
        action='CREATE_ASSET',
        entity_type='asset',
        entity_id=str(asset.id),
        details=f"Registered equipment {asset.name} [{asset.asset_tag}]."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(asset.to_dict()), 201

@assets_bp.route('/<int:asset_id>/borrow', methods=['POST'])
def borrow_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = request.get_json() or {}
    user_id = data.get('user_id', 1)
    purpose = data.get('purpose', '').strip()

    if asset.status == 'in_use':
        return jsonify({'error': f'Equipment {asset.name} is currently in use'}), 400
    if asset.status == 'under_maintenance':
        return jsonify({'error': f'Equipment {asset.name} is under maintenance and cannot be borrowed'}), 400

    hours = int(data.get('borrow_duration_hours', 4))
    expected_return = datetime.utcnow() + timedelta(hours=hours)

    borrow = AssetBorrowLog(
        asset_id=asset.id,
        user_id=user_id,
        borrowed_at=datetime.utcnow(),
        expected_return_at=expected_return,
        status='active',
        purpose=purpose or 'Laboratory Practical Session',
        condition_on_checkout=data.get('condition_on_checkout', 'Excellent'),
        notes=data.get('notes', '')
    )

    asset.status = 'in_use'
    db.session.add(borrow)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_id=user_id,
        user_name=data.get('user_name', 'Student / Researcher'),
        action='BORROW_ASSET',
        entity_type='asset',
        entity_id=str(asset.id),
        details=f"Checked out {asset.name} ({asset.asset_tag}) for purpose: {borrow.purpose}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Successfully checked out {asset.name}',
        'borrow_log': borrow.to_dict(),
        'asset': asset.to_dict()
    })

@assets_bp.route('/<int:asset_id>/return', methods=['POST'])
def return_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = request.get_json() or {}

    active_borrow = AssetBorrowLog.query.filter_by(asset_id=asset.id, status='active').first()
    if not active_borrow:
        return jsonify({'error': 'No active checkout record found for this asset'}), 400

    active_borrow.returned_at = datetime.utcnow()
    active_borrow.status = 'returned'
    active_borrow.condition_on_return = data.get('condition_on_return', 'Good / Clean')
    active_borrow.runtime_hours = float(data.get('runtime_hours', 2.0))
    active_borrow.notes = (active_borrow.notes or '') + f" Return note: {data.get('notes', 'Returned on time.')}"

    asset.status = 'available'
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_id=active_borrow.user_id,
        user_name=data.get('user_name', 'Student / Researcher'),
        action='RETURN_ASSET',
        entity_type='asset',
        entity_id=str(asset.id),
        details=f"Returned {asset.name} ({asset.asset_tag}). Runtime: {active_borrow.runtime_hours} hrs. Condition: {active_borrow.condition_on_return}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Successfully returned {asset.name}',
        'borrow_log': active_borrow.to_dict(),
        'asset': asset.to_dict()
    })

@assets_bp.route('/<int:asset_id>/calibrate', methods=['POST'])
def calibrate_asset(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    data = request.get_json() or {}

    cal_date = datetime.strptime(data.get('calibration_date', date.today().isoformat()), '%Y-%m-%d').date()
    cal_interval = asset.calibration_interval_days or 90
    next_due = cal_date + timedelta(days=cal_interval)

    cal = AssetCalibration(
        asset_id=asset.id,
        calibration_date=cal_date,
        technician_name=data.get('technician_name', 'Internal Calibration Metrologist'),
        technician_organization=data.get('technician_organization', 'PES Lab Services'),
        calibration_status=data.get('calibration_status', 'passed'),
        certificate_number=data.get('certificate_number', f"CAL-{asset.asset_tag}-{cal_date.strftime('%Y%m')}"),
        measured_deviation=data.get('measured_deviation', 'Within ISO tolerance'),
        standard_reference=data.get('standard_reference', 'Class E2 Metrology Standard'),
        next_due_date=next_due,
        report_notes=data.get('report_notes', 'All diagnostic channels and sensor baselines certified.')
    )

    asset.last_calibration_date = cal_date
    asset.next_calibration_due = next_due
    if asset.status == 'calibration_due':
        asset.status = 'available'

    db.session.add(cal)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_name=cal.technician_name,
        action='CALIBRATE_ASSET',
        entity_type='asset',
        entity_id=str(asset.id),
        details=f"Calibrated {asset.name}. Result: {cal.calibration_status}. Next due: {cal.next_due_date}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Calibration logged for {asset.name}',
        'calibration': cal.to_dict(),
        'asset': asset.to_dict()
    }), 201

@assets_bp.route('/<int:asset_id>/qr', methods=['GET'])
def get_asset_qr(asset_id):
    asset = Asset.query.get_or_404(asset_id)
    token = asset.qr_code_token or f"QR-{asset.asset_tag}"
    qr_img = QRService.generate_qr_base64(token, asset.name)
    return jsonify({
        'asset_id': asset.id,
        'asset_tag': asset.asset_tag,
        'name': asset.name,
        'qr_image_url': qr_img
    })
