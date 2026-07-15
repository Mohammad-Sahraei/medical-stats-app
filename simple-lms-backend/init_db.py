from app import create_app
from app.models import db, Admin, Professor, Student

def init_database():
    app = create_app()
    with app.app_context():
        # Drop all tables and recreate them
        db.drop_all()
        db.create_all()
        
        # Create admin
        admin = Admin(
            username='admin',
            first_name='System',
            last_name='Administrator',
            role='admin'
        )
        admin.set_password('admin123')
        
        # Create professor
        professor = Professor(
            username='professor',
            first_name='John',
            last_name='Smith',
            role='professor'
        )
        professor.set_password('prof123')
        
        # Create sample student
        student = Student(
            username='student',
            first_name='Jane',
            last_name='Doe',
            student_id='STU2024001',
            role='student'
        )
        student.set_password('student123')
        
        # Add all to database
        db.session.add(admin)
        db.session.add(professor)
        db.session.add(student)
        db.session.commit()
        
        print("Database initialized successfully!")
        print("\nTest accounts created:")
        print("- Admin: username='admin', password='admin123'")
        print("- Professor: username='professor', password='prof123'")
        print("- Student: username='student', password='student123'")

if __name__ == '__main__':
    init_database()