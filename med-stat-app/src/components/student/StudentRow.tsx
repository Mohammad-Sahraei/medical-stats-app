import { useState } from "react";
import { ChevronDown, UserCircle } from "lucide-react";
import "./StudentRow.scss";

interface LessonBreakdown {
  lesson_id: number;
  lesson_title: string;
  progress_percentage: number;
  exams: { exam_id: number; exam_title: string; score: number }[];
}

interface Props {
  name: string;
  studentNumber: string;
  examScore: number | null;
  progressPercentage: number;
  lessons: LessonBreakdown[];
}

export default function StudentScoreRow({
  name,
  studentNumber,
  lessons,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`student-score-row ${expanded ? "expanded" : ""}`}>
      <button
        type="button"
        className="student-row-toggle"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="student-info">
          <UserCircle size={30} />
          <div>
            <h4 className="student-name">{name}</h4>
            <span className="student-number">{studentNumber}</span>
          </div>
        </div>

        <ChevronDown className="chevron" size={20} />
      </button>

      {expanded && (
        <div className="student-breakdown">
          {lessons.length === 0 && (
            <p className="no-data">هنوز پیشرفتی ثبت نشده است.</p>
          )}

          {lessons.map((lesson) => (
            <div className="lesson-breakdown-item" key={lesson.lesson_id}>
              <div className="lesson-breakdown-header">
                <span>{lesson.lesson_title}</span>
                <span className="lesson-percentage">
                  {lesson.progress_percentage}%
                </span>
              </div>

              <div className="student-progress-bar">
                <div style={{ width: `${lesson.progress_percentage}%` }} />
              </div>

              {lesson.exams.length > 0 && (
                <div className="lesson-exam-scores">
                  {lesson.exams.map((exam) => {
                    const passed = exam.score >= 50;
                    return (
                      <div className="lesson-exam-row" key={exam.exam_id}>
                        <span className="exam-name">{exam.exam_title}</span>
                        <span className={`exam-status ${passed ? "pass" : "fail"}`}>
                          {exam.score}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
