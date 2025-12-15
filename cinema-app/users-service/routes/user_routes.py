from flask import Blueprint, request, jsonify
from models.user import User
from extensions import db, bcrypt
from routes.auth_routes import token_required, admin_required

user_bp = Blueprint('users', __name__)

@user_bp.route('/', methods=['GET'])
@token_required
@admin_required
def get_all_users(current_user):
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    # Users can view their own profile, admins can view any
    if current_user.id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify(user.to_dict())

@user_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    # Users can update their own profile, admins can update any
    if current_user.id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'user_type' in data and current_user.is_admin:
        user.user_type = data['user_type']
    if 'is_active' in data and current_user.is_admin:
        user.is_active = data['is_active']
    if 'is_admin' in data and current_user.is_admin:
        user.is_admin = data['is_admin']
    if 'password' in data:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/<int:user_id>', methods=['DELETE'])
@token_required
@admin_required
def delete_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'})

@user_bp.route('/<int:user_id>/pricing', methods=['GET'])
@token_required
def get_user_pricing(current_user, user_id):
    """Get pricing multiplier based on user type"""
    if current_user.id != user_id and not current_user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Pricing multipliers by user type
    pricing_multipliers = {
        'regular': 1.0,
        'student': 0.8,      # 20% discount
        'under16': 0.7,      # 30% discount  
        'unemployed': 0.75   # 25% discount
    }
    
    multiplier = pricing_multipliers.get(user.user_type, 1.0)
    
    return jsonify({
        'user_type': user.user_type,
        'price_multiplier': multiplier,
        'discount_percentage': (1 - multiplier) * 100
    })
