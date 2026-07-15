import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getLesson, getLessonSections } from "../../api/lessonsApi";
import { resolveContentUrls } from "../../utils/richContent";
import "./PreviewLesson.scss";

export default function PreviewLesson() {
  const { lessonId } = useParams();

  const [lesson, setLesson] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);

  useEffect(() => {
    console.log("PreviewLesson mounted");
    console.log("lessonId from params:", lessonId);

    if (!lessonId) {
      console.log("lessonId is missing");
      return;
    }

    const load = async () => {
      try {
        console.log("Fetching lesson...");

        const lessonData = await getLesson(Number(lessonId));
        console.log("Lesson response:", lessonData);

        setLesson(lessonData);

        console.log("Fetching sections...");

        const sectionData = await getLessonSections(Number(lessonId));
        console.log("Sections response:", sectionData);

        setSections(sectionData);
      } catch (err) {
        console.error("Error loading lesson:", err);
      }
    };

    load();
  }, [lessonId]);

  console.log("Current lesson state:", lesson);
  console.log("Current sections state:", sections);

  if (!lesson) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <div className="lesson-preview">

      <h1 className="lesson-title">
        {lesson.title}
      </h1>

      {sections.map((section) => (
        <div key={section.id} className="section-card">

          <h3 className="section-title">
            {section.title}
          </h3>

          <div
            className="section-body rich-content"
            dangerouslySetInnerHTML={{
              __html: resolveContentUrls(section.body_content),
            }}
          />

        </div>
      ))}

    </div>
  );
}
