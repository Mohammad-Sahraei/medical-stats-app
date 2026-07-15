// src/api/examsApi.ts

import api from "./axios";

/* =========================
   Types
========================= */

export type ExamOptionLetter = "A" | "B" | "C" | "D";

export type ExamLockReason =
  | "lesson_incomplete"
  | "attempts_exhausted"
  | "perfect_score"
  | null;

export interface Exam {
  id: number;
  lesson_id: number;
  lesson_title?: string | null;
  title: string;
  created_at?: string;
  updated_at?: string;
  duration_minutes?: number | null;
  /** Only meaningful for students: true when the exam can't be taken right now. */
  locked?: boolean;
  lock_reason?: ExamLockReason;
  attempts_used?: number | null;
  max_attempts?: number;
  questions?: ExamQuestion[];
}

export interface ExamQuestion {
  id: number;
  exam_id?: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;

  /**
   * correct_option ممکن است برای student مخفی باشد.
   * اما برای professor/admin معمولاً وجود دارد.
   */
  correct_option?: ExamOptionLetter;

  /**
   * توضیح پاسخ صحیح؛ مثل correct_option ممکن است برای student مخفی باشد.
   */
  explanation?: string | null;

  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateExamPayload {
  lesson_id: number;
  title: string;
  duration_minutes?: number | null;
}

export interface UpdateExamPayload {
  lesson_id: number;
  title: string;
  duration_minutes?: number | null;
}

export interface CreateExamQuestionPayload {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: ExamOptionLetter;
  explanation?: string;
}

export interface UpdateExamQuestionPayload {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: ExamOptionLetter;
  order_index?: number;
  explanation?: string;
}

export interface SubmitExamPayload {
  answers: Record<string, ExamOptionLetter>;
}

export interface ExamSubmission {
  id: number;
  exam_id: number;
  exam_title?: string;
  student_id: number;
  score?: number;
  total_questions?: number;
  correct_count?: number;
  answers?: Record<string, ExamOptionLetter>;
  details?: unknown;
  submitted_at?: string;
  created_at?: string;
}

export interface SubmitExamResponse {
  message?: string;
  submission_id?: number;
  score?: number;
  best_score?: number;
  attempts_used?: number;
  attempts_remaining?: number;
  total_questions?: number;
  correct_count?: number;
  locked?: boolean;
  lock_reason?: ExamLockReason;
}

export interface ExamReviewQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  selected_option: ExamOptionLetter | null;
  is_correct: boolean;
  /** فقط برای سؤال‌هایی که غلط پاسخ داده شده‌اند ارسال می‌شود. */
  correct_option?: ExamOptionLetter;
  explanation?: string | null;
}

export interface ExamReview {
  exam_id: number;
  exam_title: string;
  score: number;
  submitted_at?: string;
  questions: ExamReviewQuestion[];
}

export interface ApiMessageResponse {
  message: string;
}

interface CreateExamResponse {
  exam: Exam;
  message?: string;
}


/* =========================
   Helpers
========================= */

/**
 * تبدیل شماره گزینه UI به حرف مورد نیاز API
 * در UI فعلی:
 * 1 => A
 * 2 => B
 * 3 => C
 * 4 => D
 */
export function optionNumberToLetter(
  optionNumber: number | null
): ExamOptionLetter | null {
  switch (optionNumber) {
    case 1:
      return "A";
    case 2:
      return "B";
    case 3:
      return "C";
    case 4:
      return "D";
    default:
      return null;
  }
}

/**
 * تبدیل حرف گزینه API به شماره برای UI
 */
export function optionLetterToNumber(
  optionLetter?: string | null
): number | null {
  switch (optionLetter) {
    case "A":
      return 1;
    case "B":
      return 2;
    case "C":
      return 3;
    case "D":
      return 4;
    default:
      return null;
  }
}

/**
 * ساخت payload سوال از state فعلی AddExam
 */
export function buildQuestionPayload(params: {
  questionText: string;
  options: string[];
  correctOption: number | null;
  explanation?: string;
}): CreateExamQuestionPayload {
  const correctLetter = optionNumberToLetter(params.correctOption);

  if (!correctLetter) {
    throw new Error("گزینه صحیح معتبر نیست.");
  }

  return {
    question_text: params.questionText,
    option_a: params.options[0] ?? "",
    option_b: params.options[1] ?? "",
    option_c: params.options[2] ?? "",
    option_d: params.options[3] ?? "",
    correct_option: correctLetter,
    explanation: params.explanation?.trim() ? params.explanation.trim() : undefined,
  };
}

