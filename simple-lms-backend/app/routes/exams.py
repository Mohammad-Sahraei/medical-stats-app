from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.routes.auth import role_required
from app.models import db, Exam, Question, ExamSubmission
from app.utils import is_lesson_completed_by_student

exams_bp = Blueprint('exams', __name__)

MAX_EXAM_ATTEMPTS = 3


def get_exam_eligibility(exam, student_id):
    """
    Returns (locked: bool, lock_reason: str|None, attempts_used: int) for a
    student trying to access/submit this exam. Lesson completion is checked
    before the attempt count since it's the more fundamental gate. A perfect
    score on any past attempt ends further attempts immediately, even if
    fewer than MAX_EXAM_ATTEMPTS have been used.
    """
    scores = [
        s.score for s in ExamSubmission.query.filter_by(
            exam_id=exam.id, student_id=student_id
        ).all()
    ]
    attempts_used = len(scores)

    if not is_lesson_completed_by_student(exam.lesson_id, student_id):
        return True, 'lesson_incomplete', attempts_used

    if scores and max(scores) >= 100:
        return True, 'perfect_score', attempts_used

    if attempts_used >= MAX_EXAM_ATTEMPTS:
        return True, 'attempts_exhausted', attempts_used

    return False, None, attempts_used


def _lock_message(lock_reason):
    if lock_reason == 'lesson_incomplete':
        return 'You must complete this lesson before taking its exam'
    if lock_reason == 'perfect_score':
        return 'You already achieved a perfect score on this exam'
    return f'You have used all {MAX_EXAM_ATTEMPTS} attempts for this exam'

@exams_bp.route('', methods=['GET'])
@jwt_required()
def get_exams():
    """
    Get all exams
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: lesson_id
        in: query
        type: integer
        required: false
        description: Filter exams by lesson ID
    responses:
      200:
        description: A list of exams (without correct options)
    """
    lesson_id = request.args.get('lesson_id', type=int)

    if lesson_id:
        exams = Exam.query.filter_by(lesson_id=lesson_id).all()
    else:
        exams = Exam.query.all()

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')
    include_answers = role in ['professor', 'admin']

    result = []
    for exam in exams:
        data = exam.to_dict(include_answers=include_answers)
        if role == 'student':
            locked, lock_reason, attempts_used = get_exam_eligibility(exam, user_id)
            data['locked'] = locked
            data['lock_reason'] = lock_reason
            data['attempts_used'] = attempts_used
            data['max_attempts'] = MAX_EXAM_ATTEMPTS
        else:
            data['locked'] = False
            data['lock_reason'] = None
            data['attempts_used'] = None
            data['max_attempts'] = MAX_EXAM_ATTEMPTS
        result.append(data)

    return jsonify(result), 200


@exams_bp.route('/<int:exam_id>', methods=['GET'])
@jwt_required()
def get_exam(exam_id):
    """
    Get a specific exam by ID
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Exam details with questions (correct options hidden for students)
      403:
        description: Student has not completed the exam's lesson yet.
      404:
        description: Exam not found
    """
    exam = Exam.query.get_or_404(exam_id)

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')
    include_answers = role in ['professor', 'admin']

    if role == 'student':
        locked, lock_reason, _ = get_exam_eligibility(exam, user_id)
        if locked:
            return jsonify({'error': _lock_message(lock_reason), 'lock_reason': lock_reason}), 403

    return jsonify(exam.to_dict(include_answers=include_answers)), 200


@exams_bp.route('', methods=['POST'])
@role_required(['professor', 'admin'])
def create_exam():
    """
    Create a new exam
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [title, lesson_id]
          properties:
            title:
              type: string
              example: "پایان‌ترم برنامه‌نویسی پایتون"
            lesson_id:
              type: integer
              example: 1
    responses:
      201:
        description: Exam created successfully
      400:
        description: Bad request
    """
    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'error': 'Title is required'}), 400
        
    if 'lesson_id' not in data or data.get('lesson_id') is None:
        return jsonify({'error': 'lesson_id is required and cannot be null'}), 400
        
    user_id = get_jwt().get('user_id')

    duration_minutes = data.get('duration_minutes')
    if duration_minutes is not None and (not isinstance(duration_minutes, int) or duration_minutes <= 0):
        return jsonify({'error': 'duration_minutes must be a positive integer or null'}), 400

    exam = Exam(
        title=data['title'],
        lesson_id=data['lesson_id'],
        professor_id=user_id,
        duration_minutes=duration_minutes
    )

    db.session.add(exam)
    db.session.commit()
    
    return jsonify({'message': 'Exam created successfully', 'exam': exam.to_dict(include_answers=True)}), 201


