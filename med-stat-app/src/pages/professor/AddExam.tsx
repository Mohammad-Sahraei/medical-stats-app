import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./AddExam.scss";

import api from "../../api/axios";

import {
  createExam,
  addExamQuestion,
  buildQuestionPayload,
} from "../../api/examsApi";
import { useToast } from "../../context/ToastContext";

interface ExamQuestion {
  number: number;
  text: string;
  options: string[];
  correctOption: number | null;
  explanation: string;
}

interface Lesson {
  id: number;
  title?: string;
  name?: string;
}

export type AddExamProps = {
  mode?: "create" | "edit";
  initialData?: {
    id?: number;
    title: string;
    question: string;
    options: string[];
    correct: number;
    chapter: number;
  };
};

export default function AddExam({
  mode = "create",
  initialData,
}: AddExamProps) {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { showToast } = useToast();

  const [examTitle, setExamTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);

  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const [currentQuestion, setCurrentQuestion] = useState<ExamQuestion>({
    number: 1,
    text: "",
    options: ["", "", "", ""],
    correctOption: null,
    explanation: "",
  });

  const [lessonTitle, setLessonTitle] = useState<string>("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState("");

  const [loading, setLoading] = useState(false);

  // گرفتن اطلاعات فصل بر اساس lessonId
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        return;
      }

      try {
        setLessonLoading(true);
        setLessonError("");

        const res = await api.get<Lesson>(`/lessons/${lessonId}`);

        const lesson = res.data;

        setLessonTitle(lesson.title || lesson.name || `فصل شماره ${lessonId}`);
      } catch (error) {
        console.error("Error fetching lesson:", error);
        setLessonError("خطا در دریافت اطلاعات فصل");
        setLessonTitle(`فصل شماره ${lessonId}`);
      } finally {
        setLessonLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId]);

  // Prefill در حالت edit
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setExamTitle(initialData.title);

      setCurrentQuestion({
        number: 1,
        text: initialData.question,
        options: initialData.options,
        correctOption: initialData.correct + 1,
        explanation: "",
      });
    }
  }, [mode, initialData]);

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => {
      const updated = [...prev.options];
      updated[index] = value;

      return {
        ...prev,
        options: updated,
      };
    });
  };

  const handleCorrectOptionChange = (value: string) => {
    const num = Number(value);

    if (num >= 1 && num <= 4) {
      setCurrentQuestion((prev) => ({
        ...prev,
        correctOption: num,
      }));
    } else if (value === "") {
      setCurrentQuestion((prev) => ({
        ...prev,
        correctOption: null,
      }));
    }
  };

  const validateQuestion = (question: ExamQuestion) => {
    if (!question.text.trim()) {
      showToast("متن سؤال را وارد کنید.", "error");
      return false;
    }

    if (question.options.some((option) => !option.trim())) {
      showToast("همه گزینه‌ها را کامل کنید.", "error");
      return false;
    }

    if (!question.correctOption) {
      showToast("گزینه صحیح را مشخص کنید.", "error");
      return false;
    }

    return true;
  };

  const resetQuestion = (nextNumber: number) => {
    setCurrentQuestion({
      number: nextNumber,
      text: "",
      options: ["", "", "", ""],
      correctOption: null,
      explanation: "",
    });
  };

  const nextQuestion = () => {
    if (!validateQuestion(currentQuestion)) {
      return;
    }

    setQuestions((prev) => [...prev, currentQuestion]);

    const nextNumber = questionNumber + 1;

    setQuestionNumber(nextNumber);
    resetQuestion(nextNumber);
  };

 const finishExam = async () => {
  console.log("===== FINISH EXAM START =====");

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("access_token");

  console.log("Token in localStorage:", token);

  console.log("lessonId:", lessonId);
  console.log("examTitle:", examTitle);
  console.log("questions stored:", questions.length);
  console.log("currentQuestion:", currentQuestion);

  if (!examTitle.trim()) {
    showToast("نام آزمون را وارد کنید.", "error");
    return;
  }

  if (!lessonId) {
    showToast("برای ساخت آزمون باید ابتدا فصل موردنظر را انتخاب کنید.", "error");
    navigate("/professor/courses");
    return;
  }

  const numericLessonId = Number(lessonId);

  const allQuestions = [...questions, currentQuestion];

  console.log("All questions to submit:", allQuestions);

  try {
    setLoading(true);

    const examPayload = {
      lesson_id: numericLessonId,
      title: examTitle,
      duration_minutes: durationMinutes.trim() ? Number(durationMinutes) : null,
    };

    console.log("Create exam payload:", examPayload);

    const exam = await createExam(examPayload);

    console.log("Exam created:", exam);

    const examId = exam.id;

    for (const question of allQuestions) {
      const payload = buildQuestionPayload({
        questionText: question.text,
        options: question.options,
        correctOption: question.correctOption,
        explanation: question.explanation,
      });

      console.log("Sending question payload:", payload);

      const res = await addExamQuestion(examId, payload);

      console.log("Question created:", res);
    }

    showToast("آزمون با موفقیت ایجاد شد.", "success");
    navigate("/professor/courses");
  } catch (error: any) {
    console.error("FULL ERROR:", error);

    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }

    showToast("خطا در ایجاد آزمون.", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="add-exam-page">
      <div className="add-exam-header">
        {lessonId && (
          <div className="exam-lesson-box">
            {lessonLoading ? (
              <span>در حال دریافت اطلاعات فصل...</span>
            ) : (
              <>
                <span className="exam-lesson-label">فصل:</span>
                <span className="exam-lesson-title">
                  {lessonTitle || `فصل شماره ${lessonId}`}
                </span>
              </>
            )}
          </div>
        )}

        {lessonError && <div className="exam-lesson-error">{lessonError}</div>}
      </div>

      {!lessonId && mode === "create" && (
        <div className="add-exam-warning">
          برای ساخت آزمون باید ابتدا از لیست فصل‌ها، فصل موردنظر را انتخاب کنید.
        </div>
      )}

      <div className="add-exam-group">
        <label className="add-exam-label">نام آزمون</label>
        <input
          className="add-exam-input"
          placeholder="مثلاً: آزمون فصل اول"
          value={examTitle}
          disabled={loading}
          onChange={(e) => setExamTitle(e.target.value)}
        />
      </div>

      <div className="add-exam-group">
        <label className="add-exam-label">
          مدت زمان آزمون (دقیقه) — خالی بگذارید یعنی بدون محدودیت زمانی
        </label>
        <input
          className="add-exam-input"
          placeholder="مثلاً 30"
          inputMode="numeric"
          value={durationMinutes}
          disabled={loading}
          onChange={(e) => setDurationMinutes(e.target.value.replace(/[^\d]/g, ""))}
        />
      </div>

      <div className="add-exam-meta">
        <span>شماره سؤال: {questionNumber}</span>

        {questions.length > 0 && (
          <span>سؤال‌های ذخیره‌شده: {questions.length}</span>
        )}
      </div>

      <div className="add-exam-group">
        <label className="add-exam-label">متن سؤال</label>
        <textarea
          className="add-exam-textarea"
          placeholder="صورت سؤال را اینجا وارد کنید..."
          value={currentQuestion.text}
          disabled={loading}
          onChange={(e) =>
            setCurrentQuestion((prev) => ({
              ...prev,
              text: e.target.value,
            }))
          }
        />
      </div>

      <div className="add-exam-options">
        <span className="add-exam-label">گزینه‌ها</span>

        {currentQuestion.options.map((opt, index) => (
          <input
            key={index}
            className="add-exam-input"
            placeholder={`گزینه ${index + 1}`}
            value={opt}
            disabled={loading}
            onChange={(e) => handleOptionChange(index, e.target.value)}
          />
        ))}
      </div>

      <div className="add-exam-group">
        <label className="add-exam-label">گزینه صحیح، عدد ۱ تا ۴</label>
        <input
          className="add-exam-input"
          placeholder="مثلاً 2"
          inputMode="numeric"
          value={currentQuestion.correctOption ?? ""}
          disabled={loading}
          onChange={(e) => handleCorrectOptionChange(e.target.value)}
        />
      </div>

      <div className="add-exam-group">
        <label className="add-exam-label">توضیح پاسخ (اختیاری)</label>
        <textarea
          className="add-exam-textarea"
          placeholder="توضیح دهید چرا گزینه صحیح، درست است..."
          value={currentQuestion.explanation}
          disabled={loading}
          onChange={(e) =>
            setCurrentQuestion((prev) => ({
              ...prev,
              explanation: e.target.value,
            }))
          }
        />
      </div>

      <div className="add-exam-actions">
        <button
          type="button"
          className="add-exam-btn add-exam-btn-secondary"
          onClick={finishExam}
          disabled={loading}
        >
          {mode === "edit"
            ? "ذخیره تغییرات"
            : loading
            ? "در حال ذخیره..."
            : "پایان آزمون"}
        </button>

        {mode === "create" && (
          <button
            type="button"
            className="add-exam-btn add-exam-btn-primary"
            onClick={nextQuestion}
            disabled={loading}
          >
            سؤال بعدی
          </button>
        )}
      </div>
    </div>
  );
}
