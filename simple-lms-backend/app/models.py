from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'student', 'professor', 'admin'
    
    # Common fields
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Student-specific field
    student_id = db.Column(db.String(20), unique=True, nullable=True)  # Only for students

    # UI preference, persisted per-account
    theme = db.Column(db.String(10), default='light', nullable=False)

    # Required for new student registrations; used for password-reset codes.
    # Nullable because pre-existing accounts (created before this field
    # existed) don't have one on file.
    email = db.Column(db.String(255), unique=True, nullable=True)

    # Password-reset flow: a short-lived hashed code emailed to the user.
    # Hashed (not stored raw) so a DB read alone can't be used to reset an
    # account; cleared once used or replaced by a fresh request.
    reset_code_hash = db.Column(db.String(255), nullable=True)
    reset_code_expires_at = db.Column(db.DateTime, nullable=True)

    # Tracks the last time this user opened the notifications list, so an
    # unread badge can be computed without a separate per-notification
    # read-receipt table (all notifications are broadcast/identical for
    # every student, so one timestamp per user is enough).
    last_seen_notifications_at = db.Column(db.DateTime, nullable=True)

    # Relationship type discriminator
    __mapper_args__ = {
        'polymorphic_identity': 'user',
        'polymorphic_on': role
    }
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        base_dict = {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'theme': self.theme,
            'email': self.email
        }

        if self.role == 'student' and self.student_id:
            base_dict['student_id'] = self.student_id

        return base_dict

class Student(User):
    __mapper_args__ = {
        'polymorphic_identity': 'student'
    }

class Professor(User):
    __mapper_args__ = {
        'polymorphic_identity': 'professor'
    }

class Admin(User):
    __mapper_args__ = {
        'polymorphic_identity': 'admin'
    }

class Lesson(db.Model):
    __tablename__ = 'lessons'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # The teacher who created this lesson
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationship to sections
    sections = db.relationship('Section', backref='lesson', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'professor_id': self.professor_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sections': [section.to_dict() for section in sorted(self.sections, key=lambda x: x.order_index)]
        }

class Section(db.Model):
    __tablename__ = 'sections'
    
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False)
    
    title = db.Column(db.String(200), nullable=False)
    body_content = db.Column(db.Text, nullable=False) # Main section text (HTML)
    order_index = db.Column(db.Integer, default=0) # To order sections within a lesson

    def to_dict(self):
        return {
            'id': self.id,
            'lesson_id': self.lesson_id,
            'title': self.title,
            'body_content': self.body_content,
            'order_index': self.order_index
        }

class Exam(db.Model):
    __tablename__ = 'exams'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=False) # Required association
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    duration_minutes = db.Column(db.Integer, nullable=True)  # null = no time limit

    # Relationships
    lesson = db.relationship('Lesson', backref=db.backref('exams', lazy=True))
    questions = db.relationship('Question', backref='exam', lazy=True, cascade='all, delete-orphan')
    submissions = db.relationship('ExamSubmission', backref='exam', lazy=True, cascade='all, delete-orphan')

    def to_dict(self, include_answers=False):
        return {
            'id': self.id,
            'title': self.title,
            'lesson_id': self.lesson_id,
            'lesson_title': self.lesson.title if self.lesson else None,
            'professor_id': self.professor_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'duration_minutes': self.duration_minutes,
            'questions': [q.to_dict(include_correct=include_answers) for q in sorted(self.questions, key=lambda x: x.order_index)]
        }

class Question(db.Model):
    __tablename__ = 'questions'
    
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    
    question_text = db.Column(db.Text, nullable=False) # HTML content
    option_a = db.Column(db.Text, nullable=False) # HTML or plain text
    option_b = db.Column(db.Text, nullable=False) # HTML or plain text
    option_c = db.Column(db.Text, nullable=False) # HTML or plain text
    option_d = db.Column(db.Text, nullable=False) # HTML or plain text
    correct_option = db.Column(db.String(1), nullable=False) # 'A', 'B', 'C', or 'D'
    order_index = db.Column(db.Integer, default=0)
    explanation = db.Column(db.Text, nullable=True) # why the correct option is correct

    def to_dict(self, include_correct=False):
        d = {
            'id': self.id,
            'exam_id': self.exam_id,
            'question_text': self.question_text,
            'option_a': self.option_a,
            'option_b': self.option_b,
            'option_c': self.option_c,
            'option_d': self.option_d,
            'order_index': self.order_index
        }
        if include_correct:
            d['correct_option'] = self.correct_option
            d['explanation'] = self.explanation
        return d

class ExamSubmission(db.Model):
    __tablename__ = 'exam_submissions'
    
    id = db.Column(db.Integer, primary_key=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Float, nullable=False) # score out of 100 or fractional
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)
    answers = db.Column(db.JSON, nullable=True) # {question_id (str): selected_option ('A'/'B'/'C'/'D')}

    def to_dict(self):
        return {
            'id': self.id,
            'exam_id': self.exam_id,
            'exam_title': self.exam.title if self.exam else "Unknown Exam",
            'student_id': self.student_id,
            'score': self.score,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None
        }

class Resource(db.Model):
    __tablename__ = 'resources'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    filename = db.Column(db.String(255), nullable=False)  # stored (unique, on-disk) filename
    original_filename = db.Column(db.String(255), nullable=False)

    lesson_id = db.Column(db.Integer, db.ForeignKey('lessons.id'), nullable=True)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    lesson = db.relationship('Lesson', backref=db.backref('resources', lazy=True, cascade='all, delete-orphan'))
    exam = db.relationship('Exam', backref=db.backref('resources', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'original_filename': self.original_filename,
            'lesson_id': self.lesson_id,
            'lesson_title': self.lesson.title if self.lesson else None,
            'exam_id': self.exam_id,
            'exam_title': self.exam.title if self.exam else None,
            'url': f'/api/resources/files/{self.filename}',
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }


class SectionProgress(db.Model):
    __tablename__ = 'section_progress'
    
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    section_id = db.Column(db.Integer, db.ForeignKey('sections.id'), nullable=False)
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    student = db.relationship('User', backref=db.backref('completed_sections', lazy=True))
    section = db.relationship('Section', backref=db.backref('progress_records', lazy=True, cascade='all, delete-orphan'))
    
    __table_args__ = (
        db.UniqueConstraint('student_id', 'section_id', name='_student_section_uc'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'section_id': self.section_id,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None
        }


class Notification(db.Model):
    """
    A professor-authored message pinned to a specific calendar date. One
    message per date (creating a second one for the same date overwrites
    the first) — broadcast to every student, not targeted per-student.
    """
    __tablename__ = 'notifications'

    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, unique=True, index=True)
    message = db.Column(db.Text, nullable=False)
    professor_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'message': self.message,
            'professor_id': self.professor_id,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
