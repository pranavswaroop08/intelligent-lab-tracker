import json
from datetime import datetime, date
from flask import Blueprint, request, jsonify
from app.models import db, Chemical, ChemicalBatch, HazardClass, StorageLocation, AuditLog
from app.services.compatibility_engine import CompatibilityEngine
from app.services.qr_service import QRService

chemicals_bp = Blueprint('chemicals', __name__, url_prefix='/api/chemicals')

@chemicals_bp.route('', methods=['GET'])
def get_chemicals():
    query = request.args.get('q', '').strip()
    hazard_code = request.args.get('hazard', '').strip()
    low_stock = request.args.get('low_stock', '').lower() == 'true'

    chem_query = Chemical.query

    if query:
        search_filter = f"%{query}%"
        chem_query = chem_query.filter(
            (Chemical.name.ilike(search_filter)) |
            (Chemical.cas_number.ilike(search_filter)) |
            (Chemical.formula.ilike(search_filter)) |
            (Chemical.iupac_name.ilike(search_filter))
        )

    if hazard_code:
        chem_query = chem_query.join(HazardClass).filter(HazardClass.code == hazard_code)

    chemicals = chem_query.all()
    results = [c.to_dict() for c in chemicals]

    if low_stock:
        results = [c for c in results if c['is_low_stock']]

    return jsonify(results)

@chemicals_bp.route('/<int:chem_id>', methods=['GET'])
def get_chemical(chem_id):
    chem = Chemical.query.get_or_404(chem_id)
    data = chem.to_dict()
    data['batches'] = [b.to_dict() for b in chem.batches]
    return jsonify(data)

@chemicals_bp.route('', methods=['POST'])
def create_chemical():
    data = request.get_json() or {}
    
    cas_number = data.get('cas_number', '').strip()
    name = data.get('name', '').strip()

    if not cas_number or not name:
        return jsonify({'error': 'CAS Number and Chemical Name are required'}), 400

    existing = Chemical.query.filter_by(cas_number=cas_number).first()
    if existing:
        return jsonify({'error': f'Chemical with CAS {cas_number} already exists: {existing.name}'}), 409

    hazard_codes_str = json.dumps(data.get('ghs_hazard_codes', [])) if isinstance(data.get('ghs_hazard_codes'), list) else data.get('ghs_hazard_codes', '[]')
    pictograms_str = json.dumps(data.get('ghs_pictograms', [])) if isinstance(data.get('ghs_pictograms'), list) else data.get('ghs_pictograms', '[]')

    chem = Chemical(
        cas_number=cas_number,
        name=name,
        iupac_name=data.get('iupac_name', ''),
        formula=data.get('formula', ''),
        molecular_weight=float(data.get('molecular_weight', 0.0) or 0.0),
        physical_state=data.get('physical_state', 'liquid'),
        density=float(data.get('density', 1.0) or 1.0),
        hazard_class_id=data.get('hazard_class_id'),
        nfpa_health=int(data.get('nfpa_health', 0) or 0),
        nfpa_flammability=int(data.get('nfpa_flammability', 0) or 0),
        nfpa_instability=int(data.get('nfpa_instability', 0) or 0),
        nfpa_special=data.get('nfpa_special', ''),
        ghs_signal_word=data.get('ghs_signal_word', 'WARNING'),
        ghs_hazard_codes=hazard_codes_str,
        ghs_pictograms=pictograms_str,
        sds_url=data.get('sds_url', f"https://chem-sds.pes.edu/sds/{cas_number}.pdf"),
        storage_requirements=data.get('storage_requirements', ''),
        min_threshold_qty=float(data.get('min_threshold_qty', 500.0) or 500.0),
        unit=data.get('unit', 'ml')
    )

    db.session.add(chem)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_name=data.get('user_name', 'PES Admin'),
        action='CREATE',
        entity_type='chemical',
        entity_id=str(chem.id),
        details=f"Created chemical {chem.name} (CAS: {chem.cas_number}) with hazard class {chem.hazard_class_id}"
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify(chem.to_dict()), 201

