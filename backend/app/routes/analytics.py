from datetime import date, timedelta
from flask import Blueprint, jsonify, request
from sqlalchemy import func
from app.models import db, Chemical, ChemicalBatch, Asset, AssetBorrowLog, HazardClass, StorageLocation, Dispensation, AuditLog

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('/dashboard', methods=['GET'])
def get_dashboard_summary():
    today = date.today()
    expiring_cutoff = today + timedelta(days=30)
    cal_cutoff = today + timedelta(days=14)

    total_chemicals = Chemical.query.count()
    total_batches = ChemicalBatch.query.filter(ChemicalBatch.status != 'depleted').count()
    
    # Low stock chemicals
    chemicals = Chemical.query.all()
    low_stock_count = sum(1 for c in chemicals if c.to_dict()['is_low_stock'])

    # Expiring batches
    expiring_batches_count = ChemicalBatch.query.filter(
        ChemicalBatch.status != 'depleted',
        ChemicalBatch.expiry_date <= expiring_cutoff
    ).count()

    # Asset statistics
    total_assets = Asset.query.count()
    active_borrows_count = AssetBorrowLog.query.filter_by(status='active').count()
    calibration_due_count = Asset.query.filter(
        (Asset.next_calibration_due <= cal_cutoff) | (Asset.status == 'calibration_due')
    ).count()

    # Calculate Laboratory Safety & Compliance Index (0 - 100%)
    # Deduct points for expired batches, overdue calibrations, low stock, and unaddressed safety violations
    base_score = 100
    expired_count = ChemicalBatch.query.filter(ChemicalBatch.expiry_date < today).count()
    base_score -= (expired_count * 8)
    base_score -= (calibration_due_count * 5)
    base_score = max(35, min(100, base_score))

    # Hazard class distribution
    hazards = HazardClass.query.all()
    hazard_distribution = []
    for h in hazards:
        chem_count = Chemical.query.filter_by(hazard_class_id=h.id).count()
        if chem_count > 0:
            hazard_distribution.append({
                'name': h.name,
                'code': h.code,
                'count': chem_count
            })

    # Asset category distribution
    asset_categories = db.session.query(Asset.category, func.count(Asset.id)).group_by(Asset.category).all()
    category_distribution = [{'category': cat.replace('_', ' ').title(), 'count': count} for cat, count in asset_categories]

    # Recent dispensations
    recent_dispensations = Dispensation.query.order_by(Dispensation.dispensed_at.desc()).limit(5).all()

    # Recent audit events
    recent_audits = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(8).all()

    return jsonify({
        'summary': {
            'total_chemicals': total_chemicals,
            'total_batches': total_batches,
            'low_stock_count': low_stock_count,
            'expiring_batches_count': expiring_batches_count,
            'total_assets': total_assets,
            'active_borrows_count': active_borrows_count,
            'calibration_due_count': calibration_due_count,
            'compliance_score': base_score,
            'compliance_grade': 'A+' if base_score >= 90 else ('A' if base_score >= 80 else 'B')
        },
        'hazard_distribution': hazard_distribution,
        'category_distribution': category_distribution,
        'recent_dispensations': [d.to_dict() for d in recent_dispensations],
        'recent_audits': [a.to_dict() for a in recent_audits]
    })

@analytics_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    limit = int(request.args.get('limit', 50))
    action = request.args.get('action')
    
    query = AuditLog.query.order_by(AuditLog.created_at.desc())
    if action:
        query = query.filter_by(action=action)
        
    logs = query.limit(limit).all()
    return jsonify([l.to_dict() for l in logs])

@analytics_bp.route('/views/<view_name>', methods=['GET'])
def get_view_data(view_name):
    allowed_views = {
        'vw_chemical_inventory_summary',
        'vw_asset_maintenance_status',
        'vw_hazard_incompatibility_matrix',
        'vw_dispensation_audit_trail',
        'vw_lab_safety_compliance_snapshot'
    }
    if view_name not in allowed_views:
        return jsonify({'error': f'Invalid view name. Allowed: {list(allowed_views)}'}), 400

    try:
        limit = min(int(request.args.get('limit', 20)), 100)
        res = db.session.execute(db.text(f"SELECT * FROM {view_name} LIMIT {limit}"))
        columns = list(res.keys())
        rows = [dict(zip(columns, row)) for row in res.fetchall()]
        return jsonify({
            'view_name': view_name,
            'columns': columns,
            'rows': rows,
            'count': len(rows)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@analytics_bp.route('/schema-metadata', methods=['GET'])
def get_schema_metadata():
    views_info = [
        {
            'name': 'vw_chemical_inventory_summary',
            'purpose': 'Aggregates chemical specifications with live container batches, physical storage cabinets, and stock threshold warnings.',
            'tables_joined': ['chemicals', 'hazard_classes', 'chemical_batches', 'storage_locations']
        },
        {
            'name': 'vw_asset_maintenance_status',
            'purpose': 'Consolidates instrument lifecycle, metrology calibration, days until next calibration due, and active borrower custody.',
            'tables_joined': ['assets', 'laboratories', 'storage_locations', 'asset_borrow_logs', 'users']
        },
        {
            'name': 'vw_hazard_incompatibility_matrix',
            'purpose': 'Unpacks the self-referential chemical incompatibility table into human-readable hazard names, severity levels, and segregation protocols.',
            'tables_joined': ['chemical_incompatibilities', 'hazard_classes (h1)', 'hazard_classes (h2)']
        },
        {
            'name': 'vw_dispensation_audit_trail',
            'purpose': 'Provides a complete chain-of-custody audit report for reagent dispensations, connecting user, batch lot, chemical, and witness.',
            'tables_joined': ['dispensations', 'chemical_batches', 'chemicals', 'users', 'roles']
        },
        {
            'name': 'vw_lab_safety_compliance_snapshot',
            'purpose': 'Laboratory-level executive summary aggregating instruments, chemical stock containers, overdue calibrations, and active loans.',
            'tables_joined': ['laboratories', 'assets', 'storage_locations', 'chemical_batches']
        }
    ]

    triggers_info = [
        {
            'name': 'trg_after_dispensation_deduct_stock',
            'timing': 'AFTER INSERT ON dispensations',
            'purpose': 'Automatically deducts remaining quantity from chemical_batches, updates status to low or depleted, and writes immutable audit entry.'
        },
        {
            'name': 'trg_after_calibration_update_asset',
            'timing': 'AFTER INSERT ON asset_calibrations',
            'purpose': 'Automatically resets asset operational status to available (or under_maintenance if failed), updates last and next calibration due dates, and writes audit record.'
        },
        {
            'name': 'trg_before_borrow_verify_status',
            'timing': 'BEFORE INSERT ON asset_borrow_logs',
            'purpose': 'Enforces database integrity by rejecting loans if instrument status is not available (prevents double-booking).'
        }
    ]

    return jsonify({
        'tables_count': 14,
        'views': views_info,
        'triggers': triggers_info
    })
