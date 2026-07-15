import { useEffect, useState } from "react";
import { Bell, Trash2, X } from "lucide-react";

import "./NotificationModal.scss";

interface Props {
  dateLabel: string;
  initialMessage: string;
  readOnly: boolean;
  saving: boolean;
  onClose: () => void;
  onSave?: (message: string) => void;
  onDelete?: () => void;
}

export default function NotificationModal({
  dateLabel,
  initialMessage,
  readOnly,
  saving,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [message, setMessage] = useState(initialMessage);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-modal" onClick={(e) => e.stopPropagation()}>
        <div className="notification-modal-header">
          <div className="notification-modal-icon">
            <Bell size={20} />
          </div>

          <span className="notification-modal-date">{dateLabel}</span>

          <button
            type="button"
            className="notification-modal-close"
            onClick={onClose}
            aria-label="بستن"
          >
            <X size={18} />
          </button>
        </div>

        {readOnly ? (
          <p className="notification-modal-message">{message}</p>
        ) : (
          <textarea
            className="notification-modal-textarea"
            placeholder="پیام خود را برای دانشجویان بنویسید..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        )}

        {!readOnly && (
          <div className="notification-modal-actions">
            {onDelete && (
              <button
                type="button"
                className="notification-modal-delete"
                onClick={onDelete}
                disabled={saving}
              >
                <Trash2 size={16} />
                حذف
              </button>
            )}

            <button
              type="button"
              className="notification-modal-save"
              onClick={() => onSave?.(message.trim())}
              disabled={saving || !message.trim()}
            >
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
