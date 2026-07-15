from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.routes.auth import role_required
from app.models import db, User, Lesson, Section, SectionProgress, Exam, ExamSubmission

progress_bp = Blueprint('progress', __name__)

@progress_bp.route('/me', methods=['GET'])
@role_required(['student'])
def get_my_progress():
    """
    Get current student's progress across all lessons
    ---
    tags:
      - Progress
    security:
      - Bearer: []
    responses:
      200:
        description: List of lesson progress objects for the student
        schema:
          type: array
          items:
            type: object
            properties:
              lesson_id:
                type: integer
                example: 1
              lesson_title:
                type: string
                example: "مقدمه‌ای بر برنامه‌نویسی پایتون"
              total_sections:
                type: integer
                example: 2
              completed_sections_count:
                type: integer
                example: 1
              progress_percentage:
                type: number
                example: 50.0
              completed_section_ids:
                type: array
                items:
                  type: integer
                example: [1]
              next_section_id:
                type: integer
                example: 2
      401:
        description: Unauthorized
      403:
        description: Forbidden (insufficient permissions, student role required)
    """
    try:
        user_id = get_jwt().get('user_id')
        
        # Get all lessons
        lessons = Lesson.query.all()
        
        # Get all progress records for this student to make querying efficient
        progress_records = SectionProgress.query.filter_by(student_id=user_id).all()
        completed_section_ids = {p.section_id for p in progress_records}
        
        progress_list = []
        
        for lesson in lessons:
            # Sort sections by order_index
            sorted_sections = sorted(lesson.sections, key=lambda s: s.order_index)
            total_sections = len(sorted_sections)
            
            completed_in_lesson = [s.id for s in sorted_sections if s.id in completed_section_ids]
            completed_count = len(completed_in_lesson)
            
            percentage = 0.0
            if total_sections > 0:
                percentage = round((completed_count / total_sections) * 100, 2)
                
            # Find next section: the first section that is not completed
            next_section_id = None
            for s in sorted_sections:
                if s.id not in completed_section_ids:
                    next_section_id = s.id
                    break
            
            progress_list.append({
                'lesson_id': lesson.id,
                'lesson_title': lesson.title,
                'total_sections': total_sections,
                'completed_sections_count': completed_count,
                'progress_percentage': percentage,
                'completed_section_ids': completed_in_lesson,
                'next_section_id': next_section_id
            })
            
        return jsonify(progress_list), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@progress_bp.route('', methods=['POST'])
