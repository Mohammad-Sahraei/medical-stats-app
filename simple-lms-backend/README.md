# simple-lms-backend

A clean, premium, and fully featured Flask API for School and Exam Management.

## Features
- **User Authentication:** Student registration, login, JWT protection, and role-based access control (`admin`, `professor`, `student`).
- **Lessons and Sections:** Organized learning courses with HTML body sections.
- **Exams and Grading:** Dynamic four-option multiple-choice tests, automated grading engine, and cheating prevention.
- **Image Upload:** Auto-converting uploaded images to optimized WebP formats.
- **Swagger Documentation:** Beautiful and interactive documentation at `/docs/`.

## Getting Started
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Initialize database:
   ```bash
   python init_db.py
   ```
3. Run the development server:
   ```bash
   python app.py
   ```
