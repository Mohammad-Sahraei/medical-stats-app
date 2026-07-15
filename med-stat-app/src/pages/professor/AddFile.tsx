import { useEffect, useMemo, useState } from "react";
import { FileText, Upload, Trash2 } from "lucide-react";

import { getLessons } from "../../api/lessonsApi";
import { getExams } from "../../api/examsApi";
import {
  getResources,
  uploadResource,
  deleteResource,
} from "../../api/resourcesApi";
import type { Resource } from "../../api/resourcesApi";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";
import Select from "../../components/select/Select";

import "./AddFile.scss";

type TargetType = "lesson" | "exam";

interface Option {
  id: number;
  title: string;
}

export default function AddFile() {
  const { showToast } = useToast();
  const confirm = useConfirm();

  const [targetType, setTargetType] = useState<TargetType>("lesson");
  const [lessons, setLessons] = useState<Option[]>([]);
  const [exams, setExams] = useState<Option[]>([]);
  const [targetId, setTargetId] = useState<number | "">("");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [lessonsData, examsData] = await Promise.all([
          getLessons(),
          getExams(),
        ]);

        setLessons(
          (lessonsData || []).map((l: any) => ({ id: l.id, title: l.title }))
        );
        setExams(
          (examsData || []).map((e: any) => ({
            id: e.id,
            title: e.title || `آزمون شماره ${e.id}`,
          }))
        );
      } catch (err) {
        console.error("Failed to load lessons/exams:", err);
        showToast("خطا در دریافت لیست فصل‌ها و آزمون‌ها", "error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(
    () => (targetType === "lesson" ? lessons : exams),
    [targetType, lessons, exams]
  );

  const loadResources = async () => {
    try {
      setLoadingResources(true);

      // With no chapter/exam selected, show everything the professor has
      // uploaded so far (each row is labeled with its source below) rather
      // than hiding the whole list behind a filter pick.
      const params = !targetId
        ? undefined
        : targetType === "lesson"
        ? { lesson_id: Number(targetId) }
        : { exam_id: Number(targetId) };

      const data = await getResources(params);
      setResources(data);
    } catch (err) {
      console.error("Failed to load resources:", err);
    } finally {
      setLoadingResources(false);
    }
  };

  useEffect(() => {
    loadResources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId, targetType]);

  const handleUpload = async () => {
    if (!targetId) {
      showToast("یک فصل یا آزمون را انتخاب کنید", "error");
      return;
    }

    if (!file) {
      showToast("یک فایل PDF انتخاب کنید", "error");
      return;
    }

    try {
      setUploading(true);

      await uploadResource(file, {
        [targetType === "lesson" ? "lesson_id" : "exam_id"]: Number(targetId),
        title: title.trim() || undefined,
      });

      showToast("فایل با موفقیت بارگذاری شد", "success");
      setFile(null);
      setTitle("");
      await loadResources();
    } catch (err) {
      console.error("PDF upload error:", err);
      showToast("خطا در بارگذاری فایل", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (resourceId: number) => {
    const confirmed = await confirm("آیا از حذف این فایل مطمئن هستید؟", {
      confirmText: "حذف",
      danger: true,
    });
    if (!confirmed) return;

    try {
      await deleteResource(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      showToast("فایل حذف شد", "success");
    } catch (err) {
      console.error("Delete resource error:", err);
      showToast("خطا در حذف فایل", "error");
    }
  };

  return (
    <div className="add-file-page">
      <div className="target-type-toggle">
        <button
          type="button"
          className={targetType === "lesson" ? "active" : ""}
          onClick={() => {
            setTargetType("lesson");
            setTargetId("");
          }}
        >
          فصل
        </button>
        <button
          type="button"
          className={targetType === "exam" ? "active" : ""}
          onClick={() => {
            setTargetType("exam");
            setTargetId("");
          }}
        >
          آزمون
        </button>
      </div>

      <div className="form-group">
        <label>{targetType === "lesson" ? "انتخاب فصل" : "انتخاب آزمون"}</label>
        <Select
          value={targetId}
          onChange={(v) => setTargetId(v ? Number(v) : "")}
          options={options.map((opt) => ({ value: opt.id, label: opt.title }))}
          placeholder="— انتخاب کنید —"
        />
      </div>

      <div className="form-group">
        <label>عنوان فایل (اختیاری)</label>
        <input
          type="text"
          placeholder="مثلاً: جزوه فصل اول"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>فایل PDF</label>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <button
        type="button"
        className="upload-btn"
        disabled={uploading}
        onClick={handleUpload}
      >
        <Upload size={16} />
        {uploading ? "در حال بارگذاری..." : "بارگذاری فایل"}
      </button>

      <div className="uploaded-files">
        <h3>
          {targetId ? "فایل‌های این فصل/آزمون" : "همه فایل‌های بارگذاری‌شده"}
        </h3>

        {loadingResources && <p className="empty-note">در حال بارگذاری...</p>}

        {!loadingResources && resources.length === 0 && (
          <p className="empty-note">هنوز فایلی بارگذاری نشده است.</p>
        )}

        {!loadingResources &&
          resources.map((res) => (
            <div key={res.id} className="uploaded-file-row">
              <FileText size={18} />

              <span className="file-info">
                <span className="file-title">{res.title}</span>

                {!targetId && (
                  <span className="file-source">
                    {res.lesson_title
                      ? `فصل: ${res.lesson_title}`
                      : res.exam_title
                      ? `آزمون: ${res.exam_title}`
                      : ""}
                  </span>
                )}
              </span>

              <button
                type="button"
                className="delete-btn"
                onClick={() => handleDelete(res.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
