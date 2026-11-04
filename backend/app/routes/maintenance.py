from datetime import datetime, date, timedelta
from flask import Blueprint, request, jsonify
from app.models import db, Asset, AssetCalibration

maintenance_bp = Blueprint('maintenance', __name__, url_prefix='/api/maintenance')

@maintenance_bp.route('/schedule', methods=['GET'])
def get_maintenance_schedule():
    days_ahead = int(request.args.get('days', 60))
    target_date = date.today() + timedelta(days=days_ahead)

    # Assets due within target date or overdue
    assets_due = Asset.query.filter(
        (Asset.next_calibration_due <= target_date) |
        (Asset.status.in_(['calibration_due', 'under_maintenance']))
    ).order_by(Asset.next_calibration_due.asc()).all()

    results = []
    for a in assets_due:
        days_left = (a.next_calibration_due - date.today()).days if a.next_calibration_due else 0
        results.append({
            'asset': a.to_dict(),
            'days_remaining': days_left,
            'is_overdue': days_left < 0,
            'priority': 'URGENT' if days_left <= 0 else ('HIGH' if days_left <= 14 else 'MEDIUM')
        })

    return jsonify(results)

@maintenance_bp.route('/calibrations', methods=['GET'])
def get_calibrations():
    cals = AssetCalibration.query.order_by(AssetCalibration.calibration_date.desc()).all()
    return jsonify([c.to_dict() for c in cals])