@exams_bp.route('/<int:exam_id>', methods=['PUT'])
@role_required(['professor', 'admin'])
def update_exam(exam_id):
    """
    Update exam metadata
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
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
              example: "پایان‌ترم برنامه‌نویسی پایتون (ویرایش شده)"
            lesson_id:
              type: integer
              example: 1
    responses:
      200:
        description: Exam updated successfully
      400:
        description: Bad request
      404:
        description: Exam not found
    """
    exam = Exam.query.get_or_404(exam_id)
    data = request.get_json()
    
    if data:
        if 'title' in data:
            if not data['title']:
                return jsonify({'error': 'Title cannot be empty'}), 400
            exam.title = data['title']
        if 'lesson_id' in data:
            if data['lesson_id'] is None:
                return jsonify({'error': 'lesson_id cannot be null'}), 400
            exam.lesson_id = data['lesson_id']
        if 'duration_minutes' in data:
            duration_minutes = data['duration_minutes']
            if duration_minutes is not None and (not isinstance(duration_minutes, int) or duration_minutes <= 0):
                return jsonify({'error': 'duration_minutes must be a positive integer or null'}), 400
            exam.duration_minutes = duration_minutes

        db.session.commit()
        return jsonify({'message': 'Exam updated successfully', 'exam': exam.to_dict(include_answers=True)}), 200
    return jsonify({'error': 'No data provided to update'}), 400


