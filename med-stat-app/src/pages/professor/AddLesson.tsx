import { useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";
import "./AddLesson.scss";

import { createLesson, createSection } from "../../api/lessonsApi";
import { useToast } from "../../context/ToastContext";
import { getApiOrigin } from "../../utils/richContent";

export default function AddLesson() {

  const editor = useRef(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [lessonId, setLessonId] = useState<number | null>(null);
  const [sectionNumber, setSectionNumber] = useState(1);

  const token = localStorage.getItem("token");

  const config = useMemo(() => {

    const headersToSend = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    return {
      readonly: false,
      height: 420,
      direction: "rtl" as const,
      language: "fa",

      uploader: {
        url: `${import.meta.env.VITE_API_URL}/upload`,
        method: "POST",
        format: "json",
        headers: headersToSend,
        filesVariableName: () => "image",

        isSuccess: (resp: any) => {
          console.log("UPLOAD RESPONSE:", resp);
          return !!resp?.url;
        },

        process: (resp: any) => {
          console.log("UPLOAD PROCESS:", resp);

          // resp.url is relative to the backend (e.g. /api/upload/images/x.webp).
          // Insert it as an absolute URL so it previews correctly inside the
          // editor right away — otherwise the broken preview has led to
          // professors working around it by pasting the link as plain text.
          return {
            files: [`${getApiOrigin()}${resp.url}`],
            path: "",
            baseurl: ""
          };
        },

        error: (e: any) => {
          console.error("UPLOAD ERROR:", e);
        }
      },

      buttons: [
        "bold","italic","underline","strikethrough",
        "|",
        "ul","ol",
        "|",
        "image","link","table",
        "|",
        "undo","redo",
        "|",
        "source","preview","fullsize"
      ]
    };

  }, [token]);


  const handleNextSection = async () => {

    console.log("====== NEXT SECTION CLICKED ======");

    console.log("TITLE:", title);
    console.log("CONTENT LENGTH:", content.length);
    console.log("CURRENT LESSON ID:", lessonId);
    console.log("SECTION NUMBER:", sectionNumber);

    if (!title.trim()) {
      showToast("عنوان فصل را وارد کنید", "error");
      return;
    }

    if (!content.trim()) {
      showToast("محتوای بخش خالی است", "error");
      return;
    }

    try {

      let currentLessonId = lessonId;

      if (!currentLessonId) {

        console.log("CREATING LESSON...");

        const res = await createLesson(title);

        console.log("LESSON RESPONSE:", res);

        currentLessonId = res.lesson?.id;

        if (!currentLessonId) {
          throw new Error("Lesson ID missing from API response");
        }

        console.log("NEW LESSON ID:", currentLessonId);

        setLessonId(currentLessonId);
      }

      console.log("CREATING SECTION...");

      const section = await createSection(currentLessonId, {
        title: `بخش ${sectionNumber}`,
        body_content: content,
        order_index: sectionNumber
      });

      console.log("SECTION RESPONSE:", section);

      setSectionNumber(prev => prev + 1);
      setContent("");

      console.log("SECTION SAVED SUCCESS");
      showToast("بخش ذخیره شد", "success");

    } catch (error: any) {

      console.error("FULL ERROR:", error);

      console.log("ERROR STATUS:", error?.response?.status);
      console.log("ERROR DATA:", error?.response?.data);
      console.log("ERROR HEADERS:", error?.response?.headers);

      showToast("خطا در ذخیره بخش", "error");

    }

  };


const handleSaveLesson = async () => {

  console.log("SAVE LESSON CLICKED");
  console.log("LESSON ID:", lessonId);

  if (!title.trim()) {
    showToast("عنوان فصل را وارد کنید", "error");
    return;
  }

  if (!content.trim()) {
    showToast("محتوای بخش خالی است", "error");
    return;
  }

  try {

    let currentLessonId = lessonId;

    if (!currentLessonId) {

      const res = await createLesson(title);

      currentLessonId = res.lesson?.id;

      if (!currentLessonId) {
        throw new Error("Lesson ID missing from API response");
      }

      setLessonId(currentLessonId);
    }

    await createSection(currentLessonId, {
      title: `بخش ${sectionNumber}`,
      body_content: content,
      order_index: sectionNumber
    });

    showToast("فصل با موفقیت ذخیره شد", "success");
    navigate("/professor/courses");

  } catch (error) {

    console.error("SAVE LESSON ERROR:", error);
    showToast("خطا در ذخیره فصل", "error");

  }

};

  return (

    <div className="add-lesson-page">

      <div className="form-group">

        <label>عنوان فصل</label>

        <input
          type="text"
          placeholder="مثلاً: فصل اول"
          value={title}
          onChange={(e)=>setTitle(e.target.value)}
          disabled={lessonId !== null}
        />

      </div>


      <div className="editor-wrapper">

        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          onChange={(newContent)=>setContent(newContent)}
        />

      </div>


      <div style={{marginBottom:10}}>
        شماره بخش فعلی: {sectionNumber}
      </div>

      <div className="lesson-actions">

        <button
          className="btn-secondary"
          onClick={handleNextSection}
        >
          ذخیره و بخش بعدی
        </button>


        <button
          className="btn-primary"
          onClick={handleSaveLesson}
        >
          ذخیره فصل
        </button>

      </div>

    </div>
  );
}
