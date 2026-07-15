from app.models import db, Section, SectionProgress


def is_lesson_completed_by_student(lesson_id, student_id):
    """
    True once the student has a completion record for every section of the
    given lesson. A lesson with zero sections is treated as complete (there
    is nothing to gate on).
    """
    total_sections = Section.query.filter_by(lesson_id=lesson_id).count()
    if total_sections == 0:
        return True

    completed_sections = (
        db.session.query(SectionProgress)
        .join(Section, SectionProgress.section_id == Section.id)
        .filter(
            Section.lesson_id == lesson_id,
            SectionProgress.student_id == student_id
        )
        .count()
    )
    return completed_sections >= total_sections