@exams_bp.route('/<int:exam_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_exam(exam_id):
    """
    Delete an exam
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Exam deleted successfully
      404:
        description: Exam not found
    """
    exam = Exam.query.get_or_404(exam_id)
    db.session.delete(exam)
    db.session.commit()
    
    return jsonify({'message': 'Exam deleted successfully'}), 200


# ==========================================
# Question Operations
# ==========================================

@exams_bp.route('/<int:exam_id>/questions', methods=['POST'])
@role_required(['professor', 'admin'])
def create_question(exam_id):
    """
    Add a question to an exam
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [question_text, option_a, option_b, option_c, option_d, correct_option]
          properties:
            question_text:
              type: string
              example: "<p>خروجی کد <code>print(2 ** 3)</code> چیست؟</p>"
            option_a:
              type: string
              example: "6"
            option_b:
              type: string
              example: "8"
            option_c:
              type: string
              example: "9"
            option_d:
              type: string
              example: "هیچکدام"
            correct_option:
              type: string
              example: "B"
            explanation:
              type: string
              example: "چون 2 به توان 3 برابر 8 می‌شود."
    responses:
      201:
        description: Question added successfully
      400:
        description: Bad request
      404:
        description: Exam not found
    """
    exam = Exam.query.get_or_404(exam_id)
    data = request.get_json()
    
    required_fields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']
    for field in required_fields:
        if not data or field not in data:
            return jsonify({'error': f'Missing field: {field}'}), 400
            
    correct_opt = data['correct_option'].upper()
    if correct_opt not in ['A', 'B', 'C', 'D']:
        return jsonify({'error': 'correct_option must be A, B, C, or D'}), 400
        
    # Auto determine order_index
    max_order = db.session.query(db.func.max(Question.order_index)).filter_by(exam_id=exam.id).scalar()
    next_index = 0 if max_order is None else max_order + 1
    
    question = Question(
        exam_id=exam.id,
        question_text=data['question_text'],
        option_a=data['option_a'],
        option_b=data['option_b'],
        option_c=data['option_c'],
        option_d=data['option_d'],
        correct_option=correct_opt,
        order_index=next_index,
        explanation=data.get('explanation')
    )
    
    db.session.add(question)
    db.session.commit()
    
    return jsonify({'message': 'Question added successfully', 'question': question.to_dict(include_correct=True)}), 201


@exams_bp.route('/<int:exam_id>/questions/<int:question_id>', methods=['PUT'])
@role_required(['professor', 'admin'])
def update_question(exam_id, question_id):
    """
    Update a specific question
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
      - name: question_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            question_text:
              type: string
            option_a:
              type: string
            option_b:
              type: string
            option_c:
              type: string
            option_d:
              type: string
            correct_option:
              type: string
            order_index:
              type: integer
            explanation:
              type: string
    responses:
      200:
        description: Question updated successfully
      404:
        description: Question not found
    """
    question = Question.query.filter_by(id=question_id, exam_id=exam_id).first_or_404()
    data = request.get_json()
    
    if data:
        if 'question_text' in data:
            question.question_text = data['question_text']
        if 'option_a' in data:
            question.option_a = data['option_a']
        if 'option_b' in data:
            question.option_b = data['option_b']
        if 'option_c' in data:
            question.option_c = data['option_c']
        if 'option_d' in data:
            question.option_d = data['option_d']
        if 'correct_option' in data:
            correct_opt = data['correct_option'].upper()
            if correct_opt not in ['A', 'B', 'C', 'D']:
                return jsonify({'error': 'correct_option must be A, B, C, or D'}), 400
            question.correct_option = correct_opt
        if 'order_index' in data:
            question.order_index = data['order_index']
        if 'explanation' in data:
            question.explanation = data['explanation']

        db.session.commit()
        return jsonify({'message': 'Question updated successfully', 'question': question.to_dict(include_correct=True)}), 200
        
    return jsonify({'error': 'No data provided to update'}), 400


@exams_bp.route('/<int:exam_id>/questions/<int:question_id>', methods=['DELETE'])
@role_required(['professor', 'admin'])
def delete_question(exam_id, question_id):
    """
    Delete a specific question
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
      - name: question_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Question deleted successfully
      404:
        description: Question not found
    """
    question = Question.query.filter_by(id=question_id, exam_id=exam_id).first_or_404()
    db.session.delete(question)
    
    # Auto reorder remaining questions
    remaining = Question.query.filter_by(exam_id=exam_id).order_by(Question.order_index).all()
    for index, q in enumerate(remaining):
        q.order_index = index
        
    db.session.commit()
    return jsonify({'message': 'Question deleted successfully, indices reordered'}), 200


# ==========================================
# Exam Submission & Grading
# ==========================================

@exams_bp.route('/<int:exam_id>/submit', methods=['POST'])
@jwt_required()
def submit_exam(exam_id):
    """
    Submit exam answers and get instant score
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
      - name: body
        in: body
        required: true
        schema:
          type: object
          required: [answers]
          properties:
            answers:
              type: object
              description: A dictionary mapping question ID string to selected option A/B/C/D
              example: {"1": "B", "2": "C"}
    responses:
      200:
        description: Exam submitted successfully with grading details
      400:
        description: Bad request (no answers or no questions in exam)
      404:
        description: Exam not found
    """
    exam = Exam.query.get_or_404(exam_id)

    claims = get_jwt()
    user_id = claims.get('user_id')

    if claims.get('role') == 'student':
        locked, lock_reason, _ = get_exam_eligibility(exam, user_id)
        if locked:
            return jsonify({'error': _lock_message(lock_reason), 'lock_reason': lock_reason}), 403

    data = request.get_json()

    if not data or 'answers' not in data:
        return jsonify({'error': 'Answers are required'}), 400

    submitted_answers = data['answers'] # Dict mapping question_id (str) to option (str)
    
    questions = exam.questions
    if not questions:
        return jsonify({'error': 'This exam has no questions'}), 400
        
    total_questions = len(questions)
    correct_count = 0
    breakdown = []
    
    for q in questions:
        q_id_str = str(q.id)
        selected = submitted_answers.get(q_id_str)
        if selected:
            selected = selected.upper()
            
        correct = q.correct_option
        is_correct = (selected == correct)
        
        if is_correct:
            correct_count += 1
            
        breakdown.append({
            'question_id': q.id,
            'selected_option': selected,
            'correct_option': correct,
            'is_correct': is_correct
        })
        
    score = (correct_count / total_questions) * 100

    submission = ExamSubmission(
        exam_id=exam.id,
        student_id=user_id,
        score=score,
        answers={b['question_id']: b['selected_option'] for b in breakdown}
    )
    db.session.add(submission)
    db.session.commit()

    all_scores = [
        s.score for s in ExamSubmission.query.filter_by(
            exam_id=exam.id, student_id=user_id
        ).all()
    ]
    best_score = max(all_scores)
    attempts_used = len(all_scores)

    locked, lock_reason, _ = get_exam_eligibility(exam, user_id)

    return jsonify({
        'message': 'Exam submitted and graded successfully',
        'submission_id': submission.id,
        'score': score,
        'best_score': best_score,
        'attempts_used': attempts_used,
        'attempts_remaining': max(0, MAX_EXAM_ATTEMPTS - attempts_used),
        'total_questions': total_questions,
        'correct_count': correct_count,
        'breakdown': breakdown,
        'locked': locked,
        'lock_reason': lock_reason
    }), 200


@exams_bp.route('/<int:exam_id>/review', methods=['GET'])
@jwt_required()
def review_exam(exam_id):
    """
    Review a student's own best attempt on an exam: the option they picked
    per question, and (only for questions they got wrong) the correct
    option and its explanation. Only available once the student has no
    attempts left (attempts exhausted or an earlier perfect score) — this
    keeps answers hidden while retries are still possible.
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: exam_id
        in: path
        type: integer
        required: true
    responses:
      200:
        description: Review of the student's best submission
      403:
        description: Review not available yet (attempts remain) or wrong role
      404:
        description: Exam or submission not found
    """
    exam = Exam.query.get_or_404(exam_id)

    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')

    if role != 'student':
        return jsonify({'error': 'Only students can review their own exam attempts'}), 403

    _, lock_reason, _ = get_exam_eligibility(exam, user_id)
    if lock_reason not in ('attempts_exhausted', 'perfect_score'):
        return jsonify({
            'error': 'Review is only available once your attempts for this exam are finished',
            'lock_reason': lock_reason
        }), 403

    best_submission = (
        ExamSubmission.query
        .filter_by(exam_id=exam.id, student_id=user_id)
        .order_by(ExamSubmission.score.desc(), ExamSubmission.submitted_at.desc())
        .first()
    )

    if not best_submission:
        return jsonify({'error': 'No submission found for this exam'}), 404

    answers = best_submission.answers or {}
    questions = sorted(exam.questions, key=lambda q: q.order_index)

    review_questions = []
    for q in questions:
        selected = answers.get(str(q.id))
        is_correct = selected == q.correct_option

        item = {
            'id': q.id,
            'question_text': q.question_text,
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            'selected_option': selected,
            'is_correct': is_correct,
        }

        if not is_correct:
            item['correct_option'] = q.correct_option
            item['explanation'] = q.explanation

        review_questions.append(item)

    return jsonify({
        'exam_id': exam.id,
        'exam_title': exam.title,
        'score': best_submission.score,
        'submitted_at': best_submission.submitted_at.isoformat() if best_submission.submitted_at else None,
        'questions': review_questions
    }), 200


@exams_bp.route('/submissions', methods=['GET'])
@jwt_required()
def get_submissions():
    """
    Get exam submissions/history for student or system
    ---
    tags:
      - Exams
    security: [{Bearer: []}]
    parameters:
      - name: student_id
        in: query
        type: integer
        required: false
        description: Filter history by a specific student ID (accessible by Professor or Admin roles only).
    responses:
      200:
        description: List of submissions successfully retrieved.
      403:
        description: Insufficient permissions.
    """
    claims = get_jwt()
    role = claims.get('role')
    user_id = claims.get('user_id')
    
    if role == 'student':
        # Students are forced to only see their own exam scores/submissions
        submissions = ExamSubmission.query.filter_by(student_id=user_id).all()
    else:
        # Admins & Professors can query any student's score history, or see all if student_id parameter is empty
        filter_student_id = request.args.get('student_id', type=int)
        if filter_student_id:
            submissions = ExamSubmission.query.filter_by(student_id=filter_student_id).all()
        else:
            submissions = ExamSubmission.query.all()
            
    return jsonify([sub.to_dict() for sub in submissions]), 200
