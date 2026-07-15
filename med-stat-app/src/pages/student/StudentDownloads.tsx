import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Download,
  Search,
  Loader2,
  AlertCircle,
  Lock,
} from "lucide-react";

import { getResources, downloadResourceFile } from "../../api/resourcesApi";
import type { Resource } from "../../api/resourcesApi";
import { useToast } from "../../context/ToastContext";

import "./StudentDownloads.scss";

const LOCK_MESSAGES: Record<string, string> = {
  complete_lesson: "برای دانلود، ابتدا تمام بخش‌های این درس را کامل کنید",
  take_exam: "برای دانلود، ابتدا در این آزمون شرکت کنید",
};

export default function StudentDownloads() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const resources = await getResources();
        setFiles(resources);
      } catch (err) {
        console.error("Failed to load resources:", err);
        setError("خطا در دریافت فایل‌ها.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredFiles = useMemo(() => {
    return files.filter((item) => item.title.includes(search));
  }, [files, search]);

  const handleDownload = async (file: Resource) => {
    if (!file.unlocked) {
      showToast(LOCK_MESSAGES[file.lock_reason ?? ""] || "این فایل هنوز قفل است", "error");
      return;
    }

    try {
      setDownloadingId(file.id);
      await downloadResourceFile(file);
    } catch (err) {
      console.error("Download failed:", err);
      showToast("خطا در دانلود فایل", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="student-downloads-page">

      <div className="downloads-header">
        <div className="search-box">
          <Search size={18} />

          <input
            type="text"
            placeholder="جستجو فایل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="empty-state">
          <Loader2 className="spin" size={40} />
          <p>در حال بارگذاری...</p>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state">
          <AlertCircle size={40} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="downloads-list">

          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <div className={`download-card ${!file.unlocked ? "locked" : ""}`} key={file.id}>

                <div className="file-icon">
                  {file.unlocked ? <FileText size={28} /> : <Lock size={24} />}
                </div>

                <div className="file-content">

                  <div className="file-info">
                    <h3>{file.title}</h3>
                    <p>{file.lesson_title || file.exam_title || ""}</p>
                  </div>

                  {file.unlocked ? (
                    <div className="file-meta">
                      <span>{new Date(file.uploaded_at).toLocaleDateString("fa-IR")}</span>
                    </div>
                  ) : (
                    <p className="lock-note">{LOCK_MESSAGES[file.lock_reason ?? ""]}</p>
                  )}

                </div>

                <button
                  type="button"
                  className="download-btn"
                  disabled={!file.unlocked || downloadingId === file.id}
                  onClick={() => handleDownload(file)}
                >
                  {downloadingId === file.id ? (
                    <Loader2 className="spin" size={20} />
                  ) : file.unlocked ? (
                    <Download size={20} />
                  ) : (
                    <Lock size={18} />
                  )}
                </button>

              </div>
            ))
          ) : (
            <div className="empty-state">
              <FileText size={48} />
              <p>فایلی پیدا نشد</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
