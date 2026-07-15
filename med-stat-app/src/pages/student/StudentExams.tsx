import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Loader2, AlertCircle, History, Lock, Eye } from "lucide-react";
import { getExams, getExamSubmissions } from "../../api/examsApi";
import type { Exam, ExamSubmission } from "../../api/examsApi";
import { useToast } from "../../context/ToastContext";
import "./StudentExams.scss";

export default function StudentExams() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chapterFilter, setChapterFilter] = useState<number | "all">("all");

  async function loadExams() {
    try {
      setLoading(true);
      setError(null);

      const [examsData, submissionsData] = await Promise.all([
        getExams(),
        getExamSubmissions().catch(() => []),
      ]);

      setExams(examsData);
      setSubmissions(submissionsData);
    } catch (err) {
      console.error("Failed to load exams:", err);
      setError("خطا در دریافت لیست آزمون‌ها.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExams();
  }, []);

  // The score that "counts" for an exam is the highest across all attempts,
  // not the most recent one.
  const bestScoreByExam = useMemo(() => {
    const map: Record<number, number> = {};
    for (const sub of submissions) {
      if (sub.score == null) continue;
      if (!(sub.exam_id in map) || sub.score > map[sub.exam_id]) {
        map[sub.exam_id] = sub.score;
      }
    }
    return map;
  }, [submissions]);

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const dateA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0;
      const dateB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [submissions]);

  // Chapters (lessons) that actually have exams, for the filter row.
  const chapters = useMemo(() => {
    const map = new Map<number, string>();
    for (const exam of exams) {
      if (!map.has(exam.lesson_id)) {
        map.set(exam.lesson_id, exam.lesson_title || `فصل شماره ${exam.lesson_id}`);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [exams]);

  const filteredExams = useMemo(() => {
    if (chapterFilter === "all") return exams;
    return exams.filter((exam) => exam.lesson_id === chapterFilter);
  }, [exams, chapterFilter]);

  const isReviewable = (exam: Exam) =>
    exam.lock_reason === "attempts_exhausted" || exam.lock_reason === "perfect_score";

  const handleStartExam = (exam: Exam) => {
    if (exam.locked) {
      if (isReviewable(exam)) {
        navigate(`/student/exams/${exam.id}/review`);
        return;
      }

      showToast(
        "برای شرکت در این آزمون، ابتدا باید تمام بخش‌های این فصل را کامل کنید",
        "error"
      );
      return;
    }

    navigate(`/student/exams/${exam.id}`);
  };

  return (
    <div className="student-exams-page">
      <div className="student-exams-content">
        <header className="student-exams-header">
          <div>
            <p>لیست آزمون‌های فعال و قابل شرکت برای شما</p>
          </div>

          <div className="header-icon">
            <ClipboardList size={34} />
          </div>
        </header>

        {loading && (
          <div className="exam-state-box">
            <Loader2 className="spin" size={32} />
            <p>در حال دریافت آزمون‌ها...</p>
          </div>
        )}

        {!loading && error && (
          <div className="exam-state-box error">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button onClick={loadExams}>تلاش دوباره</button>
          </div>
        )}

        {!loading && !error && chapters.length > 0 && (
          <div className="chapter-filter-row">
            <button
              type="button"
              className={chapterFilter === "all" ? "active" : ""}
              onClick={() => setChapterFilter("all")}
            >
              همه
            </button>

            {chapters.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                className={chapterFilter === chapter.id ? "active" : ""}
                onClick={() => setChapterFilter(chapter.id)}
              >
                {chapter.title}
              </button>
            ))}
          </div>
        )}

        {!loading && !error && exams.length === 0 && (
          <div className="empty-box">
            <ClipboardList size={42} />
            <h2>فعلاً آزمونی وجود ندارد</h2>
            <p>وقتی استاد آزمونی ایجاد کند، اینجا نمایش داده می‌شود.</p>
          </div>
        )}

        {!loading && !error && exams.length > 0 && filteredExams.length === 0 && (
          <div className="empty-box">
            <ClipboardList size={42} />
            <h2>آزمونی برای این فصل پیدا نشد</h2>
          </div>
        )}

        {!loading && !error && filteredExams.length > 0 && (
          <div className="exams-list">
            {filteredExams.map((exam) => {
              const bestScore = bestScoreByExam[exam.id];
              const attemptsUsed = exam.attempts_used ?? 0;
              const maxAttempts = exam.max_attempts ?? 3;

              return (
                <div key={exam.id} className={`exam-card ${exam.locked ? "locked" : ""}`}>
                  <div className="exam-card-main">
                    <h2>{exam.title}</h2>

                    <div className="exam-badge-row">
                      <span>فصل: {exam.lesson_title || exam.lesson_id}</span>
                      {typeof exam.attempts_used === "number" && (
                        <span>تلاش‌ها: {attemptsUsed} از {maxAttempts}</span>
                      )}
                    </div>

                    {exam.created_at && (
                      <p className="exam-date">
                        تاریخ ایجاد:{" "}
                        {new Date(exam.created_at).toLocaleDateString("fa-IR")}
                      </p>
                    )}

                    {exam.locked ? (
                      <p className="exam-lock-note">
                        {exam.lock_reason === "perfect_score"
                          ? "شما در این آزمون نمره کامل گرفته‌اید و دیگر نیازی به تلاش مجدد نیست"
                          : exam.lock_reason === "attempts_exhausted"
                          ? "تلاش‌های مجاز شما برای این آزمون به پایان رسیده است"
                          : "برای شرکت در این آزمون، ابتدا این فصل را کامل کنید"}
                      </p>
                    ) : (
                      bestScore != null && (
                        <span className="exam-last-score">
                          بهترین نمره: {Math.round(bestScore)}٪
                        </span>
                      )
                    )}
                  </div>

                  <button
                    className="start-exam-btn"
                    onClick={() => handleStartExam(exam)}
                  >
                    {exam.locked ? (
                      isReviewable(exam) ? (
                        <>
                          <Eye size={16} />
                          مشاهده پاسخ‌ها
                        </>
                      ) : (
                        <Lock size={16} />
                      )
                    ) : bestScore != null ? (
                      "شرکت مجدد"
                    ) : (
                      "شروع آزمون"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {!loading && !error && sortedSubmissions.length > 0 && (
          <section className="exam-history-section">
            <div className="exam-history-title">
              <History size={20} />
              <span>تاریخچه آزمون‌های شرکت‌شده</span>
            </div>

            <div className="exam-history-list">
              {sortedSubmissions.map((sub) => (
                <div key={sub.id} className="exam-history-row">
                  <span className="exam-history-name">
                    {sub.exam_title || `آزمون شماره ${sub.exam_id}`}
                  </span>

                  <span className="exam-history-score">
                    {Math.round(sub.score ?? 0)}٪
                  </span>

                  {sub.submitted_at && (
                    <span className="exam-history-date">
                      {new Date(sub.submitted_at).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
