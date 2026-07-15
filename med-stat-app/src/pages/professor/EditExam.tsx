import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getExamById,
  updateExam,
  updateExamQuestion,
  deleteExamQuestion,
  addExamQuestion,
  buildQuestionPayload,
} from "../../api/examsApi";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Select from "../../components/select/Select";

import "./EditExam.scss";

type EditableQuestion = {
  id?: number;
  question_text: string;
  options: string[];
  correctOption: number | null;
  explanation: string;
};

export default function EditExam() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizeOptions = (q: any): string[] => {
    if (Array.isArray(q.options)) {
      return normalizeToFourOptions(q.options);
    }

    if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);

        if (Array.isArray(parsed)) {
          return normalizeToFourOptions(parsed);
        }
      } catch (error) {
        console.error("Failed to parse question options:", error);
      }
    }

    const individualOptions = [
      q.option_1 ?? q.option1 ?? q.option_a ?? q.optiona ?? "",
      q.option_2 ?? q.option2 ?? q.option_b ?? q.optionb ?? "",
      q.option_3 ?? q.option3 ?? q.option_c ?? q.optionc ?? "",
      q.option_4 ?? q.option4 ?? q.option_d ?? q.optiond ?? "",
    ];

    return normalizeToFourOptions(individualOptions);
  };

  const normalizeToFourOptions = (options: any[]): string[] => {
    const cleanOptions = options.map((option) =>
      option === null || option === undefined ? "" : String(option)
    );

    while (cleanOptions.length < 4) {
      cleanOptions.push("");
    }

    return cleanOptions.slice(0, 4);
  };

  const normalizeCorrectOption = (q: any): number | null => {
    const value = q.correct_option ?? q.correct_answer ?? null;

    if (value === null || value === undefined || value === "") {
      return null;
    }

    if (typeof value === "number") {
      // اگر API صفرمبنا بدهد: 0 تا 3
      if (value >= 0 && value <= 3) {
        return value + 1;
      }

      // اگر API یک‌مبنا بدهد: 1 تا 4
      if (value >= 1 && value <= 4) {
        return value;
      }
    }

    const stringValue = String(value).trim().toUpperCase();

    if (["A", "B", "C", "D"].includes(stringValue)) {
      return stringValue.charCodeAt(0) - 64;
    }

    const numericValue = Number(stringValue);

    if (!Number.isNaN(numericValue)) {
      if (numericValue >= 0 && numericValue <= 3) {
        return numericValue + 1;
      }

      if (numericValue >= 1 && numericValue <= 4) {
        return numericValue;
      }
    }

    return null;
  };

