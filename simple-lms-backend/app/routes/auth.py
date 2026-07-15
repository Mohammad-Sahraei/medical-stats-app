import hashlib
import re
import secrets
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from app.models import db, User, Student
from app.mailer import send_verification_code_email
from functools import wraps

auth_bp = Blueprint('auth', __name__)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')

RESET_CODE_TTL = timedelta(minutes=10)


def _hash_reset_code(code):
    return hashlib.sha256(code.encode('utf-8')).hexdigest()


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new student
    ---
    tags: [Authentication]
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [first_name, last_name, student_id, username, password, email]
          properties:
            first_name: {type: string, example: John}
            last_name: {type: string, example: Doe}
            student_id: {type: string, example: STU2024001}
            username: {type: string, example: johndoe}
            password: {type: string, example: password123}
            email: {type: string, example: john@example.com}
    responses:
      201: {description: Student registered successfully}
      400: {description: Bad request}
    """
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['first_name', 'last_name', 'student_id', 'username', 'password', 'email']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400

        if not EMAIL_RE.match(data['email']):
            return jsonify({'error': 'Invalid email address'}), 400

        # Check if username already exists
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'error': 'Username already exists'}), 400

        # Check if student_id already exists
        if User.query.filter_by(student_id=data['student_id']).first():
            return jsonify({'error': 'Student ID already exists'}), 400

        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already exists'}), 400

        # Validate password length
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        # Create new student
        student = Student(
            username=data['username'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            student_id=data['student_id'],
            email=data['email'],
            role='student'
        )
        student.set_password(data['password'])

        db.session.add(student)
        db.session.commit()

        return jsonify({
            'message': 'Student registered successfully',
            'user': student.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User login
    ---
    tags: [Authentication]
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [username, password]
          properties:
            username: {type: string, example: admin}
            password: {type: string, example: admin123}
    responses:
      200: {description: Login successful}
      401: {description: Invalid credentials}
    """
    try:
        # Try JSON first, fall back to Form data (for Swagger OAuth2 login)
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form
            
        # Validate input
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Missing username or password'}), 400
        
        # Find user by username
        user = User.query.filter_by(username=data['username']).first()
        
        # Check if user exists and password is correct
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid username or password'}), 401
        
        # Create tokens with additional claims
        additional_claims = {
            'role': user.role,
            'user_id': user.id
        }
        
        access_token = create_access_token(
            identity=user.username,
            additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(identity=user.username)
        
        return jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            'token_type': 'bearer',
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token
    ---
    tags: [Authentication]
    security: [{Bearer: []}]
    responses:
      200: {description: New access token generated}
    """
    try:
        current_user = get_jwt_identity()
        user = User.query.filter_by(username=current_user).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        additional_claims = {
            'role': user.role,
            'user_id': user.id
        }
        
        access_token = create_access_token(
            identity=current_user,
            additional_claims=additional_claims
        )
        
        return jsonify({
            'access_token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    """
    Get current user profile
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Current authenticated user's profile data
        schema:
          type: object
          properties:
            user:
              type: object
              properties:
                id: { type: integer, example: 1 }
                username: { type: string, example: "johndoe" }
                role: { type: string, example: "student" }
                first_name: { type: string, example: "John" }
                last_name: { type: string, example: "Doe" }
                created_at: { type: string, example: "2024-01-01T00:00:00" }
                student_id: { type: string, example: "STU2024001" }
      401:
        description: Missing or invalid JWT access token
      404:
        description: Authenticated user not found
    """
    try:
        current_username = get_jwt_identity()
        user = User.query.filter_by(username=current_username).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({'user': user.to_dict()}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    Update current user's non-critical profile information
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            first_name:
              type: string
              example: "John"
            last_name:
              type: string
              example: "Doe"
            student_id:
              type: string
              example: "STU2024001"
    responses:
      200:
        description: Profile updated successfully
        schema:
          type: object
          properties:
            message: { type: string, example: "Profile updated successfully" }
            user: { type: object }
      400:
        description: Bad request (attempt to modify protected fields or missing data)
      401:
        description: Missing or invalid JWT access token
      404:
        description: User not found
    """
    try:
        current_username = get_jwt_identity()
        user = User.query.filter_by(username=current_username).first()

        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        protected_fields = ['username', 'role', 'password', 'id']
        for field in protected_fields:
            if field in data:
                return jsonify({'error': f'Field "{field}" cannot be modified'}), 400

        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'student_id' in data:
            if user.role != 'student':
                return jsonify({'error': 'Only students can set a student ID'}), 400
            existing = User.query.filter(User.student_id == data['student_id'], User.id != user.id).first()
            if existing:
                return jsonify({'error': 'Student ID already exists'}), 400
            user.student_id = data['student_id']
        if 'theme' in data:
            if data['theme'] not in ('light', 'dark'):
                return jsonify({'error': 'theme must be "light" or "dark"'}), 400
            user.theme = data['theme']
        if 'email' in data:
            if data['email'] and not EMAIL_RE.match(data['email']):
                return jsonify({'error': 'Invalid email address'}), 400
            existing = User.query.filter(User.email == data['email'], User.id != user.id).first()
            if data['email'] and existing:
                return jsonify({'error': 'Email already exists'}), 400
            user.email = data['email'] or None

        db.session.commit()

        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """
    Request a password-reset verification code by email
    ---
    tags: [Authentication]
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [username]
          properties:
            username: {type: string, example: johndoe}
    responses:
      200:
        description: >
          Always returns success (whether or not the account/email exists),
          to avoid revealing which usernames are registered.
    """
    generic_response = {
        'message': 'اگر این نام کاربری ایمیل ثبت‌شده داشته باشد، کد تایید برای آن ارسال شد.'
    }

    try:
        data = request.get_json() or {}
        username = data.get('username')
        if not username:
            return jsonify({'error': 'username is required'}), 400

        user = User.query.filter_by(username=username).first()
        if not user or not user.email:
            return jsonify(generic_response), 200

        code = f'{secrets.randbelow(1000000):06d}'
        user.reset_code_hash = _hash_reset_code(code)
        user.reset_code_expires_at = datetime.utcnow() + RESET_CODE_TTL
        db.session.commit()

        send_verification_code_email(user.email, user.first_name, code)

        return jsonify(generic_response), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    """
    Reset a password using the emailed verification code
    ---
    tags: [Authentication]
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [username, code, new_password]
          properties:
            username: {type: string, example: johndoe}
            code: {type: string, example: "482913"}
            new_password: {type: string, example: newpassword123}
    responses:
      200: {description: Password reset successfully}
      400: {description: Missing fields, expired/invalid code, or password too short}
    """
    try:
        data = request.get_json() or {}
        username = data.get('username')
        code = data.get('code')
        new_password = data.get('new_password')

        if not username or not code or not new_password:
            return jsonify({'error': 'username, code and new_password are required'}), 400

        if len(new_password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400

        user = User.query.filter_by(username=username).first()
        if (
            not user
            or not user.reset_code_hash
            or not user.reset_code_expires_at
            or user.reset_code_expires_at < datetime.utcnow()
            or user.reset_code_hash != _hash_reset_code(code)
        ):
            return jsonify({'error': 'کد تایید نامعتبر یا منقضی شده است'}), 400

        user.set_password(new_password)
        user.reset_code_hash = None
        user.reset_code_expires_at = None
        db.session.commit()

        return jsonify({'message': 'رمز عبور با موفقیت تغییر کرد'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """
    Get current user profile (Protected)
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Access granted. Returns current authenticated user profile.
      401:
        description: Missing or invalid JWT Access Token.
      404:
        description: Authenticated user not found in system.
    """
    try:
        current_username = get_jwt_identity()
        claims = get_jwt()
        
        user = User.query.filter_by(username=current_username).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'message': f'Hello {user.first_name}! You have {claims.get("role", "unknown")} access.',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Role-based access decorators
def role_required(roles):
    """Decorator to check user roles"""
    def wrapper(fn):
        @wraps(fn)
        @jwt_required()
        def decorator(*args, **kwargs):
            claims = get_jwt()
            if claims.get('role') not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

# Example role-protected routes
@auth_bp.route('/admin/dashboard', methods=['GET'])
@role_required(['admin'])
def admin_dashboard():
    """
    Get Admin Dashboard Stats
    ---
    tags:
      - Admin
    security:
      - Bearer: []
    responses:
      200:
        description: System health and student/faculty registration statistics.
      403:
        description: Insufficient permissions (requires admin role).
    """
    return jsonify({
        'stats': {'total_students': 150, 'total_professors': 12},
        'system_status': 'healthy'
    }), 200

