from flask import Blueprint, request, jsonify
from app.models import db, StorageLocation, Laboratory, ChemicalBatch, Asset, AuditLog
from app.services.compatibility_engine import CompatibilityEngine

locations_bp = Blueprint('locations', __name__, url_prefix='/api/locations')

@locations_bp.route('', methods=['GET'])
def get_locations():
    lab_id = request.args.get('lab_id')
    storage_type = request.args.get('type')

    loc_query = StorageLocation.query

    if lab_id:
        loc_query = loc_query.filter_by(lab_id=int(lab_id))
    if storage_type:
        loc_query = loc_query.filter_by(storage_type=storage_type)

    locations = loc_query.all()
    return jsonify([loc.to_dict() for loc in locations])

@locations_bp.route('/<int:loc_id>', methods=['GET'])
def get_location_detail(loc_id):
    loc = StorageLocation.query.get_or_404(loc_id)
    data = loc.to_dict(include_inventory=True)
    
    # Group items by shelf for visual rack/shelf renderer
    shelves = {}
    for s_idx in range(1, loc.shelf_count + 1):
        shelves[s_idx] = {'shelf_number': s_idx, 'chemicals': [], 'assets': []}

    for b in loc.batches:
        s_num = b.shelf_number or 1
        if s_num not in shelves:
            shelves[s_num] = {'shelf_number': s_num, 'chemicals': [], 'assets': []}
        shelves[s_num]['chemicals'].append(b.to_dict())

    data['shelves_map'] = list(shelves.values())
    return jsonify(data)

@locations_bp.route('', methods=['POST'])
def create_location():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    storage_type = data.get('storage_type', '').strip()
    lab_id = data.get('lab_id', 1)

    if not name or not storage_type:
        return jsonify({'error': 'name and storage_type are required'}), 400

    code = data.get('location_code')
    if not code:
        code = f"LOC-{storage_type[:4].upper()}-{data.get('room_no', '301')}"

    loc = StorageLocation(
        lab_id=int(lab_id),
        location_code=code,
        name=name,
        storage_type=storage_type,
        room_no=data.get('room_no', 'Lab 301'),
        shelf_count=int(data.get('shelf_count', 4)),
        temperature_target_c=float(data.get('temperature_target_c', 22.0)),
        max_capacity_items=int(data.get('max_capacity_items', 40)),
        notes=data.get('notes', '')
    )

    db.session.add(loc)
    db.session.commit()

    return jsonify(loc.to_dict()), 201

@locations_bp.route('/<int:loc_id>/safety-audit', methods=['GET'])
def audit_location_safety(loc_id):
    audit_res = CompatibilityEngine.audit_location_storage(loc_id)
    return jsonify(audit_res)
