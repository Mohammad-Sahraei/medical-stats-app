import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Loader2,
  Clock,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
} from "lucide-react";

import {
  getExamById,
  submitExam as submitExamApi,
} from "../../api/examsApi";

import type {
  Exam,
  ExamOptionLetter,
  ExamLockReason,
  SubmitExamResponse,
} from "../../api/examsApi";

import { AuthContext } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";

import "./StudentTakeExam.scss";

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function StudentTakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const confirm = useConfirm();

  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, ExamOptionLetter>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockReason, setLockReason] = useState<ExamLockReason>(null);
  const [result, setResult] = useState<SubmitExamResponse | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [timeUpOpen, setTimeUpOpen] = useState(false);

  const hasAutoSubmittedRef = useRef(false);
  const autoSubmitRef = useRef<() => void>(() => {});

  async function loadExam() {
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

    try {
      setLoading(true);
      setError(null);
      setLockReason(null);

      const data = await getExamById(numericExamId);
      setExam(data);
    } catch (err: any) {
      console.error("Failed to load exam:", err);

      if (err?.response?.status === 403) {
        setLockReason(err?.response?.data?.lock_reason ?? "lesson_incomplete");
      } else {
        setError("خطا در دریافت اطلاعات آزمون.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExam();
  }, [examId]);

  function selectAnswer(questionId: number, option: ExamOptionLetter) {
    setAnswers((prev) => ({
      ...prev,
      [String(questionId)]: option,
    }));
  }

  async function handleSubmitExam() {
    if (!examId || !exam) return;

    const numericExamId = Number(examId);

    if (Number.isNaN(numericExamId)) {
      setError("شناسه آزمون معتبر نیست.");
      return;
    }

    const totalQuestions = exam.questions?.length ?? 0;
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = totalQuestions - answeredCount;

    if (unansweredCount > 0) {
      const confirmed = await confirm(
        `شما به ${unansweredCount} سوال پاسخ نداده‌اید. آیا مطمئن هستید که می‌خواهید آزمون را ارسال کنید؟`,
        { confirmText: "ارسال آزمون", cancelText: "انصراف" }
      );

      if (!confirmed) return;
    }

    hasAutoSubmittedRef.current = true;

    try {
      setSubmitting(true);
      setError(null);

      const response = await submitExamApi(numericExamId, {
        answers,
      });

      setResult(response);
      localStorage.removeItem(`exam_start_${auth?.user?.id ?? "anon"}_${examId}`);
    } catch (err) {
      console.error("Failed to submit exam:", err);
      setError("خطا در ارسال پاسخ‌های آزمون.");
    } finally {
      setSubmitting(false);
    }
  }

  // Timer expiry is forced: no confirm() prompt (there's no choice left to
  // make), just submit whatever was answered and show a dedicated "time's
  // up" screen that kicks the student out of the exam.
  async function autoSubmitOnTimeout() {
    if (!examId) return;

    const numericExamId = Number(examId);
    if (Number.isNaN(numericExamId)) return;

    setTimeUpOpen(true);

    try {
      const response = await submitExamApi(numericExamId, { answers });
      setResult(response);
      localStorage.removeItem(`exam_start_${auth?.user?.id ?? "anon"}_${examId}`);
    } catch (err) {
      console.error("Auto-submit on timeout failed:", err);
    }
  }

  useEffect(() => {
    autoSubmitRef.current = autoSubmitOnTimeout;
  });

  // Countdown timer: the deadline is derived from a start timestamp recorded
  // the first time the student opens this exam, so refreshing/navigating
  // away and back doesn't reset the clock.
  useEffect(() => {
    if (!exam || !examId) return;

    if (!exam.duration_minutes) {
      setRemainingSeconds(null);
      return;
    }

    const storageKey = `exam_start_${auth?.user?.id ?? "anon"}_${examId}`;
    let startTime = Number(localStorage.getItem(storageKey));

    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(storageKey, String(startTime));
    }

    const deadline = startTime + exam.duration_minutes * 60 * 1000;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        autoSubmitRef.current();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [exam, examId]);

  const questions = exam?.questions ?? [];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  const progress =
    totalQuestions > 0
      ? Math.round((answeredCount / totalQuestions) * 100)
      : 0;

  const percent =
    result && result.total_questions
      ? Math.round(((result.correct_count ?? 0) / result.total_questions) * 100)
      : 0;

  if (loading) {
    return (
      <div className="take-exam-page">
        <div className="exam-state-box">
          <Loader2 className="spin" size={42} />
          <h2>در حال بارگذاری آزمون...</h2>
          <p>لطفاً چند لحظه صبر کنید.</p>
        </div>
      </div>
    );
  }

  if (lockReason) {
    const isFinished =
      lockReason === "attempts_exhausted" || lockReason === "perfect_score";

    const title =
      lockReason === "perfect_score"
        ? "شما نمره کامل گرفته‌اید"
        : lockReason === "attempts_exhausted"
        ? "تلاش‌های شما تمام شده است"
        : "این آزمون هنوز قفل است";

    const description =
      lockReason === "perfect_score"
        ? "شما در یکی از تلاش‌های قبلی نمره کامل گرفته‌اید و دیگر نیازی به تلاش مجدد نیست."
        : lockReason === "attempts_exhausted"
        ? "شما تمام تلاش‌های مجاز برای این آزمون را استفاده کرده‌اید."
        : "برای شرکت در این آزمون، ابتدا باید تمام بخش‌های این فصل را کامل کنید.";

    return (
      <div className="take-exam-page">
        <div className="exam-state-box error">
          <Lock size={46} />
          <h2>{title}</h2>
          <p>{description}</p>

          <div className="state-actions">
            {isFinished && (
              <button onClick={() => navigate(`/student/exams/${examId}/review`)}>
                مشاهده پاسخ‌ها
              </button>
            )}

            <button
              className={isFinished ? "secondary" : ""}
              onClick={() => navigate("/student/exams")}
            >
              بازگشت به لیست آزمون‌ها
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="take-exam-page">
        <div className="exam-state-box error">
          <AlertCircle size={46} />
          <h2>مشکلی پیش آمد</h2>
          <p>{error}</p>

          <div className="state-actions">
            <button onClick={loadExam}>تلاش دوباره</button>

            <button
              className="secondary"
              onClick={() => navigate("/student/exams")}
            >
              بازگشت به آزمون‌ها
            </button>
          </div>
        </div>

      </div>
    );
  }

  if (!exam) {
    return (
      <div className="take-exam-page">
        <div className="exam-state-box error">
          <AlertCircle size={46} />
          <h2>آزمون پیدا نشد</h2>
          <p>اطلاعاتی برای این آزمون دریافت نشد.</p>

          <button onClick={() => navigate("/student/exams")}>
            بازگشت به لیست آزمون‌ها
          </button>
        </div>

      </div>
    );
  }

  if (timeUpOpen) {
    return (
      <div className="take-exam-page">
        <div className="exam-result-card time-up-card">
          <div className="result-icon time-up">
            <Clock size={62} />
          </div>

          <h1>زمان آزمون به پایان رسید</h1>

          <p className="result-title">
            پاسخ‌های شما تا همین لحظه ثبت شد و دیگر امکان ادامه این آزمون وجود ندارد.
          </p>

          {result ? (
            <>
              <p className="result-detail">
                {result.correct_count} پاسخ صحیح از {result.total_questions}
              </p>

              {typeof result.best_score === "number" && (
                <p className="result-meta">
                  بهترین نمره شما در این آزمون: {Math.round(result.best_score)}٪
                </p>
              )}
            </>
          ) : (
            <p className="result-meta">
              <Loader2 className="spin" size={18} /> در حال ثبت پاسخ‌ها...
            </p>
          )}

          <button onClick={() => navigate("/student/exams")}>
            خروج از آزمون
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="take-exam-page">
        <div className="exam-result-card">
          <div className="result-icon">
            <CheckCircle2 size={62} />
          </div>

          <h1>نتیجه آزمون</h1>

          <p className="result-title">{exam.title}</p>

          <div className="result-percent-wrapper">
            <div className="percent-circle">
              <svg viewBox="0 0 120 120">
                <circle className="bg" cx="60" cy="60" r="52" />

                <circle
                  className="progress"
                  cx="60"
                  cy="60"
                  r="52"
                  style={{
                    strokeDasharray: 327,
                    strokeDashoffset: 327 - (327 * percent) / 100,
                  }}
                />
              </svg>

              <div className="percent-text">{percent}%</div>
            </div>

            <p className="result-detail">
              {result.correct_count} پاسخ صحیح از {result.total_questions}
            </p>
          </div>

          {typeof result.correct_count === "number" &&
            typeof result.total_questions === "number" && (
              <p className="result-meta">
                تعداد پاسخ‌های غلط: {result.total_questions - result.correct_count}
              </p>
            )}

          {typeof result.best_score === "number" && (
            <p className="result-meta">
              بهترین نمره شما در این آزمون: {Math.round(result.best_score)}٪
            </p>
          )}

          {typeof result.attempts_remaining === "number" && (
            <p className="result-meta">
              {result.attempts_remaining > 0
                ? `تلاش‌های باقی‌مانده: ${result.attempts_remaining}`
                : "تلاش‌های مجاز شما برای این آزمون به پایان رسید"}
            </p>
          )}

          {result.message && <p className="result-message">{result.message}</p>}

          <div className="state-actions">
            {result.locked && (
              <button onClick={() => navigate(`/student/exams/${examId}/review`)}>
                مشاهده پاسخ‌ها
              </button>
            )}

            <button
              className={result.locked ? "secondary" : ""}
              onClick={() => navigate("/student/exams")}
            >
              بازگشت به لیست آزمون‌ها
            </button>
          </div>
        </div>

      </div>
    );
  }

  return (
    <div className="take-exam-page">
      <div className="take-exam-content">
        <header className="take-exam-header">
          <div className="exam-title-box">
            <div>
              <h1>{exam.title}</h1>
              <p>به سوالات پاسخ دهید و در پایان آزمون را ارسال کنید.</p>
            </div>
          </div>

          <div className="exam-header-side">
            {exam.duration_minutes && remainingSeconds !== null ? (
              <div
                className={`timer-box ${remainingSeconds <= 60 ? "danger" : ""}`}
              >
                <Clock size={20} />
                <span>{formatDuration(remainingSeconds)}</span>
              </div>
            ) : (
              <div className="timer-box no-time">
                <Clock size={20} />
                <span>بدون محدودیت زمان</span>
              </div>
            )}
          </div>
        </header>

        <section className="exam-progress-card">
          <div className="progress-info">
            <span>
              پاسخ داده‌شده: {answeredCount} از {totalQuestions}
            </span>

            <strong>{progress}%</strong>
          </div>

          <div className="progress-bar">
            <div style={{ width: `${progress}%` }} />
          </div>
        </section>

        {error && (
          <div className="inline-error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <section className="questions-list">
          {questions.map((question, index) => {
            const selectedAnswer = answers[String(question.id)];

            return (
              <article key={question.id} className="question-card">
                <div className="question-top">
                  <span className="question-number">
                    سوال {index + 1}
                  </span>

                  {selectedAnswer && (
                    <span className="answered-badge">
                      پاسخ داده شده
                    </span>
                  )}
                </div>

                <h2>{question.question_text}</h2>

                <div className="options-list">
                  {(["A","B","C","D"] as ExamOptionLetter[]).map((opt) => {
                    const text =
                      opt === "A"
                        ? question.option_a
                        : opt === "B"
                        ? question.option_b
                        : opt === "C"
                        ? question.option_c
                        : question.option_d;

                    return (
                      <label
                        key={opt}
                        className={`option-item ${
                          selectedAnswer === opt ? "selected" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={selectedAnswer === opt}
                          onChange={() => selectAnswer(question.id, opt)}
                        />

                        <span className="custom-radio" />
                        <span className="option-letter">{opt}</span>
                        <span className="option-text">{text}</span>
                      </label>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </section>

        <footer className="exam-submit-footer">
          <div>
            <strong>{answeredCount}</strong>
            <span> سوال از </span>
            <strong>{totalQuestions}</strong>
            <span> پاسخ داده شده</span>
          </div>

          <button
            className="submit-exam-btn"
            type="button"
            onClick={handleSubmitExam}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="spin" size={18} />
                در حال ارسال...
              </>
            ) : (
              <>
                <Send size={18} />
                ارسال پاسخ‌ها
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
}
