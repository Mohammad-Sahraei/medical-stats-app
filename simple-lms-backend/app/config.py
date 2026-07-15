import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-change-this-in-production'
    
    # Uploads (points to 'uploads' at the project root)
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload size
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///school.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-this'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # Outgoing mail (password-reset codes), sent via Gmail SMTP
    MAIL_SERVER = os.environ.get('MAIL_SERVER') or 'smtp.gmail.com'
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_APP_PASSWORD = os.environ.get('MAIL_APP_PASSWORD')
    MAIL_SENDER_NAME = os.environ.get('MAIL_SENDER_NAME') or 'MedStat'
    
    # Swagger
    SWAGGER = {
        'title': 'School Management API',
        'uiversion': 3,
        'specs_route': '/docs/',
        'description': 'API for managing students, professors, and admins',
        'version': '1.0.0'
    }
