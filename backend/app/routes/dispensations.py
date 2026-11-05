from datetime import datetime
from flask import Blueprint, request, jsonify
from app.models import db, Dispensation, ChemicalBatch, WasteLog, User, AuditLog

dispensations_bp = Blueprint('dispensations', __name__, url_prefix='/api/dispensations')

@dispensations_bp.route('', methods=['GET'])
def get_dispensations():
    batch_id = request.args.get('batch_id')
    user_id = request.args.get('user_id')

    disp_query = Dispensation.query.order_by(Dispensation.dispensed_at.desc())

    if batch_id:
        disp_query = disp_query.filter_by(batch_id=int(batch_id))
    if user_id:
        disp_query = disp_query.filter_by(user_id=int(user_id))

    records = disp_query.all()
    return jsonify([r.to_dict() for r in records])

@dispensations_bp.route('', methods=['POST'])
def dispense_chemical():
    data = request.get_json() or {}
    batch_id = data.get('batch_id')
    user_id = data.get('user_id', 1)
    amount = float(data.get('dispensed_amount', 0.0))
    experiment = data.get('experiment_name', '').strip()

    if not batch_id or amount <= 0 or not experiment:
        return jsonify({'error': 'batch_id, dispensed_amount (> 0), and experiment_name are required'}), 400

    batch = ChemicalBatch.query.get_or_404(batch_id)

    if batch.status == 'expired':
        return jsonify({'error': 'Cannot dispense from an expired chemical batch! Quarantine protocol required.'}), 400

    if batch.current_quantity < amount:
        return jsonify({'error': f'Insufficient quantity. Requested: {amount} {batch.unit}, Available: {batch.current_quantity} {batch.unit}'}), 400

    # Calculate expected remaining quantity for record
    remaining_qty = max(0.0, batch.current_quantity - amount)

    # If bottle was unopened, mark opened date today
    if not batch.opened_date:
        batch.opened_date = datetime.utcnow().date()

    dispensation = Dispensation(
        batch_id=batch.id,
        user_id=user_id,
        dispensed_amount=amount,
        unit=batch.unit,
        experiment_name=experiment,
        course_or_project=data.get('course_or_project', 'PESU DBMS Mini-Project Lab'),
        dispensed_at=datetime.utcnow(),
        remaining_quantity_after=remaining_qty,
        witness_name=data.get('witness_name', 'Pranav Kaushal J'),
        notes=data.get('notes', '')
    )

    db.session.add(dispensation)
    db.session.commit()
    # Refresh batch from DB to reflect the value updated by the AFTER INSERT trigger
    db.session.refresh(batch)

    # Log audit
    audit = AuditLog(
        user_id=user_id,
        user_name=data.get('user_name', 'Student / Researcher'),
        action='DISPENSE',
        entity_type='chemical_batch',
        entity_id=str(batch.id),
        details=f"Dispensed {amount} {batch.unit} of {batch.chemical.name} for experiment: '{experiment}'. Remaining: {batch.current_quantity} {batch.unit}."
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': f'Successfully dispensed {amount} {batch.unit} of {batch.chemical.name}',
        'dispensation': dispensation.to_dict(),
        'batch': batch.to_dict()
    }), 201

# Waste logging routes
@dispensations_bp.route('/waste', methods=['GET'])
def get_waste_logs():
    status = request.args.get('status')
    waste_query = WasteLog.query.order_by(WasteLog.logged_at.desc())
    if status:
        waste_query = waste_query.filter_by(status=status)
    logs = waste_query.all()
    return jsonify([w.to_dict() for w in logs])

@dispensations_bp.route('/waste', methods=['POST'])
def log_waste():
    data = request.get_json() or {}
    waste_code = data.get('waste_code', '').strip()
    description = data.get('waste_description', '').strip()
    qty = float(data.get('quantity', 0.0))

    if not waste_code or not description or qty <= 0:
        return jsonify({'error': 'waste_code, waste_description, and quantity are required'}), 400

    waste = WasteLog(
        chemical_id=data.get('chemical_id'),
        batch_id=data.get('batch_id'),
        waste_code=waste_code,
        waste_description=description,
        quantity=qty,
        unit=data.get('unit', 'l'),
        container_id=data.get('container_id', f"CONT-W-{datetime.utcnow().strftime('%y%m%d')}"),
        location_id=data.get('location_id', 1),
        logged_by_user_id=data.get('user_id', 1),
        status='accumulating'
    )

    db.session.add(waste)
    db.session.commit()

    return jsonify(waste.to_dict()), 201
