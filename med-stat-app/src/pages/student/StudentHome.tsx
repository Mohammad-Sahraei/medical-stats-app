import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

import {
  getLessonSections,
  getLessons,
  markSectionCompleted,
} from "../../api/lessonsApi";
import { resolveContentUrls } from "../../utils/richContent";
import RichContentViewer from "../../components/richcontent/RichContentViewer";

import "./StudentHome.scss";

interface Section {
  id: number;
  title: string;
  body_content: string;
  order_index?: number;
  completed?: boolean;
}

interface Lesson {
  id: number;
  title: string;
}

export default function StudentHome() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [lessonTitle, setLessonTitle] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [courseFinished, setCourseFinished] = useState(false);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const lessons: Lesson[] = await getLessons();
        setAllLessons(lessons || []);

        if (!lessons || lessons.length === 0) {
          setLoading(false);
          return;
        }

        let currentLessonId = lessonId;

        if (!lessonId) {
          const firstLesson = lessons[0];
          navigate(`/student/home/${firstLesson.id}`, { replace: true });
          return;
        }

        setCourseFinished(false);

        const lesson = lessons.find(
          (l) => l.id === Number(currentLessonId)
        );

        if (lesson) {
          setLessonTitle(lesson.title);
        }

        const data = await getLessonSections(Number(currentLessonId));

        const sorted = [...data].sort(
          (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
        );

        setSections(sorted);

        const firstIncompleteIndex = sorted.findIndex(
          (section) => !section.completed
        );

        if (firstIncompleteIndex !== -1) {
          setCurrentIndex(firstIncompleteIndex);
        } else {
          // Every section is already completed — "review again" restarts
          // from the beginning rather than reopening the last section.
          setCurrentIndex(0);
        }
      } catch (error) {
        console.error("Failed to load lesson:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [lessonId, navigate]);

  const goToNextLesson = async () => {
    if (updating) return;

    const currentSection = sections[currentIndex];

    try {
      setUpdating(true);

      await markSectionCompleted(currentSection.id);

      if (currentIndex < sections.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Last section of this lesson — advance to the next lesson's first section.
      const lessonIndex = allLessons.findIndex(
        (l) => l.id === Number(lessonId)
      );
      const nextLesson =
        lessonIndex !== -1 ? allLessons[lessonIndex + 1] : undefined;

      if (nextLesson) {
        navigate(`/student/home/${nextLesson.id}`);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setCourseFinished(true);
      }
    } catch (err) {
      console.error("Progress update failed", err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div className="student-home-page">در حال بارگذاری درس...</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="student-home-page">
        <p>هیچ بخشی برای این درس پیدا نشد.</p>
      </div>
    );
  }

  const currentSection = sections[currentIndex];

  return (
    <div className="student-home-page">
      <div className="lesson-content">
        <div className="lesson-section">
          <h2 className="lesson-title">
            {lessonTitle}
            <span className="section-counter">
              {" "}
              (بخش {currentIndex + 1})
            </span>
          </h2>

          <RichContentViewer
            className="section-content"
            html={resolveContentUrls(currentSection.body_content)}
          />
        </div>
      </div>

      {courseFinished ? (
        <div className="next-lesson course-finished">
          <span>تبریک! تمام دروس این دوره را به پایان رساندید 🎉</span>
        </div>
      ) : (
        <div
          className="next-lesson"
          onClick={goToNextLesson}
          style={{ opacity: updating ? 0.6 : 1 }}
        >
          <span>
            {updating
              ? "در حال ثبت پیشرفت..."
              : currentIndex < sections.length - 1
              ? "ادامه آموزش"
              : "درس بعدی"}
          </span>
          <ArrowLeft size={18} />
        </div>
      )}
    </div>
  );
}
