import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getExamById } from "../../api/examsApi";
import "./PreviewExam.scss";

export default function PreviewExam() {
  const { examId } = useParams();
  const [exam, setExam] = useState<any>(null);

  useEffect(() => {
    if (!examId) return;

    const load = async () => {
      try {
        const data = await getExamById(Number(examId));
        setExam(data);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, [examId]);

  // استخراج گزینه‌ها از هر ساختاری
  const getQuestionOptions = (q: any): string[] => {
    if (Array.isArray(q.options)) {
      return q.options;
    }

    if (typeof q.options === "string") {
      try {
        const parsed = JSON.parse(q.options);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }

    const individualOptions = [
      q.option_1 || q.option1 || q.option_a || q.optiona,
      q.option_2 || q.option2 || q.option_b || q.optionb,
      q.option_3 || q.option3 || q.option_c || q.optionc,
      q.option_4 || q.option4 || q.option_d || q.optiond,
    ].filter(Boolean);

    return individualOptions;
  };

  if (!exam) return <div className="exam-loading">در حال بارگذاری آزمون...</div>;

  return (
    <div className="exam-preview-container">
      <header className="preview-header">
        <div className="header-info">
          <h2>{exam.title}</h2>
          <span className="badge">{exam.questions.length} سوال</span>
        </div>
      </header>

      <div className="questions-grid">
        {exam.questions.map((q: any, i: number) => {
          const options = getQuestionOptions(q);

          return (
            <div key={q.id} className="q-card">
              <div className="q-header">
                <span className="q-number">سوال {i + 1}</span>
              </div>

              <p className="q-text">{q.question_text}</p>

              <div className="options-group">
                {options.map((opt: string, idx: number) => {

                  // تبدیل index به A B C D
                  const optionLetter = String.fromCharCode(65 + idx);

                  // مقایسه با correct_option
                  const isCorrect =
                    q.correct_option &&
                    optionLetter === q.correct_option.toUpperCase();

                  return (
                    <div
                      key={idx}
                      className={`opt-item ${isCorrect ? "is-correct" : ""}`}
                    >
                      <span className="opt-label">{optionLetter}</span>

                      <span className="opt-text">{opt}</span>

                      {isCorrect && (
                        <span className="correct-tag">پاسخ صحیح ✓</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="q-explanation">
                  <span className="q-explanation-label">توضیح پاسخ:</span>
                  <p>{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
