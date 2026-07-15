import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  ClipboardList,
  Eye,
  FilePlus,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";

import { getLessons, deleteLesson } from "../../api/lessonsApi";
import { getExams, deleteExam } from "../../api/examsApi";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

import "./CoursesList.scss";

type Lesson = {
  id: number;
  title: string;
  created_at?: string;
};

type Exam = {
  id: number;
  title?: string;
  name?: string;
  lesson_id: number;
  lessonId?: number;
  questions?: any[];
  created_at?: string;
};

export default function CoursesList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [lessonsData, examsData] = await Promise.all([
        getLessons(),
        getExams(),
      ]);

      setLessons(Array.isArray(lessonsData) ? lessonsData : []);
      setExams(Array.isArray(examsData) ? examsData : []);
    } catch (err: any) {
      console.error("Error loading lessons/exams:", err);
      setErrorMessage("خطا در دریافت اطلاعات فصل‌ها و آزمون‌ها");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteLesson = async (lessonId: number) => {
    const confirmed = await confirm(
      "آیا از حذف این فصل و تمام محتوای آن مطمئن هستید؟",
      { confirmText: "حذف", danger: true }
    );
    if (!confirmed) return;

    try {
      await deleteLesson(lessonId);
      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonId));
    } catch (err) {
      console.error("Error deleting lesson:", err);
      showToast("خطا در حذف فصل. لطفاً دوباره تلاش کنید.", "error");
    }
  };

  const handleDeleteExam = async (examId: number) => {
    const confirmed = await confirm("آیا از حذف این آزمون مطمئن هستید؟", {
      confirmText: "حذف",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deleteExam(examId);
      setExams((prev) => prev.filter((exam) => exam.id !== examId));
    } catch (err) {
      console.error("Error deleting exam:", err);
      showToast("خطا در حذف آزمون. لطفاً دوباره تلاش کنید.", "error");
    }
  };

  const filteredLessons = useMemo(() => {
    return lessons.filter((lesson) =>
      lesson.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [lessons, searchTerm]);

  const examsByLesson = useMemo(() => {
    const map: Record<number, Exam[]> = {};

    exams.forEach((exam) => {
      const lessonId = exam.lesson_id ?? exam.lessonId;

      if (!lessonId) return;

      if (!map[lessonId]) {
        map[lessonId] = [];
      }

      map[lessonId].push(exam);
    });

    return map;
  }, [exams]);

  const getExamTitle = (exam: Exam) => {
    return exam.title || exam.name || `آزمون شماره ${exam.id}`;
  };

  return (
    <div className="courses-list-container">
      <div className="courses-hero">
        <div>
          <p className="eyebrow">پنل مدیریت استاد</p>
          <p className="page-subtitle">
            برای هر فصل می‌توانی درسنامه را ببینی، ویرایش کنی و آزمون‌های همان فصل را مدیریت کنی.
          </p>
        </div>

        <div className="search-wrapper">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            placeholder="جستجوی فصل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading && (
        <div className="state-box">
          در حال دریافت اطلاعات...
        </div>
      )}

      {!loading && errorMessage && (
        <div className="state-box error">
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && filteredLessons.length === 0 && (
        <div className="state-box">
          فصلی با این عنوان پیدا نشد.
        </div>
      )}

      {!loading && !errorMessage && filteredLessons.length > 0 && (
        <div className="lessons-grid">
          {filteredLessons.map((lesson) => {
            const lessonExams = examsByLesson[lesson.id] || [];

            return (
              <div key={lesson.id} className="lesson-card">
                <div className="lesson-card-top">
                  <div className="lesson-icon-box">
                    <BookOpen size={34} strokeWidth={1.7} />
                  </div>

                  <div className="lesson-main-info">
                    <span className="lesson-label">فصل</span>
                    <h3 className="lesson-title">{lesson.title}</h3>
                  </div>
                </div>

                <div className="lesson-card-actions">
                  <button
                    type="button"
                    className="action-btn preview"
                    onClick={() =>
                      navigate(`/professor/preview-lesson/${lesson.id}`)
                    }
                  >
                    <Eye size={16} />
                    پیش‌نمایش درسنامه
                  </button>

                  <button
                    type="button"
                    className="action-btn edit"
                    onClick={() =>
                      navigate(`/professor/edit-lesson/${lesson.id}`)
                    }
                  >
                    <Pencil size={16} />
                    ویرایش درسنامه
                  </button>

                  <button
                    type="button"
                    className="action-btn delete"
                    onClick={() => handleDeleteLesson(lesson.id)}
                  >
                    <Trash2 size={16} />
                    حذف فصل
                  </button>
                </div>

                <div className="exam-section">
                  <div className="exam-section-header">
                    <div>
                      <span className="section-title">آزمون‌های این فصل</span>
                      <span className="exam-count">
                        {lessonExams.length} آزمون
                      </span>
                    </div>

                    <ClipboardList size={20} />
                  </div>

                  <div className="exam-list">
                    {lessonExams.length === 0 ? (
                      <div className="empty-exam-box">
                        هنوز آزمونی برای این فصل ثبت نشده است.
                      </div>
                    ) : (
                      lessonExams.map((exam) => (
                        <div key={exam.id} className="exam-item">
                          <div className="exam-info">
                            <span className="exam-title">
                              {getExamTitle(exam)}
                            </span>

                            <span className="exam-meta">
                              {exam.questions?.length || 0} سوال
                            </span>
                          </div>

                          <div className="exam-actions">
                            <button
                              type="button"
                              className="icon-btn"
                              title="پیش‌نمایش آزمون"
                              onClick={() =>
                                navigate(`/professor/preview-exam/${exam.id}`)
                              }
                            >
                              <Eye size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn"
                              title="ویرایش آزمون"
                              onClick={() =>
                                navigate(`/professor/edit-exam/${exam.id}`)
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              className="icon-btn delete"
                              title="حذف آزمون"
                              onClick={() => handleDeleteExam(exam.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    className="add-exam-cta-btn"
                    onClick={() =>
                      navigate(`/professor/add/exam/${lesson.id}`)
                    }
                  >
                    <FilePlus size={17} />
                    افزودن آزمون جدید
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
