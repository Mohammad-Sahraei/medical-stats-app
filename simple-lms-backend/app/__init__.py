from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flasgger import Swagger
from app.config import Config
from app.models import db
from app.swagger_config import swagger_config, swagger_template

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend developer connection
    CORS(app, supports_credentials=True)
    
    # Initialize extensions
    db.init_app(app)
    JWTManager(app)
    Swagger(app, config=swagger_config, template=swagger_template)
    
    # Register blueprints (with routes package prefix)
    from app.routes.auth import auth_bp
    from app.routes.upload import upload_bp
    from app.routes.lessons import lessons_bp
    from app.routes.exams import exams_bp
    from app.routes.progress import progress_bp
    from app.routes.resources import resources_bp
    from app.routes.notifications import notifications_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(upload_bp, url_prefix='/api/upload')
    app.register_blueprint(lessons_bp, url_prefix='/api/lessons')
    app.register_blueprint(exams_bp, url_prefix='/api/exams')
    app.register_blueprint(progress_bp, url_prefix='/api/progress')
    app.register_blueprint(resources_bp, url_prefix='/api/resources')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    with app.app_context():
        db.create_all()

        # Additive migration: add columns introduced after the initial schema
        # without dropping/recreating the existing SQLite database.
        from sqlalchemy import text
        existing_columns = [
            row[1] for row in db.session.execute(text("PRAGMA table_info(users)")).fetchall()
        ]
        if 'theme' not in existing_columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN theme VARCHAR(10) DEFAULT 'light'")
            )
            db.session.commit()
        if 'email' not in existing_columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN email VARCHAR(255)")
            )
            db.session.commit()
        if 'reset_code_hash' not in existing_columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN reset_code_hash VARCHAR(255)")
            )
            db.session.commit()
        if 'reset_code_expires_at' not in existing_columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN reset_code_expires_at DATETIME")
            )
            db.session.commit()
        if 'last_seen_notifications_at' not in existing_columns:
            db.session.execute(
                text("ALTER TABLE users ADD COLUMN last_seen_notifications_at DATETIME")
            )
            db.session.commit()

        exam_columns = [
            row[1] for row in db.session.execute(text("PRAGMA table_info(exams)")).fetchall()
        ]
        if 'duration_minutes' not in exam_columns:
            db.session.execute(
                text("ALTER TABLE exams ADD COLUMN duration_minutes INTEGER")
            )
            db.session.commit()
        if 'season' in exam_columns:
            # Removed: "season" turned out to mean lesson/chapter name in this
            # app's terminology, not a calendar season — dropped in favor of
            # filtering by the exam's existing lesson_id/title instead.
            db.session.execute(
                text("ALTER TABLE exams DROP COLUMN season")
            )
            db.session.commit()

        # Create default admin and professor if none exists
        from app.models import Admin, Professor
        if not Admin.query.filter_by(username='admin').first():
            admin = Admin(username='admin', first_name='System', last_name='Admin', role='admin')
            admin.set_password('admin123')
            db.session.add(admin)
            
        if not Professor.query.filter_by(username='Dr.LilyTapak').first():
            prof = Professor(username='Dr.LilyTapak', first_name='Lily', last_name='Tapak', role='professor')
            prof.set_password('Pass123')
            db.session.add(prof)
            
        db.session.commit()
    
    return app
