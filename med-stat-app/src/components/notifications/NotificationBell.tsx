import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationsCount,
  markNotificationsRead,
  type Notification,
} from "../../api/notificationsApi";
import { gregorianToJalali, JALALI_MONTH_NAMES, toPersianDigits } from "../../utils/jalali";

import "./NotificationBell.scss";

const POLL_INTERVAL_MS = 60_000;

function formatJalaliDate(isoDate: string) {
  const [gy, gm, gd] = isoDate.split("-").map(Number);
  const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);
  return `${toPersianDigits(jd)} ${JALALI_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        setUnreadCount(count);
      } catch (err) {
        console.error("Failed to fetch unread notifications count:", err);
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);

    try {
      const data = await getNotifications();
      setNotifications(data);
      await markNotificationsRead();
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="notification-bell"
        onClick={handleOpen}
        aria-label="اعلان‌ها"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-list-overlay" onClick={() => setOpen(false)}>
          <div className="notification-list-panel" onClick={(e) => e.stopPropagation()}>
            <div className="notification-list-header">
              <span>اعلان‌ها</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
              >
                <X size={18} />
              </button>
            </div>

            <div className="notification-list-body">
              {loading && <p className="notification-list-empty">در حال بارگذاری...</p>}

              {!loading && notifications.length === 0 && (
                <p className="notification-list-empty">هنوز اعلانی ثبت نشده است.</p>
              )}

              {!loading &&
                notifications.map((n) => (
                  <div key={n.id} className="notification-list-item">
                    <span className="notification-list-date">{formatJalaliDate(n.date)}</span>
                    <p className="notification-list-message">{n.message}</p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
