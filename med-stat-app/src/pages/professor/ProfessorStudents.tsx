import { useEffect, useMemo, useState } from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";

import StudentScoreRow from "../../components/student/StudentRow";
import { getStudentsProgress } from "../../api/lessonsApi";

import "./ProfessorStudents.scss";

interface LessonBreakdown {
  lesson_id: number;
  lesson_title: string;
  progress_percentage: number;
  exams: { exam_id: number; exam_title: string; score: number }[];
}

interface StudentSummary {
  id: number;
  name: string;
  studentNumber: string;
  examScore: number | null;
  progressPercentage: number;
  lessons: LessonBreakdown[];
}

export default function ProfessorStudents() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getStudentsProgress();

        const summaries: StudentSummary[] = (data.students || []).map((entry: any) => {
          const scores: number[] = [];
          const progressValues: number[] = [];

          for (const lesson of entry.lessons || []) {
            progressValues.push(lesson.progress_percentage ?? 0);
            for (const exam of lesson.exams || []) {
              if (typeof exam.score === "number") scores.push(exam.score);
            }
          }

          const avgScore =
            scores.length > 0
              ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
              : null;

          const avgProgress =
            progressValues.length > 0
              ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
              : 0;

          return {
            id: entry.student.id,
            name: `${entry.student.first_name} ${entry.student.last_name}`,
            studentNumber: entry.student.student_id || "—",
            examScore: avgScore,
            progressPercentage: avgProgress,
            lessons: entry.lessons || [],
          };
        });

        setStudents(summaries);
      } catch (err) {
        console.error("Failed to load students progress:", err);
        setError("خطا در دریافت اطلاعات دانشجویان.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((student) => student.name.includes(search));
  }, [students, search]);

  return (
    <div className="professor-students-page">
      <div className="students-search">
        <Search size={18} />

        <input
          type="text"
          placeholder="جستجوی دانشجو..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="students-state">
          <Loader2 className="spin" size={32} />
          <p>در حال دریافت اطلاعات...</p>
        </div>
      )}

      {!loading && error && (
        <div className="students-state">
          <AlertCircle size={32} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="students-state">
          <p>هنوز دانشجویی در کلاس شما ثبت‌نامی نداشته است.</p>
        </div>
      )}

      {!loading && !error && filteredStudents.length > 0 && (
        <div className="students-list">
          {filteredStudents.map((student) => (
            <StudentScoreRow
              key={student.id}
              name={student.name}
              studentNumber={student.studentNumber}
              examScore={student.examScore}
              progressPercentage={student.progressPercentage}
              lessons={student.lessons}
            />
          ))}
        </div>
      )}
    </div>
  );
}