const normalizeQuestion = (q: any): EditableQuestion => {
  return {
    id: q.id,
    question_text: q.question_text ?? q.text ?? q.question ?? "",
    options: normalizeOptions(q),
    correctOption: normalizeCorrectOption(q),
    explanation: q.explanation ?? "",
  };
};

  useEffect(() => {
    if (!examId) return;

    const load = async () => {
      try {
        setLoading(true);

const data = await getExamById(Number(examId));

console.log("EDIT EXAM RAW DATA:", data);
console.log("EDIT EXAM QUESTIONS:", data.questions);
console.log("FIRST QUESTION:", data.questions?.[0]);

setExam(data);
setExamTitle(data.title ?? "");
setDurationMinutes(
  data.duration_minutes != null ? String(data.duration_minutes) : ""
);


        const normalizedQuestions = Array.isArray(data.questions)
          ? data.questions.map(normalizeQuestion)
          : [];

        setQuestions(normalizedQuestions);
      } catch (error) {
        console.error("Error loading exam:", error);
        showToast("خطا در دریافت اطلاعات آزمون.", "error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [examId]);

  const updateQuestionText = (questionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              question_text: value,
            }
          : question
      )
    );
  };

  const updateExplanation = (questionIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              explanation: value,
            }
          : question
      )
    );
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setQuestions((prev) =>
      prev.map((question, index) => {
        if (index !== questionIndex) return question;

        const updatedOptions = [...question.options];
        updatedOptions[optionIndex] = value;

        return {
          ...question,
          options: updatedOptions,
        };
      })
    );
  };

  const updateCorrectOption = (questionIndex: number, value: string) => {
    const numericValue = Number(value);

    setQuestions((prev) =>
      prev.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              correctOption:
                numericValue >= 1 && numericValue <= 4 ? numericValue : null,
            }
          : question
      )
    );
  };

  const validateQuestion = (question: EditableQuestion) => {
    if (!question.question_text.trim()) {
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

  const saveQuestion = async (question: EditableQuestion) => {
    if (!examId) return;

    if (!question.id) {
      showToast("شناسه سؤال نامعتبر است.", "error");
      return;
    }

    if (!validateQuestion(question)) {
      return;
    }

    try {
      setLoading(true);

      const payload = buildQuestionPayload({
        questionText: question.question_text,
        options: question.options,
        correctOption: question.correctOption,
        explanation: question.explanation,
      });

      await updateExamQuestion(Number(examId), question.id, payload);

      showToast("سؤال با موفقیت ذخیره شد.", "success");
    } catch (error: any) {
      console.error("Error saving question:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      showToast("خطا در ذخیره سؤال.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveAllQuestions = async () => {
    if (!examId) return;

    for (const question of questions) {
      if (!validateQuestion(question)) {
        return;
      }
    }

    try {
      setLoading(true);

      for (const question of questions) {
        if (!question.id) continue;

        const payload = buildQuestionPayload({
          questionText: question.question_text,
          options: question.options,
          correctOption: question.correctOption,
          explanation: question.explanation,
        });

        await updateExamQuestion(Number(examId), question.id, payload);
      }

      showToast("همه تغییرات با موفقیت ذخیره شد.", "success");
    } catch (error: any) {
      console.error("Error saving all questions:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      showToast("خطا در ذخیره تغییرات.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveExamTitle = async () => {
    if (!examId || !exam) return;

    if (!examTitle.trim()) {
      showToast("نام آزمون نمی‌تواند خالی باشد.", "error");
      return;
    }

    const parsedDuration = durationMinutes.trim() ? Number(durationMinutes) : null;

    try {
      setLoading(true);

      await updateExam(Number(examId), {
        lesson_id: exam.lesson_id,
        title: examTitle,
        duration_minutes: parsedDuration,
      });

      setExam((prev: any) => ({
        ...prev,
        title: examTitle,
        duration_minutes: parsedDuration,
      }));
      showToast("تغییرات آزمون ذخیره شد.", "success");
    } catch (error) {
      console.error("Error updating exam title:", error);
      showToast("خطا در ذخیره تغییرات آزمون.", "error");
    } finally {
      setLoading(false);
    }
  };

  const removeQuestion = async (questionId?: number) => {
    if (!examId || !questionId) return;

    const confirmed = await confirm("آیا از حذف این سؤال مطمئن هستید؟", {
      confirmText: "حذف",
      danger: true,
    });

    if (!confirmed) return;

    try {
      setLoading(true);

      await deleteExamQuestion(Number(examId), questionId);

      setQuestions((prev) =>
        prev.filter((question) => question.id !== questionId)
      );
    } catch (error: any) {
      console.error("Error deleting question:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      showToast("خطا در حذف سؤال.", "error");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = async () => {
    if (!examId) return;

    try {
      setLoading(true);

      const payload = buildQuestionPayload({
        questionText: "سؤال جدید",
        options: ["گزینه ۱", "گزینه ۲", "گزینه ۳", "گزینه ۴"],
        correctOption: 1,
        explanation: "",
      });

      const createdQuestion = await addExamQuestion(Number(examId), payload);

      const normalizedQuestion = normalizeQuestion(createdQuestion);

      setQuestions((prev) => [...prev, normalizedQuestion]);
    } catch (error: any) {
      console.error("Error adding question:", error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }

      showToast("خطا در افزودن سؤال.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !exam) {
    return <div className="edit-exam-page">در حال بارگذاری آزمون...</div>;
  }

  if (!exam) {
    return <div className="edit-exam-page">آزمونی یافت نشد.</div>;
  }

  return (
    <div className="edit-exam-page">
      <div className="edit-exam-group">
        <label className="edit-exam-label">نام آزمون</label>

        <input
          className="edit-exam-input"
          value={examTitle}
          disabled={loading}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="نام آزمون"
        />

        <label className="edit-exam-label">
          مدت زمان آزمون (دقیقه) — خالی یعنی بدون محدودیت زمانی
        </label>

        <input
          className="edit-exam-input"
          value={durationMinutes}
          disabled={loading}
          inputMode="numeric"
          onChange={(e) => setDurationMinutes(e.target.value.replace(/[^\d]/g, ""))}
          placeholder="مثلاً 30"
        />

        <button
          type="button"
          className="edit-exam-btn edit-exam-btn-primary"
          disabled={
            loading ||
            (examTitle === exam.title &&
              durationMinutes === (exam.duration_minutes != null ? String(exam.duration_minutes) : ""))
          }
          onClick={saveExamTitle}
        >
          ذخیره تغییرات آزمون
        </button>
      </div>

      <div className="edit-exam-meta">
        <span>تعداد سؤال‌ها: {questions.length}</span>
      </div>

      {questions.length === 0 && (
        <div className="edit-exam-warning">
          هنوز هیچ سؤالی برای این آزمون ثبت نشده است.
        </div>
      )}

      {questions.map((question, questionIndex) => (
        <div key={question.id ?? questionIndex} className="question-editor">
          <div className="edit-exam-meta">
            <span>سؤال شماره {questionIndex + 1}</span>
          </div>

          <div className="edit-exam-group">
            <label className="edit-exam-label">متن سؤال</label>

            <textarea
              className="edit-exam-textarea"
              value={question.question_text}
              disabled={loading}
              onChange={(e) =>
                updateQuestionText(questionIndex, e.target.value)
              }
              placeholder="صورت سؤال را وارد کنید..."
            />
          </div>

          <div className="edit-exam-options">
            <span className="edit-exam-label">گزینه‌ها</span>

            {question.options.map((option, optionIndex) => (
              <input
                key={optionIndex}
                className="edit-exam-input"
                value={option}
                disabled={loading}
                onChange={(e) =>
                  updateOption(questionIndex, optionIndex, e.target.value)
                }
                placeholder={`گزینه ${optionIndex + 1}`}
              />
            ))}
          </div>

          <div className="edit-exam-group">
            <label className="edit-exam-label">گزینه صحیح</label>

            <Select
              className="edit-exam-select"
              value={question.correctOption ?? ""}
              disabled={loading}
              onChange={(v) => updateCorrectOption(questionIndex, v)}
              placeholder="انتخاب گزینه صحیح"
              options={[
                { value: "1", label: "گزینه ۱" },
                { value: "2", label: "گزینه ۲" },
                { value: "3", label: "گزینه ۳" },
                { value: "4", label: "گزینه ۴" },
              ]}
            />
          </div>

          <div className="edit-exam-group">
            <label className="edit-exam-label">توضیح پاسخ (اختیاری)</label>

            <textarea
              className="edit-exam-textarea"
              value={question.explanation}
              disabled={loading}
              onChange={(e) =>
                updateExplanation(questionIndex, e.target.value)
              }
              placeholder="توضیح دهید چرا گزینه صحیح، درست است..."
            />
          </div>

          <div className="edit-exam-actions">
            <button
              type="button"
              className="edit-exam-btn edit-exam-btn-primary"
              disabled={loading}
              onClick={() => saveQuestion(question)}
            >
              ذخیره این سؤال
            </button>

            <button
              type="button"
              className="edit-exam-btn edit-exam-btn-secondary"
              disabled={loading}
              onClick={() => removeQuestion(question.id)}
            >
              حذف سؤال
            </button>
          </div>
        </div>
      ))}

      <div className="edit-exam-actions">
        <button
          type="button"
          className="edit-exam-btn edit-exam-btn-primary"
          disabled={loading}
          onClick={addQuestion}
        >
          افزودن سؤال
        </button>

        <button
          type="button"
          className="edit-exam-btn edit-exam-btn-secondary"
          disabled={loading}
          onClick={saveAllQuestions}
        >
          {loading ? "در حال ذخیره..." : "ذخیره همه تغییرات"}
        </button>

        <button
          type="button"
          className="edit-exam-btn edit-exam-btn-secondary"
          disabled={loading}
          onClick={() => navigate(-1)}
        >
          بازگشت
        </button>
      </div>
    </div>
  );
}
