import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";

import { getExamReview } from "../../api/examsApi";
import type { ExamOptionLetter, ExamReview } from "../../api/examsApi";

import "./StudentExamReview.scss";

export default function StudentExamReview() {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState<ExamReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) {
      setError("شناسه آزمون نامعتبر است.");
      setLoading(false);
      return;
    }

    const numericExamId = Number(examId);

    if (Number.isNaN(numericExamId)) {
      setError("شناسه آزمون معتبر نیست.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getExamReview(numericExamId);
        setReview(data);
      } catch (err: any) {
        console.error("Failed to load exam review:", err);

        if (err?.response?.status === 403) {
          setError("مرور پاسخ‌ها فقط پس از پایان تلاش‌های شما در این آزمون در دسترس است.");
        } else {
          setError("خطا در دریافت پاسخ‌های آزمون.");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [examId]);

  if (loading) {
    return (
      <div className="exam-review-page">
        <div className="exam-state-box">
          <Loader2 className="spin" size={42} />
          <h2>در حال بارگذاری پاسخ‌ها...</h2>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="exam-review-page">
        <div className="exam-state-box error">
          <AlertCircle size={46} />
          <h2>مشکلی پیش آمد</h2>
          <p>{error ?? "پاسخ‌های این آزمون یافت نشد."}</p>

          <button onClick={() => navigate("/student/exams")}>
            بازگشت به لیست آزمون‌ها
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exam-review-page">
      <div className="exam-review-content">
        <header className="review-header">
          <div>
            <h1>{review.exam_title}</h1>
            <p>مرور سؤال‌ها و پاسخ‌های شما در بهترین تلاش ثبت‌شده.</p>
          </div>

          <div className="review-score-badge">
            نمره: {Math.round(review.score)}٪
          </div>
        </header>

        <section className="review-questions-list">
          {review.questions.map((question, index) => (
            <article key={question.id} className="review-question-card">
              <div className="question-top">
                <span className="question-number">سوال {index + 1}</span>

                <span
                  className={`correctness-badge ${
                    question.is_correct ? "correct" : "wrong"
                  }`}
                >
                  {question.is_correct ? (
                    <>
                      <CheckCircle2 size={15} /> پاسخ صحیح
                    </>
                  ) : (
                    <>
                      <XCircle size={15} /> پاسخ غلط
                    </>
                  )}
                </span>
              </div>

              <h2>{question.question_text}</h2>

              <div className="options-list">
                {(["A", "B", "C", "D"] as ExamOptionLetter[]).map((opt) => {
                  const text =
                    opt === "A"
                      ? question.option_a
                      : opt === "B"
                      ? question.option_b
                      : opt === "C"
                      ? question.option_c
                      : question.option_d;

                  const isSelected = question.selected_option === opt;
                  const isCorrectOption = question.correct_option === opt;

                  const classNames = [
                    "option-item",
                    isSelected && question.is_correct ? "selected-correct" : "",
                    isSelected && !question.is_correct ? "selected-wrong" : "",
                    !isSelected && isCorrectOption ? "actual-correct" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div key={opt} className={classNames}>
                      <span className="option-letter">{opt}</span>
                      <span className="option-text">{text}</span>

                      {isSelected && (
                        <span className="option-tag">پاسخ شما</span>
                      )}

                      {!isSelected && isCorrectOption && (
                        <span className="option-tag">پاسخ صحیح</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!question.is_correct && question.explanation && (
                <div className="question-explanation">
                  <span className="question-explanation-label">توضیح پاسخ:</span>
                  <p>{question.explanation}</p>
                </div>
              )}
            </article>
          ))}
        </section>

        <div className="review-footer">
          <button onClick={() => navigate("/student/exams")}>
            بازگشت به لیست آزمون‌ها
          </button>
        </div>
      </div>
    </div>
  );
}
