from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.routes.auth import role_required
from app.models import db, Lesson, Section, SectionProgress

lessons_bp = Blueprint('lessons', __name__)

@lessons_bp.route('', methods=['GET'])
@jwt_required(optional=True)
def get_lessons():
    """
    Get all lessons
    ---
    tags:
      - Lessons
    responses:
      200:
        description: A list of lessons
    """
    lessons = Lesson.query.all()
    return jsonify([lesson.to_dict() for lesson in lessons]), 200

@lessons_bp.route('/<int:lesson_id>', methods=['GET'])
@jwt_required(optional=True)
def get_lesson(lesson_id):
    """
    Get a specific lesson by ID
    ---
    tags:
      - Lessons
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Lesson details with sections
      404:
        description: Lesson not found
    """
    lesson = Lesson.query.get_or_404(lesson_id)
    return jsonify(lesson.to_dict()), 200

@lessons_bp.route('', methods=['POST'])
@role_required(['professor', 'admin'])
def create_lesson():
    """
    Create a new lesson
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              example: "مقدمه‌ای بر پایتون پیشرفته"
    responses:
      201:
        description: Lesson created successfully
      400:
        description: Bad request
      403:
        description: Unauthorized (only professors/admins)
    """
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400

    user_id = get_jwt().get('user_id')
    lesson = Lesson(
        title=data['title'],
        professor_id=user_id
    )
    
    db.session.add(lesson)
    db.session.commit()
    
    return jsonify({'message': 'Lesson created successfully', 'lesson': lesson.to_dict()}), 201

@lessons_bp.route('/<int:lesson_id>/sections', methods=['POST'])
@role_required(['professor', 'admin'])
def create_section(lesson_id):
    """
    Add a new section to a lesson
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              example: "۱. انواع داده‌ها و متغیرها"
            body_content:
              type: string
              example: "<p>به بخش اول خوش آمدید! در اینجا یک نمونه تصویر خطی آورده شده است:</p><br><img src='/api/upload/images/sample.webp' alt='لوگوی پایتون'>"
    responses:
      201:
        description: Section added successfully
      400:
        description: Bad request
      403:
        description: Unauthorized
      404:
        description: Lesson not found
    """
    lesson = Lesson.query.get_or_404(lesson_id)

    data = request.get_json()
    if not data or not data.get('title') or not data.get('body_content'):
        return jsonify({'error': 'Title and body_content are required'}), 400

    # Automatically determine the next order_index
    max_order = db.session.query(db.func.max(Section.order_index)).filter_by(lesson_id=lesson.id).scalar()
    next_index = 0 if max_order is None else max_order + 1

    section = Section(
        lesson_id=lesson.id,
        title=data['title'],
        body_content=data['body_content'],
        order_index=next_index
    )
    
    db.session.add(section)
    db.session.commit()
    
    return jsonify({'message': 'Section added successfully', 'section': section.to_dict()}), 201

@lessons_bp.route('/<int:lesson_id>', methods=['PUT'])
@role_required(['professor', 'admin'])
def update_lesson(lesson_id):
    """
    Update a lesson
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              example: "مقدمه‌ای بر برنامه‌نویسی (ویرایش شده)"
    responses:
      200:
        description: Lesson updated successfully
      400:
        description: Bad request
      403:
        description: Unauthorized
      404:
        description: Lesson not found
    """
    lesson = Lesson.query.get_or_404(lesson_id)
    data = request.get_json()
    
    if data and data.get('title'):
        lesson.title = data['title']
        db.session.commit()
        return jsonify({'message': 'Lesson updated successfully', 'lesson': lesson.to_dict()}), 200
        
    return jsonify({'error': 'Title is required for update'}), 400

