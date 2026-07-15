export type ContentType = "lesson" | "exam";

export interface Lesson {
  id: number;
  type: "lesson";
  title: string;
  content: string;
  example: string;
  chapter: number;
}

export interface Exam {
  id: number;
  type: "exam";
  title: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  chapter: number;
}

export type CourseItem = Lesson | Exam;