@role_required(['student'])
def mark_progress():
    """
    Mark a lesson section as completed
    ---
    tags:
      - Progress
    security:
      - Bearer: []
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - section_id
          properties:
            section_id:
              type: integer
              example: 1
    responses:
      201:
        description: Progress recorded successfully
        schema:
          type: object
          properties:
            message:
              type: string
              example: "Progress recorded successfully"
            progress:
              type: object
              properties:
                id: { type: integer, example: 1 }
                student_id: { type: integer, example: 3 }
                section_id: { type: integer, example: 1 }
                completed_at: { type: string, example: "2026-06-14T01:30:00" }
      200:
        description: Section already marked as completed
      400:
        description: Bad request (missing fields, section doesn't exist)
      401:
        description: Unauthorized
      403:
        description: Forbidden
    """
    try:
        data = request.get_json()
        if not data or 'section_id' not in data:
            return jsonify({'error': 'section_id is required'}), 400
            
        section_id = data['section_id']
        
        # Verify section exists
        section = Section.query.get(section_id)
        if not section:
            return jsonify({'error': f'Section with ID {section_id} not found'}), 404
            
        user_id = get_jwt().get('user_id')
        
        # Check if progress already exists
        existing = SectionProgress.query.filter_by(student_id=user_id, section_id=section_id).first()
        if existing:
            return jsonify({
                'message': 'Section already marked as completed',
                'progress': existing.to_dict()
            }), 200
            
        progress = SectionProgress(
            student_id=user_id,
            section_id=section_id
        )
        db.session.add(progress)
        db.session.commit()
        
        return jsonify({
            'message': 'Progress recorded successfully',
            'progress': progress.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@progress_bp.route('/students', methods=['GET'])
@role_required(['professor', 'admin'])
def get_students_progress():
    """
    Get all students' progress and exam scores (Professor/Admin only)
    ---
    tags:
      - Progress
    security:
      - Bearer: []
    parameters:
      - name: student_id
        in: query
        type: integer
        required: false
        description: Filter by specific student ID
    responses:
      200:
        description: List of students with their lesson progress and exam scores
        schema:
          type: object
          properties:
            students:
              type: array
              items:
                type: object
                properties:
                  student:
                    type: object
                    properties:
                      id: { type: integer, example: 3 }
                      first_name: { type: string, example: "Jane" }
                      last_name: { type: string, example: "Doe" }
                      student_id: { type: string, example: "STU2024001" }
                  lessons:
                    type: array
                    items:
                      type: object
                      properties:
                        lesson_id: { type: integer, example: 1 }
                        lesson_title: { type: string, example: "مقدمه‌ای بر برنامه‌نویسی پایتون" }
                        total_sections: { type: integer, example: 2 }
                        completed_sections: { type: integer, example: 1 }
                        progress_percentage: { type: number, example: 50.0 }
                        exams:
                          type: array
                          items:
                            type: object
                            properties:
                              exam_id: { type: integer, example: 1 }
                              exam_title: { type: string, example: "کوئیز جامع پایتون مقدماتی" }
                              score: { type: number, example: 85.0 }
                              submitted_at: { type: string, example: "2024-01-15T10:30:00" }
      403:
        description: Insufficient permissions (requires professor or admin role)
    """
    try:
        claims = get_jwt()
        current_user_id = claims.get('user_id')
        current_role = claims.get('role')

        if current_role == 'admin':
            lessons = Lesson.query.all()
        else:
            lessons = Lesson.query.filter_by(professor_id=current_user_id).all()

        if not lessons:
            return jsonify({'students': []}), 200

        lesson_ids = [l.id for l in lessons]

        sections = Section.query.filter(Section.lesson_id.in_(lesson_ids)).all()
        section_ids = [s.id for s in sections]

        exams = Exam.query.filter(Exam.lesson_id.in_(lesson_ids)).all()
        exam_ids = [e.id for e in exams]

        progress_records = SectionProgress.query.filter(
            SectionProgress.section_id.in_(section_ids)
        ).all() if section_ids else []

        submissions = ExamSubmission.query.filter(
            ExamSubmission.exam_id.in_(exam_ids)
        ).all() if exam_ids else []

        student_ids = set()
        for p in progress_records:
            student_ids.add(p.student_id)
        for s in submissions:
            student_ids.add(s.student_id)

        if not student_ids:
            return jsonify({'students': []}), 200

        filter_student_id = request.args.get('student_id', type=int)
        if filter_student_id:
            if filter_student_id not in student_ids:
                return jsonify({'students': []}), 200
            student_ids = {filter_student_id}

        students = User.query.filter(User.id.in_(student_ids), User.role == 'student').all()

        progress_by_student = {}
        for p in progress_records:
            progress_by_student.setdefault(p.student_id, []).append(p)

        submissions_by_student = {}
        for s in submissions:
            submissions_by_student.setdefault(s.student_id, []).append(s)

        result = []
        for student in students:
            student_progress = progress_by_student.get(student.id, [])
            student_submissions = submissions_by_student.get(student.id, [])

            completed_section_ids = {p.section_id for p in student_progress}

            lesson_data = []
            for lesson in lessons:
                sorted_sections = sorted(lesson.sections, key=lambda s: s.order_index)
                total = len(sorted_sections)
                completed = [s.id for s in sorted_sections if s.id in completed_section_ids]
                completed_count = len(completed)

                percentage = 0.0
                if total > 0:
                    percentage = round((completed_count / total) * 100, 2)

                lesson_exams = [e for e in exams if e.lesson_id == lesson.id]
                exam_scores = []
                for exam in lesson_exams:
                    for sub in student_submissions:
                        if sub.exam_id == exam.id:
                            exam_scores.append({
                                'exam_id': exam.id,
                                'exam_title': exam.title,
                                'score': sub.score,
                                'submitted_at': sub.submitted_at.isoformat() if sub.submitted_at else None
                            })

                lesson_data.append({
                    'lesson_id': lesson.id,
                    'lesson_title': lesson.title,
                    'total_sections': total,
                    'completed_sections': completed_count,
                    'progress_percentage': percentage,
                    'exams': exam_scores
                })

            student_info = {
                'id': student.id,
                'first_name': student.first_name,
                'last_name': student.last_name,
                'student_id': student.student_id
            }

            result.append({
                'student': student_info,
                'lessons': lesson_data
            })

        return jsonify({'students': result}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