@chemicals_bp.route('/batches', methods=['GET'])
def get_batches():
    location_id = request.args.get('location_id')
    status = request.args.get('status')
    expiring_soon = request.args.get('expiring_soon', '').lower() == 'true'

    batch_query = ChemicalBatch.query

    if location_id:
        batch_query = batch_query.filter_by(location_id=int(location_id))
    if status:
        batch_query = batch_query.filter_by(status=status)

    batches = batch_query.all()
    results = [b.to_dict() for b in batches]

    if expiring_soon:
        results = [b for b in results if b['days_until_expiry'] is not None and 0 < b['days_until_expiry'] <= 30]

    return jsonify(results)

@chemicals_bp.route('/batches', methods=['POST'])
def create_batch():
    data = request.get_json() or {}
    chemical_id = data.get('chemical_id')
    location_id = data.get('location_id')
    
    if not chemical_id or not location_id:
        return jsonify({'error': 'chemical_id and location_id are required'}), 400

    chem = Chemical.query.get_or_404(chemical_id)
    location = StorageLocation.query.get_or_404(location_id)

    # Perform Incompatibility Pre-Check for this location!
    existing_batches = ChemicalBatch.query.filter_by(location_id=location_id).all()
    incompatibilities = []
    for eb in existing_batches:
        if eb.chemical and eb.chemical.id != chem.id:
            res = CompatibilityEngine.check_pairwise(chem, eb.chemical)
            if not res.get('compatible', True):
                incompatibilities.append({
                    'other_chemical': eb.chemical.name,
                    'severity': res['severity'],
                    'reason': res['reason']
                })

    # Auto-generate Barcode QR Token if not provided
    barcode = data.get('barcode_qr')
    if not barcode:
        barcode = f"QR-{chem.name[:4].upper()}-{datetime.utcnow().strftime('%y%m%d%H%M%S')}"

    # Parse dates
    received_date = datetime.strptime(data.get('received_date', date.today().isoformat()), '%Y-%m-%d').date()
    expiry_date = datetime.strptime(data.get('expiry_date'), '%Y-%m-%d').date()
    initial_qty = float(data.get('initial_quantity', 1000.0))

    batch = ChemicalBatch(
        chemical_id=chem.id,
        barcode_qr=barcode,
        batch_lot_number=data.get('batch_lot_number', f"LOT-{datetime.utcnow().year}-01"),
        location_id=location.id,
        shelf_number=int(data.get('shelf_number', 1)),
        supplier=data.get('supplier', 'Standard Laboratory Reagents'),
        purity_percentage=float(data.get('purity_percentage', 99.0)),
        manufacture_date=datetime.strptime(data['manufacture_date'], '%Y-%m-%d').date() if data.get('manufacture_date') else None,
        received_date=received_date,
        expiry_date=expiry_date,
        initial_quantity=initial_qty,
        current_quantity=initial_qty,
        unit=data.get('unit', chem.unit),
        cost_inr=float(data.get('cost_inr', 0.0)),
        status='available',
        notes=data.get('notes', '')
    )

    db.session.add(batch)
    db.session.commit()

    # Log audit
    audit = AuditLog(
        user_name=data.get('user_name', 'PES Lab Staff'),
        action='CREATE_BATCH',
        entity_type='chemical_batch',
        entity_id=str(batch.id),
        details=f"Added new batch of {chem.name} ({batch.current_quantity} {batch.unit}) to {location.name}."
    )
    db.session.add(audit)
    db.session.commit()

    response_data = batch.to_dict()
    response_data['storage_safety_warning'] = incompatibilities if incompatibilities else None
    return jsonify(response_data), 201

@chemicals_bp.route('/batches/<int:batch_id>/qr', methods=['GET'])
def get_batch_qr(batch_id):
    batch = ChemicalBatch.query.get_or_404(batch_id)
    qr_data_url = QRService.generate_qr_base64(batch.barcode_qr, batch.chemical.name)
    return jsonify({
        'batch_id': batch.id,
        'chemical_name': batch.chemical.name,
        'barcode_qr': batch.barcode_qr,
        'qr_image_url': qr_data_url
    })

@chemicals_bp.route('/hazards', methods=['GET'])
def get_hazards():
    hazards = HazardClass.query.all()
    return jsonify([h.to_dict() for h in hazards])