/* =========================
   Exams
========================= */

/**
 * GET /api/exams
 * دریافت همه آزمون‌ها
 * اگر lessonId ارسال شود، آزمون‌ها بر اساس درس فیلتر می‌شوند.
 */
export async function getExams(lessonId?: number): Promise<Exam[]> {
  const response = await api.get<Exam[]>("/exams", {
    params: lessonId ? { lesson_id: lessonId } : undefined,
  });

  return response.data;
}

/**
 * POST /api/exams
 * ساخت آزمون جدید
 */
export async function createExam(
  payload: CreateExamPayload
): Promise<Exam> {
  const response = await api.post<CreateExamResponse>("/exams", payload);
  return response.data.exam;
}


/**
 * GET /api/exams/{exam_id}
 * دریافت یک آزمون خاص با سوالات
 */
export async function getExamById(examId: number): Promise<Exam> {
  const response = await api.get<Exam>(`/exams/${examId}`);
  return response.data;
}

/**
 * PUT /api/exams/{exam_id}
 * ویرایش اطلاعات آزمون
 */
export async function updateExam(
  examId: number,
  payload: UpdateExamPayload
): Promise<Exam> {
  const response = await api.put<Exam>(`/exams/${examId}`, payload);
  return response.data;
}

/**
 * DELETE /api/exams/{exam_id}
 * حذف آزمون
 */
export async function deleteExam(
  examId: number
): Promise<ApiMessageResponse> {
  const response = await api.delete<ApiMessageResponse>(`/exams/${examId}`);
  return response.data;
}

/* =========================
   Exam Questions
========================= */

/**
 * POST /api/exams/{exam_id}/questions
 * افزودن سوال به آزمون
 */
export async function addExamQuestion(
  examId: number,
  payload: CreateExamQuestionPayload
): Promise<ExamQuestion> {
  const response = await api.post<ExamQuestion>(
    `/exams/${examId}/questions`,
    payload
  );

  return response.data;
}

/**
 * PUT /api/exams/{exam_id}/questions/{question_id}
 * ویرایش یک سوال خاص
 */
export async function updateExamQuestion(
  examId: number,
  questionId: number,
  payload: UpdateExamQuestionPayload
): Promise<ExamQuestion> {
  const response = await api.put<ExamQuestion>(
    `/exams/${examId}/questions/${questionId}`,
    payload
  );

  return response.data;
}

/**
 * DELETE /api/exams/{exam_id}/questions/{question_id}
 * حذف یک سوال خاص
 */
export async function deleteExamQuestion(
  examId: number,
  questionId: number
): Promise<ApiMessageResponse> {
  const response = await api.delete<ApiMessageResponse>(
    `/exams/${examId}/questions/${questionId}`
  );

  return response.data;
}

/* =========================
   Submit Exam
========================= */

/**
 * POST /api/exams/{exam_id}/submit
 * ارسال پاسخ‌های دانشجو و دریافت نمره
 */
export async function submitExam(
  examId: number,
  payload: SubmitExamPayload
): Promise<SubmitExamResponse> {
  const response = await api.post<SubmitExamResponse>(
    `/exams/${examId}/submit`,
    payload
  );

  return response.data;
}

/**
 * GET /api/exams/{exam_id}/review
 * مرور بهترین تلاش دانشجو در آزمون: پاسخ انتخابی به هر سؤال، و برای
 * سؤال‌های غلط، گزینه صحیح و توضیح آن.
 * فقط زمانی در دسترس است که تلاش‌های دانشجو تمام شده باشد.
 */
export async function getExamReview(examId: number): Promise<ExamReview> {
  const response = await api.get<ExamReview>(`/exams/${examId}/review`);
  return response.data;
}

/* =========================
   Submissions / History
========================= */

/**
 * GET /api/exams/submissions
 * دریافت تاریخچه ارسال آزمون‌ها
 *
 * studentId فقط برای Professor/Admin کاربرد دارد.
 */
export async function getExamSubmissions(
  studentId?: number
): Promise<ExamSubmission[]> {
  const response = await api.get<ExamSubmission[]>("/exams/submissions", {
    params: studentId ? { student_id: studentId } : undefined,
  });

  return response.data;
}
