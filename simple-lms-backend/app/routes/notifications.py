from datetime import datetime

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from app.models import db, Notification, User
from app.routes.auth import role_required

notifications_bp = Blueprint('notifications', __name__)


@notifications_bp.route('', methods=['GET'])
@jwt_required()
def list_notifications():
    """
    List all calendar notifications (both roles see the same broadcast list),
    newest-posted first. Students also get an 'unread' flag per item.
    ---
    tags:
      - Notifications
    security: [{Bearer: []}]
    responses:
      200:
        description: List of notifications
    """
    notifications = Notification.query.order_by(Notification.created_at.desc()).all()

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')

    last_seen = None
    if role == 'student':
        user = User.query.get(user_id)
        last_seen = user.last_seen_notifications_at if user else None

    result = []
    for n in notifications:
        data = n.to_dict()
        if role == 'student':
            data['unread'] = last_seen is None or n.created_at > last_seen
        result.append(data)

    return jsonify({'notifications': result}), 200


@notifications_bp.route('/unread-count', methods=['GET'])
@role_required(['student'])
def unread_notifications_count():
    """
    Number of notifications posted since this student last opened the list
    ---
    tags:
      - Notifications
    security: [{Bearer: []}]
    responses:
      200:
        description: Unread count
    """
    user_id = get_jwt().get('user_id')
    user = User.query.get(user_id)

    query = Notification.query
    if user and user.last_seen_notifications_at:
        query = query.filter(Notification.created_at > user.last_seen_notifications_at)

    return jsonify({'count': query.count()}), 200


@notifications_bp.route('/mark-read', methods=['POST'])
@role_required(['student'])
def mark_notifications_read():
    """
    Mark all current notifications as seen by this student
    ---
    tags:
      - Notifications
    security: [{Bearer: []}]
    responses:
      200:
        description: Marked as read
    """
    user_id = get_jwt().get('user_id')
    user = User.query.get(user_id)
    if user:
        user.last_seen_notifications_at = datetime.utcnow()
        db.session.commit()

    return jsonify({'message': 'Marked as read'}), 200


@notifications_bp.route('', methods=['POST'])
@role_required(['professor', 'admin'])
def upsert_notification():
    """
    Create or replace the notification message for a given date
    ---
    tags:
      - Notifications
    security: [{Bearer: []}]
    parameters:
      - in: body
        name: body
        schema:
          type: object
          required: [date, message]
          properties:
            date: {type: string, example: "2026-07-10"}
            message: {type: string, example: "امتحان میان‌ترم هفته آینده برگزار می‌شود."}
    responses:
      200: {description: Notification saved}
      400: {description: Bad request (missing/invalid fields)}
    """
    data = request.get_json() or {}
    date_str = data.get('date')
    message = (data.get('message') or '').strip()

    if not date_str or not message:
        return jsonify({'error': 'date and message are required'}), 400

    try:
        parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'date must be in YYYY-MM-DD format'}), 400

    professor_id = get_jwt().get('user_id')

    notification = Notification.query.filter_by(date=parsed_date).first()
    if notification:
        notification.message = message
        notification.professor_id = professor_id
    else:
        notification = Notification(date=parsed_date, message=message, professor_id=professor_id)
        db.session.add(notification)

    db.session.commit()

    return jsonify({
        'message': 'Notification saved',
        'notification': notification.to_dict()
    }), 200


@notifications_bp.route('/<int:notification_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_notification(notification_id):
    """
    Delete a notification
    ---
    tags:
      - Notifications
    security: [{Bearer: []}]
    parameters:
      - name: notification_id
        in: path
        type: integer
        required: true
    responses:
      200: {description: Notification deleted}
      404: {description: Notification not found}
    """
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404

    db.session.delete(notification)
    db.session.commit()

    return jsonify({'message': 'Notification deleted'}), 200
