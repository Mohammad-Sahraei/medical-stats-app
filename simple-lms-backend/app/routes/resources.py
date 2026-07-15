import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.utils import secure_filename
from app.models import db, Resource, Lesson, Exam, ExamSubmission
from app.routes.auth import role_required
from app.utils import is_lesson_completed_by_student

resources_bp = Blueprint('resources', __name__)

ALLOWED_EXTENSIONS = {'pdf'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def is_resource_unlocked_for_student(resource, student_id):
    """
    Lesson-attached PDFs unlock once the student has completed every section
    of that lesson. Exam-attached PDFs unlock once the student has submitted
    that exam at least once (any score).
    """
    if resource.lesson_id:
        return is_lesson_completed_by_student(resource.lesson_id, student_id)

    if resource.exam_id:
        return ExamSubmission.query.filter_by(
            exam_id=resource.exam_id, student_id=student_id
        ).first() is not None

    return True


@resources_bp.route('', methods=['GET'])
@jwt_required()
def list_resources():
    """
    List downloadable PDF resources
    ---
    tags:
      - Resources
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: query
        type: integer
        required: false
      - name: exam_id
        in: query
        type: integer
        required: false
    responses:
      200:
        description: List of resources
    """
    query = Resource.query

    lesson_id = request.args.get('lesson_id', type=int)
    exam_id = request.args.get('exam_id', type=int)

    if lesson_id:
        query = query.filter_by(lesson_id=lesson_id)
    if exam_id:
        query = query.filter_by(exam_id=exam_id)

    resources = query.order_by(Resource.uploaded_at.desc()).all()

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')

    result = []
    for r in resources:
        data = r.to_dict()
        if role == 'student':
            data['unlocked'] = is_resource_unlocked_for_student(r, user_id)
            data['lock_reason'] = (
                None if data['unlocked']
                else ('complete_lesson' if r.lesson_id else 'take_exam')
            )
        else:
            data['unlocked'] = True
            data['lock_reason'] = None
        result.append(data)

    return jsonify({'resources': result}), 200


@resources_bp.route('', methods=['POST'])
@role_required(['professor', 'admin'])
def upload_resource():
    """
    Upload a PDF resource attached to a lesson or an exam
    ---
    tags:
      - Resources
    security: [{Bearer: []}]
    consumes:
      - multipart/form-data
    parameters:
      - name: file
        in: formData
        type: file
        required: true
      - name: title
        in: formData
        type: string
        required: false
      - name: lesson_id
        in: formData
        type: integer
        required: false
      - name: exam_id
        in: formData
        type: integer
        required: false
    responses:
      201:
        description: Resource uploaded successfully
      400:
        description: Bad request (no file, wrong type, or missing lesson_id/exam_id)
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'Only PDF files are allowed'}), 400

    lesson_id = request.form.get('lesson_id', type=int)
    exam_id = request.form.get('exam_id', type=int)

    if not lesson_id and not exam_id:
        return jsonify({'error': 'lesson_id or exam_id is required'}), 400

    if lesson_id and not Lesson.query.get(lesson_id):
        return jsonify({'error': f'Lesson with ID {lesson_id} not found'}), 404

    if exam_id and not Exam.query.get(exam_id):
        return jsonify({'error': f'Exam with ID {exam_id} not found'}), 404

    original_filename = secure_filename(file.filename)
    unique_filename = f"{uuid.uuid4().hex}.pdf"

    upload_folder = current_app.config['UPLOAD_FOLDER']
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder, exist_ok=True)

    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)

    professor_id = get_jwt().get('user_id')
    title = request.form.get('title') or original_filename

    resource = Resource(
        title=title,
        filename=unique_filename,
        original_filename=original_filename,
        lesson_id=lesson_id,
        exam_id=exam_id,
        professor_id=professor_id
    )
    db.session.add(resource)
    db.session.commit()

    return jsonify({
        'message': 'Resource uploaded successfully',
        'resource': resource.to_dict()
    }), 201


@resources_bp.route('/<int:resource_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_resource(resource_id):
    """
    Delete a PDF resource
    ---
    tags:
      - Resources
    security: [{Bearer: []}]
    parameters:
      - name: resource_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Resource deleted
      404:
        description: Resource not found
    """
    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404

    upload_folder = current_app.config['UPLOAD_FOLDER']
    file_path = os.path.join(upload_folder, resource.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    db.session.delete(resource)
    db.session.commit()

    return jsonify({'message': 'Resource deleted successfully'}), 200


@resources_bp.route('/files/<filename>')
@jwt_required()
def serve_resource_file(filename):
    """
    Serve an uploaded PDF resource (locked for students until they've
    completed the related lesson/exam)
    ---
    tags:
      - Resources
    security: [{Bearer: []}]
    parameters:
      - name: filename
        in: path
        type: string
        required: true
    produces:
      - application/pdf
    responses:
      200:
        description: Returns the raw PDF file stream.
      403:
        description: File is locked for this student.
      404:
        description: File not found.
    """
    resource = Resource.query.filter_by(filename=filename).first()
    if not resource:
        return jsonify({'error': 'File not found'}), 404

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')

    if role == 'student' and not is_resource_unlocked_for_student(resource, user_id):
        return jsonify({'error': 'This file is locked until the related lesson/exam is completed'}), 403

    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)