@lessons_bp.route('/<int:lesson_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_lesson(lesson_id):
    """
    Delete a lesson (and all its sections)
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Lesson deleted successfully
      403:
        description: Unauthorized
      404:
        description: Lesson not found
    """
    lesson = Lesson.query.get_or_404(lesson_id)
    db.session.delete(lesson)
    db.session.commit()
    
    return jsonify({'message': 'Lesson deleted successfully'}), 200

@lessons_bp.route('/<int:lesson_id>/sections/<int:section_id>', methods=['PUT'])
@role_required(['professor', 'admin'])
def update_section(lesson_id, section_id):
    """
    Update a specific section
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
      - name: section_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            title:
              type: string
              example: "۱. متغیرها (ویرایش شده)"
            body_content:
              type: string
              example: "<p>محتوای جدید برای این بخش.</p>"
            order_index:
              type: integer
              example: 0
    responses:
      200:
        description: Section updated successfully
      403:
        description: Unauthorized
      404:
        description: Section not found
    """
    section = Section.query.filter_by(id=section_id, lesson_id=lesson_id).first_or_404()
    data = request.get_json()
    
    if data:
        if 'title' in data:
            section.title = data['title']
        if 'body_content' in data:
            section.body_content = data['body_content']
        if 'order_index' in data:
            section.order_index = data['order_index']
            
        db.session.commit()
        return jsonify({'message': 'Section updated successfully', 'section': section.to_dict()}), 200
        
    return jsonify({'error': 'No data provided to update'}), 400

@lessons_bp.route('/<int:lesson_id>/sections/<int:section_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_section(lesson_id, section_id):
    """
    Delete a specific section
    ---
    tags:
      - Lessons
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
      - name: section_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Section deleted successfully
      403:
        description: Unauthorized
      404:
        description: Section not found
    """
    section = Section.query.filter_by(id=section_id, lesson_id=lesson_id).first_or_404()
    db.session.delete(section)
    
    # Re-order the remaining sections to close any gaps
    remaining_sections = Section.query.filter_by(lesson_id=lesson_id).order_by(Section.order_index).all()
    for index, sec in enumerate(remaining_sections):
        sec.order_index = index
        
    db.session.commit()
    
    return jsonify({'message': 'Section deleted successfully, indices reordered'}), 200

@lessons_bp.route('/<int:lesson_id>/sections/<int:section_id>', methods=['GET'])
@jwt_required(optional=True)
def get_section(lesson_id, section_id):
    """
    Get a specific section by ID
    ---
    tags:
      - Lessons
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
      - name: section_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Section details
      404:
        description: Section not found
    """
    section = Section.query.filter_by(id=section_id, lesson_id=lesson_id).first_or_404()
    return jsonify(section.to_dict()), 200

@lessons_bp.route('/<int:lesson_id>/sections', methods=['GET'])
@jwt_required(optional=True)
def get_lesson_sections(lesson_id):
    """
    Get all sections of a lesson (with optional completion progress)
    ---
    tags:
      - Lessons
    parameters:
      - name: lesson_id
        in: path
        type: integer
        required: true
        description: ID of the lesson
    responses:
      200:
        description: List of sections in the lesson
        schema:
          type: array
          items:
            type: object
            properties:
              id: { type: integer, example: 1 }
              lesson_id: { type: integer, example: 1 }
              title: { type: string, example: "۱. متغیرها و انواع داده‌ها در پایتون" }
              body_content: { type: string, example: "<p>محتوا</p>" }
              order_index: { type: integer, example: 0 }
              completed: { type: boolean, example: true }
      404:
        description: Lesson not found
    """
    lesson = Lesson.query.get_or_404(lesson_id)
    
    # Sort sections by order_index
    sorted_sections = sorted(lesson.sections, key=lambda x: x.order_index)
    
    # Check if student is authenticated and has progress
    claims = get_jwt()
    completed_section_ids = set()
    if claims and claims.get('user_id') and claims.get('role') == 'student':
        user_id = claims.get('user_id')
        progress_records = SectionProgress.query.filter_by(student_id=user_id).all()
        completed_section_ids = {p.section_id for p in progress_records}
        
    sections_list = []
    for section in sorted_sections:
        s_dict = section.to_dict()
        s_dict['completed'] = section.id in completed_section_ids
        sections_list.append(s_dict)
        
    return jsonify(sections_list), 200
