from flask import Blueprint, request, jsonify
from app.models import db, Chemical, StorageLocation, ChemicalIncompatibility, AuditLog
from app.services.compatibility_engine import CompatibilityEngine

compatibility_bp = Blueprint('compatibility', __name__, url_prefix='/api/compatibility')

@compatibility_bp.route('/check-pair', methods=['POST'])
def check_pair():
    data = request.get_json() or {}
    chem_a_id = data.get('chemical_a_id')
    chem_b_id = data.get('chemical_b_id')

    if not chem_a_id or not chem_b_id:
        return jsonify({'error': 'chemical_a_id and chemical_b_id are required'}), 400

    chem_a = Chemical.query.get_or_404(chem_a_id)
    chem_b = Chemical.query.get_or_404(chem_b_id)

    result = CompatibilityEngine.check_pairwise(chem_a, chem_b)
    result['chemical_a'] = chem_a.to_dict()
    result['chemical_b'] = chem_b.to_dict()

    if not result.get('compatible', True):
        # Log incompatibility safety alert to audit trail
        audit = AuditLog(
            user_name=data.get('user_name', 'Safety Simulation User'),
            action='INCOMPATIBILITY_ALERT',
            entity_type='safety_engine',
            entity_id=f"{chem_a_id}-{chem_b_id}",
            details=f"Incompatibility detected between {chem_a.name} and {chem_b.name}: {result.get('severity')} - {result.get('title')}"
        )
        db.session.add(audit)
        db.session.commit()

    return jsonify(result)

@compatibility_bp.route('/rules', methods=['GET'])
def get_rules():
    rules = ChemicalIncompatibility.query.all()
    return jsonify([r.to_dict() for r in rules])

@compatibility_bp.route('/facility-audit', methods=['GET'])
def facility_audit():
    locations = StorageLocation.query.all()
    audits = []
    total_violations = 0

    for loc in locations:
        res = CompatibilityEngine.audit_location_storage(loc.id)
        if not res.get('is_safe', True):
            total_violations += (res.get('incompatibilities_found', 0) + len(res.get('cabinet_violations', [])))
        audits.append(res)

    return jsonify({
        'total_locations_audited': len(locations),
        'total_hazard_violations': total_violations,
        'overall_facility_status': 'COMPLIANT' if total_violations == 0 else 'HAZARDS_DETECTED',
        'location_audits': audits
    })
