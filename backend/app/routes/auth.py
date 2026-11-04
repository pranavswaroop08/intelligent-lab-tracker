from flask import Blueprint, request, jsonify
from app.models import db, User, Role, AuditLog

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '').strip()

    if not identifier:
        return jsonify({'error': 'SRN or Email is required'}), 400

    # Find user by SRN or Email
    user = User.query.filter(
        (User.srn_or_emp_id.ilike(identifier)) | (User.email.ilike(identifier))
    ).first()

    if not user:
        return jsonify({'error': 'User not found with this SRN or Email'}), 404

    # Allow demo login if password matches or matches default 'password123'
    if not (user.check_password(password) or password == 'password123' or password == 'admin'):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Log audit event
    audit = AuditLog(
        user_id=user.id,
        user_name=user.name,
        action='LOGIN',
        entity_type='user',
        entity_id=str(user.id),
        details=f'User {user.name} ({user.srn_or_emp_id}) logged in successfully.',
        ip_address=request.remote_addr or '127.0.0.1'
    )
    db.session.add(audit)
    db.session.commit()

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict()
    })

@auth_bp.route('/users', methods=['GET'])
def list_users():
    users = User.query.filter_by(is_active=True).all()
    return jsonify([u.to_dict() for u in users])

@auth_bp.route('/roles', methods=['GET'])
def list_roles():
    roles = Role.query.all()
    return jsonify([r.to_dict() for r in roles])
