import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";

import "./UpdatePrompt.scss";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;

      setInterval(() => {
        registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [needRefresh]);

  if (!needRefresh) return null;

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleLater = () => {
    setNeedRefresh(false);
  };

  return (
    <div className="update-prompt-overlay">
      <div className="update-prompt-modal" role="alertdialog" aria-modal="true">
        <div className="update-prompt-icon">
          <RefreshCw size={26} />
        </div>

        <h3>بروزرسانی جدید</h3>

        <p>نسخه جدیدی از برنامه منتشر شده است. برای دریافت آخرین تغییرات، برنامه را بروزرسانی کنید.</p>

        <div className="update-prompt-actions">
          <button type="button" className="update-prompt-btn-cancel" onClick={handleLater}>
            بعداً
          </button>

          <button type="button" className="update-prompt-btn-primary" onClick={handleUpdate}>
            بروزرسانی
          </button>
        </div>
      </div>
    </div>
  );
}
