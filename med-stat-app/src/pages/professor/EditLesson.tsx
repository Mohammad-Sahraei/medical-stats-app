import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import JoditEditor from "jodit-react";
import "jodit/es2021/jodit.min.css";

import { Trash2 } from "lucide-react";

import {
  getLesson,
  getLessonSections,
  updateSection,
  createSection,
  deleteSection,
} from "../../api/lessonsApi";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import { resolveContentUrls, getApiOrigin } from "../../utils/richContent";

import "./AddLesson.scss";

export default function EditLesson() {

  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const confirm = useConfirm();

  const editor = useRef(null);

  const [title,setTitle] = useState("");
  const [content,setContent] = useState("");

  const [sections,setSections] = useState<any[]>([]);
  const [currentIndex,setCurrentIndex] = useState(0);

  const token = localStorage.getItem("token");

  const config = useMemo(()=>({

    readonly:false,
    height:420,
    direction:"rtl" as const,
    language:"fa",

    uploader:{
      url:`${import.meta.env.VITE_API_URL}/upload`,
      method:"POST",
      headers: token ? { Authorization:`Bearer ${token}` } : {},
      filesVariableName:()=> "image",

      isSuccess:(resp:any)=>!!resp?.url,

      process:(resp:any)=>({
        files:[`${getApiOrigin()}${resp.url}`],
        path:"",
        baseurl:""
      })
    }

  }),[token]);



  useEffect(()=>{

    const loadLesson = async ()=>{

      if(!lessonId) return;

      try{

        const lesson = await getLesson(Number(lessonId));
        setTitle(lesson.title);

        const secs = await getLessonSections(Number(lessonId));

        setSections(secs);

        if(secs.length>0){
          setContent(resolveContentUrls(secs[0].body_content));
        }

      }catch(err){
        console.error("LOAD LESSON ERROR:",err);
      }

    };

    loadLesson();

  },[lessonId]);


const saveCurrentSection = async () => {

  const section = sections[currentIndex];

  if(!section) return;

  try{

    await updateSection(
      Number(lessonId),
      section.id,
      {
        title: section.title,
        body_content: content,
        order_index: section.order_index
      }
    );

    const updated = [...sections];
    updated[currentIndex].body_content = content;

    setSections(updated);

    showToast("بخش ذخیره شد", "success");

  }catch(err){
    console.error("UPDATE SECTION ERROR:",err);
    showToast("خطا در ذخیره", "error");
  }

};


  const goNext = async ()=>{

    await saveCurrentSection();

    if(currentIndex < sections.length-1){

      const next = currentIndex+1;

      setCurrentIndex(next);
      setContent(resolveContentUrls(sections[next].body_content));

    }

  };


  const goPrev = async ()=>{

    await saveCurrentSection();

    if(currentIndex>0){

      const prev = currentIndex-1;

      setCurrentIndex(prev);
      setContent(resolveContentUrls(sections[prev].body_content));

    }

  };


  const removeCurrentSection = async () => {

    const section = sections[currentIndex];

    if (!section) return;

    const confirmed = await confirm("آیا از حذف این بخش مطمئن هستید؟", {
      confirmText: "حذف",
      danger: true,
    });
    if (!confirmed) return;

    try {

      await deleteSection(Number(lessonId), section.id);

      const updated = sections.filter((_, idx) => idx !== currentIndex);
      setSections(updated);

      const nextIndex = Math.max(0, Math.min(currentIndex, updated.length - 1));
      setCurrentIndex(nextIndex);
      setContent(resolveContentUrls(updated[nextIndex]?.body_content || ""));

    } catch (err) {
      console.error("DELETE SECTION ERROR:", err);
      showToast("خطا در حذف بخش", "error");
    }

  };


  const addNewSection = async ()=>{

    try{

      const newOrder = sections.length+1;

      const newSection = await createSection(Number(lessonId),{
        title:`بخش ${newOrder}`,
        body_content:"",
        order_index:newOrder
      });

      const updated = [...sections,newSection];

      setSections(updated);
      setCurrentIndex(updated.length-1);
      setContent("");

    }catch(err){
      console.error("CREATE SECTION ERROR:",err);
    }

  };


  if(!lessonId) return <div>درس پیدا نشد</div>;

  return(

    <div className="add-lesson-page">

      <div className="form-group">

        <label>عنوان فصل</label>

        <input
          type="text"
          value={title}
          disabled
        />

      </div>


      <div style={{marginBottom:10}}>
        بخش {currentIndex+1} از {sections.length}
      </div>


      <div className="editor-wrapper">

        <JoditEditor
          ref={editor}
          value={content}
          config={config}
          onChange={(v)=>setContent(v)}
        />

      </div>


      <div className="lesson-actions">

        <button
          className="btn-secondary"
          onClick={goPrev}
        >
          بخش قبلی
        </button>

        <button
          className="btn-secondary"
          onClick={goNext}
        >
          بخش بعدی
        </button>

        <button
          className="btn-secondary"
          onClick={addNewSection}
        >
          افزودن بخش جدید
        </button>

        <button
          className="btn-danger"
          onClick={removeCurrentSection}
          disabled={sections.length === 0}
        >
          <Trash2 size={16} />
          حذف این بخش
        </button>

        <button
          className="btn-primary"
          onClick={saveCurrentSection}
        >
          ذخیره
        </button>

        <button
          className="btn-primary"
          onClick={()=>navigate("/professor/courses")}
        >
          بازگشت
        </button>

      </div>

    </div>

  );

}
