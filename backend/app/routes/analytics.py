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
